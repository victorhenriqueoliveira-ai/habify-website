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
    // console.log('Hubla webhook called - Method:', req.method);
    // console.log('Hubla webhook headers:', Object.fromEntries(req.headers.entries()));
    
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
    // console.log('Hubla webhook received:', JSON.stringify(webhookData, null, 2));

    // Extract transaction details from Hubla webhook
    // Hubla sends different event types, we're interested in payment confirmation
    const eventType = webhookData.event || webhookData.type;
    const transactionId = webhookData.transaction?.id || webhookData.data?.id || webhookData.id;
    const transactionStatus = webhookData.transaction?.status || webhookData.data?.status || webhookData.status;
    const customerEmail = webhookData.transaction?.customer?.email || webhookData.customer?.email || webhookData.data?.customer?.email;
    
    // console.log('Processing Hubla webhook:', { eventType, transactionId, transactionStatus, customerEmail });

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
      // console.log('Found order by Hubla transaction ID:', order.id);
    } else if (customerEmail) {
      // Try to find by customer email in payment_data
      const { data: allOrders } = await supabaseService
        .from('orders')
        .select('*, payment_data')
        .eq('gateway', 'HUBLA')
        .eq('status', 'pending');

      if (allOrders && allOrders.length > 0) {
        order = allOrders.find(o => 
          o.payment_data?.customerData?.email === customerEmail
        );
        
        if (order) {
          // console.log('Found order by customer email:', order.id);
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

    // console.log('Order updated successfully via Hubla webhook:', updatedOrder);

    // If payment is completed, create user and profile
    if (isPaid && updatedOrder) {
      const customerData = updatedOrder.payment_data?.customerData;
      
      // Se for compra de usuário já logado, adicionar créditos
      if (updatedOrder.payment_data?.isLoggedInPurchase && updatedOrder.user_id) {
        // console.log('Logged in user purchase - adding credits');
        
        // Adicionar créditos ao perfil existente
        const { data: planData } = await supabaseService
          .from('plans')
          .select('credits_granted')
          .eq('id', updatedOrder.plan_id)
          .single();

          // Adicionar plano ao usuário
          const { data: userPlanId, error: planError } = await supabaseService.rpc('add_user_plan', {
            _user_id: updatedOrder.user_id,
            _plan_id: updatedOrder.plan_id,
            _order_id: updatedOrder.id
          });

          if (planError) {
            console.error('Error adding user plan:', planError);
          } else {
            // console.log('User plan added successfully:', userPlanId);
          }

          // Enviar e-mails de confirmação para usuário logado
        try {
          const { data: planDetails } = await supabaseService
            .from('plans')
            .select('name, price, stripe_price')
            .eq('id', updatedOrder.plan_id)
            .single();

          const { data: userProfile } = await supabaseService
            .from('profiles')
            .select('name, email')
            .eq('id', updatedOrder.user_id)
            .single();

          if (planDetails && userProfile) {
            // Enviar confirmação ao usuário
            await supabaseService.functions.invoke('send-payment-confirmation', {
              body: {
                customerName: userProfile.name,
                customerEmail: userProfile.email,
                planName: planDetails.name,
                planPrice: (planDetails.stripe_price || planDetails.price).toFixed(2),
                paymentMethod: 'CARTÃO',
                gateway: 'HUBLA'
              }
            });
            
            // Notificar administração
            await supabaseService.functions.invoke('send-admin-notification', {
              body: {
                customerName: userProfile.name,
                customerEmail: userProfile.email,
                planName: planDetails.name,
                planPrice: (planDetails.stripe_price || planDetails.price).toFixed(2),
                paymentMethod: 'CARTÃO',
                gateway: 'HUBLA'
              }
            });
            
            // console.log('Emails sent successfully');
          }
        } catch (emailError) {
          console.error('Failed to send confirmation emails:', emailError);
        }
      } else if (customerData?.email && customerData?.password) {
        // Novo usuário - criar tudo do zero
        // console.log('New user purchase - creating auth user and profile');
        
        try {
          // 1. Criar usuário no Supabase Auth
          const { data: authData, error: authError } = await supabaseService.auth.admin.createUser({
            email: customerData.email,
            password: customerData.password,
            email_confirm: true,
            user_metadata: {
              name: customerData.name,
              phone: customerData.phone || null,
              payment_confirmed: true,
              payment_gateway: 'HUBLA',
              activated_via_webhook: true,
              activated_at: new Date().toISOString()
            }
          });

          if (authError) {
            console.error('Failed to create auth user:', authError);
            throw authError;
          }

          // console.log('Auth user created:', authData.user?.id);

          // 2. Criar perfil ativo
          const { data: newProfile, error: profileError } = await supabaseService
            .from('profiles')
            .insert({
              auth_user_id: authData.user.id,
              user_id: authData.user.id,
              name: customerData.name,
              email: customerData.email,
              phone: customerData.phone || null,
              role: 'user',
              is_active: true
            })
            .select()
            .single();

          if (profileError) {
            console.error('Failed to create profile:', profileError);
            throw profileError;
          }

          // console.log('Profile created:', newProfile.id);

          // 3. Atualizar order com o profile_id
          const { error: orderUpdateError } = await supabaseService
            .from('orders')
            .update({ user_id: newProfile.id })
            .eq('id', updatedOrder.id);

          if (orderUpdateError) {
            console.error('Failed to link order to profile:', orderUpdateError);
          } else {
            // console.log('Order linked to profile successfully');
          }

          // 4. Adicionar créditos ao usuário baseado no plano
          const { data: planData } = await supabaseService
            .from('plans')
            .select('credits_granted')
            .eq('id', updatedOrder.plan_id)
            .single();

          // Adicionar plano ao usuário
          const { data: userPlanId, error: planError } = await supabaseService.rpc('add_user_plan', {
            _user_id: newProfile.id,
            _plan_id: updatedOrder.plan_id,
            _order_id: updatedOrder.id
          });

          if (planError) {
            console.error('Error adding user plan:', planError);
          } else {
            // console.log('User plan added successfully:', userPlanId);
          }

          // Enviar e-mails de confirmação
          try {
            const { data: planDetails } = await supabaseService
              .from('plans')
              .select('name, price, stripe_price')
              .eq('id', updatedOrder.plan_id)
              .single();

            if (planDetails) {
              // Enviar confirmação ao usuário
              await supabaseService.functions.invoke('send-payment-confirmation', {
                body: {
                  customerName: customerData.name,
                  customerEmail: customerData.email,
                  planName: planDetails.name,
                  planPrice: (planDetails.stripe_price || planDetails.price).toFixed(2),
                  paymentMethod: 'CARTÃO',
                  gateway: 'HUBLA'
                }
              });
              
              // Notificar administração
              await supabaseService.functions.invoke('send-admin-notification', {
                body: {
                  customerName: customerData.name,
                  customerEmail: customerData.email,
                  planName: planDetails.name,
                  planPrice: (planDetails.stripe_price || planDetails.price).toFixed(2),
                  paymentMethod: 'CARTÃO',
                  gateway: 'HUBLA'
                }
              });
              
              // console.log('Emails sent successfully');
            }
          } catch (emailError) {
            console.error('Failed to send confirmation emails:', emailError);
          }

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