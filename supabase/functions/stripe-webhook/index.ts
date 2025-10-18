import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import Stripe from "https://esm.sh/stripe@18.5.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, stripe-signature',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

serve(async (req) => {
  // console.log('Stripe webhook received');

  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
      apiVersion: '2025-08-27.basil',
    });

    const supabaseService = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { persistSession: false } }
    );

    // Get the raw body for signature verification
    const body = await req.text();
    const signature = req.headers.get('stripe-signature');

    if (!signature) {
      console.error('No Stripe signature found');
      return new Response(JSON.stringify({ error: 'No signature' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Verify webhook signature (optional but recommended)
    // For now, we'll just parse the body
    const event = JSON.parse(body);

    // console.log('Stripe event type:', event.type);
    // console.log('Stripe event data:', JSON.stringify(event.data, null, 2));

    // Handle checkout.session.completed event
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;
      const sessionId = session.id;
      const paymentStatus = session.payment_status;
      const metadata = session.metadata;

      // console.log('Checkout session completed:', {
      //   sessionId,
      //   paymentStatus,
      //   metadata,
      // });

      // Find the order by payment_data
      const { data: orders, error: orderFetchError } = await supabaseService
        .from('orders')
        .select('*')
        .eq('gateway', 'STRIPE')
        .eq('status', 'pending');

      if (orderFetchError) {
        console.error('Error fetching orders:', orderFetchError);
        return new Response(JSON.stringify({ error: 'Order fetch failed' }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Find order with matching session ID in payment_data
      const order = orders?.find((o: any) => 
        o.payment_data?.paymentId === sessionId
      );

      if (!order) {
        console.error('Order not found for session:', sessionId);
        return new Response(JSON.stringify({ error: 'Order not found' }), {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // console.log('Found order:', order.id);

      // Update order status based on payment status
      const newStatus = paymentStatus === 'paid' ? 'paid' : 'failed';
      
      const { error: orderUpdateError } = await supabaseService
        .from('orders')
        .update({
          status: newStatus,
          paid_at: paymentStatus === 'paid' ? new Date().toISOString() : null,
          payment_data: {
            ...order.payment_data,
            stripeSessionId: sessionId,
            stripePaymentStatus: paymentStatus,
          }
        })
        .eq('id', order.id);

      if (orderUpdateError) {
        console.error('Error updating order:', orderUpdateError);
        return new Response(JSON.stringify({ error: 'Order update failed' }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // console.log('Order updated to status:', newStatus);

      // If paid, handle user registration (if not logged in purchase)
      if (paymentStatus === 'paid') {
        const isLoggedInPurchase = order.payment_data?.isLoggedInPurchase;
        
        if (!isLoggedInPurchase) {
          // Create user in Supabase Auth
          const customerEmail = order.payment_data?.customerData?.email || metadata?.customerEmail;
          const customerName = order.payment_data?.customerData?.name || metadata?.customerName;
          const customerPassword = order.payment_data?.customerData?.password || metadata?.customerPassword;

          if (customerEmail && customerPassword) {
            // console.log('Creating auth user for:', customerEmail);

            const { data: authData, error: authError } = await supabaseService.auth.admin.createUser({
              email: customerEmail,
              password: customerPassword,
              email_confirm: true,
              user_metadata: {
                name: customerName,
              },
            });

            if (authError) {
              console.error('Error creating auth user:', authError);
            } else {
              // console.log('Auth user created:', authData.user.id);

              // Update profile with auth user ID and activate
              const { error: profileUpdateError } = await supabaseService
                .from('profiles')
                .update({
                  user_id: authData.user.id,
                  is_active: true,
                })
                .eq('id', order.user_id);

              if (profileUpdateError) {
                console.error('Error updating profile:', profileUpdateError);
              } else {
                // console.log('Profile activated for user:', authData.user.id);
              }
            }
          }
        } else {
          // Just activate the profile if it's a logged in purchase
          const { error: profileActivateError } = await supabaseService
            .from('profiles')
            .update({ is_active: true })
            .eq('id', order.user_id);

          if (profileActivateError) {
            console.error('Error activating profile:', profileActivateError);
          } else {
            // console.log('Profile activated');
          }
        }
      }
    }

    // Handle payment_intent.succeeded (for additional confirmation)
    if (event.type === 'payment_intent.succeeded') {
      const paymentIntent = event.data.object;
      // console.log('Payment intent succeeded:', paymentIntent.id);
    }

    // Handle payment_intent.payment_failed
    if (event.type === 'payment_intent.payment_failed') {
      const paymentIntent = event.data.object;
      // console.log('Payment intent failed:', paymentIntent.id);
    }

    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Stripe webhook error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : String(error) }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
