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
    
    // console.log('Verifying payment:', id);

    // Create Supabase service client
    const supabaseService = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { persistSession: false } }
    );

    // console.log('Checking order status in database for paymentId:', id);
    
    if (!id) {
      throw new Error('ID de pagamento não fornecido');
    }
    
    // Check order status directly from database (webhook should have already updated it)
    // Try to find by abacatepay_id, hubla_transaction_id or by id
    const { data: orders, error: orderError } = await supabaseService
      .from('orders')
      .select('*')
      .or(`abacatepay_id.eq.${id},hubla_transaction_id.eq.${id},id.eq.${id}`)
      .order('created_at', { ascending: false })
      .limit(1);
      
    // console.log('Order query result:', { orders, orderError });

    if (orderError) {
      console.error('Erro ao buscar pedido:', orderError);
      throw new Error('Erro ao verificar pedido. Tente novamente em instantes.');
    }

    if (!orders || orders.length === 0) {
      console.error('Pedido não encontrado para ID:', id);
      throw new Error('Pedido não encontrado. Verifique se o pagamento foi concluído.');
    }

    const order = orders[0];

    const isPaid = order.status === 'paid';
    // console.log('Order status check:', { isPaid, status: order.status });

    // ✅ SECURITY: Webhook já criou o usuário, apenas verificar se está ativo
    if (isPaid && order && order.user_id) {
      // console.log('Payment confirmed, verifying user is active:', order.user_id);
      
      // Get profile data
      const { data: profile, error: profileError } = await supabaseService
        .from('profiles')
        .select('id, auth_user_id, is_active, email')
        .eq('id', order.user_id)
        .maybeSingle();

      if (profileError) {
        console.error('Erro ao buscar perfil:', profileError);
      } else if (!profile) {
        console.error('Perfil não encontrado para pedido:', order.id);
      } else if (!profile.is_active) {
        console.error('ALERTA: Perfil existe mas não está ativo:', profile.id);
      } else {
        // console.log('Perfil ativo e pronto:', profile.id);
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