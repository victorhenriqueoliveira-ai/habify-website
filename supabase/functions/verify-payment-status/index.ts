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
    const { orderId, paymentId } = await req.json();
    
    console.log('🔍 Verifying payment status:', { orderId, paymentId });

    if (!orderId && !paymentId) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'orderId or paymentId required' 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    // Create Supabase client with service role
    const supabaseService = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { persistSession: false } }
    );

    // Find order by orderId or paymentId
    let query = supabaseService
      .from('orders')
      .select(`
        id,
        status,
        amount,
        gateway,
        payment_method,
        paid_at,
        user_id,
        payment_data,
        plan:plans(
          id,
          name,
          description,
          credits_granted
        )
      `);

    if (orderId) {
      query = query.eq('id', orderId);
    } else {
      // Try to find by gateway payment ID
      query = query.or(`abacatepay_id.eq.${paymentId},hubla_transaction_id.eq.${paymentId}`);
    }

    const { data: order, error: orderError } = await query.maybeSingle();

    if (orderError) {
      console.error('Error fetching order:', orderError);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Failed to fetch order' 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }

    if (!order) {
      console.log('Order not found');
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Order not found' 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 404 }
      );
    }

    console.log('✅ Order found:', {
      id: order.id,
      status: order.status,
      gateway: order.gateway,
      hasUserId: !!order.user_id
    });

    // If order is paid, get user's credits
    let credits = 0;
    if (order.status === 'paid' && order.user_id) {
      const { data: profile } = await supabaseService
        .from('profiles')
        .select('credits')
        .eq('id', order.user_id)
        .single();
      
      credits = profile?.credits || 0;
      console.log('User credits:', credits);
    }

    return new Response(
      JSON.stringify({
        success: true,
        order: {
          id: order.id,
          status: order.status,
          amount: order.amount,
          gateway: order.gateway,
          paymentMethod: order.payment_method,
          paidAt: order.paid_at,
          plan: order.plan,
          credits,
          isLoggedInPurchase: !!order.payment_data?.isLoggedInPurchase,
          customerEmail: order.payment_data?.customerData?.email
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );

  } catch (error) {
    console.error('Verification error:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
