// Leva um commit até estar no ar.
//
// Existe porque o apply-maintenance-request commitava o site.config.json no
// repositório do cliente e parava por aí — marcando a solicitação como
// "concluída" e avisando que o site já estava atualizado, sem nunca ter
// verificado se alguma coisa chegou a ser publicada. Se o projeto na Vercel
// não estiver com o auto-deploy do Git ativo (coisa que não dá pra ver pelo
// painel), o commit entra e o site continua igual.
//
// A estratégia aqui não assume nenhum dos dois cenários: procura um deploy
// que tenha nascido do próprio push e, se nenhum aparecer, cria um. Assim
// funciona com ou sem a integração, e sem gastar dois builds quando ela
// está ativa.

const VERCEL_API = 'https://api.vercel.com';

export type DeploymentOrigin = 'git' | 'api';

export type EnsureDeploymentResult =
  | { ok: true; deploymentId: string; origin: DeploymentOrigin }
  | { ok: false; error: string };

export type DeploymentState = 'READY' | 'ERROR' | 'CANCELED' | 'TIMEOUT';

function teamQuery(teamId?: string): string {
  return teamId ? `?teamId=${teamId}` : '';
}

function teamParam(teamId?: string): string {
  return teamId ? `&teamId=${teamId}` : '';
}

/** Deploys do projeto criados a partir de `sinceMs`, mais novo primeiro. */
async function findDeploymentSince(
  vercelToken: string,
  vercelProjectId: string,
  sinceMs: number,
  teamId?: string,
): Promise<string | null> {
  const response = await fetch(
    `${VERCEL_API}/v6/deployments?projectId=${vercelProjectId}&limit=10${teamParam(teamId)}`,
    { headers: { Authorization: `Bearer ${vercelToken}` } },
  );

  if (!response.ok) return null;

  const data = await response.json();
  const deployments: Array<{ uid?: string; id?: string; created?: number; createdAt?: number }> =
    data.deployments ?? [];

  const match = deployments.find((d) => {
    const created = d.created ?? d.createdAt ?? 0;
    return created >= sinceMs;
  });

  return match ? (match.uid ?? match.id ?? null) : null;
}

/** O id numérico do repo, que a Vercel exige pra criar deploy via gitSource. */
async function fetchRepoId(githubToken: string, repoFullName: string): Promise<number | null> {
  const response = await fetch(`https://api.github.com/repos/${repoFullName}`, {
    headers: {
      Authorization: `Bearer ${githubToken}`,
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
    },
  });

  if (!response.ok) return null;
  const data = await response.json();
  return typeof data.id === 'number' ? data.id : null;
}

export async function ensureProductionDeployment(opts: {
  vercelToken: string;
  teamId?: string;
  vercelProjectId: string;
  repoFullName: string;
  githubToken: string;
  /** Momento do commit — serve de corte pra não confundir com deploy antigo. */
  committedAtMs: number;
  /** Quanto esperar pelo deploy automático antes de criar um. */
  gitGraceMs?: number;
}): Promise<EnsureDeploymentResult> {
  const {
    vercelToken,
    teamId,
    vercelProjectId,
    repoFullName,
    githubToken,
    committedAtMs,
    gitGraceMs = 12000,
  } = opts;

  // O webhook do GitHub leva alguns segundos pra virar deploy. Sem esta
  // espera a gente criaria um deploy próprio sempre, e o do push viria
  // logo atrás — dois builds pra uma alteração só.
  const deadline = Date.now() + gitGraceMs;
  while (Date.now() < deadline) {
    const fromGit = await findDeploymentSince(vercelToken, vercelProjectId, committedAtMs, teamId);
    if (fromGit) return { ok: true, deploymentId: fromGit, origin: 'git' };
    await new Promise((resolve) => setTimeout(resolve, 3000));
  }

  // Nenhum deploy nasceu do push: ou o projeto não está ligado ao repo, ou
  // a integração não está entregando. Cria explicitamente.
  const repoId = await fetchRepoId(githubToken, repoFullName);
  if (!repoId) {
    return { ok: false, error: `Não consegui ler o id do repositório ${repoFullName} no GitHub.` };
  }

  const repoName = repoFullName.split('/')[1] ?? repoFullName;

  const response = await fetch(`${VERCEL_API}/v13/deployments${teamQuery(teamId)}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${vercelToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      name: repoName,
      project: vercelProjectId,
      target: 'production',
      gitSource: { type: 'github', repoId, ref: 'main' },
    }),
  });

  if (!response.ok) {
    return { ok: false, error: `Falha ao criar deploy na Vercel: ${await response.text()}` };
  }

  const data = await response.json();
  const deploymentId = data.id as string | undefined;
  if (!deploymentId) {
    return { ok: false, error: 'A Vercel aceitou o deploy mas não devolveu um id.' };
  }

  return { ok: true, deploymentId, origin: 'api' };
}

/**
 * Espera o deploy ficar pronto.
 *
 * TIMEOUT não é falha: a Vercel continua buildando mesmo se a gente parar
 * de esperar — o limite de execução da edge function é que é curto. Quem
 * chama decide o que fazer com essa diferença.
 */
export async function waitForDeployment(opts: {
  vercelToken: string;
  teamId?: string;
  deploymentId: string;
  maxAttempts?: number;
  intervalMs?: number;
}): Promise<{ state: DeploymentState; url?: string }> {
  const { vercelToken, teamId, deploymentId, maxAttempts = 20, intervalMs = 4000 } = opts;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const response = await fetch(
      `${VERCEL_API}/v13/deployments/${deploymentId}${teamQuery(teamId)}`,
      { headers: { Authorization: `Bearer ${vercelToken}` } },
    );

    if (response.ok) {
      const data = await response.json();
      const readyState = data.readyState as string | undefined;
      const url = data.url ? `https://${data.url}` : undefined;

      if (readyState === 'READY') return { state: 'READY', url };
      if (readyState === 'ERROR' || readyState === 'CANCELED') {
        return { state: readyState as DeploymentState, url };
      }
    }

    await new Promise((resolve) => setTimeout(resolve, intervalMs));
  }

  return { state: 'TIMEOUT' };
}
