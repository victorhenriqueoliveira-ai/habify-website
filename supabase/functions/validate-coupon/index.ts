import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

serve(async (req) => {
  // console.log('Validate coupon function started. Method:', req.method);
  
  if (req.method === 'OPTIONS') {
    // console.log('Handling CORS preflight request');
    // return new Response(null, { 
    //   status: 200,
    //   headers: corsHeaders 
    // });
  }

  try {
    const { couponId } = await req.json();
    // console.log('Validating coupon:', couponId);
    
    if (!couponId) {
      throw new Error('Código do cupom é obrigatório');
    }
    
    const abacatePayApiKey = Deno.env.get('ABACATEPAY_API_KEY');
    if (!abacatePayApiKey) {
      console.error('ABACATEPAY_API_KEY not configured');
      throw new Error('Configuração de pagamento não encontrada');
    }

    // List all coupons and find the matching one
    const listUrl = 'https://api.abacatepay.com/v1/coupon/list';
    // console.log('Fetching coupons list from:', listUrl);
    
    const response = await fetch(listUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${abacatePayApiKey}`,
        'Content-Type': 'application/json',
      },
    });

    // console.log('AbacatePay response status:', response.status);

    if (!response.ok) {
      const errorBody = await response.text();
      console.error('AbacatePay error:', errorBody);
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Erro ao consultar cupons',
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      );
    }

    const couponsData = await response.json();
    // console.log('Coupons list retrieved:', couponsData);

    // Find the coupon with matching id (case-insensitive)
    const coupon = couponsData.data?.find((c: any) => 
      c.id.toUpperCase() === couponId.toUpperCase()
    );

    if (!coupon) {
      // console.log('Coupon not found:', couponId);
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Cupom não encontrado',
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      );
    }

    // Check if coupon is active
    if (coupon.status !== 'ACTIVE') {
      // console.log('Coupon is not active:', coupon.status);
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Cupom inválido ou expirado',
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      );
    }

    // Check if coupon has remaining uses (if maxRedeems is not -1)
    if (coupon.maxRedeems !== -1 && coupon.redeems >= coupon.maxRedeems) {
      // console.log('Coupon has no remaining uses');
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Cupom esgotado',
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      );
    }

    // console.log('Coupon validated successfully:', {
    //   id: coupon.id,
    //   discountKind: coupon.discountKind,
    //   discount: coupon.discount
    // });

    return new Response(
      JSON.stringify({
        success: true,
        coupon: {
          id: coupon.id,
          discountKind: coupon.discountKind,
          discount: coupon.discount,
        },
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    console.error('Coupon validation error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Erro ao validar cupom',
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  }
});
