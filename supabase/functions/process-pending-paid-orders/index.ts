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
    console.log('🔄 Starting process-pending-paid-orders job');

    // Create Supabase service client
    const supabaseService = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { persistSession: false } }
    );

    // Buscar orders pendentes há mais de 1 hora que ainda não tem user_id
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    
    const { data: paidOrders, error: ordersError } = await supabaseService
      .from('orders')
      .select('*')
      .eq('status', 'paid')
      .is('user_id', null)
      .lt('created_at', oneHourAgo)
      .limit(50);

    if (ordersError) {
      console.error('Error fetching orders:', ordersError);
      throw ordersError;
    }

    if (!paidOrders || paidOrders.length === 0) {
      console.log('✅ No pending paid orders found');
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'No pending paid orders to process',
          processed: 0 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );
    }

    console.log(`📦 Found ${paidOrders.length} pending paid orders to process`);

    const results = [];

    for (const order of paidOrders || []) {
      try {
        const customerData = order.payment_data?.customerData;
        const password = order.payment_data?.password;

        if (!customerData?.email) {
          console.error('Order missing email in payment_data');
          results.push({ orderId: order.id, success: false, error: 'Missing email' });
          continue;
        }

        // Verificar se usuário já existe
        const { data: existingProfile } = await supabaseService
          .from('profiles')
          .select('id, user_id')
          .eq('email', customerData.email)
          .maybeSingle();

        let profileId: string;

        if (existingProfile) {
          // Usuário já existe
          console.log(`User already exists for order ${order.id}, linking to profile ${existingProfile.id}`);
          profileId = existingProfile.id;
        } else if (password) {
          // Criar novo usuário
          console.log(`Creating new user for order ${order.id}`);
          const { data: authData, error: authError } = await supabaseService.auth.admin.createUser({
            email: customerData.email,
            password: password,
            email_confirm: true,
            user_metadata: {
              name: customerData.name,
              phone: customerData.phone || null,
              payment_confirmed: true,
              payment_gateway: order.gateway,
              activated_via_cron: true,
              activated_at: new Date().toISOString()
            }
          });

          if (authError) {
            console.error(`Failed to create auth user for order ${order.id}:`, authError);
            results.push({ orderId: order.id, success: false, error: authError.message });
            continue;
          }

          // Criar perfil
          const { data: newProfile, error: profileError } = await supabaseService
            .from('profiles')
            .insert({
              auth_user_id: authData.user.id,
              user_id: authData.user.id,
              name: customerData.name,
              email: customerData.email,
              phone: customerData.phone?.replace(/\D/g, '') || null,
              cpf: customerData.cpf?.replace(/\D/g, '') || null,
              role: 'user',
              is_active: true
            })
            .select()
            .single();

          if (profileError) {
            console.error(`Failed to create profile for order ${order.id}:`, profileError);
            results.push({ orderId: order.id, success: false, error: profileError.message });
            continue;
          }

          profileId = newProfile.id;
          console.log(`Created new profile ${profileId} for order ${order.id}`);
        } else {
          console.error(`Order ${order.id} missing password and user doesn't exist`);
          results.push({ orderId: order.id, success: false, error: 'Missing password' });
          continue;
        }

        // Atualizar order com user_id e remover senha do payment_data
        const sanitizedPaymentData = { ...order.payment_data };
        delete sanitizedPaymentData.password;
        await supabaseService
          .from('orders')
          .update({ user_id: profileId, payment_data: sanitizedPaymentData })
          .eq('id', order.id);

        // Buscar plano
        const { data: planData } = await supabaseService
          .from('plans')
          .select('credits_granted')
          .eq('id', order.plan_id)
          .single();

        // Adicionar plano
        const { error: planError } = await supabaseService.rpc('add_user_plan', {
          _user_id: profileId,
          _plan_id: order.plan_id,
          _order_id: order.id
        });

        if (planError) {
          console.error(`Failed to add plan for order ${order.id}:`, planError);
        }

        // Adicionar créditos
        if (planData?.credits_granted && planData.credits_granted > 0) {
          const { error: creditsError } = await supabaseService.rpc('add_credits', {
            _user_id: profileId,
            _amount: planData.credits_granted,
            _type: 'purchase',
            _description: `Compra do plano via ${order.gateway} (processado automaticamente)`,
            _order_id: order.id
          });

          if (creditsError) {
            console.error(`Failed to add credits for order ${order.id}:`, creditsError);
          } else {
            console.log(`Added ${planData.credits_granted} credits for order ${order.id}`);
          }
        }

        // Enviar e-mail de confirmação
        await supabaseService.functions.invoke('send-payment-confirmation', {
          body: { orderId: order.id }
        });

        results.push({ orderId: order.id, success: true, profileId });
        console.log(`✅ Successfully processed order ${order.id}`);

      } catch (error) {
        console.error(`Error processing order ${order.id}:`, error);
        results.push({ 
          orderId: order.id, 
          success: false, 
          error: error instanceof Error ? error.message : String(error) 
        });
      }
    }

    const successCount = results.filter(r => r.success).length;
    console.log(`✅ Processed ${successCount}/${results.length} orders successfully`);

    return new Response(
      JSON.stringify({ 
        success: true,
        processed: results.length,
        successful: successCount,
        failed: results.length - successCount,
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
