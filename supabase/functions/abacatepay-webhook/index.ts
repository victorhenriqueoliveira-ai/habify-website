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
    console.log('AbacatePay webhook called - Method:', req.method);
    console.log('AbacatePay webhook headers:', Object.fromEntries(req.headers.entries()));
    
    const webhookData = await req.json();
    console.log('AbacatePay webhook received:', JSON.stringify(webhookData, null, 2));

    // Extract bill ID and status from webhook - try multiple formats
    let billId = webhookData.data?.id || webhookData.id || webhookData.bill?.id;
    const paymentStatus = webhookData.data?.status || webhookData.status || webhookData.bill?.status;
    
    console.log('Processing webhook for bill:', billId, 'status:', paymentStatus);

    if (!billId) {
      console.error('No bill ID found in webhook data. Full webhook:', JSON.stringify(webhookData, null, 2));
      // Try alternative paths for bill ID
      const altBillId = webhookData.billing?.id || webhookData.external_id || webhookData.externalId;
      if (!altBillId) {
        return new Response(
          JSON.stringify({ error: 'No bill ID found in webhook' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
        );
      }
      console.log('Found alternative bill ID:', altBillId);
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
    
    console.log('Updating transaction status:', { billId, isPaid, status });

    // Update transaction in database
    const { data: transaction, error: updateError } = await supabaseService
      .from('transactions')
      .update({
        status,
        paid_at: isPaid ? new Date().toISOString() : null,
        payment_method: webhookData.data?.payment_method || webhookData.payment_method || null,
        payment_data: {
          webhook_data: webhookData,
          updated_via_webhook: true,
          updated_at: new Date().toISOString()
        }
      })
      .eq('abacatepay_id', billId)
      .select('*')
      .single();

    if (updateError) {
      console.error('Failed to update transaction:', updateError);
      return new Response(
        JSON.stringify({ error: 'Failed to update transaction', details: updateError }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }

    console.log('Transaction updated successfully via webhook:', transaction);

    // If payment is completed and user exists, activate the user
    if (isPaid && transaction && transaction.user_id) {
      console.log('Payment completed, activating user:', transaction.user_id);
      
      const customerData = transaction.payment_data?.customerData;
      if (customerData?.email) {
        try {
          // Activate user by confirming email and updating metadata
          const { data: userData, error: updateError } = await supabaseService.auth.admin.updateUserById(
            transaction.user_id,
            {
              email_confirm: true,
              user_metadata: {
                ...customerData,
                payment_confirmed: true,
                activated_via_webhook: true,
                activated_at: new Date().toISOString()
              }
            }
          );

          if (updateError) {
            console.error('Failed to activate user via webhook:', updateError);
          } else {
            console.log('User activated successfully via webhook:', userData.user?.id);
            
            // Activate profile
            const { error: profileUpdateError } = await supabaseService
              .from('profiles')
              .update({ 
                is_active: true,
                updated_at: new Date().toISOString()
              })
              .eq('user_id', transaction.user_id);

            if (profileUpdateError) {
              console.error('Failed to activate profile via webhook:', profileUpdateError);
            } else {
              console.log('Profile activated successfully via webhook');
            }
          }
        } catch (error) {
          console.error('Error activating user via webhook:', error);
        }
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Webhook processed successfully',
        transaction_updated: !!transaction
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );

  } catch (error) {
    console.error('Webhook processing error:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});