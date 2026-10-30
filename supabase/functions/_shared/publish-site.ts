// Leva o estado atual do projeto no banco até o site publicado.
//
// Esta sequência — recarregar projeto e imóveis, remontar o
// site.config.json, commitar no repositório do cliente e garantir que
// o commit vire deploy — é a mesma para qualquer alteração pós-entrega,
// seja ela paga (manutenção) ou gratuita (tag do Google). Ficar duplicada
// é como as duas acabariam divergindo: uma passaria a confirmar o deploy
// e a outra não, e ninguém notaria até um cliente reclamar.

import { buildSiteConfig, commitSiteConfig } from "./site-config.ts";
import { ensureProductionDeployment, waitForDeployment } from "./vercel-deploy.ts";

export type PublishResult =
  | {
      ok: true;
      deploymentId: string;
      /** 'git' quando o deploy nasceu do push; 'api' quando precisamos criar. */
      origin: 'git' | 'api';
      /** false quando o build ainda não tinha concluído quando paramos de esperar. */
      confirmed: boolean;
    }
  | { ok: false; error: string };

/**
 * @param waitAttempts Quantas vezes checar se o build terminou. Quem é
 *   chamado de dentro de um clique do cliente usa um número baixo, porque
 *   a pessoa está olhando um spinner; um job de fundo pode esperar mais.
 */
export async function publishProjectSite(
  // deno-lint-ignore no-explicit-any
  supabaseService: any,
  projectId: string,
  commitMessage: string,
  waitAttempts = 11,
): Promise<PublishResult> {
  const { data: project, error: projectError } = await supabaseService
    .from('projects')
    .select('*')
    .eq('id', projectId)
    .single();

  if (projectError || !project) {
    return { ok: false, error: `Falha ao carregar projeto: ${projectError?.message ?? projectId}` };
  }

  if (!project.github_repo_name) {
    return {
      ok: false,
      error: 'Este projeto ainda não tem um site gerado — não há repositório onde publicar.',
    };
  }

  const { data: properties, error: propertiesError } = await supabaseService
    .from('portfolio_properties')
    .select('*')
    .eq('project_id', projectId)
    .order('created_at', { ascending: true });

  if (propertiesError) {
    return { ok: false, error: `Falha ao carregar imóveis: ${propertiesError.message}` };
  }

  const githubToken = Deno.env.get('GITHUB_PAT');
  if (!githubToken) {
    return { ok: false, error: 'GITHUB_PAT não configurado nos secrets da função.' };
  }

  const vercelToken = Deno.env.get('VERCEL_API_TOKEN');
  const vercelTeamId = Deno.env.get('VERCEL_TEAM_ID') ?? undefined;

  if (!vercelToken) {
    return { ok: false, error: 'VERCEL_API_TOKEN não configurado nos secrets da função.' };
  }
  if (!project.vercel_project_id) {
    return { ok: false, error: 'Este projeto não tem vercel_project_id salvo — não dá pra publicar.' };
  }

  const siteConfig = buildSiteConfig(project, properties || []);
  const committedAtMs = Date.now();

  const commitResult = await commitSiteConfig(
    githubToken,
    project.github_repo_name,
    siteConfig,
    commitMessage,
  );

  if (!commitResult.ok) {
    return { ok: false, error: commitResult.error };
  }

  const deployment = await ensureProductionDeployment({
    vercelToken,
    teamId: vercelTeamId,
    vercelProjectId: project.vercel_project_id,
    repoFullName: project.github_repo_name,
    githubToken,
    committedAtMs,
  });

  if (!deployment.ok) {
    return { ok: false, error: deployment.error };
  }

  const result = await waitForDeployment({
    vercelToken,
    teamId: vercelTeamId,
    deploymentId: deployment.deploymentId,
    maxAttempts: waitAttempts,
  });

  if (result.state === 'ERROR' || result.state === 'CANCELED') {
    return {
      ok: false,
      error:
        `A alteração foi commitada mas o build falhou na Vercel (${result.state}). ` +
        `Logs em https://vercel.com/deployments/${deployment.deploymentId}`,
    };
  }

  // TIMEOUT não é falha: a Vercel continua publicando depois que a edge
  // function morre. Só deixamos de confirmar.
  return {
    ok: true,
    deploymentId: deployment.deploymentId,
    origin: deployment.origin,
    confirmed: result.state === 'READY',
  };
}
