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
  // console.log('Edge function started. Method:', req.method);
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    // console.log('Handling CORS preflight request');
    return new Response(null, { 
      status: 200,
      headers: corsHeaders 
    });
  }

  try {
    const origin = req.headers.get('origin') || 'https://habify.com.br';
    
    // console.log('Payment request received from origin:', origin);
    
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    );

    // Parse request body
    const { planId, customerData }: PaymentRequest = await req.json();

    // console.log('Creating payment for plan:', planId, 'customer:', customerData.email, 'method:', customerData.paymentMethod);

    // Determine gateway based on payment method
    const useAbacatePay = customerData.paymentMethod === 'PIX';
    const useHubla = customerData.paymentMethod === 'CARD';

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

    // console.log('Plan query result:', { plan, planError });

    if (planError || !plan) {
      console.error('Plan not found:', planError);
      throw new Error('Plano não encontrado. Tente novamente.');
    }

    // Validar se plano está ativo
    if (!plan.is_active) {
      console.error('Plan is inactive:', planId);
      await supabaseService.from('payment_logs').insert({
        gateway: 'UNKNOWN',
        error_message: 'Tentativa de comprar plano inativo',
        request_body: { planId, plan }
      });
      throw new Error('Este plano não está mais disponível para compra. Entre em contato com o suporte.');
    }

    // Get the correct price based on gateway
    const planPrice = useAbacatePay ? (plan.pix_price || plan.price) : (plan.stripe_price || plan.price);
    
    // Validar preço mínimo
    if (planPrice <= 0) {
      console.error('Invalid plan price:', planPrice);
      throw new Error('Preço do plano inválido. Entre em contato com o suporte.');
    }
    
    let gateway = useAbacatePay ? 'ABACATEPAY' : 'HUBLA';
    // console.log('Creating payment for plan:', plan.name, 'gateway:', gateway, 'price:', planPrice);

    // Create Supabase service client for database operations
    const supabaseService = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { persistSession: false } }
    );

    let profileId: string | null = null;

    // Se for compra de usuário logado, usa o perfil existente
    if (customerData.isLoggedInPurchase && customerData.userId) {
      // console.log('Using existing profile for logged in user:', customerData.userId);
      
      // Buscar profile usando auth_user_id
      const { data: existingProfile, error: profileFetchError } = await supabaseService
        .from('profiles')
        .select('id')
        .eq('auth_user_id', customerData.userId)
        .maybeSingle();

      if (profileFetchError) {
        console.error('Error fetching profile:', profileFetchError);
        
        // Log error
        await supabaseService.from('payment_logs').insert({
          gateway: gateway,
          error_message: `Failed to find profile: ${profileFetchError.message}`,
          request_body: { customerData },
          user_id: null
        });
        
        throw new Error('Erro ao buscar perfil do usuário. Tente novamente.');
      }

      if (!existingProfile) {
        console.error('Profile not found for user:', customerData.userId);
        throw new Error('Perfil não encontrado. Faça login novamente.');
      }

      profileId = existingProfile.id;
      // console.log('Found existing profile:', profileId);
      
      // Validar se já não tem order pendente
      const { data: pendingOrders, error: pendingError } = await supabaseService
        .from('orders')
        .select('id, created_at')
        .eq('user_id', profileId)
        .eq('status', 'pending')
        .limit(1);
        
      if (!pendingError && pendingOrders && pendingOrders.length > 0) {
        console.error('User has pending order:', profileId, pendingOrders[0].id);
        await supabaseService.from('payment_logs').insert({
          gateway: gateway,
          error_message: 'Tentativa de criar pedido duplicado',
          request_body: { profileId, existingOrderId: pendingOrders[0].id },
          user_id: profileId
        });
        throw new Error('Você já tem um pedido pendente. Complete o pagamento anterior ou aguarde alguns minutos e tente novamente.');
      }
    } else {
      // Novo usuário - validar se não tem order pendente com mesmo email
      // ✅ Permitir retry se order anterior está pending há mais de 15 minutos
      console.log('🔍 Checking for duplicate orders:', customerData.email);
      
      const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000);
      const { data: recentOrders } = await supabaseService
        .from('orders')
        .select('id, created_at, status, plan_id, payment_data')
        .gte('created_at', fifteenMinutesAgo.toISOString())
        .order('created_at', { ascending: false });

      const duplicates = recentOrders?.filter(o => {
        const orderEmail = o.payment_data?.customerData?.email;
        const orderPlanId = o.plan_id;
        
        // Bloquear apenas orders PAGAS ou PENDING recentes (menos de 15 min)
        return orderEmail === customerData.email && 
               orderPlanId === planId &&
               o.status === 'paid'; // Apenas bloquear se JÁ PAGO (duplicata real)
      });

      if (duplicates && duplicates.length > 0) {
        const lastOrder = duplicates[0];
        
        const errorMessage = 
          'Você já possui um pagamento confirmado para este plano. ' +
          'Verifique seu email ou entre em contato com o suporte.';
        
        console.error('⚠️ Paid duplicate order detected:', {
          existingOrderId: lastOrder.id,
          email: customerData.email
        });
        
        await supabaseService.from('payment_logs').insert({
          gateway: gateway,
          error_message: 'Paid duplicate order blocked',
          request_body: { 
            email: customerData.email, 
            planId,
            existingOrderId: lastOrder.id
          }
        });
        
        throw new Error(errorMessage);
      }
      
      console.log('✅ No paid duplicate orders - allowing purchase');
      
      // console.log('New user purchase - profile will be created after payment confirmation');
      profileId = null;
    }

    // Process payment based on gateway
    let paymentUrl: string;
    let paymentId: string;

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

      // console.log('Creating customer with payload:', JSON.stringify(customerPayload, null, 2));

      const customerResponse = await fetch('https://api.abacatepay.com/v1/customer/create', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${abacatePayApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(customerPayload),
      });

      // console.log('Customer response status:', customerResponse.status);

      if (!customerResponse.ok) {
        const customerErrorText = await customerResponse.text();
        console.error('Customer creation error:', customerErrorText);
        throw new Error('Falha ao criar cliente no sistema de pagamento.');
      }

      const customerResponseData = await customerResponse.json();
      // console.log('Customer created:', customerResponseData);

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
          price: Math.round(planPrice * 100),
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
      
      // console.log('AbacatePay billing payload:', JSON.stringify(billingPayload, null, 2));

      const abacatePayResponse = await fetch('https://api.abacatepay.com/v1/billing/create', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${abacatePayApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(billingPayload),
      });

      // console.log('AbacatePay response status:', abacatePayResponse.status);

      if (!abacatePayResponse.ok) {
        const errorText = await abacatePayResponse.text();
        console.error('AbacatePay error response:', errorText);
        
        // Log error
        await supabaseService.from('payment_logs').insert({
          gateway: 'ABACATEPAY',
          status_code: abacatePayResponse.status,
          error_message: errorText,
          request_body: billingPayload,
          response_body: { error: errorText }
        });
        
        throw new Error('Falha ao processar pagamento PIX. Verifique os dados e tente novamente.');
      }

      const abacatePayData = await abacatePayResponse.json();
      // console.log('AbacatePay response data:', abacatePayData);

      const responseData = abacatePayData.data || abacatePayData;
      
      if (!responseData || !responseData.id) {
        console.error('Invalid AbacatePay response - missing ID:', abacatePayData);
        throw new Error('Resposta inválida do sistema de pagamento.');
      }

      paymentUrl = responseData.checkout_url || responseData.url || responseData.paymentUrl;
      paymentId = responseData.id;

      if (!paymentUrl) {
        console.error('No payment URL in response:', abacatePayData);
        
        // Log error
        await supabaseService.from('payment_logs').insert({
          gateway: 'ABACATEPAY',
          error_message: 'No payment URL in response',
          response_body: abacatePayData
        });
        
        throw new Error('URL de pagamento não foi gerada.');
      }

      // Log success
      await supabaseService.from('payment_logs').insert({
        gateway: 'ABACATEPAY',
        status_code: 200,
        request_body: billingPayload,
        response_body: abacatePayData
      });
      
    } else if (useHubla) {
      // Hubla flow for CARD with installments
      gateway = 'HUBLA';
      
      // console.log('Using Hubla for card payment');
      
      // Check if plan has Hubla checkout URL configured
      if (!plan.hubla_checkout_url || plan.hubla_checkout_url.trim() === '') {
        console.error('Hubla checkout URL not configured or empty for plan:', planId);
        
        // Log error
        await supabaseService.from('payment_logs').insert({
          gateway: 'HUBLA',
          error_message: 'Hubla checkout URL not configured or empty',
          request_body: { planId, planData: plan }
        });
        
        throw new Error('Link de pagamento com cartão não está configurado. Entre em contato com o suporte.');
      }
      
      // Use the pre-configured Hubla checkout URL
      paymentUrl = plan.hubla_checkout_url;
      
      // Generate a unique reference for tracking
      paymentId = `hubla-${planId}-${Date.now()}`;
      
      // console.log('Using Hubla checkout URL:', paymentUrl);
      
      // Log success
      await supabaseService.from('payment_logs').insert({
        gateway: 'HUBLA',
        status_code: 200,
        request_body: { planId, customerData: { name: customerData.name, email: customerData.email } },
        response_body: { paymentUrl, paymentId }
      });
    }

    // Create order record - sem user_id se for novo usuário (será linkado no webhook)
    const { data: order, error: orderError } = await supabaseService
      .from('orders')
      .insert({
        user_id: profileId, // null para novos usuários
        plan_id: planId,
        abacatepay_id: gateway === 'ABACATEPAY' ? paymentId : null,
        hubla_transaction_id: gateway === 'HUBLA' ? paymentId : null,
        amount: planPrice,
        status: 'pending',
        payment_method: customerData.paymentMethod || 'PIX',
        gateway: gateway,
        payment_data: {
          customerData: {
            name: customerData.name,
            email: customerData.email,
            phone: customerData.phone?.replace(/\D/g, '') || null,
            cpf: customerData.cpf?.replace(/\D/g, '') || null
          },
          paymentId: paymentId,
          installments: customerData.installments,
          isLoggedInPurchase: customerData.isLoggedInPurchase,
          isNewUser: !customerData.isLoggedInPurchase,
          password: customerData.isLoggedInPurchase ? undefined : customerData.password
        }
      })
      .select()
      .single();

    if (orderError) {
      console.error('Order creation error:', orderError);
      throw new Error('Falha ao registrar pedido.');
    }

    // console.log('Order created successfully:', order.id);

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
    
    // Log error with Supabase service client
    try {
      const supabaseService = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
        { auth: { persistSession: false } }
      );
      
      await supabaseService.from('payment_logs').insert({
        gateway: 'UNKNOWN',
        error_message: error instanceof Error ? error.message : String(error),
        request_body: { error: 'Failed to parse request' }
      });
    } catch (logError) {
      console.error('Failed to log error:', logError);
    }
    
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