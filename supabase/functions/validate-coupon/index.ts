import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { 
      status: 200,
      headers: corsHeaders 
    });
  }

  try {
    const { couponId } = await req.json();

    if (!couponId) {
      throw new Error('Código do cupom é obrigatório');
    }

    const abacatePayApiKey = Deno.env.get('ABACATEPAY_API_KEY');
    if (!abacatePayApiKey) {
      throw new Error('Configuração de pagamento não encontrada');
    }

    console.log('Validating coupon:', couponId);

    // Validate coupon with AbacatePay
    const response = await fetch(`https://api.abacatepay.com/v1/coupon/${couponId}`, {
      headers: {
        'Authorization': `Bearer ${abacatePayApiKey}`,
      },
    });

    if (!response.ok) {
      console.error('Coupon not found or API error:', response.status);
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Cupom não encontrado ou inválido',
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      );
    }

    const data = await response.json();
    console.log('Coupon API response:', JSON.stringify(data, null, 2));

    const coupon = data.data;

    if (!coupon) {
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

    // Check if coupon has reached max redeems (if maxRedeems is not -1)
    if (coupon.maxRedeems !== -1 && coupon.redeemsCount >= coupon.maxRedeems) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Cupom já atingiu o limite de usos',
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      );
    }

    // Return valid coupon
    return new Response(
      JSON.stringify({
        success: true,
        coupon: coupon,
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
        error: error instanceof Error ? error.message : String(error),
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});
