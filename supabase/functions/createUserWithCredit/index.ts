import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CreateUserRequest {
  email: string;
  password: string;
  name?: string;
  full_name?: string;
  cpf?: string;
  phone?: string;
  plan_id?: string;
  gateway?: 'abacatepay' | 'hubla' | 'manual';
  creation_type?: 'pago' | 'permuta';
  created_by?: string;
  role?: 'user' | 'admin' | 'dev';
  credits?: number;
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
    const { 
      email, 
      password, 
      name,
      full_name, 
      cpf,
      phone,
      plan_id, 
      gateway, 
      creation_type, 
      created_by,
      role = 'user',
      credits: customCredits
    } = body;

    const userName = name || full_name || email;
    const isAdminCreation = role === 'admin' || role === 'dev';

    // console.log('Creating user:', { email, role, isAdminCreation });

    // Buscar detalhes do plano (somente se não for criação de admin/dev)
    let plan = null;
    let amount = 0;
    let creditsToGrant = customCredits || 0;

    if (!isAdminCreation && plan_id) {
      const { data: planData, error: planError } = await supabaseAdmin
        .from('plans')
        .select('*')
        .eq('id', plan_id)
        .single();

      if (planError || !planData) {
        console.error('Plan not found:', planError);
        throw new Error('Plano não encontrado');
      }

      plan = planData;
      creditsToGrant = plan.credits_granted || 1;

      // Determinar o valor baseado no tipo de criação e gateway
      if (creation_type === 'pago') {
        amount = gateway === 'abacatepay' 
          ? Number(plan.pix_price || plan.price)
          : Number(plan.stripe_price || plan.price);
      }
    }

    // console.log('Plan details:', { plan: plan?.name, credits: creditsToGrant, isAdminCreation });

    // 1. Criar usuário no Auth
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        name: userName,
        cpf: cpf || null,
        phone: phone || null,
        role: role
      }
    });

    if (authError || !authData.user) {
      console.error('Auth error:', authError);
      throw new Error(`Erro ao criar usuário: ${authError?.message}`);
    }

    // console.log('Auth user created:', authData.user.id);

    // 2. Aguardar trigger criar o perfil
    await new Promise(resolve => setTimeout(resolve, 1000));

    // 3. Buscar perfil criado pelo trigger
    const { data: createdProfile, error: profileFetchError } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .eq('user_id', authData.user.id)
      .single();

    if (profileFetchError || !createdProfile) {
      console.error('Profile not found after trigger:', profileFetchError);
      throw new Error('Perfil não foi criado automaticamente pelo trigger');
    }

    // console.log('Profile found:', createdProfile.id);

    // 4. Atualizar profile com dados adicionais (CPF, phone) e role no profiles
    const { error: updateProfileError } = await supabaseAdmin
      .from('profiles')
      .update({
        cpf: cpf?.replace(/\D/g, '') || null,
        phone: phone?.replace(/\D/g, '') || null,
        role: role as any // Atualizar role no profiles também
      })
      .eq('id', createdProfile.id);

    if (updateProfileError) {
      console.error('Error updating profile:', updateProfileError);
    }

    // 5. Se for admin ou dev, adicionar role na tabela user_roles
    if (isAdminCreation) {
      const { error: roleError } = await supabaseAdmin
        .from('user_roles')
        .insert({
          user_id: authData.user.id,
          role: role as any,
          created_by: profile.id
        });

      if (roleError) {
        console.error('Error adding user role:', roleError);
        throw new Error(`Erro ao adicionar role: ${roleError.message}`);
      }

      // console.log(`Role ${role} added to user ${authData.user.id}`);
    }

    // 6. Adicionar créditos (se houver)
    if (creditsToGrant > 0) {
      const creditDescription = isAdminCreation
        ? `Créditos iniciais - Criação de ${role}`
        : creation_type === 'permuta'
          ? `Créditos iniciais - ${plan?.name} (Permuta)`
          : `Créditos iniciais - ${plan?.name} via ${gateway}`;

      const { error: creditsError } = await supabaseAdmin.rpc('add_credits', {
        _user_id: createdProfile.id,
        _amount: creditsToGrant,
        _type: isAdminCreation ? 'admin_grant' : (creation_type === 'permuta' ? 'admin_grant' : 'purchase'),
        _description: creditDescription
      });

      if (creditsError) {
        console.error('Credits error:', creditsError);
      } else {
        // console.log(`Added ${creditsToGrant} credits to user ${createdProfile.id}`);
      }
    }

    // 7. Criar log de crédito (somente se não for admin/dev)
    if (!isAdminCreation && plan_id) {
      const { error: logError } = await supabaseAdmin
        .from('credit_logs')
        .insert({
          user_id: createdProfile.id,
          plan_id: plan_id,
          gateway: gateway || 'manual',
          amount: amount,
          credits_granted: creditsToGrant,
          created_by: created_by || profile.id
        });

      if (logError) {
        console.error('Credit log error:', logError);
      }
    }

    // 8. Criar registro em payment_logs para auditoria
    const { error: paymentLogError } = await supabaseAdmin
      .from('payment_logs')
      .insert({
        gateway: isAdminCreation 
          ? `admin_create_${role}` 
          : (creation_type === 'permuta' ? 'admin_create_manual' : `admin_create_${gateway}`),
        status_code: 200,
        request_body: {
          email,
          role,
          plan_id: plan_id || null,
          created_by: profile.id,
          name: userName,
          creation_type: creation_type || 'manual',
          gateway: gateway || 'manual'
        },
        response_body: {
          user_id: authData.user.id,
          profile_id: createdProfile.id,
          credits: creditsToGrant,
          amount,
          role
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
    //   role,
    //   credits: creditsToGrant,
    //   plan: plan?.name || 'N/A'
    // });

    return new Response(
      JSON.stringify({
        success: true,
        user_id: authData.user.id,
        profile_id: createdProfile.id,
        role: role,
        credits: creditsToGrant,
        amount: amount,
        plan_name: plan?.name || 'N/A'
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
