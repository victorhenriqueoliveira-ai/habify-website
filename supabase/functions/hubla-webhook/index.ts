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

    // ✅ FLUXO SIMPLIFICADO: Processar pagamento aprovado
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
        
        // ✅ ETAPA 1: Se order já tem user_id, usar esse profile
        if (profileId) {
          console.log('✅ Order already has user_id:', profileId);
        } else {
          // ✅ ETAPA 2: Buscar se já existe profile com esse email
          console.log('🔍 Searching for existing profile:', customerData.email);
          const { data: existingProfile } = await supabaseService
            .from('profiles')
            .select('id, user_id, auth_user_id')
            .eq('email', customerData.email)
            .maybeSingle();
          
          if (existingProfile) {
            console.log('✅ Found existing profile:', existingProfile.id);
            profileId = existingProfile.id;
            
            // Atualizar order com profile existente
            await supabaseService
              .from('orders')
              .update({ user_id: profileId })
              .eq('id', updatedOrder.id);
              
            console.log('✅ Order linked to existing profile');
          } else {
            // ✅ ETAPA 3: Verificar se existe auth user
            console.log('🔍 Checking for existing auth user:', customerData.email);
            const { data: authUsers } = await supabaseService.auth.admin.listUsers();
            const existingAuthUser = authUsers?.users.find(u => u.email === customerData.email);
            
            let authUserId;
            
            if (existingAuthUser) {
              console.log('✅ Found existing auth user:', existingAuthUser.id);
              authUserId = existingAuthUser.id;
            } else {
              // ✅ ETAPA 4: Criar novo auth user
              if (!password) {
                throw new Error('Password required for new user');
              }
              
              console.log('👤 Creating new auth user:', customerData.email);
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
              console.log('✅ Auth user created:', authUserId);
            }
            
            // ✅ ETAPA 5: Criar profile
            console.log('📝 Creating profile for auth user:', authUserId);
            const { data: newProfile, error: profileError } = await supabaseService
              .from('profiles')
              .insert({
                auth_user_id: authUserId,
                user_id: authUserId,
                name: customerData.name,
                email: customerData.email,
                phone: customerData.phone?.replace(/\D/g, '') || null,
                cpf: customerData.cpf?.replace(/\D/g, '') || null,
                role: 'user',
                is_active: true,
                credits: 0
              })
              .select()
              .single();
            
            if (profileError || !newProfile?.id) {
              // Rollback: deletar auth user se profile falhou
              if (!existingAuthUser) {
                await supabaseService.auth.admin.deleteUser(authUserId);
              }
              throw new Error(`Profile creation failed: ${profileError?.message}`);
            }
            
            profileId = newProfile.id;
            console.log('✅ Profile created:', profileId);
            
            // ✅ ETAPA 6: CRÍTICO - Atualizar order.user_id
            console.log('🔗 Linking order to new profile:', profileId);
            const { error: orderLinkError } = await supabaseService
              .from('orders')
              .update({ user_id: profileId })
              .eq('id', updatedOrder.id);
            
            if (orderLinkError) {
              throw new Error(`Failed to link order to profile: ${orderLinkError.message}`);
            }
            
            console.log('✅ Order linked to profile successfully');
          }
        }
        
        // ✅ ETAPA 7: Adicionar plano ao usuário
        console.log('📦 Adding plan to user:', profileId);
        const { data: planData } = await supabaseService
          .from('plans')
          .select('credits_granted')
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
        
        // ✅ ETAPA 8: Adicionar créditos se o plano tiver
        if (planData?.credits_granted && planData.credits_granted > 0) {
          console.log(`💳 Adding ${planData.credits_granted} credits`);
          const { error: creditsError } = await supabaseService.rpc('add_credits', {
            _user_id: profileId,
            _amount: planData.credits_granted,
            _type: 'purchase',
            _description: 'Compra via Hubla',
            _order_id: updatedOrder.id
          });
          
          if (creditsError) {
            console.error('❌ Failed to add credits:', creditsError);
          } else {
            console.log('✅ Credits added successfully');
          }
        }
        
        // ✅ ETAPA 9: Enviar emails de confirmação
        console.log('📧 Sending confirmation emails');
        const emailResult = await supabaseService.functions.invoke('send-payment-confirmation', {
          body: { orderId: updatedOrder.id }
        });
        
        if (emailResult.error) {
          console.error('⚠️ Email sending failed:', emailResult.error);
        } else {
          console.log('✅ Confirmation emails sent');
        }
        
        // ✅ ETAPA 10: Notificar admin
        await supabaseService.functions.invoke('send-admin-notification', {
          body: {
            type: 'new_payment',
            title: 'Novo pagamento confirmado',
            message: `Pagamento via Hubla: ${customerData.email}`,
            orderId: updatedOrder.id,
            gateway: 'HUBLA',
            amount: updatedOrder.amount
          }
        });
        
        console.log('✅ ✅ ✅ COMPLETE FLOW FINISHED SUCCESSFULLY ✅ ✅ ✅');
        
      } catch (error) {
        console.error('❌ Error in user processing flow:', error);
        await supabaseService.from('payment_logs').insert({
          gateway: 'HUBLA',
          error_message: error instanceof Error ? error.message : String(error),
          order_id: updatedOrder.id,
          request_body: { 
            customerEmail: orderPaymentData?.customerData?.email,
            hasPassword: !!orderPaymentData?.password
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