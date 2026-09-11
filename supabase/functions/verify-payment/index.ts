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
    const { paymentId, abacatePayId, orderId } = await req.json();
    
    // Support multiple ID formats:
    // 1. orderId (most reliable - our internal ID)
    // 2. paymentId (gateway ID from URL params)
    // 3. abacatePayId (legacy support)
    const id = orderId || paymentId || abacatePayId;
    
    console.log('Verifying payment:', { orderId, paymentId, abacatePayId, id });

    // Create Supabase service client
    const supabaseService = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { persistSession: false } }
    );
    
    if (!id) {
      throw new Error('ID de pagamento não fornecido');
    }
    
    // Check order status directly from database (webhook should have already updated it)
    // Try to find by:
    // 1. orderId (our internal UUID)
    // 2. abacatepay_id (gateway ID for PIX)
    // 3. asaas_id (gateway ID for CARD)
    // 4. hubla_transaction_id (legacy gateway ID)
    const { data: orders, error: orderError } = await supabaseService
      .from('orders')
      .select('*')
      .or(`id.eq.${id},abacatepay_id.eq.${id},asaas_id.eq.${id},hubla_transaction_id.eq.${id}`)
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
    console.log('📦 Order status check:', { 
      orderId: order.id, 
      isPaid, 
      status: order.status,
      hasUserId: !!order.user_id 
    });

    // ✅ VALIDAÇÃO ADICIONAL: Verificar se profile existe e tem auth_user_id
    if (isPaid && order.user_id) {
      console.log('🔍 Payment confirmed, verifying user profile:', order.user_id);
      
      // Get profile data
      const { data: profile, error: profileError } = await supabaseService
        .from('profiles')
        .select('id, auth_user_id, is_active, email')
        .eq('id', order.user_id)
        .maybeSingle();

      if (profileError) {
        console.error('❌ Erro ao buscar perfil:', profileError);
        throw new Error('Erro ao verificar perfil do usuário');
      }
      
      if (!profile) {
        console.error('🚨 CRITICAL: Order paid but profile not found:', order.id);
        return new Response(
          JSON.stringify({
            success: false,
            isPaid: false,
            error: 'Usuário não encontrado. Contate o suporte com o ID: ' + order.id,
            order
          }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
          }
        );
      }
      
      if (!profile.auth_user_id) {
        console.error('🚨 CRITICAL: Profile without auth_user_id:', profile.id);
        return new Response(
          JSON.stringify({
            success: false,
            isPaid: false,
            error: 'Conta não ativada completamente. Contate o suporte com o ID: ' + profile.id,
            order
          }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
          }
        );
      }
      
      if (!profile.is_active) {
        console.error('⚠️ Profile exists but not active:', profile.id);
        return new Response(
          JSON.stringify({
            success: false,
            isPaid: false,
            error: 'Conta desativada. Contate o suporte.',
            order
          }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
          }
        );
      }
      
      console.log('✅ Profile validated:', { 
        profileId: profile.id, 
        authUserId: profile.auth_user_id,
        isActive: profile.is_active 
      });
    } else if (isPaid && !order.user_id) {
      // Pedido pago mas sem user_id = problema crítico
      console.error('🚨 CRITICAL: Order paid but no user_id:', order.id);
      return new Response(
        JSON.stringify({
          success: false,
          isPaid: false,
          error: 'Pagamento confirmado mas usuário não criado. Contate o suporte urgente com o ID: ' + order.id,
          order
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      );
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