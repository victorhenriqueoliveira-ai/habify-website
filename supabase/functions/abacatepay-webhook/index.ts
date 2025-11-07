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
    
    // ✅ CORREÇÃO: Converter payment_data de string JSON para objeto se necessário
    let paymentData = currentOrder?.payment_data;
    if (typeof paymentData === 'string') {
      try {
        paymentData = JSON.parse(paymentData);
        console.log('⚠️ Converted payment_data from string to object');
      } catch (e) {
        console.error('❌ Failed to parse payment_data string:', e);
      }
    }
      
    console.log('📋 Current order found:', {
      hasOrder: !!currentOrder,
      hasPaymentData: !!paymentData,
      hasCustomerData: !!paymentData?.customerData,
      customerEmail: paymentData?.customerData?.email
    });

    // Update order in database
    const { data: order, error: updateError } = await supabaseService
      .from('orders')
      .update({
        status: isPaid ? 'paid' : status,
        paid_at: isPaid ? new Date().toISOString() : null,
        payment_method: webhookData.data?.payment?.method || webhookData.data?.payment_method || webhookData.payment_method || null,
        payment_data: {
          ...paymentData, // Use parsed payment_data
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

    // ✅ FLUXO SIMPLIFICADO: Processar pagamento aprovado
    if (isPaid && order) {
      console.log('💰 Payment completed - starting user processing flow');
      
      // Parse payment_data
      let orderPaymentData = order.payment_data;
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
        orderId: order.id,
        hasUserId: !!order.user_id,
        hasCustomerData: !!customerData,
        email: customerData?.email,
        hasPassword: !!password
      });
      
      // ✅ VALIDAÇÃO: Verificar dados obrigatórios
      if (!customerData?.email) {
        console.error('❌ CRITICAL: No customer email in payment_data');
        await supabaseService.from('payment_logs').insert({
          gateway: 'ABACATEPAY',
          error_message: 'No customer email found',
          order_id: order.id
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
        let profileId = order.user_id;
        
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
              .eq('id', order.id);
              
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
                  created_via: 'ABACATEPAY_WEBHOOK'
                }
              });
              
              if (authError || !authData?.user?.id) {
                throw new Error(`Auth user creation failed: ${authError?.message}`);
              }
              
              authUserId = authData.user.id;
              console.log('✅ Auth user created:', authUserId);
            }
            
            // ✅ ETAPA 5: Aguardar profile criado pelo trigger handle_new_user
            console.log('⏳ Waiting for profile creation by trigger...');
            
            // Aguardar um momento para o trigger executar
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            // Buscar profile criado pelo trigger
            const { data: newProfile, error: profileError } = await supabaseService
              .from('profiles')
              .select('*')
              .eq('user_id', authUserId)
              .single();
            
            if (profileError || !newProfile?.id) {
              // Rollback: deletar auth user se profile não foi criado
              if (!existingAuthUser) {
                await supabaseService.auth.admin.deleteUser(authUserId);
              }
              throw new Error(`Profile not found after creation: ${profileError?.message}`);
            }
            
            profileId = newProfile.id;
            console.log('✅ Profile found:', profileId);
            
            // Atualizar profile com dados adicionais se necessário
            const { error: updateError } = await supabaseService
              .from('profiles')
              .update({
                phone: customerData.phone?.replace(/\D/g, '') || null,
                cpf: customerData.cpf?.replace(/\D/g, '') || null
              })
              .eq('id', profileId);
            
            if (updateError) {
              console.warn('⚠️ Failed to update profile with additional data:', updateError);
            }
            
            // ✅ ETAPA 6: CRÍTICO - Atualizar order.user_id
            console.log('🔗 Linking order to new profile:', profileId);
            const { error: orderLinkError } = await supabaseService
              .from('orders')
              .update({ user_id: profileId })
              .eq('id', order.id);
            
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
          .eq('id', order.plan_id)
          .single();
        
        const { error: planError } = await supabaseService.rpc('add_user_plan', {
          _user_id: profileId,
          _plan_id: order.plan_id,
          _order_id: order.id
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
            _description: 'Compra via AbacatePay',
            _order_id: order.id
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
          body: { orderId: order.id }
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
            message: `Pagamento via AbacatePay: ${customerData.email}`,
            orderId: order.id,
            gateway: 'ABACATEPAY',
            amount: order.amount
          }
        });
        
        console.log('✅ ✅ ✅ COMPLETE FLOW FINISHED SUCCESSFULLY ✅ ✅ ✅');
        
      } catch (error) {
        console.error('❌ Error in user processing flow:', error);
        await supabaseService.from('payment_logs').insert({
          gateway: 'ABACATEPAY',
          error_message: error instanceof Error ? error.message : String(error),
          order_id: order.id,
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