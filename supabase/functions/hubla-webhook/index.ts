import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const headers = Object.fromEntries(req.headers.entries());
    
    // ⚠️ DEPRECATION NOTICE: This webhook is deprecated as of 2026-02-12.
    // All new payments now use AbacatePay for both PIX and CARD.
    // This webhook is kept active for 30 days to process any pending Hubla transactions.
    // Scheduled for deletion: 2026-03-14
    console.log('⚠️ [DEPRECATED] Hubla webhook received:', {
      method: req.method,
      timestamp: new Date().toISOString(),
      deprecation: 'This webhook is deprecated. All new payments use AbacatePay.',
      headers: {
        hasAuth: !!req.headers.get('authorization'),
        hasToken: !!req.headers.get('x-webhook-token')
      }
    });
    
    // Validate webhook token from headers
    const webhookToken = headers["x-hubla-token"] || headers["x-webhook-token"] || headers["authorization"];
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

    // ✅ FLUXO COMPLETO: Processar pagamento aprovado
    if (isPaid && updatedOrder) {
      console.log('💰 Payment completed - starting user processing flow');
      
      // Parse payment_data
      let orderPaymentData = updatedOrder.payment_data;
      if (typeof orderPaymentData === 'string') {
        try {
          orderPaymentData = JSON.parse(orderPaymentData);
        } catch (e) {
          console.error('❌ Failed to parse payment_data:', e);
        }
      }
      
      const customerData = orderPaymentData?.customerData;
      const password = orderPaymentData?.password;
      
      console.log('📋 Order data:', {
        orderId: updatedOrder.id,
        hasUserId: !!updatedOrder.user_id,
        hasCustomerData: !!customerData,
        email: customerData?.email,
        hasPassword: !!password
      });
      
      // ✅ VALIDAÇÃO: Verificar dados obrigatórios
      if (!customerData?.email) {
        console.error('❌ CRITICAL: No customer email in payment_data');
        await supabaseService.from('payment_logs').insert({
          gateway: 'HUBLA',
          error_message: 'No customer email found',
          order_id: updatedOrder.id
        });
        return new Response(JSON.stringify({ 
          success: true, 
          warning: 'Payment recorded but missing email' 
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200
        });
      }
      
      try {
        let profileId = updatedOrder.user_id;
        
        // ✅ ETAPA 1: Se order já tem user_id, validar que profile existe
        if (profileId) {
          console.log('🔍 Order has user_id, validating profile:', profileId);
          const { data: existingProfile } = await supabaseService
            .from('profiles')
            .select('id')
            .eq('id', profileId)
            .maybeSingle();
          
          if (existingProfile) {
            console.log('✅ Profile validated:', profileId);
          } else {
            console.warn('⚠️ Order has user_id but profile not found, will search by email');
            profileId = null; // Forçar busca por email
          }
        }
        
        // ✅ ETAPA 2: Se não tem profileId válido, buscar por email
        if (!profileId) {
          console.log('🔍 Searching for profile by email:', customerData.email);
          const { data: profileByEmail } = await supabaseService
            .from('profiles')
            .select('id, user_id, auth_user_id')
            .eq('email', customerData.email)
            .maybeSingle();
          
          if (profileByEmail) {
            console.log('✅ Found existing profile by email:', profileByEmail.id);
            profileId = profileByEmail.id;
            
            // Atualizar order com profile encontrado
            const { error: linkError } = await supabaseService
              .from('orders')
              .update({ user_id: profileId })
              .eq('id', updatedOrder.id);
              
            if (linkError) {
              console.error('❌ Failed to link order:', linkError);
            } else {
              console.log('✅ Order linked to existing profile');
            }
          }
        }
        
        // ✅ ETAPA 3: Se ainda não tem profile, criar auth user + profile
        if (!profileId) {
          console.log('👤 No existing profile, creating new user');
          
          // Verificar se já existe auth user
          const { data: authUsers } = await supabaseService.auth.admin.listUsers();
          const existingAuthUser = authUsers?.users.find(u => u.email === customerData.email);
          
          let authUserId;
          let isNewAuthUser = false;
          
          if (existingAuthUser) {
            console.log('✅ Found existing auth user:', existingAuthUser.id);
            authUserId = existingAuthUser.id;
          } else {
            // Validar senha para novo usuário
            if (!password) {
              throw new Error('Password required for new user');
            }
            
            console.log('🆕 Creating new auth user:', customerData.email);
            const { data: authData, error: authError } = await supabaseService.auth.admin.createUser({
              email: customerData.email,
              password: password,
              email_confirm: true,
              user_metadata: {
                name: customerData.name,
                phone: customerData.phone || null,
                cpf: customerData.cpf || null,
                created_via: 'HUBLA_WEBHOOK'
              }
            });
            
            if (authError || !authData?.user?.id) {
              throw new Error(`Auth user creation failed: ${authError?.message}`);
            }
            
            authUserId = authData.user.id;
            isNewAuthUser = true;
            console.log('✅ Auth user created:', authUserId);
          }
          
          // Aguardar trigger criar profile (se for novo auth user)
          if (isNewAuthUser) {
            console.log('⏳ Waiting for trigger to create profile...');
            await new Promise(resolve => setTimeout(resolve, 2000));
          }
          
          // Buscar profile criado pelo trigger
          console.log('🔍 Fetching profile for auth user:', authUserId);
          const { data: userProfile, error: profileError } = await supabaseService
            .from('profiles')
            .select('*')
            .eq('user_id', authUserId)
            .maybeSingle();
          
          if (!userProfile) {
            // Se trigger não criou profile, tentar rollback
            if (isNewAuthUser) {
              console.error('⚠️ Profile not created by trigger, rolling back auth user');
              await supabaseService.auth.admin.deleteUser(authUserId);
            }
            throw new Error(`Profile not found: ${profileError?.message || 'Trigger may have failed'}`);
          }
          
          profileId = userProfile.id;
          console.log('✅ Profile found:', profileId);
          
          // Atualizar profile com dados adicionais
          const { error: updateError } = await supabaseService
            .from('profiles')
            .update({
              phone: customerData.phone?.replace(/\D/g, '') || null,
              cpf: customerData.cpf?.replace(/\D/g, '') || null
            })
            .eq('id', profileId);
          
          if (updateError) {
            console.warn('⚠️ Failed to update profile:', updateError);
          }
          
          // ✅ CRÍTICO: Atualizar order.user_id
          console.log('🔗 Linking order to profile:', profileId);
          const { error: orderLinkError } = await supabaseService
            .from('orders')
            .update({ user_id: profileId })
            .eq('id', updatedOrder.id);
          
          if (orderLinkError) {
            console.error('❌ Failed to link order:', orderLinkError);
          } else {
            console.log('✅ Order linked to profile');
          }
        }
        
        // ✅ ETAPA 4: Adicionar plano ao usuário
        console.log('📦 Adding plan to user:', profileId);
        const { data: planData } = await supabaseService
          .from('plans')
          .select('credits_granted, name')
          .eq('id', updatedOrder.plan_id)
          .single();
        
        const { error: planError } = await supabaseService.rpc('add_user_plan', {
          _user_id: profileId,
          _plan_id: updatedOrder.plan_id,
          _order_id: updatedOrder.id
        });
        
        if (planError) {
          console.error('❌ Failed to add plan:', planError);
        } else {
          console.log('✅ Plan added successfully');
        }
        
        // ✅ ETAPA 5: Adicionar créditos
        if (planData?.credits_granted && planData.credits_granted > 0) {
          console.log(`💳 Adding ${planData.credits_granted} credits to user ${profileId}`);
          const { error: creditsError } = await supabaseService.rpc('add_credits', {
            _user_id: profileId,
            _amount: planData.credits_granted,
            _type: 'purchase',
            _description: `Compra via Hubla - Plano ${planData.name}`,
            _order_id: updatedOrder.id
          });
          
          if (creditsError) {
            console.error('❌ Failed to add credits:', creditsError);
          } else {
            console.log('✅ Credits added successfully');
          }
        } else {
          console.log('⚠️ No credits to add - plan has 0 credits_granted');
        }
        
        // ✅ ETAPA 6: Enviar email de boas-vindas ao cliente
        console.log('📧 Sending welcome email to customer');
        const emailResult = await supabaseService.functions.invoke('send-payment-confirmation', {
          body: { orderId: updatedOrder.id }
        });
        
        if (emailResult.error) {
          console.error('⚠️ Email sending failed:', emailResult.error);
        } else {
          console.log('✅ Welcome email sent');
        }
        
        // ✅ ETAPA 7: Notificar administradores
        console.log('📧 Sending admin notification');
        const adminResult = await supabaseService.functions.invoke('send-admin-notification', {
          body: {
            customerName: customerData.name,
            customerEmail: customerData.email,
            planName: planData?.name || 'Plano Desconhecido',
            planPrice: Number(updatedOrder.amount).toFixed(2),
            paymentMethod: 'CARTÃO DE CRÉDITO',
            gateway: 'HUBLA'
          }
        });
        
        if (adminResult.error) {
          console.error('⚠️ Admin notification failed:', adminResult.error);
        } else {
          console.log('✅ Admin notified');
        }
        
        // ✅ ETAPA 8: Sanitizar senha do payment_data
        console.log('🔒 Sanitizing password from payment_data');
        const sanitizedPaymentData = { ...updatedOrder.payment_data };
        if (typeof sanitizedPaymentData === 'object' && sanitizedPaymentData !== null) {
          delete sanitizedPaymentData.password;
          if (sanitizedPaymentData.customerData) {
            delete sanitizedPaymentData.customerData.password;
          }
          await supabaseService
            .from('orders')
            .update({ payment_data: sanitizedPaymentData })
            .eq('id', updatedOrder.id);
          console.log('✅ Password sanitized from payment_data');
        }
        
        console.log('🎉 ✅ ✅ ✅ COMPLETE FLOW FINISHED SUCCESSFULLY ✅ ✅ ✅');
        console.log('📊 Final status:', {
          profileId,
          orderId: updatedOrder.id,
          creditsAdded: planData?.credits_granted || 0,
          emailSent: !emailResult.error,
          adminNotified: !adminResult.error
        });
        
      } catch (error) {
        console.error('❌ ❌ ❌ CRITICAL ERROR IN USER PROCESSING:', error);
        await supabaseService.from('payment_logs').insert({
          gateway: 'HUBLA',
          error_message: error instanceof Error ? error.message : String(error),
          order_id: updatedOrder.id,
          request_body: { 
            customerEmail: orderPaymentData?.customerData?.email,
            customerName: orderPaymentData?.customerData?.name,
            hasPassword: !!orderPaymentData?.password,
            errorStack: error instanceof Error ? error.stack : undefined
          }
        });
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