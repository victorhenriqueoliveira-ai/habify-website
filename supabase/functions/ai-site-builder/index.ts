import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { GITHUB_OWNER, CONFIG_PATH, slugify, buildSiteConfig, commitSiteConfig } from "../_shared/site-config.ts";

// Repositório-template criado manualmente no GitHub (ver
// habify-site-template/README.md). O pipeline gera um repo novo na
// organização GITHUB_OWNER (compartilhada com _shared/site-config.ts)
// para cada projeto pago.
const GITHUB_TEMPLATE_REPO = 'habify-site-template';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

type GenerationStatus =
  | 'queued'
  | 'generating_structure'
  | 'generating_content'
  | 'rendering'
  | 'pushing_github'
  | 'deploying'
  | 'done'
  | 'failed';

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

    const companyName = wizardData.companyName || project.title || 'Meu Site';
    const siteConfig = buildSiteConfig(project, properties || []);
    // Valor "cru" (sem o fallback *.habify.com.br que buildSiteConfig aplica
    // em siteConfig.domain) — só tenta anexar domínio na Vercel se o cliente
    // realmente definiu um.
    const domain = (
      project.vercel_custom_domain ||
      (project.desired_domain ? `${project.desired_domain}.com.br` : '') ||
      (wizardData.desiredDomain ? `${wizardData.desiredDomain}.com.br` : '')
    ).replace(/^https?:\/\//, '');

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
    // até o arquivo que vamos sobrescrever existir de verdade antes de
    // tentar o commit (commitSiteConfig busca o sha sozinho).
    let fileExists = false;
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
        fileExists = true;
        break;
      }
      await new Promise((resolve) => setTimeout(resolve, 1500));
    }

    if (!fileExists) {
      throw new Error('Repositório criado, mas content/site.config.json nunca ficou disponível pra atualizar.');
    }

    // ---- 4. Commitar os dados reais do cliente por cima do exemplo ----
    await setStatus('pushing_github');

    const commitResult = await commitSiteConfig(githubToken, repoFullName, siteConfig, `Configura site de ${companyName}`);
    if (!commitResult.ok) {
      throw new Error(commitResult.error);
    }

    // ---- 5. Cria (ou reaproveita) o Project na Vercel, ligado ao repo ----
    await setStatus('deploying');

    const vercelToken = Deno.env.get('VERCEL_API_TOKEN');
    const vercelTeamId = Deno.env.get('VERCEL_TEAM_ID');

    // Fonte da verdade pra "já existe um Project?" é o NOSSO banco, nunca um
    // lookup por nome na Vercel — a Vercel pode alterar o nome pedido (ex:
    // truncar), então procurar de volta pelo nome que a gente pediu pode
    // simplesmente não achar nada e deixar o projeto com uma URL quebrada.
    //
    // vercelDeploymentUrl começa null de propósito (não herda o valor salvo
    // antes): se algo falhar nesta execução, é melhor não gravar nada do que
    // regravar silenciosamente uma URL antiga/errada por cima.
    let vercelProjectId: string | null = project.vercel_project_id ?? null;
    let vercelDeploymentUrl: string | null = null;
    // true só quando a Vercel confirma readyState === 'READY' — controla se
    // o e-mail de "site pronto" é enviado lá na frente.
    let deploymentConfirmed = false;
    // Esse aqui pode manter o valor salvo: só é atualizado se o attach de
    // domínio for bem-sucedido nesta execução, nunca fica "errado".
    let vercelCustomDomainToSave: string | null = project.vercel_custom_domain ?? null;

    if (!vercelToken || !vercelTeamId) {
      console.warn('[ai-site-builder] VERCEL_API_TOKEN/VERCEL_TEAM_ID não configurados — pulando deploy.');
    } else {
      const vercelQuery = `?teamId=${vercelTeamId}`;

      if (vercelProjectId) {
        // "Regenerar com IA": Project já existe, só confirma que a Vercel
        // ainda o reconhece.
        const existingProjectResponse = await fetch(
          `https://api.vercel.com/v10/projects/${vercelProjectId}${vercelQuery}`,
          { headers: { Authorization: `Bearer ${vercelToken}` } },
        );
        if (!existingProjectResponse.ok) {
          console.warn('[ai-site-builder] vercel_project_id salvo não encontrado na Vercel, recriando:', await existingProjectResponse.text());
          vercelProjectId = null;
        }
      }

      if (!vercelProjectId) {
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
        } else if (createProjectResponse.status === 409) {
          // Já existe um Project pra esse repo (de antes de vercel_project_id
          // existir na tabela), mas não sabemos o ID. Busca pelo nome que a
          // gente pediu — a Vercel normalmente prefixa/mantém o começo do
          // nome mesmo quando altera o final, então dá pra achar por busca
          // parcial em vez de um lookup exato (que falharia do mesmo jeito).
          const searchTerm = repoName.slice(0, 20);
          const searchResponse = await fetch(
            `https://api.vercel.com/v9/projects${vercelQuery}&search=${encodeURIComponent(searchTerm)}`,
            { headers: { Authorization: `Bearer ${vercelToken}` } },
          );
          if (searchResponse.ok) {
            const searchData = await searchResponse.json();
            const match = (searchData.projects || []).find(
              (p: { link?: { repo?: string; repoId?: number } }) =>
                p.link?.repo === repoFullName || p.link?.repoId === repoId,
            );
            if (match) {
              vercelProjectId = match.id;
            }
          }
          if (!vercelProjectId) {
            console.error(
              '[ai-site-builder] 409 ao criar Project, e não achei o existente pela busca:',
              await createProjectResponse.text(),
            );
          }
        } else {
          const errText = await createProjectResponse.text();
          console.error('[ai-site-builder] Falha ao criar Project na Vercel:', errText);
        }
      }

      // O domínio *.vercel.app REAL não é necessariamente `{name}.vercel.app`
      // — o campo `name` do Project pode preservar o que a gente pediu mesmo
      // quando a Vercel atribui um domínio padrão diferente (foi exatamente
      // isso que quebrou o link enviado por e-mail). A lista de domínios do
      // Project é a única fonte confiável.
      if (vercelProjectId) {
        const domainsResponse = await fetch(
          `https://api.vercel.com/v9/projects/${vercelProjectId}/domains${vercelQuery}`,
          { headers: { Authorization: `Bearer ${vercelToken}` } },
        );
        if (domainsResponse.ok) {
          const domainsData = await domainsResponse.json();
          const defaultDomain = (domainsData.domains || []).find((d: { name: string }) =>
            d.name.endsWith('.vercel.app'),
          );
          if (defaultDomain) {
            vercelDeploymentUrl = `https://${defaultDomain.name}`;
          } else {
            console.error('[ai-site-builder] Project sem nenhum domínio *.vercel.app:', JSON.stringify(domainsData));
          }
        } else {
          console.error('[ai-site-builder] Falha ao buscar domínios do Project:', await domainsResponse.text());
        }
      }

      // Criar o Project com gitRepository NÃO dispara build sozinho quando o
      // repo já tinha commits antes do link (não existe "push novo" pra
      // acionar o webhook) — sem isso o Project fica sem nenhum deployment.
      let deploymentId: string | null = null;
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
        } else {
          const deployData = await deployResponse.json();
          deploymentId = (deployData.id as string) ?? null;
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
        if (domainResponse.ok || domainResponse.status === 409) {
          // 409 = já estava anexado (ex: reprocessamento) — ainda assim é o
          // domínio ativo do cliente, então registra em vercel_custom_domain
          // pra ele aparecer no card de domínio (DomainConnect) também.
          vercelCustomDomainToSave = domain;
        } else {
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

      // ---- 5b. Espera o build da Vercel terminar de verdade ----
      // Sem isso, "done" só significava "disparamos o deploy" — um erro de
      // build (ex: site.config.json com um valor que quebra o template)
      // ficava invisível e o cliente recebia o e-mail de "site pronto"
      // apontando pra um link com erro. Timeout não é tratado como falha:
      // a Vercel continua buildando por conta própria mesmo se pararmos de
      // esperar aqui; só deixamos de confirmar e pulamos o e-mail.
      if (deploymentId) {
        const POLL_INTERVAL_MS = 4000;
        const MAX_ATTEMPTS = 25; // ~100s no total, dentro do limite de execução da edge function
        for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
          const statusResponse = await fetch(
            `https://api.vercel.com/v13/deployments/${deploymentId}${vercelQuery}`,
            { headers: { Authorization: `Bearer ${vercelToken}` } },
          );
          if (!statusResponse.ok) break;

          const statusData = await statusResponse.json();
          const readyState = statusData.readyState as string | undefined;

          if (readyState === 'READY') {
            deploymentConfirmed = true;
            break;
          }
          if (readyState === 'ERROR' || readyState === 'CANCELED') {
            throw new Error(
              `O build do site falhou na Vercel (${readyState}). Confira os logs em https://vercel.com/deployments/${deploymentId}`,
            );
          }
          await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS));
        }

        if (!deploymentConfirmed) {
          console.warn('[ai-site-builder] Build ainda não confirmado como pronto após o tempo de espera — seguindo sem enviar o e-mail de "site pronto".');
          await supabaseService.from('ai_generation_logs').insert({
            project_id: projectId,
            step: 'deploying',
            status: 'ok',
            payload: { warning: 'Deploy ainda não confirmado como READY após o tempo de espera — verificar manualmente.' },
          });
        }
      }
    }

    // ---- 6. Concluído ----
    // Também fecha o status legado (fila manual "Aprovar → Finalizar") —
    // sem isso o projeto fica preso em "Pendente" nas estatísticas e nos
    // filtros do painel mesmo com o site já gerado e no ar. Só não mexe se
    // alguém já rejeitou o projeto manualmente por outro motivo.
    await supabaseService
      .from('projects')
      .update({
        ai_generation_status: 'done',
        ai_generation_error: null,
        github_repo_url: repoUrl,
        github_repo_name: repoFullName,
        vercel_project_id: vercelProjectId,
        vercel_deployment_url: vercelDeploymentUrl,
        vercel_custom_domain: vercelCustomDomainToSave,
        ...(project.status !== 'rejected' ? { status: 'completed' } : {}),
      })
      .eq('id', projectId);

    await supabaseService.from('ai_generation_logs').insert({
      project_id: projectId,
      step: 'done',
      status: 'ok',
      payload: { repo_url: repoUrl, repo_name: repoFullName, vercel_deployment_url: vercelDeploymentUrl },
    });

    if (vercelDeploymentUrl && wizardData.contactEmail && deploymentConfirmed) {
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
