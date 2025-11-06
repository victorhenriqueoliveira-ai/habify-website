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
    console.log('🔔 Hubla webhook received:', {
      method: req.method,
      timestamp: new Date().toISOString(),
      headers: {
        hasAuth: !!req.headers.get('authorization'),
        hasToken: !!req.headers.get('x-webhook-token')
      }
    });
    
    // Validate webhook token from headers
    const webhookToken = req.headers.get('authorization') || req.headers.get('x-webhook-token');
    const expectedToken = Deno.env.get('HUBLA_WEBHOOK_TOKEN');
    
    // console.log('Webhook token received:', webhookToken ? 'Present' : 'Missing');
    
    if (!webhookToken || !expectedToken) {
      console.error('Webhook token missing');
      return new Response(
        JSON.stringify({ error: 'Unauthorized - Token missing' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
      );
    }
    
    // Remove 'Bearer ' prefix if present
    const cleanToken = webhookToken.replace('Bearer ', '');
    
    if (cleanToken !== expectedToken) {
      console.error('Invalid webhook token');
      return new Response(
        JSON.stringify({ error: 'Unauthorized - Invalid token' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
      );
    }
    
    // console.log('Webhook token validated successfully');
    
    const webhookData = await req.json();
    
    // Extract transaction details from Hubla webhook
    const eventType = webhookData.event || webhookData.type;
    const transactionId = webhookData.transaction?.id || webhookData.data?.id || webhookData.id;
    const transactionStatus = webhookData.transaction?.status || webhookData.data?.status || webhookData.status;
    const customerEmail = webhookData.transaction?.customer?.email || webhookData.customer?.email || webhookData.data?.customer?.email;
    
    console.log('📦 Processing Hubla webhook:', { 
      eventType, 
      transactionId, 
      status: transactionStatus, 
      email: customerEmail,
      hasTransaction: !!webhookData.transaction
    });

    if (!transactionId) {
      console.error('No transaction ID found in webhook data');
      return new Response(
        JSON.stringify({ error: 'No transaction ID found in webhook' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    // Create Supabase client
    const supabaseService = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { persistSession: false } }
    );

    // Map Hubla status to our database status
    const isPaid = transactionStatus === 'PAID' || transactionStatus === 'APPROVED' || 
                   transactionStatus === 'paid' || transactionStatus === 'approved' ||
                   transactionStatus === 'COMPLETED' || transactionStatus === 'completed';
    const status = isPaid ? 'completed' : 
                   transactionStatus === 'FAILED' || transactionStatus === 'failed' || 
                   transactionStatus === 'REFUNDED' || transactionStatus === 'refunded' ? 'failed' : 'pending';
    
    // console.log('Payment status mapping:', { transactionStatus, isPaid, status });

    // Try to find order by transaction ID or customer email
    let order;
    let updateError;
    
    // First try to find by Hubla transaction ID
    const { data: orderByTransactionId } = await supabaseService
      .from('orders')
      .select('*, payment_data')
      .eq('hubla_transaction_id', transactionId)
      .single();

    if (orderByTransactionId) {
      order = orderByTransactionId;
      console.log('✅ Found order by Hubla transaction ID:', order.id);
      
      // ✅ Parse payment_data if it's a string
      if (typeof order.payment_data === 'string') {
        try {
          order.payment_data = JSON.parse(order.payment_data);
          console.log('⚠️ Converted payment_data from string to object');
        } catch (e) {
          console.error('❌ Failed to parse payment_data string:', e);
        }
      }
    } else if (customerEmail) {
      // Try to find by customer email in payment_data
      const { data: allOrders } = await supabaseService
        .from('orders')
        .select('*, payment_data')
        .eq('gateway', 'HUBLA')
        .eq('status', 'pending');

      if (allOrders && allOrders.length > 0) {
        order = allOrders.find(o => {
          // ✅ Parse payment_data if it's a string
          let paymentData = o.payment_data;
          if (typeof paymentData === 'string') {
            try {
              paymentData = JSON.parse(paymentData);
            } catch (e) {
              return false;
            }
          }
          return paymentData?.customerData?.email === customerEmail;
        });
        
        if (order) {
          // ✅ Ensure payment_data is parsed
          if (typeof order.payment_data === 'string') {
            try {
              order.payment_data = JSON.parse(order.payment_data);
            } catch (e) {
              console.error('❌ Failed to parse order payment_data:', e);
            }
          }
          
          console.log('✅ Found order by customer email:', order.id);
          // Update with transaction ID for future lookups
          await supabaseService
            .from('orders')
            .update({ hubla_transaction_id: transactionId })
            .eq('id', order.id);
        }
      }
    }

    if (!order) {
      console.error('Order not found for Hubla transaction:', transactionId);
      return new Response(
        JSON.stringify({ error: 'Order not found', transaction_id: transactionId }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 404 }
      );
    }

    // Update order in database
    const { data: updatedOrder, error: orderUpdateError } = await supabaseService
      .from('orders')
      .update({
        status: isPaid ? 'paid' : status,
        paid_at: isPaid ? new Date().toISOString() : null,
        hubla_transaction_id: transactionId,
        payment_data: {
          ...order.payment_data,
          webhook_data: webhookData,
          updated_via_webhook: true,
          updated_at: new Date().toISOString()
        }
      })
      .eq('id', order.id)
      .select('*')
      .single();

    if (orderUpdateError) {
      console.error('Failed to update order:', orderUpdateError);
      
      // Log error
      await supabaseService.from('payment_logs').insert({
        gateway: 'HUBLA',
        error_message: `Failed to update order: ${orderUpdateError.message}`,
        request_body: webhookData,
        order_id: order?.id
      });
      
      return new Response(
        JSON.stringify({ error: 'Failed to update order', details: orderUpdateError }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }

    // Log successful update
    await supabaseService.from('payment_logs').insert({
      gateway: 'HUBLA',
      status_code: 200,
      request_body: webhookData,
      response_body: { order_updated: true, order_id: order.id },
      order_id: order.id
    });

    console.log('✅ Order updated via Hubla webhook:', {
      orderId: updatedOrder.id,
      status: updatedOrder.status,
      isPaid,
      hasUserId: !!updatedOrder.user_id
    });

    // If payment is completed, create user and profile
    if (isPaid && updatedOrder) {
      // ✅ Parse payment_data if it's a string
      let orderPaymentData = updatedOrder.payment_data;
      if (typeof orderPaymentData === 'string') {
        try {
          orderPaymentData = JSON.parse(orderPaymentData);
        } catch (e) {
          console.error('❌ Failed to parse order payment_data:', e);
        }
      }
      
      const customerData = orderPaymentData?.customerData;
      const password = orderPaymentData?.password;
      const isLoggedInPurchase = orderPaymentData?.isLoggedInPurchase;
      
      console.log('💰 Payment completed, processing user creation:', {
        hasCustomerData: !!customerData,
        email: customerData?.email,
        hasPassword: !!password,
        isLoggedInPurchase: !!isLoggedInPurchase,
        hasUserId: !!updatedOrder.user_id
      });
      
      // ✅ Validação crítica: Verificar se temos dados necessários
      if (!customerData?.email) {
        console.error('❌ CRITICAL: No customer email found in payment_data');
        await supabaseService.from('payment_logs').insert({
          gateway: 'HUBLA',
          error_message: 'No customer email found in payment_data',
          order_id: updatedOrder.id,
          request_body: { payment_data: orderPaymentData }
        });
        
        return new Response(JSON.stringify({ 
          success: true, 
          warning: 'Payment recorded but user creation skipped - no email' 
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200
        });
      }
      
        // Se for compra de usuário já logado, adicionar créditos
        if (isLoggedInPurchase && updatedOrder.user_id) {
          console.log('Logged in user purchase - adding plan and credits');
          
          // Buscar plano para pegar credits_granted
          const { data: planData } = await supabaseService
            .from('plans')
            .select('credits_granted')
            .eq('id', updatedOrder.plan_id)
            .single();

          // Adicionar plano ao usuário
          const { error: planError } = await supabaseService.rpc('add_user_plan', {
            _user_id: updatedOrder.user_id,
            _plan_id: updatedOrder.plan_id,
            _order_id: updatedOrder.id
          });

          if (planError) {
            console.error('Error adding user plan:', planError);
          } else {
            console.log('User plan added successfully');
          }

          // Adicionar créditos se o plano tiver credits_granted
          if (planData?.credits_granted && planData.credits_granted > 0) {
            const { error: creditsError } = await supabaseService.rpc('add_credits', {
              _user_id: updatedOrder.user_id,
              _amount: planData.credits_granted,
              _type: 'purchase',
              _description: `Compra do plano via Hubla`,
              _order_id: updatedOrder.id
            });

            if (creditsError) {
              console.error('Failed to add credits:', creditsError);
            } else {
              console.log(`Added ${planData.credits_granted} credits to user ${updatedOrder.user_id}`);
            }
          }

          // Enviar e-mails de confirmação para usuário logado
          const emailResult = await supabaseService.functions.invoke('send-payment-confirmation', {
            body: { orderId: updatedOrder.id }
          });

          if (emailResult.error) {
            console.error('CRITICAL: Failed to send confirmation emails:', emailResult.error);
            await supabaseService.from('payment_logs').insert({
              gateway: 'HUBLA',
              error_message: `Email sending failed after payment: ${emailResult.error.message}`,
              order_id: updatedOrder.id,
              response_body: { emailError: emailResult.error }
            });
          }

          // Notificar admin sobre novo pagamento
          await supabaseService.functions.invoke('send-admin-notification', {
            body: {
              type: 'new_payment',
              title: 'Novo pagamento confirmado (usuário logado)',
              message: `Pagamento confirmado via Hubla para usuário existente: ${customerData.email}`,
              orderId: updatedOrder.id,
              gateway: 'HUBLA',
              amount: updatedOrder.amount
            }
          });
        } else if (customerData?.email) {
        // Novo usuário - criar tudo do zero
        console.log('🆕 New user purchase - creating auth user and profile');
        
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
              
              // Link order e adicionar plano/créditos
              await supabaseService
                .from('orders')
                .update({ user_id: existingProfile.id })
                .eq('id', updatedOrder.id);

              const { data: planData } = await supabaseService
                .from('plans')
                .select('credits_granted')
                .eq('id', updatedOrder.plan_id)
                .single();

              await supabaseService.rpc('add_user_plan', {
                _user_id: existingProfile.id,
                _plan_id: updatedOrder.plan_id,
                _order_id: updatedOrder.id
              });

              if (planData?.credits_granted && planData.credits_granted > 0) {
                await supabaseService.rpc('add_credits', {
                  _user_id: existingProfile.id,
                  _amount: planData.credits_granted,
                  _type: 'purchase',
                  _description: `Compra do plano via Hubla`,
                  _order_id: updatedOrder.id
                });
              }

              await supabaseService.functions.invoke('send-payment-confirmation', {
                body: { orderId: updatedOrder.id }
              });
              
              await supabaseService.functions.invoke('send-admin-notification', {
                body: {
                  type: 'new_payment',
                  title: 'Pagamento para usuário existente',
                  message: `Pagamento via Hubla para: ${customerData.email}`,
                  orderId: updatedOrder.id,
                  gateway: 'HUBLA',
                  amount: updatedOrder.amount
                }
              });

              console.log('✅ Existing user flow completed');
              return;
            }
          }

          // 1. ✅ Criar usuário no Supabase Auth com validação
          console.log('👤 Creating new auth user:', customerData.email);
          
          if (!password) {
            console.error('❌ CRITICAL: No password found for new user');
            await supabaseService.from('payment_logs').insert({
              gateway: 'HUBLA',
              error_message: 'No password found for new user creation',
              order_id: updatedOrder.id,
              request_body: { email: customerData.email, hasPassword: false }
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
              payment_gateway: 'HUBLA',
              activated_via_webhook: true,
              activated_at: new Date().toISOString()
            }
          });

          if (authError) {
            console.error('❌ Failed to create auth user:', {
              error: authError,
              email: customerData.email,
              orderId: updatedOrder.id
            });
            
            await supabaseService.from('payment_logs').insert({
              gateway: 'HUBLA',
              error_message: `Auth creation failed: ${authError.message}`,
              order_id: updatedOrder.id,
              request_body: { email: customerData.email, errorCode: authError.code }
            });
            
            throw authError;
          }
          
          // ✅ Validar que user foi criado
          if (!authData.user || !authData.user.id) {
            const errorMsg = 'User ID not returned from auth creation';
            console.error('❌', errorMsg);
            await supabaseService.from('payment_logs').insert({
              gateway: 'HUBLA',
              error_message: errorMsg,
              order_id: updatedOrder.id
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
              gateway: 'HUBLA',
              error_message: `Profile creation failed: ${profileError.message}`,
              order_id: updatedOrder.id,
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

          // 3. ✅ Atualizar order com o profile_id - CRÍTICO
          console.log('🔗 Linking order to profile:', newProfile.id);
          const { error: orderUpdateError } = await supabaseService
            .from('orders')
            .update({ user_id: newProfile.id })
            .eq('id', updatedOrder.id);

          if (orderUpdateError) {
            console.error('❌ Failed to link order to profile:', orderUpdateError);
            throw orderUpdateError;
          }
          
          console.log('✅ Order linked to profile successfully');

          // 4. Buscar plano para pegar credits_granted
          const { data: planData } = await supabaseService
            .from('plans')
            .select('credits_granted')
            .eq('id', updatedOrder.plan_id)
            .single();

          // 5. Adicionar plano ao usuário
          const { error: planError } = await supabaseService.rpc('add_user_plan', {
            _user_id: newProfile.id,
            _plan_id: updatedOrder.plan_id,
            _order_id: updatedOrder.id
          });

          if (planError) {
            console.error('Error adding user plan:', planError);
          } else {
            console.log('User plan added successfully');
          }

          // 6. Adicionar créditos se o plano tiver credits_granted
          if (planData?.credits_granted && planData.credits_granted > 0) {
            const { error: creditsError } = await supabaseService.rpc('add_credits', {
              _user_id: newProfile.id,
              _amount: planData.credits_granted,
              _type: 'purchase',
              _description: `Compra do plano via Hubla`,
              _order_id: updatedOrder.id
            });

            if (creditsError) {
              console.error('Failed to add credits:', creditsError);
            } else {
              console.log(`Added ${planData.credits_granted} credits to new user ${newProfile.id}`);
            }
          }

          // Enviar e-mails de confirmação
          const emailResult = await supabaseService.functions.invoke('send-payment-confirmation', {
            body: { orderId: updatedOrder.id }
          });

          if (emailResult.error) {
            console.error('CRITICAL: Failed to send confirmation emails:', emailResult.error);
            await supabaseService.from('payment_logs').insert({
              gateway: 'HUBLA',
              error_message: `Email sending failed after payment: ${emailResult.error.message}`,
              order_id: updatedOrder.id,
              response_body: { emailError: emailResult.error }
            });
          }

          // Notificar admin sobre novo pagamento
          await supabaseService.functions.invoke('send-admin-notification', {
            body: {
              type: 'new_payment',
              title: 'Novo pagamento confirmado (novo usuário)',
              message: `Novo usuário criado via Hubla: ${customerData.email}`,
              orderId: updatedOrder.id,
              gateway: 'HUBLA',
              amount: updatedOrder.amount
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
        message: 'Hubla webhook processed successfully',
        order_updated: !!updatedOrder
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );

  } catch (error) {
    console.error('Hubla webhook processing error:', error);
    
    // Log error
    try {
      const supabaseService = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
        { auth: { persistSession: false } }
      );
      
      await supabaseService.from('payment_logs').insert({
        gateway: 'HUBLA',
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