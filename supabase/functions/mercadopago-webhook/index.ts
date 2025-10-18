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
    // console.log('Mercado Pago webhook received');

    const body = await req.json();
    // console.log('Webhook body:', JSON.stringify(body, null, 2));

    // Mercado Pago sends notifications in this format
    const { type, data } = body;

    // Only process payment notifications
    if (type !== 'payment') {
      // console.log('Ignoring non-payment notification:', type);
      return new Response(JSON.stringify({ received: true }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const paymentId = data?.id;
    if (!paymentId) {
      console.error('No payment ID in webhook data');
      return new Response(JSON.stringify({ error: 'No payment ID' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // console.log('Processing payment ID:', paymentId);

    // Get payment details from Mercado Pago
    const mercadoPagoToken = Deno.env.get('MERCADOPAGO_ACCESS_TOKEN');
    if (!mercadoPagoToken) {
      console.error('MERCADOPAGO_ACCESS_TOKEN not configured');
      return new Response(JSON.stringify({ error: 'Configuration error' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const paymentResponse = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
      headers: {
        'Authorization': `Bearer ${mercadoPagoToken}`,
        'Content-Type': 'application/json',
      },
    });

    if (!paymentResponse.ok) {
      const errorText = await paymentResponse.text();
      console.error('Error fetching payment details:', errorText);
      return new Response(JSON.stringify({ error: 'Failed to fetch payment' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const payment = await paymentResponse.json();
    // console.log('Payment details:', JSON.stringify(payment, null, 2));

    // Map Mercado Pago status to our status
    let orderStatus = 'pending';
    if (payment.status === 'approved') {
      orderStatus = 'paid';
    } else if (payment.status === 'rejected' || payment.status === 'cancelled') {
      orderStatus = 'failed';
    }

    // console.log('Mapped status:', orderStatus);

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('Supabase configuration missing');
      return new Response(JSON.stringify({ error: 'Configuration error' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { persistSession: false }
    });

    // Find order by external reference or preference_id
    const externalReference = payment.external_reference;
    const preferenceId = payment.metadata?.preference_id;

    // console.log('Looking for order with external reference:', externalReference);

    // First try to find by payment_data containing the preference_id
    const { data: orders, error: orderError } = await supabase
      .from('orders')
      .select('*')
      .eq('gateway', 'MERCADOPAGO')
      .eq('status', 'pending');

    if (orderError) {
      console.error('Error fetching orders:', orderError);
      return new Response(JSON.stringify({ error: 'Database error' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Find the matching order
    const order = orders?.find(o => 
      o.payment_data?.paymentId === preferenceId || 
      externalReference?.includes(o.plan_id)
    );

    if (!order) {
      console.error('Order not found for payment:', paymentId);
      return new Response(JSON.stringify({ error: 'Order not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // console.log('Found order:', order.id);

    // Update order status
    const updateData: any = {
      status: orderStatus,
      payment_data: {
        ...order.payment_data,
        mercadoPagoPaymentId: paymentId,
        mercadoPagoData: payment,
      },
      updated_at: new Date().toISOString(),
    };

    if (orderStatus === 'paid') {
      updateData.paid_at = new Date().toISOString();
    }

    const { error: updateError } = await supabase
      .from('orders')
      .update(updateData)
      .eq('id', order.id);

    if (updateError) {
      console.error('Error updating order:', updateError);
      return new Response(JSON.stringify({ error: 'Failed to update order' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // console.log('Order updated successfully');

    // If payment successful and user needs to be created
    if (orderStatus === 'paid' && order.user_id) {
      // console.log('Payment successful, checking if user needs to be created');

      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', order.user_id)
        .single();

      if (profile && !profile.is_active) {
        // console.log('Creating auth user for profile:', profile.id);

        const customerData = order.payment_data?.customerData;
        if (customerData?.email && customerData?.password) {
          const { data: authData, error: authError } = await supabase.auth.admin.createUser({
            email: customerData.email,
            password: customerData.password,
            email_confirm: true,
            user_metadata: {
              name: customerData.name,
            }
          });

          if (authError) {
            console.error('Error creating auth user:', authError);
          } else if (authData?.user) {
            // console.log('Auth user created:', authData.user.id);

            // Update profile with auth user ID
            const { error: profileUpdateError } = await supabase
              .from('profiles')
              .update({
                user_id: authData.user.id,
                auth_user_id: authData.user.id,
                is_active: true,
              })
              .eq('id', profile.id);

            if (profileUpdateError) {
              console.error('Error updating profile:', profileUpdateError);
            } else {
              // console.log('Profile updated with auth user ID');
            }
          }
        }
      }
    }

    return new Response(
      JSON.stringify({ received: true, status: orderStatus }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('Webhook processing error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Internal error' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
