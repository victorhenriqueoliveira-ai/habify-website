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
    const webhookData = await req.json();
    console.log('AbacatePay webhook received:', JSON.stringify(webhookData, null, 2));

    // Extract bill ID and status from webhook
    const billId = webhookData.data?.id || webhookData.id;
    const paymentStatus = webhookData.data?.status || webhookData.status;
    
    console.log('Processing webhook for bill:', billId, 'status:', paymentStatus);

    if (!billId) {
      console.error('No bill ID found in webhook data');
      return new Response(
        JSON.stringify({ error: 'No bill ID found' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
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

    // If payment is completed and we have customer data, try to create user automatically
    if (isPaid && transaction && !transaction.user_id) {
      console.log('Payment completed, attempting automatic user creation...');
      
      const customerData = transaction.payment_data?.customerData;
      if (customerData?.email && customerData?.name) {
        console.log('Creating user from webhook for:', customerData.email);
        
        // Generate a temporary password (user will need to reset it)
        const tempPassword = crypto.randomUUID();
        
        try {
          // Create user in auth
          const { data: authData, error: authError } = await supabaseService.auth.admin.createUser({
            email: customerData.email,
            password: tempPassword,
            email_confirm: true, // Skip email confirmation since payment is confirmed
            user_metadata: {
              name: customerData.name,
              created_via_webhook: true
            }
          });

          if (authError) {
            console.error('Failed to create user via webhook:', authError);
          } else if (authData.user) {
            console.log('User created via webhook:', authData.user.id);
            
            // Create profile
            const { error: profileError } = await supabaseService
              .from('profiles')
              .insert({
                user_id: authData.user.id,
                name: customerData.name,
                email: customerData.email,
                phone: customerData.phone || null,
                role: 'user',
              });

            if (profileError) {
              console.error('Failed to create profile via webhook:', profileError);
            }

            // Link transaction to user
            const { error: linkError } = await supabaseService
              .from('transactions')
              .update({ user_id: authData.user.id })
              .eq('id', transaction.id);

            if (linkError) {
              console.error('Failed to link transaction to user:', linkError);
            } else {
              console.log('Transaction linked to user via webhook');
            }
          }
        } catch (error) {
          console.error('Error creating user via webhook:', error);
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