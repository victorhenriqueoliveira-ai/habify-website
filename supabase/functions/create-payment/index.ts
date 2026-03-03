import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

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
    paymentMethod?: 'PIX' | 'CARD';
    installments?: number;
    isLoggedInPurchase?: boolean;
    userId?: string;
    projectId?: string;
  };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { 
      status: 200,
      headers: corsHeaders 
    });
  }

  try {
    const origin = req.headers.get('origin') || 'https://habify.com.br';
    
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    );

    const { planId, customerData }: PaymentRequest = await req.json();

    // Always use AbacatePay for both PIX and CARD
    const abacatePayApiKey = Deno.env.get('ABACATEPAY_API_KEY');
    if (!abacatePayApiKey) {
      console.error('ABACATEPAY_API_KEY is not configured');
      throw new Error('Configuração de pagamento não encontrada. Entre em contato com o suporte.');
    }

    const paymentMethod = customerData.paymentMethod || 'PIX';
    const gateway = 'ABACATEPAY';

    // Get plan details
    let planData;
    let isMaintenance = false;
    
    if (planId === 'maintenance-monthly') {
      isMaintenance = true;
      planData = {
        id: 'maintenance-monthly',
        name: 'Manutenção Mensal',
        description: 'Manutenção mensal do projeto',
        price: 54.90,
        pix_price: 54.90,
        credits_granted: 0,
        is_active: true,
        type: 'website_maintenance_1m'
      };
      
      console.log('Processing maintenance payment:', planData);
    } else {
      const { data: plan, error: planError } = await supabaseClient
        .from('plans')
        .select('*')
        .eq('id', planId)
        .single();

      if (planError || !plan) {
        console.error('Plan not found:', planError);
        throw new Error('Plano não encontrado. Tente novamente.');
      }

      if (!plan.is_active) {
        console.error('Plan is inactive:', planId);
        throw new Error('Este plano não está mais disponível para compra. Entre em contato com o suporte.');
      }
      
      planData = plan;
    }

    // Get the correct price based on payment method
    const planPrice = paymentMethod === 'PIX' 
      ? (planData.pix_price || planData.price) 
      : (planData.price);
    
    if (planPrice <= 0) {
      console.error('Invalid plan price:', planPrice);
      throw new Error('Preço do plano inválido. Entre em contato com o suporte.');
    }

    // Create Supabase service client for database operations
    const supabaseService = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { persistSession: false } }
    );

    let profileId: string | null = null;

    // Se for compra de usuário logado, usa o perfil existente
    if (customerData.isLoggedInPurchase && customerData.userId) {
      const { data: existingProfile, error: profileFetchError } = await supabaseService
        .from('profiles')
        .select('id')
        .eq('user_id', customerData.userId)
        .maybeSingle();

      if (profileFetchError) {
        console.error('Error fetching profile:', profileFetchError);
        
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
      // Novo usuário - validar duplicatas
      const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000);
      const { data: recentOrders } = await supabaseService
        .from('orders')
        .select('id, created_at, status, plan_id, payment_data')
        .gte('created_at', fifteenMinutesAgo.toISOString())
        .order('created_at', { ascending: false });

      const duplicates = recentOrders?.filter(o => {
        const orderEmail = o.payment_data?.customerData?.email;
        const orderPlanId = o.plan_id;
        
        return orderEmail === customerData.email && 
               orderPlanId === planId &&
               o.status === 'paid';
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
      
      profileId = null;
    }

    // ✅ Process payment via AbacatePay (both PIX and CARD)
    // Create customer in AbacatePay
    const customerPayload = {
      name: customerData.name,
      cellphone: customerData.phone,
      email: customerData.email,
      taxId: customerData.cpf,
    };

    const customerResponse = await fetch('https://api.abacatepay.com/v1/customer/create', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${abacatePayApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(customerPayload),
    });

    if (!customerResponse.ok) {
      const customerErrorText = await customerResponse.text();
      console.error('Customer creation error:', customerErrorText);
      throw new Error('Falha ao criar cliente no sistema de pagamento.');
    }

    const customerResponseData = await customerResponse.json();
    const customerId = customerResponseData.data?.id;
    if (!customerId) {
      console.error('No customer ID received:', customerResponseData);
      throw new Error('ID do cliente não foi gerado.');
    }

    // Create billing with AbacatePay - use correct method based on payment selection
    const webhookUrl = `https://jsttoajuszshrivmgnmc.supabase.co/functions/v1/abacatepay-webhook`;
    
    const billingPayload: any = {
      frequency: 'ONE_TIME',
      methods: [paymentMethod], // 'PIX' or 'CARD'
      products: [{
        externalId: planId,
        name: planData.name,
        description: planData.description || planData.name,
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
    
    console.log('AbacatePay billing payload:', JSON.stringify({ ...billingPayload, methods: billingPayload.methods }, null, 2));

    const abacatePayResponse = await fetch('https://api.abacatepay.com/v1/billing/create', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${abacatePayApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(billingPayload),
    });

    if (!abacatePayResponse.ok) {
      const errorText = await abacatePayResponse.text();
      console.error('AbacatePay error response:', errorText);
      
      await supabaseService.from('payment_logs').insert({
        gateway: 'ABACATEPAY',
        status_code: abacatePayResponse.status,
        error_message: errorText,
        request_body: billingPayload,
        response_body: { error: errorText }
      });
      
      throw new Error(`Falha ao processar pagamento ${paymentMethod}. Verifique os dados e tente novamente.`);
    }

    const abacatePayData = await abacatePayResponse.json();
    const responseData = abacatePayData.data || abacatePayData;
    
    if (!responseData || !responseData.id) {
      console.error('Invalid AbacatePay response - missing ID:', abacatePayData);
      throw new Error('Resposta inválida do sistema de pagamento.');
    }

    const paymentUrl = responseData.checkout_url || responseData.url || responseData.paymentUrl;
    const paymentId = responseData.id;

    if (!paymentUrl) {
      console.error('No payment URL in response:', abacatePayData);
      
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

    // Create order record
    const orderInsertData: any = {
      user_id: profileId,
      plan_id: isMaintenance ? null : planId,
      abacatepay_id: paymentId,
      amount: planPrice,
      status: 'pending',
      payment_method: paymentMethod,
      gateway: 'ABACATEPAY',
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
        isMaintenance: isMaintenance,
        projectId: customerData.projectId,
        password: customerData.isLoggedInPurchase ? undefined : customerData.password
      }
    };
    
    const { data: order, error: orderError } = await supabaseService
      .from('orders')
      .insert(orderInsertData)
      .select()
      .single();

    if (orderError) {
      console.error('Order creation error:', orderError);
      throw new Error('Falha ao registrar pedido.');
    }

    return new Response(
      JSON.stringify({
        success: true,
        paymentUrl: paymentUrl,
        orderId: order.id,
        paymentId: paymentId,
        gateway: 'ABACATEPAY',
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    console.error('Payment creation error:', error);
    
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
