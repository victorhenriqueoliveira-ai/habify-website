import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { fulfillPaidOrder } from "../_shared/fulfill-order.ts";

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
    // console.log('🔔 AbacatePay webhook received:', {
    //   method: req.method,
    //   timestamp: new Date().toISOString(),
    //   headers: {
    //     hasAuth: !!req.headers.get('authorization'),
    //     hasSecret: !!req.headers.get('x-webhook-secret')
    //   }
    // });
    
    // Validate webhook secret from query params or headers
    const url = new URL(req.url);
    const webhookSecretFromQuery = url.searchParams.get('webhookSecret');
    const webhookSecretFromHeader = req.headers.get('x-webhook-secret') || req.headers.get('webhook-secret');
    const webhookSecret = webhookSecretFromQuery || webhookSecretFromHeader;
    const expectedSecret = Deno.env.get('ABACATEPAY_WEBHOOK_SECRET');
    
    if (!expectedSecret) {
      console.error('ABACATEPAY_WEBHOOK_SECRET not configured');
      return new Response(
        JSON.stringify({ error: 'Configuration error' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }
    
    // console.log('Webhook secret received:', webhookSecret ? 'Present' : 'Missing', 'From:', webhookSecretFromQuery ? 'query' : webhookSecretFromHeader ? 'header' : 'none');
    
    if (!webhookSecret || webhookSecret !== expectedSecret) {
      console.error('Invalid webhook secret');
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
      );
    }
    
    // console.log('Webhook secret validated successfully');
    
    const webhookData = await req.json();
    
    // Extract bill ID and status from webhook - try multiple formats
    let billId = webhookData.data?.billing?.id || webhookData.data?.id || webhookData.id || webhookData.bill?.id;
    const paymentStatus = webhookData.data?.billing?.status || webhookData.data?.status || webhookData.status || webhookData.bill?.status;
    
    // console.log('📦 Processing webhook:', {
    //   billId,
    //   status: paymentStatus,
    //   email: webhookData.data?.customer?.email || webhookData.customer?.email,
    //   hasData: !!webhookData.data,
    //   dataKeys: Object.keys(webhookData.data || {})
    // });

    if (!billId) {
      console.error('No bill ID found in webhook data. Full webhook:', JSON.stringify(webhookData, null, 2));
      // Try alternative paths for bill ID
      const altBillId = webhookData.data?.billing?.id || webhookData.billing?.id || webhookData.external_id || webhookData.externalId;
      if (!altBillId) {
        return new Response(
          JSON.stringify({ error: 'No bill ID found in webhook' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
        );
      }
      // console.log('Found alternative bill ID:', altBillId);
      billId = altBillId;
    }

    // Create Supabase client
    const supabaseService = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { persistSession: false } }
    );

    // Map AbacatePay status to our database status
    const isPaid = paymentStatus === 'PAID' || paymentStatus === 'APPROVED' || paymentStatus === 'paid' || paymentStatus === 'approved';
    const status = isPaid ? 'completed' : paymentStatus === 'FAILED' || paymentStatus === 'failed' ? 'failed' : 'pending';
    
    // console.log('Updating transaction status:', { billId, isPaid, status });

    // Get current order to preserve original customerData
    const { data: currentOrder } = await supabaseService
      .from('orders')
      .select('payment_data')
      .eq('abacatepay_id', billId)
      .single();
    
    // ✅ CORREÇÃO: Converter payment_data de string JSON para objeto se necessário
    let paymentData = currentOrder?.payment_data;
    if (typeof paymentData === 'string') {
      try {
        paymentData = JSON.parse(paymentData);
        // console.log('⚠️ Converted payment_data from string to object');
      } catch (e) {
        console.error('❌ Failed to parse payment_data string:', e);
      }
    }
      
    // console.log('📋 Current order found:', {
    //   hasOrder: !!currentOrder,
    //   hasPaymentData: !!paymentData,
    //   hasCustomerData: !!paymentData?.customerData,
    //   customerEmail: paymentData?.customerData?.email
    // });

    // Update order in database
    const { data: order, error: updateError } = await supabaseService
      .from('orders')
      .update({
        status: isPaid ? 'paid' : status,
        paid_at: isPaid ? new Date().toISOString() : null,
        payment_method: webhookData.data?.payment?.method || webhookData.data?.payment_method || webhookData.payment_method || null,
        payment_data: {
          ...paymentData, // Use parsed payment_data
          webhook_data: webhookData,
          updated_via_webhook: true,
          updated_at: new Date().toISOString()
        }
      })
      .eq('abacatepay_id', billId)
      .select('*')
      .single();

    if (updateError) {
      console.error('Failed to update order:', updateError);
      
      // Log error
      await supabaseService.from('payment_logs').insert({
        gateway: 'ABACATEPAY',
        error_message: `Failed to update order: ${updateError.message}`,
        request_body: webhookData,
        order_id: order?.id
      });
      
      return new Response(
        JSON.stringify({ error: 'Failed to update order', details: updateError }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }

    // Log successful update
    await supabaseService.from('payment_logs').insert({
      gateway: 'ABACATEPAY',
      status_code: 200,
      request_body: webhookData,
      response_body: { order_updated: true, order_id: order.id },
      order_id: order.id
    });

    // console.log('✅ Order updated via webhook:', {
    //   orderId: order.id,
    //   status: order.status,
    //   isPaid,
    //   hasUserId: !!order.user_id
    // });

    // Processa o pagamento aprovado (criar/achar usuário, liberar plano ou
    // manutenção, créditos, e-mails) — lógica compartilhada com asaas-webhook.
    if (isPaid && order) {
      await fulfillPaidOrder({
        supabaseService,
        order,
        gateway: 'ABACATEPAY',
        gatewayPaymentId: billId,
        paymentMethodLabel: order.payment_method || 'PIX',
        webhookData,
      });
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Webhook processed successfully',
        order_updated: !!order
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );

  } catch (error) {
    console.error('Webhook processing error:', error);
    
    // Log error
    try {
      const supabaseService = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
        { auth: { persistSession: false } }
      );
      
      await supabaseService.from('payment_logs').insert({
        gateway: 'ABACATEPAY',
        error_message: error instanceof Error ? error.message : String(error),
        request_body: { error: 'Webhook processing failed' }
      });
    } catch (logError) {
      console.error('Failed to log error:', logError);
    }
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : String(error) 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});