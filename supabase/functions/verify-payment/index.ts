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
    console.log('Payment verification result:', JSON.stringify(paymentData, null, 2));

    // Update transaction in Supabase
    const supabaseService = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { persistSession: false } }
    );

    // AbacatePay returns status in different formats, check both
    const paymentStatus = paymentData.status || paymentData.data?.status;
    console.log('Payment status from AbacatePay:', paymentStatus);
    
    const isPaid = paymentStatus === 'PAID' || paymentStatus === 'APPROVED' || paymentStatus === 'paid' || paymentStatus === 'approved';
    const status = isPaid ? 'completed' : paymentStatus === 'FAILED' || paymentStatus === 'failed' ? 'failed' : 'pending';
    
    console.log('Mapped status for database:', { isPaid, status });

    console.log('Updating transaction with abacatePayId:', abacatePayId);
    
    const { data: transaction, error: updateError } = await supabaseService
      .from('transactions')
      .update({
        status,
        paid_at: isPaid ? new Date().toISOString() : null,
        payment_method: paymentData.payment_method || paymentData.data?.payment_method || null,
        payment_data: {
          ...paymentData,
          updated_at: new Date().toISOString()
        }
      })
      .eq('abacatepay_id', abacatePayId)
      .select('*')
      .single();
      
    console.log('Transaction update result:', { transaction, updateError });

    if (updateError) {
      console.error('Transaction update error:', updateError);
      throw new Error('Failed to update transaction');
    }

    // If payment is confirmed
    if (isPaid && transaction) {
      console.log('Payment confirmed successfully:', {
        transactionId: transaction.id,
        userId: transaction.user_id,
        status: transaction.status
      });
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