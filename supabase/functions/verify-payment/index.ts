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
    const { paymentId, abacatePayId } = await req.json();
    
    // Support both new paymentId and legacy abacatePayId
    const id = paymentId || abacatePayId;
    
    console.log('Verifying payment:', id);

    // Create Supabase service client
    const supabaseService = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { persistSession: false } }
    );

    console.log('Checking order status in database for paymentId:', id);
    
    // Check order status directly from database (webhook should have already updated it)
    // Try to find by abacatepay_id or by payment_data.paymentId for Mercado Pago
    const { data: orders, error: orderError } = await supabaseService
      .from('orders')
      .select('*')
      .or(`abacatepay_id.eq.${id},payment_data->paymentId.eq.${id}`)
      .order('created_at', { ascending: false })
      .limit(1);
      
    console.log('Order query result:', { orders, orderError });

    if (orderError || !orders || orders.length === 0) {
      console.error('Order fetch error:', orderError);
      throw new Error('Order not found');
    }

    const order = orders[0];

    const isPaid = order.status === 'paid';
    console.log('Order status check:', { isPaid, status: order.status });

    // If payment is already confirmed via webhook, create auth user if not exists
    if (isPaid && order) {
      console.log('Payment confirmed, checking auth user for order:', order.id);
      
      // Get profile data
      const { data: profile, error: profileError } = await supabaseService
        .from('profiles')
        .select('*')
        .eq('id', order.user_id)
        .single();

      if (profileError) {
        console.error('Failed to get profile:', profileError);
      } else {
        const customerData = order.payment_data?.customerData;
        
        if (customerData?.email && customerData?.password && !profile.auth_user_id) {
          try {
            console.log('Creating auth user for email:', customerData.email);
            
            // Create user in Supabase Auth
            const { data: authData, error: authError } = await supabaseService.auth.admin.createUser({
              email: customerData.email,
              password: customerData.password,
              email_confirm: true, // User is confirmed after payment
              user_metadata: {
                name: customerData.name,
                phone: customerData.phone || null,
                payment_confirmed: true,
                activated_via_verify: true,
                activated_at: new Date().toISOString()
              }
            });

            if (authError) {
              console.error('Failed to create auth user:', authError);
            } else {
              console.log('Auth user created successfully:', authData.user?.id);
              
              // Update profile with auth_user_id and activate it
              const { error: profileUpdateError } = await supabaseService
                .from('profiles')
                .update({ 
                  auth_user_id: authData.user.id,
                  user_id: authData.user.id, // Now link to auth.users
                  is_active: true,
                  updated_at: new Date().toISOString()
                })
                .eq('id', order.user_id);

              if (profileUpdateError) {
                console.error('Failed to activate profile:', profileUpdateError);
              } else {
                console.log('Profile activated and linked to auth user successfully');
              }
            }
          } catch (error) {
            console.error('Error creating auth user:', error);
          }
        } else if (profile.auth_user_id) {
          console.log('Auth user already exists for profile:', profile.auth_user_id);
        } else {
          console.error('Missing customerData in order:', { customerData: !!customerData, email: !!customerData?.email, password: !!customerData?.password });
        }
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        order,
        isPaid,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    console.error('Payment verification error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : String(error),
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});