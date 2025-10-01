import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import Stripe from "https://esm.sh/stripe@18.5.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

interface PaymentRequest {
  planId: string;
  customerData: {
    name: string;
    email: string;
    phone?: string;
    cpf?: string;
    password: string;
    paymentMethod?: 'PIX' | 'CARD' | 'BOLETO';
    installments?: number;
    isLoggedInPurchase?: boolean;
    userId?: string;
  };
}

serve(async (req) => {
  console.log('Edge function started. Method:', req.method);
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    console.log('Handling CORS preflight request');
    return new Response(null, { 
      status: 200,
      headers: corsHeaders 
    });
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

    console.log('Creating payment for plan:', planId, 'customer:', customerData.email, 'method:', customerData.paymentMethod);

    // Determine gateway based on payment method
    const useAbacatePay = customerData.paymentMethod === 'PIX';
    const useStripe = customerData.paymentMethod === 'CARD' || customerData.paymentMethod === 'BOLETO';

    // Check if required API keys are available
    if (useAbacatePay) {
      const abacatePayApiKey = Deno.env.get('ABACATEPAY_API_KEY');
      if (!abacatePayApiKey) {
        console.error('ABACATEPAY_API_KEY is not configured');
        throw new Error('Configuração de pagamento PIX não encontrada. Entre em contato com o suporte.');
      }
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

    // Create Supabase service client for database operations
    const supabaseService = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { persistSession: false } }
    );

    let profileId: string;

    // Se for compra de usuário logado, usa o perfil existente
    if (customerData.isLoggedInPurchase && customerData.userId) {
      console.log('Using existing profile for logged in user:', customerData.userId);
      
      const { data: existingProfile, error: profileFetchError } = await supabaseService
        .from('profiles')
        .select('id')
        .eq('user_id', customerData.userId)
        .single();

      if (profileFetchError || !existingProfile) {
        console.error('Failed to find existing profile:', profileFetchError);
        throw new Error('Perfil de usuário não encontrado');
      }

      profileId = existingProfile.id;
    } else {
      // Create inactive profile (not in Supabase Auth yet)
      console.log('Creating inactive profile for:', customerData.email);
      
      const { data: profile, error: profileError } = await supabaseService
        .from('profiles')
        .insert({
          name: customerData.name,
          email: customerData.email,
          phone: customerData.phone || null,
          role: 'user',
          is_active: false, // Will be activated when payment is confirmed
          user_id: null // Will be set when auth user is created
        })
        .select()
        .single();

      if (profileError) {
        console.error('Failed to create profile:', profileError);
        throw new Error('Erro ao criar perfil do usuário');
      }

    console.log('Profile created:', profile.id);
      profileId = profile.id;
    }

    // Process payment based on gateway
    let paymentUrl: string;
    let paymentId: string;
    let gateway: 'ABACATEPAY' | 'STRIPE';

    if (useAbacatePay) {
      // AbacatePay flow for PIX
      gateway = 'ABACATEPAY';
      const abacatePayApiKey = Deno.env.get('ABACATEPAY_API_KEY')!;

      // Create customer in AbacatePay
      const customerPayload = {
        name: customerData.name,
        cellphone: customerData.phone,
        email: customerData.email,
        taxId: customerData.cpf,
      };

      console.log('Creating customer with payload:', JSON.stringify(customerPayload, null, 2));

      const customerResponse = await fetch('https://api.abacatepay.com/v1/customer/create', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${abacatePayApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(customerPayload),
      });

      console.log('Customer response status:', customerResponse.status);

      if (!customerResponse.ok) {
        const customerErrorText = await customerResponse.text();
        console.error('Customer creation error:', customerErrorText);
        throw new Error('Falha ao criar cliente no sistema de pagamento.');
      }

      const customerResponseData = await customerResponse.json();
      console.log('Customer created:', customerResponseData);

      const customerId = customerResponseData.data?.id;
      if (!customerId) {
        console.error('No customer ID received:', customerResponseData);
        throw new Error('ID do cliente não foi gerado.');
      }

      // Create billing with AbacatePay
      const webhookUrl = `https://jsttoajuszshrivmgnmc.supabase.co/functions/v1/abacatepay-webhook`;
      
      const billingPayload: any = {
        frequency: 'ONE_TIME',
        methods: ['PIX'],
        products: [{
          externalId: planId,
          name: plan.name,
          description: plan.description || plan.name,
          quantity: 1,
          price: Math.round(plan.price * 100),
        }],
        customerId: customerId,
        returnUrl: origin.includes('localhost') || origin.includes('lovable.dev') 
          ? `${origin}/payment-success` 
          : 'https://habify.com.br/payment-success',
        completionUrl: origin.includes('localhost') || origin.includes('lovable.dev') 
          ? `${origin}/payment-success` 
          : 'https://habify.com.br/payment-success',
        webhookUrl: webhookUrl,
        externalId: `habify-${planId}-${Date.now()}`,
        allowCoupons: true,
      };
      
      console.log('AbacatePay billing payload:', JSON.stringify(billingPayload, null, 2));

      const abacatePayResponse = await fetch('https://api.abacatepay.com/v1/billing/create', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${abacatePayApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(billingPayload),
      });

      console.log('AbacatePay response status:', abacatePayResponse.status);

      if (!abacatePayResponse.ok) {
        const errorText = await abacatePayResponse.text();
        console.error('AbacatePay error response:', errorText);
        throw new Error('Falha ao processar pagamento. Tente novamente em alguns minutos.');
      }

      const abacatePayData = await abacatePayResponse.json();
      console.log('AbacatePay response data:', abacatePayData);

      const responseData = abacatePayData.data || abacatePayData;
      
      if (!responseData || !responseData.id) {
        console.error('Invalid AbacatePay response - missing ID:', abacatePayData);
        throw new Error('Resposta inválida do sistema de pagamento.');
      }

      paymentUrl = responseData.checkout_url || responseData.url || responseData.paymentUrl;
      paymentId = responseData.id;

      if (!paymentUrl) {
        console.error('No payment URL in response:', abacatePayData);
        throw new Error('URL de pagamento não foi gerada.');
      }
    } else {
      // Stripe flow for CARD and BOLETO
      gateway = 'STRIPE';
      
      // Check if plan has Stripe price ID
      if (!plan.stripe_price_id) {
        console.error('Plan does not have stripe_price_id configured');
        throw new Error('Produto não configurado no Stripe. Entre em contato com o suporte.');
      }

      console.log('Creating Stripe checkout session for price:', plan.stripe_price_id);

      // Initialize Stripe
      const stripeKey = Deno.env.get('STRIPE_SECRET_KEY');
      if (!stripeKey) {
        console.error('STRIPE_SECRET_KEY not configured');
        throw new Error('Configuração de pagamento não encontrada. Entre em contato com o suporte.');
      }
      
      const stripe = new Stripe(stripeKey, {
        apiVersion: '2024-11-20.acacia',
      });

      // Check if customer exists in Stripe
      const customers = await stripe.customers.list({ 
        email: customerData.email, 
        limit: 1 
      });
      
      let customerId;
      if (customers.data.length > 0) {
        customerId = customers.data[0].id;
        console.log('Using existing Stripe customer:', customerId);
      }

      // Create Stripe checkout session
      const sessionConfig: any = {
        customer: customerId,
        customer_email: customerId ? undefined : customerData.email,
        line_items: [
          {
            price: plan.stripe_price_id,
            quantity: 1,
          },
        ],
        mode: 'payment',
        success_url: `${origin}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${origin}/payment-canceled`,
        metadata: {
          planId: planId,
          profileId: profileId,
          customerEmail: customerData.email,
          customerName: customerData.name,
          customerPassword: customerData.isLoggedInPurchase ? '' : customerData.password,
          isLoggedInPurchase: customerData.isLoggedInPurchase ? 'true' : 'false',
        },
      };

      // Configure payment methods based on selection
      if (customerData.paymentMethod === 'BOLETO') {
        sessionConfig.payment_method_types = ['boleto'];
      } else {
        sessionConfig.payment_method_types = ['card'];
      }

      console.log('Creating Stripe session with config:', JSON.stringify(sessionConfig, null, 2));
      
      const session = await stripe.checkout.sessions.create(sessionConfig);

      paymentUrl = session.url || '';
      paymentId = session.id;

      if (!paymentUrl) {
        console.error('No Stripe checkout URL generated');
        throw new Error('URL de pagamento não foi gerada.');
      }

      console.log('Stripe checkout session created:', session.id);
    }

    // Create order record with profile reference and gateway info
    const { data: order, error: orderError } = await supabaseService
      .from('orders')
      .insert({
        user_id: profileId,
        plan_id: planId,
        abacatepay_id: gateway === 'ABACATEPAY' ? paymentId : null,
        amount: plan.price,
        status: 'pending',
        payment_method: customerData.paymentMethod || 'PIX',
        gateway: gateway,
        payment_data: {
          customerData: {
            ...customerData,
            password: customerData.isLoggedInPurchase ? undefined : customerData.password
          },
          paymentId: paymentId,
          installments: customerData.installments,
          isLoggedInPurchase: customerData.isLoggedInPurchase,
        }
      })
      .select()
      .single();

    if (orderError) {
      console.error('Order creation error:', orderError);
      throw new Error('Falha ao registrar pedido.');
    }

    console.log('Order created successfully:', order.id);

    return new Response(
      JSON.stringify({
        success: true,
        paymentUrl: paymentUrl,
        orderId: order.id,
        paymentId: paymentId,
        gateway: gateway,
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
        error: error instanceof Error ? error.message : String(error),
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});