import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { fulfillPaidOrder } from "../_shared/fulfill-order.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, asaas-access-token',
};

// Eventos que consideramos "pago" — PAYMENT_CONFIRMED já é suficiente (o
// dinheiro só fica indisponível até liquidar, mas a compra já está válida).
const PAID_EVENTS = new Set(['PAYMENT_CONFIRMED', 'PAYMENT_RECEIVED']);
const FAILED_EVENTS = new Set(['PAYMENT_OVERDUE', 'PAYMENT_DELETED', 'PAYMENT_REFUNDED', 'PAYMENT_CHARGEBACK_REQUESTED']);

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // A Asaas manda de volta, em todo webhook, o mesmo authToken configurado
    // na criação do webhook — é assim que confirmamos que a chamada é
    // legítima (não tem assinatura HMAC, é comparação direta de token).
    const receivedToken = req.headers.get('asaas-access-token');
    const expectedToken = Deno.env.get('ASAAS_WEBHOOK_SECRET');

    if (!expectedToken) {
      console.error('ASAAS_WEBHOOK_SECRET not configured');
      return new Response(
        JSON.stringify({ error: 'Configuration error' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 },
      );
    }

    if (!receivedToken || receivedToken !== expectedToken) {
      console.error('Invalid Asaas webhook token');
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 },
      );
    }

    const webhookData = await req.json();
    const event: string | undefined = webhookData.event;
    const payment = webhookData.payment;
    const paymentId: string | undefined = payment?.id;

    if (!paymentId || !event) {
      console.error('Missing payment id or event in Asaas webhook:', JSON.stringify(webhookData));
      return new Response(
        JSON.stringify({ error: 'Missing payment id or event' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 },
      );
    }

    const supabaseService = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { persistSession: false } },
    );

    const isPaid = PAID_EVENTS.has(event);
    const isFailed = FAILED_EVENTS.has(event);
    const newStatus = isPaid ? 'paid' : isFailed ? 'failed' : 'pending';

    // Busca o estado atual ANTES de atualizar — guarda contra reprocessar
    // (Asaas reenvia webhooks) e conceder crédito/plano em dobro.
    const { data: currentOrder } = await supabaseService
      .from('orders')
      .select('status, payment_data')
      .eq('asaas_id', paymentId)
      .maybeSingle();

    if (!currentOrder) {
      console.warn(`[asaas-webhook] No order found for asaas_id=${paymentId} (event=${event})`);
      return new Response(
        JSON.stringify({ success: true, message: 'No matching order — ignored' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 },
      );
    }

    const wasAlreadyPaid = currentOrder.status === 'paid';

    let paymentData = currentOrder.payment_data;
    if (typeof paymentData === 'string') {
      try {
        paymentData = JSON.parse(paymentData);
      } catch (e) {
        console.error('[asaas-webhook] Failed to parse payment_data string:', e);
      }
    }

    const { data: order, error: updateError } = await supabaseService
      .from('orders')
      .update({
        status: isPaid ? 'paid' : isFailed ? newStatus : currentOrder.status,
        paid_at: isPaid ? new Date().toISOString() : undefined,
        payment_data: {
          ...paymentData,
          webhook_data: webhookData,
          updated_via_webhook: true,
          updated_at: new Date().toISOString(),
        },
      })
      .eq('asaas_id', paymentId)
      .select('*')
      .single();

    if (updateError) {
      console.error('[asaas-webhook] Failed to update order:', updateError);
      await supabaseService.from('payment_logs').insert({
        gateway: 'ASAAS',
        error_message: `Failed to update order: ${updateError.message}`,
        request_body: webhookData,
      });
      return new Response(
        JSON.stringify({ error: 'Failed to update order', details: updateError }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 },
      );
    }

    await supabaseService.from('payment_logs').insert({
      gateway: 'ASAAS',
      status_code: 200,
      request_body: webhookData,
      response_body: { order_updated: true, order_id: order.id },
      order_id: order.id,
    });

    if (isPaid && !wasAlreadyPaid) {
      await fulfillPaidOrder({
        supabaseService,
        order,
        gateway: 'ASAAS',
        gatewayPaymentId: paymentId,
        paymentMethodLabel: 'CARD',
        webhookData,
      });
    }

    return new Response(
      JSON.stringify({ success: true, message: 'Webhook processed successfully', order_updated: true }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 },
    );
  } catch (error) {
    console.error('[asaas-webhook] Processing error:', error);

    try {
      const supabaseService = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
        { auth: { persistSession: false } },
      );
      await supabaseService.from('payment_logs').insert({
        gateway: 'ASAAS',
        error_message: error instanceof Error ? error.message : String(error),
        request_body: { error: 'Webhook processing failed' },
      });
    } catch (logError) {
      console.error('[asaas-webhook] Failed to log error:', logError);
    }

    return new Response(
      JSON.stringify({ success: false, error: error instanceof Error ? error.message : String(error) }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 },
    );
  }
});
