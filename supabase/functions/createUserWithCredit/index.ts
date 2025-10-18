import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CreateUserRequest {
  email: string;
  password: string;
  full_name: string;
  plan_id: string;
  gateway: 'abacatepay' | 'hubla' | 'manual';
  creation_type: 'pago' | 'permuta';
  created_by: string;
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Criar cliente admin com service role key
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    // console.log('Admin client created');

    // Verificar se quem está chamando é admin usando admin client
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      console.error('Missing authorization header');
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }), 
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Extrair o token do header
    const token = authHeader.replace('Bearer ', '');
    
    // Verificar o usuário usando admin client
    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token);
    
    if (userError || !user) {
      console.error('User verification error:', userError);
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }), 
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // console.log('User verified:', user.id);

    // Buscar perfil usando admin client (bypassa RLS)
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('id, role')
      .eq('user_id', user.id)
      .single();

    if (profileError) {
      console.error('Profile fetch error:', profileError);
      return new Response(
        JSON.stringify({ error: 'Profile not found' }), 
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // console.log('Profile found:', profile);

    if (!profile || !['admin', 'dev'].includes(profile.role)) {
      console.error('Access denied for role:', profile?.role);
      return new Response(
        JSON.stringify({ error: 'Forbidden: Admin access required' }), 
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const body: CreateUserRequest = await req.json();
    const { email, password, full_name, plan_id, gateway, creation_type, created_by } = body;

    // console.log('Creating user with plan:', { email, plan_id, gateway, creation_type });

    // Buscar detalhes do plano
    const { data: plan, error: planError } = await supabaseAdmin
      .from('plans')
      .select('*')
      .eq('id', plan_id)
      .single();

    if (planError || !plan) {
      console.error('Plan not found:', planError);
      throw new Error('Plano não encontrado');
    }

    // console.log('Plan found:', plan);

    // Determinar o valor e créditos baseado no tipo de criação e gateway
    let amount = 0;
    const credits = plan.credits_granted || 1;

    if (creation_type === 'pago') {
      amount = gateway === 'abacatepay' 
        ? Number(plan.pix_price || plan.price)
        : Number(plan.stripe_price || plan.price);
    }
    // Se for permuta, amount permanece 0

    // 1. Criar usuário no Auth
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        name: full_name,
        role: 'user'
      }
    });

    if (authError || !authData.user) {
      console.error('Auth error:', authError);
      throw new Error(`Erro ao criar usuário: ${authError?.message}`);
    }

    // console.log('Auth user created:', authData.user.id);

    // 2. Aguardar trigger criar o perfil
    await new Promise(resolve => setTimeout(resolve, 500));

    // 3. Buscar perfil criado
    const { data: createdProfile, error: profileFetchError } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .eq('user_id', authData.user.id)
      .single();

    if (profileFetchError || !createdProfile) {
      console.error('Profile not found:', profileFetchError);
      throw new Error('Perfil não foi criado automaticamente');
    }

    // console.log('Profile found:', createdProfile.id);

    // 4. Adicionar créditos usando a função RPC
    const creditDescription = creation_type === 'permuta'
      ? `Créditos iniciais - ${plan.name} (Permuta)`
      : `Créditos iniciais - ${plan.name} via ${gateway}`;

    const { error: creditsError } = await supabaseAdmin.rpc('add_credits', {
      _user_id: createdProfile.id,
      _amount: credits,
      _type: creation_type === 'permuta' ? 'admin_grant' : 'purchase',
      _description: creditDescription
    });

    if (creditsError) {
      console.error('Credits error:', creditsError);
    } else {
      // console.log(`Added ${credits} credits to user ${createdProfile.id}`);
    }

    // 5. Criar log de crédito
    const { error: logError } = await supabaseAdmin
      .from('credit_logs')
      .insert({
        user_id: createdProfile.id,
        plan_id: plan_id,
        gateway: gateway,
        amount: amount,
        credits_granted: credits,
        created_by: created_by
      });

    if (logError) {
      console.error('Credit log error:', logError);
    }

    // 6. Criar registro em payment_logs para auditoria
    const { error: paymentLogError } = await supabaseAdmin
      .from('payment_logs')
      .insert({
        gateway: creation_type === 'permuta' ? 'admin_create_manual' : `admin_create_${gateway}`,
        status_code: 200,
        request_body: {
          email,
          plan_id,
          created_by: profile.id,
          full_name,
          creation_type,
          gateway: gateway || 'manual'
        },
        response_body: {
          user_id: authData.user.id,
          profile_id: createdProfile.id,
          credits,
          amount,
          creation_type
        },
        user_id: createdProfile.id,
        order_id: null
      });

    if (paymentLogError) {
      console.error('Payment log error:', paymentLogError);
    }

    // console.log('User created successfully:', {
    //   user_id: authData.user.id,
    //   profile_id: createdProfile.id,
    //   credits,
    //   plan: plan.name
    // });

    return new Response(
      JSON.stringify({
        success: true,
        user_id: authData.user.id,
        profile_id: createdProfile.id,
        credits: credits,
        amount: amount,
        plan_name: plan.name
      }),
      { 
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('Error in createUserWithCredit:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Internal server error',
        details: error.toString()
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
