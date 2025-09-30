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
    console.log('API Key exists:', !!abacatePayApiKey);

    const apiUrl = `https://api.abacatepay.com/v1/coupons/${couponId}`;
    console.log('Calling API URL:', apiUrl);

    // Validate coupon with AbacatePay using the correct endpoint
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${abacatePayApiKey}`,
        'Content-Type': 'application/json',
      },
    });

    console.log('API Response status:', response.status);
    console.log('API Response headers:', JSON.stringify(Object.fromEntries(response.headers.entries())));

    // Try to get response body regardless of status
    const responseText = await response.text();
    console.log('API Response body:', responseText);

    if (!response.ok) {
      console.error('Coupon validation failed:', response.status, responseText);
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

    let data;
    try {
      data = JSON.parse(responseText);
    } catch (parseError) {
      console.error('Failed to parse response:', parseError);
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Erro ao processar resposta da API',
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      );
    }

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
