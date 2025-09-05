import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { abacatePayId } = await req.json();
    
    console.log('Verifying payment:', abacatePayId);

    // Verify payment with AbacatePay
    const abacatePayResponse = await fetch(`https://api.abacatepay.com/v1/billing/${abacatePayId}`, {
      headers: {
        'Authorization': `Bearer ${Deno.env.get('ABACATEPAY_API_KEY')}`,
      },
    });

    if (!abacatePayResponse.ok) {
      throw new Error('Failed to verify payment with AbacatePay');
    }

    const paymentData = await abacatePayResponse.json();
    console.log('Payment verification result:', paymentData);

    // Update transaction in Supabase
    const supabaseService = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { persistSession: false } }
    );

    const isPaid = paymentData.status === 'paid' || paymentData.status === 'approved';
    const status = isPaid ? 'paid' : paymentData.status === 'failed' ? 'failed' : 'pending';

    const { data: transaction, error: updateError } = await supabaseService
      .from('transactions')
      .update({
        status,
        paid_at: isPaid ? new Date().toISOString() : null,
        payment_method: paymentData.payment_method || null,
        payment_data: {
          ...paymentData,
        }
      })
      .eq('abacatepay_id', abacatePayId)
      .select('*, plan:plans(*)')
      .single();

    if (updateError) {
      console.error('Transaction update error:', updateError);
      throw new Error('Failed to update transaction');
    }

    // If payment is confirmed, create project automatically
    if (isPaid && transaction && !transaction.user_id) {
      console.log('Payment confirmed, but no user associated yet');
      
      // For now, we'll just return success. The project creation will happen
      // when the user logs in/signs up after payment
    }

    return new Response(
      JSON.stringify({
        success: true,
        transaction,
        paymentData,
        isPaid,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    console.error('Payment verification error:', error);
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