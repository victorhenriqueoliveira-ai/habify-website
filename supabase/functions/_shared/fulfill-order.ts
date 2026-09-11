import type { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

// Tudo que acontece depois que um pedido é confirmado como pago, seja qual
// for o gateway: achar/criar o usuário, liberar o plano (ou registrar
// manutenção), conceder créditos, e disparar os e-mails de confirmação.
// Extraído do abacatepay-webhook original pra ser reusado pelo asaas-webhook
// sem duplicar ~300 linhas de lógica sensível (criação de conta, créditos).
export async function fulfillPaidOrder(params: {
  supabaseService: SupabaseClient;
  order: Record<string, any>;
  gateway: 'ABACATEPAY' | 'ASAAS';
  gatewayPaymentId: string;
  paymentMethodLabel: string;
  webhookData: unknown;
}): Promise<void> {
  const { supabaseService, order, gateway, gatewayPaymentId, paymentMethodLabel, webhookData } = params;

  let orderPaymentData = order.payment_data;
  if (typeof orderPaymentData === 'string') {
    try {
      orderPaymentData = JSON.parse(orderPaymentData);
    } catch (e) {
      console.error(`[fulfill-order/${gateway}] Failed to parse payment_data:`, e);
    }
  }

  const customerData = orderPaymentData?.customerData;
  const password = orderPaymentData?.password;

  if (!customerData?.email) {
    console.error(`[fulfill-order/${gateway}] CRITICAL: No customer email in payment_data`);
    await supabaseService.from('payment_logs').insert({
      gateway,
      error_message: 'No customer email found',
      order_id: order.id,
    });
    return;
  }

  try {
    let profileId = order.user_id;

    // ETAPA 1: se order já tem user_id, valida que o profile existe.
    if (profileId) {
      const { data: existingProfile } = await supabaseService
        .from('profiles')
        .select('id')
        .eq('id', profileId)
        .maybeSingle();

      if (!existingProfile) {
        console.warn(`[fulfill-order/${gateway}] Order has user_id but profile not found, will search by email`);
        profileId = null;
      }
    }

    // ETAPA 2: sem profileId válido, busca por email.
    if (!profileId) {
      const { data: profileByEmail } = await supabaseService
        .from('profiles')
        .select('id, user_id, auth_user_id')
        .eq('email', customerData.email)
        .maybeSingle();

      if (profileByEmail) {
        profileId = profileByEmail.id;
        const { error: linkError } = await supabaseService
          .from('orders')
          .update({ user_id: profileId })
          .eq('id', order.id);
        if (linkError) {
          console.error(`[fulfill-order/${gateway}] Failed to link order:`, linkError);
        }
      }
    }

    // ETAPA 3: ainda sem profile, cria auth user + profile.
    if (!profileId) {
      const { data: authUsers } = await supabaseService.auth.admin.listUsers();
      const existingAuthUser = authUsers?.users.find((u) => u.email === customerData.email);

      let authUserId: string;
      let isNewAuthUser = false;

      if (existingAuthUser) {
        authUserId = existingAuthUser.id;
      } else {
        if (!password) {
          throw new Error('Password required for new user');
        }

        const { data: authData, error: authError } = await supabaseService.auth.admin.createUser({
          email: customerData.email,
          password,
          email_confirm: true,
          user_metadata: {
            name: customerData.name,
            phone: customerData.phone || null,
            cpf: customerData.cpf || null,
            created_via: `${gateway}_WEBHOOK`,
          },
        });

        if (authError || !authData?.user?.id) {
          throw new Error(`Auth user creation failed: ${authError?.message}`);
        }

        authUserId = authData.user.id;
        isNewAuthUser = true;
      }

      if (isNewAuthUser) {
        // Dá tempo do trigger criar o profile antes de buscar.
        await new Promise((resolve) => setTimeout(resolve, 2000));
      }

      const { data: userProfile, error: profileError } = await supabaseService
        .from('profiles')
        .select('*')
        .eq('user_id', authUserId)
        .maybeSingle();

      if (!userProfile) {
        if (isNewAuthUser) {
          console.error(`[fulfill-order/${gateway}] Profile not created by trigger, rolling back auth user`);
          await supabaseService.auth.admin.deleteUser(authUserId);
        }
        throw new Error(`Profile not found: ${profileError?.message || 'Trigger may have failed'}`);
      }

      profileId = userProfile.id;

      const { error: updateProfileError } = await supabaseService
        .from('profiles')
        .update({
          phone: customerData.phone?.replace(/\D/g, '') || null,
          cpf: customerData.cpf?.replace(/\D/g, '') || null,
        })
        .eq('id', profileId);

      if (updateProfileError) {
        console.warn(`[fulfill-order/${gateway}] Failed to update profile:`, updateProfileError);
      }

      const { error: orderLinkError } = await supabaseService
        .from('orders')
        .update({ user_id: profileId })
        .eq('id', order.id);

      if (orderLinkError) {
        console.error(`[fulfill-order/${gateway}] Failed to link order:`, orderLinkError);
      } else {
        // SECURITY: remove a senha de payment_data depois de criar o usuário.
        const sanitizedPaymentData = { ...orderPaymentData };
        delete sanitizedPaymentData.password;
        await supabaseService
          .from('orders')
          .update({ payment_data: sanitizedPaymentData })
          .eq('id', order.id);
      }
    }

    // ETAPA 4: manutenção ou plano.
    const isMaintenance = orderPaymentData?.isMaintenance;
    const projectId = orderPaymentData?.projectId;
    let planData: { credits_granted?: number; name?: string } | null = null;

    if (isMaintenance && projectId) {
      const { data: maintenance, error: maintenanceError } = await supabaseService
        .from('maintenances')
        .insert({
          user_id: profileId,
          project_id: projectId,
          amount: Number(order.amount),
          status: 'pending',
          payment_gateway: gateway,
          payment_id: gatewayPaymentId,
          payment_data: {
            order_id: order.id,
            paid_at: new Date().toISOString(),
            webhook_data: webhookData,
          },
          contracted_at: new Date().toISOString(),
          expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        })
        .select()
        .single();

      if (maintenanceError) {
        console.error(`[fulfill-order/${gateway}] Failed to create maintenance:`, maintenanceError);
      } else {
        try {
          const clientEmailResult = await supabaseService.functions.invoke('send-maintenance-confirmation', {
            body: { maintenanceId: maintenance.id },
          });
          if (clientEmailResult.error) {
            console.error(`[fulfill-order/${gateway}] Failed to send client email:`, clientEmailResult.error);
          }

          const adminEmailResult = await supabaseService.functions.invoke('send-maintenance-admin-notification', {
            body: { maintenanceId: maintenance.id },
          });
          if (adminEmailResult.error) {
            console.error(`[fulfill-order/${gateway}] Failed to send admin email:`, adminEmailResult.error);
          }
        } catch (emailError) {
          console.error(`[fulfill-order/${gateway}] Error sending maintenance emails:`, emailError);
        }
      }
    } else {
      const { data: fetchedPlanData } = await supabaseService
        .from('plans')
        .select('credits_granted, name')
        .eq('id', order.plan_id)
        .single();
      planData = fetchedPlanData;

      const { error: planError } = await supabaseService.rpc('add_user_plan', {
        _user_id: profileId,
        _plan_id: order.plan_id,
        _order_id: order.id,
      });

      if (planError) {
        console.error(`[fulfill-order/${gateway}] Failed to add plan:`, planError);
      }

      if (planData?.credits_granted && planData.credits_granted > 0) {
        const { error: creditsError } = await supabaseService.rpc('add_credits', {
          _user_id: profileId,
          _amount: planData.credits_granted,
          _type: 'purchase',
          _description: `Compra via ${gateway} - Plano ${planData.name}`,
          _order_id: order.id,
        });

        if (creditsError) {
          console.error(`[fulfill-order/${gateway}] Failed to add credits:`, creditsError);
        }
      }
    }

    // ETAPA 5: e-mail de boas-vindas.
    const emailResult = await supabaseService.functions.invoke('send-payment-confirmation', {
      body: { orderId: order.id },
    });
    if (emailResult.error) {
      console.error(`[fulfill-order/${gateway}] Email sending failed:`, emailResult.error);
    }

    // ETAPA 6: notifica administradores.
    const adminResult = await supabaseService.functions.invoke('send-admin-notification', {
      body: {
        customerName: customerData.name,
        customerEmail: customerData.email,
        planName: planData?.name || 'Plano Desconhecido',
        planPrice: Number(order.amount).toFixed(2),
        paymentMethod: paymentMethodLabel,
        gateway,
      },
    });
    if (adminResult.error) {
      console.error(`[fulfill-order/${gateway}] Admin notification failed:`, adminResult.error);
    }
  } catch (error) {
    console.error(`[fulfill-order/${gateway}] CRITICAL ERROR IN USER PROCESSING:`, error);
    await supabaseService.from('payment_logs').insert({
      gateway,
      error_message: error instanceof Error ? error.message : String(error),
      order_id: order.id,
      request_body: {
        customerEmail: orderPaymentData?.customerData?.email,
        customerName: orderPaymentData?.customerData?.name,
        hasPassword: !!orderPaymentData?.password,
        errorStack: error instanceof Error ? error.stack : undefined,
      },
    });
  }
}
