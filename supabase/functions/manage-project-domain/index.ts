import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const { project_id, requesting_user_id, domain, action } = await req.json();

    if (!project_id || !requesting_user_id) {
      throw new Error('project_id e requesting_user_id são obrigatórios.');
    }

    const supabaseService = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { persistSession: false } },
    );

    const { data: project, error: projectError } = await supabaseService
      .from('projects')
      .select('user_id, vercel_project_id, desired_domain')
      .eq('id', project_id)
      .single();

    if (projectError || !project) {
      throw new Error(`Projeto não encontrado: ${projectError?.message ?? project_id}`);
    }

    if (project.user_id !== requesting_user_id) {
      const { data: isAdmin } = await supabaseService.rpc('is_admin_or_dev_v2', { _user_id: requesting_user_id });
      if (!isAdmin) throw new Error('Usuário não é dono deste projeto.');
    }

    if (!project.vercel_project_id) {
      throw new Error('Seu site ainda não foi publicado — aguarde a geração terminar antes de conectar um domínio.');
    }

    const vercelToken = Deno.env.get('VERCEL_API_TOKEN');
    const vercelTeamId = Deno.env.get('VERCEL_TEAM_ID');
    if (!vercelToken || !vercelTeamId) {
      throw new Error('Integração com a Vercel não configurada.');
    }
    const vercelQuery = `?teamId=${vercelTeamId}`;

    const targetDomain = (domain || project.desired_domain || '').replace(/^https?:\/\//, '').trim();
    if (!targetDomain) {
      throw new Error('Informe um domínio (ex: meusite.com.br).');
    }

    // ---- attach: garante que o domínio está anexado ao Project ----
    if (action !== 'status') {
      const attachResponse = await fetch(
        `https://api.vercel.com/v10/projects/${project.vercel_project_id}/domains${vercelQuery}`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${vercelToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ name: targetDomain }),
        },
      );

      // 409 = já está anexado a este mesmo Project — não é erro, segue pra checar status.
      if (!attachResponse.ok && attachResponse.status !== 409) {
        const errText = await attachResponse.text();
        throw new Error(`Falha ao anexar domínio na Vercel: ${errText}`);
      }

      await supabaseService
        .from('projects')
        .update({ desired_domain: targetDomain })
        .eq('id', project_id);
    }

    // ---- status: consulta se o DNS já aponta certo pra Vercel ----
    const configResponse = await fetch(
      `https://api.vercel.com/v6/domains/${targetDomain}/config${vercelQuery}`,
      { headers: { Authorization: `Bearer ${vercelToken}` } },
    );

    let verified = false;
    let misconfigured = true;
    if (configResponse.ok) {
      const configData = await configResponse.json();
      misconfigured = !!configData.misconfigured;
      verified = !misconfigured;
    }

    await supabaseService
      .from('projects')
      .update({ vercel_domain_verified: verified })
      .eq('id', project_id);

    const isSubdomain = targetDomain.split('.').length > 2;

    return new Response(
      JSON.stringify({
        success: true,
        domain: targetDomain,
        verified,
        instructions: isSubdomain
          ? { type: 'CNAME', name: targetDomain.split('.')[0], value: 'cname.vercel-dns.com' }
          : { type: 'A', name: '@', value: '76.76.21.21' },
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 },
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('[manage-project-domain]', message);
    return new Response(
      JSON.stringify({ success: false, error: message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 },
    );
  }
});
