import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { encode as encodeBase64 } from "https://deno.land/std@0.190.0/encoding/base64.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

// Organização e repositório-template criados manualmente no GitHub
// (ver habify-site-template/README.md). O pipeline gera um repo novo
// nessa mesma organização para cada projeto pago.
const GITHUB_OWNER = 'habifybr-art';
const GITHUB_TEMPLATE_REPO = 'habify-site-template';
const CONFIG_PATH = 'content/site.config.json';

type GenerationStatus =
  | 'queued'
  | 'generating_structure'
  | 'generating_content'
  | 'rendering'
  | 'pushing_github'
  | 'deploying'
  | 'done'
  | 'failed';

function slugify(input: string): string {
  return input
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60) || 'site';
}

function onlyDigits(v?: string | null): string {
  return (v || '').replace(/\D/g, '');
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  const supabaseService = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    { auth: { persistSession: false } },
  );

  let projectId: string | undefined;

  // Marca o projeto como falho e loga o erro, sem nunca deixar o status
  // "preso" em generating/queued se algo explodir no meio do caminho.
  const fail = async (message: string, step: string) => {
    console.error(`[ai-site-builder] ${step}:`, message);
    if (!projectId) return;
    await supabaseService
      .from('projects')
      .update({ ai_generation_status: 'failed', ai_generation_error: message })
      .eq('id', projectId);
    await supabaseService.from('ai_generation_logs').insert({
      project_id: projectId,
      step,
      status: 'failed',
      error: message,
    });
  };

  const setStatus = async (status: GenerationStatus, payload?: Record<string, unknown>) => {
    if (!projectId) return;
    await supabaseService.from('projects').update({ ai_generation_status: status }).eq('id', projectId);
    await supabaseService.from('ai_generation_logs').insert({
      project_id: projectId,
      step: status,
      status: 'ok',
      payload: payload ?? {},
    });
  };

  try {
    const body = await req.json();
    projectId = body.project_id;
    const requestingUserId: string | undefined = body.requesting_user_id;

    if (!projectId || !requestingUserId) {
      throw new Error('project_id e requesting_user_id são obrigatórios.');
    }

    await setStatus('queued');

    // Defesa em profundidade: a UI já esconde isso atrás da flag, o hook
    // já bloqueia — a edge function revalida antes de fazer qualquer coisa.
    const { data: hasFlag } = await supabaseService.rpc('has_feature_flag', {
      _user_id: requestingUserId,
      _flag: 'ai_site_builder',
    });
    if (!hasFlag) {
      throw new Error('Usuário não tem a feature flag ai_site_builder habilitada.');
    }

    const githubToken = Deno.env.get('GITHUB_PAT');
    if (!githubToken) {
      throw new Error('GITHUB_PAT não configurado nos secrets da função.');
    }

    // ---- 1. Carregar projeto + imóveis ----
    await setStatus('generating_structure');

    const { data: project, error: projectError } = await supabaseService
      .from('projects')
      .select('*')
      .eq('id', projectId)
      .single();

    if (projectError || !project) {
      throw new Error(`Projeto não encontrado: ${projectError?.message ?? projectId}`);
    }

    if (project.user_id !== requestingUserId) {
      const { data: isAdmin } = await supabaseService.rpc('is_admin_or_dev_v2', { _user_id: requestingUserId });
      if (!isAdmin) throw new Error('Usuário não é dono deste projeto.');
    }

    const { data: properties, error: propertiesError } = await supabaseService
      .from('portfolio_properties')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: true });

    if (propertiesError) {
      throw new Error(`Falha ao carregar imóveis: ${propertiesError.message}`);
    }

    const wizardData = project.wizard_data || {};

    // ---- 2. Montar o site.config.json (mesmo schema do template) ----
    await setStatus('generating_content');

    const seenSlugs = new Set<string>();
    const siteProperties = (properties || []).map((p: Record<string, any>) => {
      let slug = slugify(p.title || 'imovel');
      if (seenSlugs.has(slug)) slug = `${slug}-${String(p.id).slice(0, 8)}`;
      seenSlugs.add(slug);

      return {
        slug,
        title: p.title,
        location: p.location,
        price: Number(p.price) || 0,
        propertyType: p.property_type,
        purpose: p.purpose,
        bedrooms: p.bedrooms ?? undefined,
        bathrooms: p.bathrooms ?? undefined,
        area: Number(p.area) || 0,
        parkingSpaces: p.parking_spaces ?? undefined,
        constructionYear: p.construction_year ?? undefined,
        floorNumber: p.floor_number ?? undefined,
        condominiumFee: p.condominium_fee ?? undefined,
        iptu: p.iptu ?? undefined,
        description: p.description ?? undefined,
        amenities: Array.isArray(p.amenities) ? p.amenities : [],
        photos: Array.isArray(p.photos) ? p.photos : [],
      };
    });

    const companyName = wizardData.companyName || project.title || 'Meu Site';
    const domain = (project.desired_domain || wizardData.desiredDomain || '').replace(/^https?:\/\//, '');
    // 'single_property' = 1 empreendimento, site inteiro é a vitrine dele.
    // 'realtor_multiple' (ou qualquer outro valor futuro) = portfólio.
    const projectMode = project.project_type === 'single_property' ? 'single' : 'multiple';

    const siteConfig = {
      projectMode,
      layoutChoice: project.layout_choice || wizardData.layoutChoice || 'modern',
      colorPalette: project.color_palette || wizardData.colorPalette || 'blue',
      logoUrl: project.logo_url || '',
      domain: domain || `${slugify(companyName)}.habify.com.br`,
      siteName: companyName,
      profileType: wizardData.profileType || 'corretor',
      ownerName: wizardData.ownerName || companyName,
      companyName,
      creciNumber: wizardData.creciNumber || '',
      // wizardData.creciType vem como "individual" | "juridico" do
      // <Select> real do wizard (ProjectDataForm.tsx) — não confundir com o
      // nome do tipo CreciType em src/types/wizard.ts, que está desatualizado.
      creciType: wizardData.creciType || 'individual',
      address: {
        cep: wizardData.addressCep || '',
        street: wizardData.addressStreet || '',
        number: wizardData.addressNumber || '',
        complement: wizardData.addressComplement || undefined,
        neighborhood: wizardData.addressNeighborhood || '',
        city: wizardData.addressCity || '',
        state: wizardData.addressState || '',
      },
      contact: {
        phone: onlyDigits(wizardData.contactPhone) || undefined,
        mobile: `55${onlyDigits(wizardData.contactMobile)}`,
        email: wizardData.contactEmail || '',
      },
      properties: siteProperties,
    };

    // ---- 3. Gerar o repositório a partir do template ----
    await setStatus('rendering');

    const repoName = `${slugify(companyName)}-${String(projectId).slice(0, 8)}`;

    const generateResponse = await fetch(
      `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_TEMPLATE_REPO}/generate`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${githubToken}`,
          Accept: 'application/vnd.github+json',
          'X-GitHub-Api-Version': '2022-11-28',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          owner: GITHUB_OWNER,
          name: repoName,
          description: `Site HabiFy — ${companyName}`,
          private: true,
          include_all_branches: false,
        }),
      },
    );

    let repoFullName: string;
    let repoUrl: string;
    let repoId: number;
    let defaultBranch: string;

    if (generateResponse.ok) {
      const repoData = await generateResponse.json();
      repoFullName = repoData.full_name as string;
      repoUrl = repoData.html_url as string;
      repoId = repoData.id as number;
      defaultBranch = (repoData.default_branch as string) || 'main';
    } else if (generateResponse.status === 422) {
      // "Regenerar com IA": repositório com esse nome já existe de uma
      // geração anterior — reaproveita em vez de falhar.
      const existingResponse = await fetch(`https://api.github.com/repos/${GITHUB_OWNER}/${repoName}`, {
        headers: {
          Authorization: `Bearer ${githubToken}`,
          Accept: 'application/vnd.github+json',
          'X-GitHub-Api-Version': '2022-11-28',
        },
      });
      if (!existingResponse.ok) {
        const errText = await generateResponse.text();
        throw new Error(`Falha ao gerar repositório no GitHub (${generateResponse.status}): ${errText}`);
      }
      const existingData = await existingResponse.json();
      repoFullName = existingData.full_name as string;
      repoUrl = existingData.html_url as string;
      repoId = existingData.id as number;
      defaultBranch = (existingData.default_branch as string) || 'main';
    } else {
      const errText = await generateResponse.text();
      throw new Error(`Falha ao gerar repositório no GitHub (${generateResponse.status}): ${errText}`);
    }

    // GitHub popula o conteúdo do template de forma assíncrona — espera
    // até o arquivo que vamos sobrescrever existir de verdade.
    let fileSha: string | undefined;
    for (let attempt = 0; attempt < 8; attempt++) {
      const fileResponse = await fetch(
        `https://api.github.com/repos/${repoFullName}/contents/${CONFIG_PATH}`,
        {
          headers: {
            Authorization: `Bearer ${githubToken}`,
            Accept: 'application/vnd.github+json',
            'X-GitHub-Api-Version': '2022-11-28',
          },
        },
      );
      if (fileResponse.ok) {
        const fileData = await fileResponse.json();
        fileSha = fileData.sha;
        break;
      }
      await new Promise((resolve) => setTimeout(resolve, 1500));
    }

    if (!fileSha) {
      throw new Error('Repositório criado, mas content/site.config.json nunca ficou disponível pra atualizar.');
    }

    // ---- 4. Commitar os dados reais do cliente por cima do exemplo ----
    await setStatus('pushing_github');

    const contentBase64 = encodeBase64(JSON.stringify(siteConfig, null, 2));

    const putResponse = await fetch(
      `https://api.github.com/repos/${repoFullName}/contents/${CONFIG_PATH}`,
      {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${githubToken}`,
          Accept: 'application/vnd.github+json',
          'X-GitHub-Api-Version': '2022-11-28',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: `Configura site de ${companyName}`,
          content: contentBase64,
          sha: fileSha,
        }),
      },
    );

    if (!putResponse.ok) {
      const errText = await putResponse.text();
      throw new Error(`Falha ao commitar site.config.json (${putResponse.status}): ${errText}`);
    }

    // ---- 5. Cria (ou reaproveita) o Project na Vercel, ligado ao repo ----
    await setStatus('deploying');

    const vercelToken = Deno.env.get('VERCEL_API_TOKEN');
    const vercelTeamId = Deno.env.get('VERCEL_TEAM_ID');

    let vercelProjectId: string | null = null;
    let vercelDeploymentUrl: string | null = null;

    if (!vercelToken || !vercelTeamId) {
      console.warn('[ai-site-builder] VERCEL_API_TOKEN/VERCEL_TEAM_ID não configurados — pulando deploy.');
    } else {
      const vercelQuery = `?teamId=${vercelTeamId}`;

      const createProjectResponse = await fetch(`https://api.vercel.com/v11/projects${vercelQuery}`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${vercelToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: repoName,
          framework: 'nextjs',
          gitRepository: { type: 'github', repo: repoFullName },
        }),
      });

      if (createProjectResponse.ok) {
        const projectData = await createProjectResponse.json();
        vercelProjectId = projectData.id;
        // A Vercel pode alterar o nome pedido (ex: truncar), então o domínio
        // *.vercel.app precisa vir do `name` que ela realmente salvou —
        // nunca do `repoName` que a gente pediu.
        vercelDeploymentUrl = `https://${projectData.name}.vercel.app`;
      } else if (createProjectResponse.status === 409) {
        // "Regenerar com IA": o Project já existe de uma geração anterior.
        const existingProjectResponse = await fetch(
          `https://api.vercel.com/v10/projects/${repoName}${vercelQuery}`,
          { headers: { Authorization: `Bearer ${vercelToken}` } },
        );
        if (existingProjectResponse.ok) {
          const existingProject = await existingProjectResponse.json();
          vercelProjectId = existingProject.id;
          vercelDeploymentUrl = `https://${existingProject.name}.vercel.app`;
        } else {
          const errText = await createProjectResponse.text();
          console.error('[ai-site-builder] Falha ao criar/recuperar Project na Vercel:', errText);
        }
      } else {
        const errText = await createProjectResponse.text();
        console.error('[ai-site-builder] Falha ao criar Project na Vercel:', errText);
      }

      // Criar o Project com gitRepository NÃO dispara build sozinho quando o
      // repo já tinha commits antes do link (não existe "push novo" pra
      // acionar o webhook) — sem isso o Project fica sem nenhum deployment.
      if (vercelProjectId) {
        const deployResponse = await fetch(`https://api.vercel.com/v13/deployments${vercelQuery}`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${vercelToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name: repoName,
            project: vercelProjectId,
            target: 'production',
            gitSource: { type: 'github', repoId, ref: defaultBranch },
          }),
        });
        if (!deployResponse.ok) {
          const errText = await deployResponse.text();
          console.error('[ai-site-builder] Falha ao disparar deploy inicial na Vercel:', errText);
        }
      }

      // Anexa o domínio do cliente, se já foi definido. Falha aqui é normal
      // (DNS ainda não apontado) — loga como aviso, não derruba o pipeline.
      if (vercelProjectId && domain) {
        const domainResponse = await fetch(
          `https://api.vercel.com/v10/projects/${vercelProjectId}/domains${vercelQuery}`,
          {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${vercelToken}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ name: domain }),
          },
        );
        if (!domainResponse.ok) {
          const errText = await domainResponse.text();
          console.warn(`[ai-site-builder] Domínio ${domain} não anexado ainda:`, errText);
          await supabaseService.from('ai_generation_logs').insert({
            project_id: projectId,
            step: 'deploying',
            status: 'ok',
            payload: { warning: `Domínio ${domain} não anexado: ${errText}` },
          });
        }
      }
    }

    // ---- 6. Concluído ----
    await supabaseService
      .from('projects')
      .update({
        ai_generation_status: 'done',
        ai_generation_error: null,
        github_repo_url: repoUrl,
        github_repo_name: repoFullName,
        vercel_project_id: vercelProjectId,
        vercel_deployment_url: vercelDeploymentUrl,
      })
      .eq('id', projectId);

    await supabaseService.from('ai_generation_logs').insert({
      project_id: projectId,
      step: 'done',
      status: 'ok',
      payload: { repo_url: repoUrl, repo_name: repoFullName, vercel_deployment_url: vercelDeploymentUrl },
    });

    if (vercelDeploymentUrl && wizardData.contactEmail) {
      const emailResult = await supabaseService.functions.invoke('send-site-ready', {
        body: {
          userName: wizardData.ownerName || companyName,
          userEmail: wizardData.contactEmail,
          projectTitle: companyName,
          siteUrl: vercelDeploymentUrl,
          projectId,
        },
      });
      if (emailResult.error) {
        console.warn('[ai-site-builder] Falha ao enviar e-mail de site pronto:', emailResult.error);
      }
    }

    return new Response(
      JSON.stringify({ success: true, repoUrl, repoName: repoFullName, vercelDeploymentUrl }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 },
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    await fail(message, 'ai-site-builder');
    return new Response(
      JSON.stringify({ success: false, error: message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 },
    );
  }
});
