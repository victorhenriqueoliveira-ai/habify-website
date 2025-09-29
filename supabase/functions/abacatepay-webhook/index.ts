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
    
    // Validate webhook secret
    const url = new URL(req.url);
    const webhookSecret = url.searchParams.get('webhookSecret');
    const expectedSecret = 'VictorOliveira@123';
    
    console.log('Webhook secret received:', webhookSecret ? 'Present' : 'Missing');
    
    if (!webhookSecret || webhookSecret !== expectedSecret) {
      console.error('Invalid webhook secret');
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
      );
    }
    
    console.log('Webhook secret validated successfully');
    
    const webhookData = await req.json();
    console.log('AbacatePay webhook received:', JSON.stringify(webhookData, null, 2));

    // Extract bill ID and status from webhook - try multiple formats
    let billId = webhookData.data?.billing?.id || webhookData.data?.id || webhookData.id || webhookData.bill?.id;
    const paymentStatus = webhookData.data?.billing?.status || webhookData.data?.status || webhookData.status || webhookData.bill?.status;
    
    console.log('Processing webhook for bill:', billId, 'status:', paymentStatus);

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

    // Get current order to preserve original customerData
    const { data: currentOrder } = await supabaseService
      .from('orders')
      .select('payment_data')
      .eq('abacatepay_id', billId)
      .single();

    // Update order in database
    const { data: order, error: updateError } = await supabaseService
      .from('orders')
      .update({
        status: isPaid ? 'paid' : status,
        paid_at: isPaid ? new Date().toISOString() : null,
        payment_method: webhookData.data?.payment?.method || webhookData.data?.payment_method || webhookData.payment_method || null,
        payment_data: {
          ...currentOrder?.payment_data, // Preserve original customerData
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
      return new Response(
        JSON.stringify({ error: 'Failed to update order', details: updateError }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }

    console.log('Order updated successfully via webhook:', order);

    // If payment is completed, create user in Supabase Auth and activate profile
    if (isPaid && order && order.user_id) {
      console.log('Payment completed, creating auth user and activating profile:', order.user_id);
      
      // Get profile data
      const { data: profile, error: profileError } = await supabaseService
        .from('profiles')
        .select('*')
        .eq('id', order.user_id)
        .single();

      if (profileError) {
        console.error('Failed to get profile:', profileError);
      } else {
        const customerData = order.payment_data?.customerData;
        
        if (customerData?.email && customerData?.password) {
          try {
            // Create user in Supabase Auth
            const { data: authData, error: authError } = await supabaseService.auth.admin.createUser({
              email: customerData.email,
              password: customerData.password,
              email_confirm: true, // User is confirmed after payment
              user_metadata: {
                name: customerData.name,
                phone: customerData.phone || null,
                payment_confirmed: true,
                activated_via_webhook: true,
                activated_at: new Date().toISOString()
              }
            });

            if (authError) {
              console.error('Failed to create auth user via webhook:', authError);
            } else {
              console.log('Auth user created successfully via webhook:', authData.user?.id);
              
              // Update profile with auth_user_id and activate it
              const { error: profileUpdateError } = await supabaseService
                .from('profiles')
                .update({ 
                  auth_user_id: authData.user.id,
                  user_id: authData.user.id, // Now link to auth.users
                  is_active: true,
                  updated_at: new Date().toISOString()
                })
                .eq('id', order.user_id);

              if (profileUpdateError) {
                console.error('Failed to activate profile via webhook:', profileUpdateError);
              } else {
                console.log('Profile activated and linked to auth user successfully via webhook');
              }
            }
          } catch (error) {
            console.error('Error creating auth user via webhook:', error);
          }
        } else {
          console.error('Missing email or password in order data');
        }
      }
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
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : String(error) 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});