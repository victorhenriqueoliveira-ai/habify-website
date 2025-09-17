import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface PaymentRequest {
  planId: string;
  customerData: {
    name: string;
    email: string;
    phone?: string;
    cpf?: string;
  };
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const origin = req.headers.get('origin') || 'https://habify.com.br';
    
    console.log('Payment request received from origin:', origin);
    
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    );

    // Parse request body
    const { planId, customerData }: PaymentRequest = await req.json();

    console.log('Creating payment for plan:', planId, 'customer:', customerData.email);

    // Check if AbacatePay API key is available
    const abacatePayApiKey = Deno.env.get('ABACATEPAY_API_KEY');
    if (!abacatePayApiKey) {
      console.error('ABACATEPAY_API_KEY is not configured');
      throw new Error('Configuração de pagamento não encontrada. Entre em contato com o suporte.');
    }

    // Get plan details
    const { data: plan, error: planError } = await supabaseClient
      .from('plans')
      .select('*')
      .eq('id', planId)
      .single();

    console.log('Plan query result:', { plan, planError });

    if (planError || !plan) {
      console.error('Plan not found:', planError);
      throw new Error('Plano não encontrado. Tente novamente.');
    }

    console.log('Creating payment with AbacatePay for plan:', plan.name, 'price:', plan.price);

    // Create AbacatePay payment
    const abacatePayResponse = await fetch('https://api.abacatepay.com/v1/billing/create', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${abacatePayApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        frequency: 'once', // Required field for one-time payments
        methods: ['pix', 'credit_card', 'bank_slip'], // Required payment methods
        products: [{
          external_id: planId,
          name: plan.name,
          description: plan.description || plan.name,
          quantity: 1,
          price: Math.round(plan.price * 100), // Convert to cents
        }],
        customer: {
          name: customerData.name,
          email: customerData.email,
          phone: customerData.phone,
          cpf: customerData.cpf,
        },
        returnUrl: origin.includes('localhost') || origin.includes('lovable.dev') 
          ? `${origin}/payment-success` 
          : 'https://habify.com.br/payment-success',
        cancelUrl: origin.includes('localhost') || origin.includes('lovable.dev') 
          ? `${origin}/payment-canceled` 
          : 'https://habify.com.br/payment-canceled',
        metadata: {
          planId: planId,
          planType: plan.type,
        }
      }),
    });

    console.log('AbacatePay response status:', abacatePayResponse.status);

    if (!abacatePayResponse.ok) {
      const errorText = await abacatePayResponse.text();
      console.error('AbacatePay error response:', errorText);
      throw new Error('Falha ao processar pagamento. Tente novamente em alguns minutos.');
    }

    const abacatePayData = await abacatePayResponse.json();
    console.log('AbacatePay response data:', abacatePayData);

    // Validate response data
    if (!abacatePayData.id) {
      console.error('Invalid AbacatePay response - missing ID:', abacatePayData);
      throw new Error('Resposta inválida do sistema de pagamento.');
    }

    const paymentUrl = abacatePayData.checkout_url || abacatePayData.url;
    if (!paymentUrl) {
      console.error('No payment URL in response:', abacatePayData);
      throw new Error('URL de pagamento não foi gerada.');
    }

    // Create transaction record in Supabase
    const supabaseService = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { persistSession: false } }
    );

    const { data: transaction, error: transactionError } = await supabaseService
      .from('transactions')
      .insert({
        plan_id: planId,
        abacatepay_id: abacatePayData.id,
        amount: plan.price,
        status: 'pending',
        payment_data: {
          customerData,
          abacatePayData,
        }
      })
      .select()
      .single();

    if (transactionError) {
      console.error('Transaction creation error:', transactionError);
      throw new Error('Falha ao registrar transação.');
    }

    console.log('Transaction created successfully:', transaction.id);

    return new Response(
      JSON.stringify({
        success: true,
        paymentUrl: paymentUrl,
        transactionId: transaction.id,
        abacatePayId: abacatePayData.id,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    console.error('Payment creation error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});