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
    
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    );

    // Parse request body
    const { planId, customerData }: PaymentRequest = await req.json();

    console.log('Creating payment for plan:', planId, 'customer:', customerData.email);

    // Get plan details
    const { data: plan, error: planError } = await supabaseClient
      .from('plans')
      .select('*')
      .eq('id', planId)
      .single();

    if (planError || !plan) {
      throw new Error('Plan not found');
    }

    // Create AbacatePay payment
    const abacatePayResponse = await fetch('https://api.abacatepay.com/v1/billing/create', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('ABACATEPAY_API_KEY')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        amount: Math.round(plan.price * 100), // Convert to cents
        description: plan.name,
        frequency: 'once', // Required field for one-time payments
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

    if (!abacatePayResponse.ok) {
      const errorText = await abacatePayResponse.text();
      console.error('AbacatePay error:', errorText);
      throw new Error('Failed to create payment with AbacatePay');
    }

    const abacatePayData = await abacatePayResponse.json();
    console.log('AbacatePay response:', abacatePayData);

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
      throw new Error('Failed to create transaction record');
    }

    console.log('Transaction created:', transaction.id);

    return new Response(
      JSON.stringify({
        success: true,
        paymentUrl: abacatePayData.checkout_url || abacatePayData.url,
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