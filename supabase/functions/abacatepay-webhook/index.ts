import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('🔔 AbacatePay webhook received:', {
      method: req.method,
      timestamp: new Date().toISOString(),
      headers: {
        hasAuth: !!req.headers.get('authorization'),
        hasSecret: !!req.headers.get('x-webhook-secret')
      }
    });
    
    // Validate webhook secret from query params or headers
    const url = new URL(req.url);
    const webhookSecretFromQuery = url.searchParams.get('webhookSecret');
    const webhookSecretFromHeader = req.headers.get('x-webhook-secret') || req.headers.get('webhook-secret');
    const webhookSecret = webhookSecretFromQuery || webhookSecretFromHeader;
    const expectedSecret = 'VictorOliveira@123';
    
    // console.log('Webhook secret received:', webhookSecret ? 'Present' : 'Missing', 'From:', webhookSecretFromQuery ? 'query' : webhookSecretFromHeader ? 'header' : 'none');
    
    if (!webhookSecret || webhookSecret !== expectedSecret) {
      console.error('Invalid webhook secret');
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
      );
    }
    
    // console.log('Webhook secret validated successfully');
    
    const webhookData = await req.json();
    
    // Extract bill ID and status from webhook - try multiple formats
    let billId = webhookData.data?.billing?.id || webhookData.data?.id || webhookData.id || webhookData.bill?.id;
    const paymentStatus = webhookData.data?.billing?.status || webhookData.data?.status || webhookData.status || webhookData.bill?.status;
    
    console.log('📦 Processing webhook:', {
      billId,
      status: paymentStatus,
      email: webhookData.data?.customer?.email || webhookData.customer?.email,
      hasData: !!webhookData.data,
      dataKeys: Object.keys(webhookData.data || {})
    });

    if (!billId) {
      console.error('No bill ID found in webhook data. Full webhook:', JSON.stringify(webhookData, null, 2));
      // Try alternative paths for bill ID
      const altBillId = webhookData.data?.billing?.id || webhookData.billing?.id || webhookData.external_id || webhookData.externalId;
      if (!altBillId) {
        return new Response(
          JSON.stringify({ error: 'No bill ID found in webhook' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
        );
      }
      // console.log('Found alternative bill ID:', altBillId);
      billId = altBillId;
    }

    // Create Supabase client
    const supabaseService = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { persistSession: false } }
    );

    // Map AbacatePay status to our database status
    const isPaid = paymentStatus === 'PAID' || paymentStatus === 'APPROVED' || paymentStatus === 'paid' || paymentStatus === 'approved';
    const status = isPaid ? 'completed' : paymentStatus === 'FAILED' || paymentStatus === 'failed' ? 'failed' : 'pending';
    
    // console.log('Updating transaction status:', { billId, isPaid, status });

    // Get current order to preserve original customerData
    const { data: currentOrder } = await supabaseService
      .from('orders')
      .select('payment_data')
      .eq('abacatepay_id', billId)
      .single();
      
    console.log('📋 Current order found:', {
      hasOrder: !!currentOrder,
      hasPaymentData: !!currentOrder?.payment_data,
      hasCustomerData: !!currentOrder?.payment_data?.customerData
    });

    // Update order in database
    const { data: order, error: updateError } = await supabaseService
      .from('orders')
      .update({
        status: isPaid ? 'paid' : status,
        paid_at: isPaid ? new Date().toISOString() : null,
        payment_method: webhookData.data?.payment?.method || webhookData.data?.payment_method || webhookData.payment_method || null,
        payment_data: {
          ...currentOrder?.payment_data, // Preserve original customerData
          webhook_data: webhookData,
          updated_via_webhook: true,
          updated_at: new Date().toISOString()
        }
      })
      .eq('abacatepay_id', billId)
      .select('*')
      .single();

    if (updateError) {
      console.error('Failed to update order:', updateError);
      
      // Log error
      await supabaseService.from('payment_logs').insert({
        gateway: 'ABACATEPAY',
        error_message: `Failed to update order: ${updateError.message}`,
        request_body: webhookData,
        order_id: order?.id
      });
      
      return new Response(
        JSON.stringify({ error: 'Failed to update order', details: updateError }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }

    // Log successful update
    await supabaseService.from('payment_logs').insert({
      gateway: 'ABACATEPAY',
      status_code: 200,
      request_body: webhookData,
      response_body: { order_updated: true, order_id: order.id },
      order_id: order.id
    });

    console.log('✅ Order updated via webhook:', {
      orderId: order.id,
      status: order.status,
      isPaid,
      hasUserId: !!order.user_id
    });

    // If payment is completed, create user and profile
    if (isPaid && order) {
      const customerData = order.payment_data?.customerData;
      console.log('💰 Payment completed, processing user creation:', {
        hasCustomerData: !!customerData,
        email: customerData?.email,
        isLoggedInPurchase: !!order.payment_data?.isLoggedInPurchase,
        hasUserId: !!order.user_id
      });
      
        // Se for compra de usuário já logado, adicionar créditos
        if (order.payment_data?.isLoggedInPurchase && order.user_id) {
          console.log('Logged in user purchase - adding plan and credits');
          
          // Buscar plano para pegar credits_granted
          const { data: planData } = await supabaseService
            .from('plans')
            .select('credits_granted')
            .eq('id', order.plan_id)
            .single();

          // Adicionar plano ao perfil existente
          const { error: planError } = await supabaseService.rpc('add_user_plan', {
            _user_id: order.user_id,
            _plan_id: order.plan_id,
            _order_id: order.id
          });

          if (planError) {
            console.error('Failed to add plan:', planError);
          } else {
            console.log(`Added plan to existing user ${order.user_id}`);
          }

          // Adicionar créditos se o plano tiver credits_granted
          if (planData?.credits_granted && planData.credits_granted > 0) {
            const { error: creditsError } = await supabaseService.rpc('add_credits', {
              _user_id: order.user_id,
              _amount: planData.credits_granted,
              _type: 'purchase',
              _description: `Compra do plano via AbacatePay`,
              _order_id: order.id
            });

            if (creditsError) {
              console.error('Failed to add credits:', creditsError);
            } else {
              console.log(`Added ${planData.credits_granted} credits to user ${order.user_id}`);
            }
          }

          // Enviar e-mails de confirmação
          const emailResult = await supabaseService.functions.invoke('send-payment-confirmation', {
            body: { orderId: order.id }
          });

          if (emailResult.error) {
            console.error('CRITICAL: Failed to send confirmation emails:', emailResult.error);
            await supabaseService.from('payment_logs').insert({
              gateway: 'ABACATEPAY',
              error_message: `Email sending failed after payment: ${emailResult.error.message}`,
              order_id: order.id,
              response_body: { emailError: emailResult.error }
            });
          }

          // Notificar admin sobre novo pagamento
          await supabaseService.functions.invoke('send-admin-notification', {
            body: {
              type: 'new_payment',
              title: 'Novo pagamento confirmado (usuário logado)',
              message: `Pagamento confirmado via AbacatePay para usuário existente: ${customerData.email}`,
              orderId: order.id,
              gateway: 'ABACATEPAY',
              amount: order.amount
            }
          });
        } else if (customerData?.email && order.payment_data?.password) {
        // Novo usuário - criar tudo do zero
        console.log('New user purchase - creating auth user and profile');
        
        try {
          // ✅ AÇÃO 2: Verificar se auth user já existe ANTES de criar
          console.log('🔍 Checking if user already exists:', customerData.email);
          
          const { data: existingAuthUsers } = await supabaseService.auth.admin.listUsers();
          const existingAuthUser = existingAuthUsers?.users.find(u => u.email === customerData.email);
          
          if (existingAuthUser) {
            console.log('👤 Auth user already exists:', existingAuthUser.id);
            
            // Buscar ou criar profile
            const { data: existingProfile, error: profileFindError } = await supabaseService
              .from('profiles')
              .select('id, auth_user_id, user_id')
              .eq('email', customerData.email)
              .maybeSingle();

            if (existingProfile) {
              console.log('📝 Profile already exists:', existingProfile.id);
              
              // Atualizar profile com auth_user_id se estiver faltando
              if (!existingProfile.auth_user_id) {
                console.log('🔗 Linking profile to auth user');
                await supabaseService
                  .from('profiles')
                  .update({ 
                    auth_user_id: existingAuthUser.id,
                    user_id: existingAuthUser.id 
                  })
                  .eq('id', existingProfile.id);
              }
            }

              // Atualizar order com o profile_id existente
              console.log('🔗 Linking order to existing profile');
              await supabaseService
                .from('orders')
                .update({ user_id: existingProfile.id })
                .eq('id', order.id);

              // Buscar plano para pegar credits_granted
              const { data: planData } = await supabaseService
                .from('plans')
                .select('credits_granted')
                .eq('id', order.plan_id)
                .single();

              // Adicionar plano
              const { error: planError } = await supabaseService.rpc('add_user_plan', {
                _user_id: existingProfile.id,
                _plan_id: order.plan_id,
                _order_id: order.id
              });

              if (planError) {
                console.error('❌ Failed to add plan:', planError);
                await supabaseService.from('payment_logs').insert({
                  gateway: 'ABACATEPAY',
                  error_message: `Failed to add plan: ${planError.message}`,
                  order_id: order.id
                });
              } else {
                console.log(`✅ Added plan to existing user ${existingProfile.id}`);
              }

              // Adicionar créditos
              if (planData?.credits_granted && planData.credits_granted > 0) {
                const { error: creditsError } = await supabaseService.rpc('add_credits', {
                  _user_id: existingProfile.id,
                  _amount: planData.credits_granted,
                  _type: 'purchase',
                  _description: `Compra do plano via AbacatePay`,
                  _order_id: order.id
                });

                if (creditsError) {
                  console.error('❌ Failed to add credits:', creditsError);
                  await supabaseService.from('payment_logs').insert({
                    gateway: 'ABACATEPAY',
                    error_message: `Failed to add credits: ${creditsError.message}`,
                    order_id: order.id
                  });
                } else {
                  console.log(`✅ Added ${planData.credits_granted} credits to existing user ${existingProfile.id}`);
                }
              }

              // Enviar emails
              await supabaseService.functions.invoke('send-payment-confirmation', {
                body: { orderId: order.id }
              });
              
              await supabaseService.functions.invoke('send-admin-notification', {
                body: {
                  type: 'new_payment',
                  title: 'Pagamento para usuário existente',
                  message: `Pagamento via AbacatePay para: ${customerData.email}`,
                  orderId: order.id,
                  gateway: 'ABACATEPAY',
                  amount: order.amount
                }
              });

              console.log('✅ Existing user flow completed');
              return; // Sair da função
            }
          }

          // ✅ Usuário não existe, criar novo
          console.log('👤 Creating new auth user:', customerData.email);
          
          const password = order.payment_data?.password;
          if (!password) {
            const errorMsg = 'Password not found in payment_data';
            console.error('❌', errorMsg);
            await supabaseService.from('payment_logs').insert({
              gateway: 'ABACATEPAY',
              error_message: errorMsg,
              order_id: order.id,
              request_body: { hasPassword: false, email: customerData.email }
            });
            throw new Error('Senha não encontrada nos dados do pedido');
          }

          const { data: authData, error: authError } = await supabaseService.auth.admin.createUser({
            email: customerData.email,
            password: password,
            email_confirm: true,
            user_metadata: {
              name: customerData.name,
              phone: customerData.phone || null,
              cpf: customerData.cpf || null,
              payment_confirmed: true,
              payment_gateway: 'ABACATEPAY',
              activated_via_webhook: true,
              activated_at: new Date().toISOString()
            }
          });

          if (authError) {
            console.error('❌ Failed to create auth user:', {
              error: authError,
              email: customerData.email,
              orderId: order.id
            });
            
            await supabaseService.from('payment_logs').insert({
              gateway: 'ABACATEPAY',
              error_message: `Auth creation failed: ${authError.message}`,
              order_id: order.id,
              request_body: { email: customerData.email, errorCode: authError.code }
            });
            
            throw authError;
          }
          
          // ✅ Validar que user foi criado
          if (!authData.user || !authData.user.id) {
            const errorMsg = 'User ID not returned from auth creation';
            console.error('❌', errorMsg);
            await supabaseService.from('payment_logs').insert({
              gateway: 'ABACATEPAY',
              error_message: errorMsg,
              order_id: order.id
            });
            throw new Error(errorMsg);
          }

          console.log('✅ Auth user created:', authData.user.id);

          // 2. ✅ Criar perfil ativo com validação
          console.log('📝 Creating profile for:', authData.user.id);
          
          const { data: newProfile, error: profileError } = await supabaseService
            .from('profiles')
            .insert({
              auth_user_id: authData.user.id,  // ✅ ID do auth.users
              user_id: authData.user.id,       // ✅ Compatibilidade
              name: customerData.name,
              email: customerData.email,
              phone: customerData.phone?.replace(/\D/g, '') || null,
              cpf: customerData.cpf?.replace(/\D/g, '') || null,
              role: 'user',
              is_active: true,
              credits: 0  // ✅ Inicializar com 0
            })
            .select()
            .single();

          if (profileError) {
            console.error('❌ Failed to create profile:', {
              error: profileError,
              authUserId: authData.user.id,
              email: customerData.email
            });
            
            // ✅ ROLLBACK: Deletar auth user se profile falhou
            console.log('🔄 Rolling back auth user creation');
            await supabaseService.auth.admin.deleteUser(authData.user.id);
            
            await supabaseService.from('payment_logs').insert({
              gateway: 'ABACATEPAY',
              error_message: `Profile creation failed: ${profileError.message}`,
              order_id: order.id,
              request_body: { authUserId: authData.user.id, email: customerData.email }
            });
            
            throw profileError;
          }
          
          // ✅ Validar que profile tem ID
          if (!newProfile || !newProfile.id) {
            const errorMsg = 'Profile ID not returned';
            console.error('❌', errorMsg);
            await supabaseService.auth.admin.deleteUser(authData.user.id);
            throw new Error(errorMsg);
          }

          console.log('✅ Profile created:', {
            profileId: newProfile.id,
            authUserId: authData.user.id,
            email: newProfile.email
          });

          // 3. Atualizar order com o profile_id
          const { error: orderUpdateError } = await supabaseService
            .from('orders')
            .update({ user_id: newProfile.id })
            .eq('id', order.id);

          if (orderUpdateError) {
            console.error('Failed to link order to profile:', orderUpdateError);
          } else {
            // console.log('Order linked to profile successfully');
          }

          // 4. Buscar plano para pegar credits_granted
          const { data: planData } = await supabaseService
            .from('plans')
            .select('credits_granted')
            .eq('id', order.plan_id)
            .single();

          // 5. Adicionar plano ao usuário
          const { error: planError } = await supabaseService.rpc('add_user_plan', {
            _user_id: newProfile.id,
            _plan_id: order.plan_id,
            _order_id: order.id
          });

          if (planError) {
            console.error('Failed to add plan:', planError);
          } else {
            console.log(`Added plan to user ${newProfile.id}`);
          }

          // 6. Adicionar créditos se o plano tiver credits_granted
          if (planData?.credits_granted && planData.credits_granted > 0) {
            const { error: creditsError } = await supabaseService.rpc('add_credits', {
              _user_id: newProfile.id,
              _amount: planData.credits_granted,
              _type: 'purchase',
              _description: `Compra do plano via AbacatePay`,
              _order_id: order.id
            });

            if (creditsError) {
              console.error('Failed to add credits:', creditsError);
            } else {
              console.log(`Added ${planData.credits_granted} credits to new user ${newProfile.id}`);
            }
          }

          // Enviar e-mails de confirmação
          const emailResult = await supabaseService.functions.invoke('send-payment-confirmation', {
            body: { orderId: order.id }
          });

          if (emailResult.error) {
            console.error('CRITICAL: Failed to send confirmation emails:', emailResult.error);
            await supabaseService.from('payment_logs').insert({
              gateway: 'ABACATEPAY',
              error_message: `Email sending failed after payment: ${emailResult.error.message}`,
              order_id: order.id,
              response_body: { emailError: emailResult.error }
            });
          }

          // Notificar admin sobre novo pagamento
          await supabaseService.functions.invoke('send-admin-notification', {
            body: {
              type: 'new_payment',
              title: 'Novo pagamento confirmado (novo usuário)',
              message: `Novo usuário criado via AbacatePay: ${customerData.email}`,
              orderId: order.id,
              gateway: 'ABACATEPAY',
              amount: order.amount
            }
          });

        } catch (error) {
          console.error('Error in user creation flow:', error);
        }
      } else {
        console.error('Missing email or password in order data');
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Webhook processed successfully',
        order_updated: !!order
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );

  } catch (error) {
    console.error('Webhook processing error:', error);
    
    // Log error
    try {
      const supabaseService = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
        { auth: { persistSession: false } }
      );
      
      await supabaseService.from('payment_logs').insert({
        gateway: 'ABACATEPAY',
        error_message: error instanceof Error ? error.message : String(error),
        request_body: { error: 'Webhook processing failed' }
      });
    } catch (logError) {
      console.error('Failed to log error:', logError);
    }
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : String(error) 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});