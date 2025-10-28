import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Processing pending paid orders...');

    // Create Supabase service client
    const supabaseService = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { persistSession: false } }
    );

    // Find paid orders without user_id
    const { data: paidOrders, error: ordersError } = await supabaseService
      .from('orders')
      .select('*')
      .eq('status', 'paid')
      .is('user_id', null);

    if (ordersError) {
      console.error('Error fetching orders:', ordersError);
      throw ordersError;
    }

    console.log(`Found ${paidOrders?.length || 0} paid orders without user_id`);

    const results = [];

    for (const order of paidOrders || []) {
      try {
        console.log(`Processing order ${order.id}`);
        
        const customerData = order.payment_data?.customerData;
        const password = order.payment_data?.password;
        
        if (!customerData?.email || !password) {
          console.error(`Order ${order.id} missing email or password`);
          results.push({
            orderId: order.id,
            success: false,
            error: 'Missing email or password'
          });
          continue;
        }

        // Check if user already exists
        const { data: existingUser } = await supabaseService.auth.admin.listUsers();
        const userExists = existingUser?.users?.find(u => u.email === customerData.email);

        if (userExists) {
          console.log(`User already exists: ${customerData.email}`);
          
          // Find profile
          const { data: profile } = await supabaseService
            .from('profiles')
            .select('id')
            .eq('user_id', userExists.id)
            .maybeSingle();

          if (profile) {
            // Link order to profile
            await supabaseService
              .from('orders')
              .update({ user_id: profile.id })
              .eq('id', order.id);

            // Add plan
            await supabaseService.rpc('add_user_plan', {
              _user_id: profile.id,
              _plan_id: order.plan_id,
              _order_id: order.id
            });

            // Add credits
            const { data: planData } = await supabaseService
              .from('plans')
              .select('credits_granted')
              .eq('id', order.plan_id)
              .single();

            if (planData?.credits_granted && planData.credits_granted > 0) {
              await supabaseService.rpc('add_credits', {
                _user_id: profile.id,
                _amount: planData.credits_granted,
                _type: 'purchase',
                _description: 'Processamento manual de pagamento',
                _order_id: order.id
              });
            }

            results.push({
              orderId: order.id,
              success: true,
              message: 'Linked to existing user and added credits'
            });
          }
          continue;
        }

        // Create new user
        const { data: authData, error: authError } = await supabaseService.auth.admin.createUser({
          email: customerData.email,
          password: password,
          email_confirm: true,
          user_metadata: {
            name: customerData.name,
            phone: customerData.phone || null,
            payment_confirmed: true,
            payment_gateway: order.gateway,
            activated_via_manual_processing: true,
            activated_at: new Date().toISOString()
          }
        });

        if (authError) {
          console.error(`Failed to create user for order ${order.id}:`, authError);
          results.push({
            orderId: order.id,
            success: false,
            error: authError.message
          });
          continue;
        }

        console.log(`Created auth user: ${authData.user.id}`);

        // Create profile
        const { data: newProfile, error: profileError } = await supabaseService
          .from('profiles')
          .insert({
            auth_user_id: authData.user.id,
            user_id: authData.user.id,
            name: customerData.name,
            email: customerData.email,
            phone: customerData.phone || null,
            role: 'user',
            is_active: true
          })
          .select()
          .single();

        if (profileError) {
          console.error(`Failed to create profile for order ${order.id}:`, profileError);
          results.push({
            orderId: order.id,
            success: false,
            error: profileError.message
          });
          continue;
        }

        console.log(`Created profile: ${newProfile.id}`);

        // Link order to profile
        await supabaseService
          .from('orders')
          .update({ user_id: newProfile.id })
          .eq('id', order.id);

        // Add plan
        await supabaseService.rpc('add_user_plan', {
          _user_id: newProfile.id,
          _plan_id: order.plan_id,
          _order_id: order.id
        });

        // Add credits
        const { data: planData } = await supabaseService
          .from('plans')
          .select('credits_granted')
          .eq('id', order.plan_id)
          .single();

        if (planData?.credits_granted && planData.credits_granted > 0) {
          await supabaseService.rpc('add_credits', {
            _user_id: newProfile.id,
            _amount: planData.credits_granted,
            _type: 'purchase',
            _description: 'Processamento manual de pagamento',
            _order_id: order.id
          });
        }

        // Send confirmation email
        await supabaseService.functions.invoke('send-payment-confirmation', {
          body: { orderId: order.id }
        });

        results.push({
          orderId: order.id,
          success: true,
          userId: newProfile.id,
          email: customerData.email
        });

        console.log(`Successfully processed order ${order.id}`);

      } catch (error) {
        console.error(`Error processing order ${order.id}:`, error);
        results.push({
          orderId: order.id,
          success: false,
          error: error instanceof Error ? error.message : String(error)
        });
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: `Processed ${results.length} orders`,
        results
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );

  } catch (error) {
    console.error('Error in process-pending-paid-orders:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : String(error)
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
