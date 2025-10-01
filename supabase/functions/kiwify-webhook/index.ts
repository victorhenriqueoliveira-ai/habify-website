import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Kiwify webhook received');
    
    const payload = await req.json();
    console.log('Kiwify webhook payload:', JSON.stringify(payload, null, 2));

    const supabaseService = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { persistSession: false } }
    );

    // Extract payment information from Kiwify webhook
    const paymentId = payload.id || payload.payment_id;
    const status = payload.status; // 'paid', 'pending', 'refused', etc.
    
    console.log('Processing payment:', paymentId, 'Status:', status);

    // Find the order by payment_id in payment_data
    const { data: order, error: orderError } = await supabaseService
      .from('orders')
      .select('*')
      .eq('gateway', 'KIWIFY')
      .contains('payment_data', { paymentId: paymentId })
      .single();

    if (orderError || !order) {
      console.error('Order not found for payment:', paymentId, orderError);
      return new Response(
        JSON.stringify({ error: 'Order not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Order found:', order.id);

    // Map Kiwify status to our status
    let orderStatus = 'pending';
    if (status === 'paid' || status === 'approved') {
      orderStatus = 'paid';
    } else if (status === 'refused' || status === 'refunded') {
      orderStatus = 'failed';
    }

    // Update order status
    const { error: updateError } = await supabaseService
      .from('orders')
      .update({
        status: orderStatus,
        paid_at: orderStatus === 'paid' ? new Date().toISOString() : null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', order.id);

    if (updateError) {
      console.error('Error updating order:', updateError);
      throw new Error('Failed to update order');
    }

    console.log('Order status updated to:', orderStatus);

    // If payment is successful, create auth user and activate profile
    if (orderStatus === 'paid') {
      const customerData = order.payment_data.customerData;
      
      // Check if this is a logged-in purchase
      if (customerData?.isLoggedInPurchase) {
        console.log('Logged-in purchase detected, skipping user creation');
      } else {
        // Create auth user
        console.log('Creating auth user for:', customerData?.email);
        
        const { data: authUser, error: authError } = await supabaseService.auth.admin.createUser({
          email: customerData?.email,
          password: customerData?.password,
          email_confirm: true,
        });

        if (authError) {
          console.error('Error creating auth user:', authError);
          throw new Error('Failed to create user account');
        }

        console.log('Auth user created:', authUser.user.id);

        // Update profile with auth user id and activate it
        const { error: profileUpdateError } = await supabaseService
          .from('profiles')
          .update({
            user_id: authUser.user.id,
            is_active: true,
            updated_at: new Date().toISOString(),
          })
          .eq('id', order.user_id);

        if (profileUpdateError) {
          console.error('Error updating profile:', profileUpdateError);
          throw new Error('Failed to update profile');
        }

        console.log('Profile activated for user:', authUser.user.id);
      }
    }

    return new Response(
      JSON.stringify({ success: true, status: orderStatus }),
      { 
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('Webhook processing error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : String(error) }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
