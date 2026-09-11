import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

// Job de reconciliação (mesmo padrão de process-pending-paid-orders): roda
// via Cron Job configurado no dashboard do Supabase, não por chamada de
// usuário. A verificação de domínio em manage-project-domain só acontece
// quando o cliente clica em "verificar" no painel — sem isso, um domínio
// cujo DNS propaga fora desse clique nunca é confirmado nem avisado por
// e-mail sozinho.
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  const supabaseService = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    { auth: { persistSession: false } },
  );

  try {
    const vercelToken = Deno.env.get('VERCEL_API_TOKEN');
    const vercelTeamId = Deno.env.get('VERCEL_TEAM_ID');
    if (!vercelToken || !vercelTeamId) {
      throw new Error('Integração com a Vercel não configurada.');
    }
    const vercelQuery = `?teamId=${vercelTeamId}`;

    const { data: pendingProjects, error } = await supabaseService
      .from('projects')
      .select('id, title, wizard_data, vercel_custom_domain')
      .not('vercel_custom_domain', 'is', null)
      .eq('vercel_domain_verified', false);

    if (error) {
      throw new Error(`Falha ao buscar domínios pendentes: ${error.message}`);
    }

    let checked = 0;
    let verified = 0;
    const errors: string[] = [];

    for (const project of pendingProjects || []) {
      const domain = project.vercel_custom_domain as string;
      checked++;

      try {
        const configResponse = await fetch(
          `https://api.vercel.com/v6/domains/${domain}/config${vercelQuery}`,
          { headers: { Authorization: `Bearer ${vercelToken}` } },
        );
        if (!configResponse.ok) {
          errors.push(`${domain}: falha ao consultar config (${configResponse.status})`);
          continue;
        }

        const configData = await configResponse.json();
        const isVerified = !configData.misconfigured;

        if (!isVerified) continue;

        await supabaseService
          .from('projects')
          .update({ vercel_domain_verified: true })
          .eq('id', project.id);
        verified++;

        const wizardData = (project.wizard_data as Record<string, unknown>) || {};
        const contactEmail = wizardData.contactEmail as string | undefined;
        if (contactEmail) {
          const emailResult = await supabaseService.functions.invoke('send-domain-connected', {
            body: {
              userName: (wizardData.ownerName as string) || (wizardData.companyName as string) || project.title,
              userEmail: contactEmail,
              projectTitle: (wizardData.companyName as string) || project.title,
              domain,
            },
          });
          if (emailResult.error) {
            console.warn(`[recheck-pending-domains] Falha ao notificar ${domain}:`, emailResult.error);
          }
        }
      } catch (domainError) {
        const message = domainError instanceof Error ? domainError.message : String(domainError);
        errors.push(`${domain}: ${message}`);
      }
    }

    return new Response(
      JSON.stringify({ success: true, checked, verified, errors }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 },
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('[recheck-pending-domains]', message);
    return new Response(
      JSON.stringify({ success: false, error: message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 },
    );
  }
});
