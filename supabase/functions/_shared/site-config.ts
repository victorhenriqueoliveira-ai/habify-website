// Montagem do site.config.json compartilhada entre ai-site-builder (geração
// inicial) e apply-maintenance-request (edições pós-entrega via API). Manter
// num único lugar evita as duas funções divergirem sobre o formato esperado
// pelo template (habify-site-template/lib/types.ts).

export const GITHUB_OWNER = 'habifybr-art';
export const CONFIG_PATH = 'content/site.config.json';

export function slugify(input: string): string {
  return input
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60) || 'site';
}

export function onlyDigits(v?: string | null): string {
  return (v || '').replace(/\D/g, '');
}

// deno-lint-ignore no-explicit-any
export function buildSiteConfig(project: Record<string, any>, properties: Record<string, any>[]) {
  const wizardData = project.wizard_data || {};

  const seenSlugs = new Set<string>();
  const siteProperties = (properties || []).map((p) => {
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
      floorPlans: Array.isArray(p.floor_plans) ? p.floor_plans : [],
    };
  });

  const companyName = wizardData.companyName || project.title || 'Meu Site';
  const domain = (
    project.vercel_custom_domain ||
    (project.desired_domain ? `${project.desired_domain}.com.br` : '') ||
    (wizardData.desiredDomain ? `${wizardData.desiredDomain}.com.br` : '')
  ).replace(/^https?:\/\//, '');
  const projectMode = project.project_type === 'single_property' ? 'single' : 'multiple';

  return {
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
}

/**
 * Commita um site.config.json novo por cima do existente no repo do
 * cliente. Precisa buscar o sha do arquivo atual primeiro — a API do
 * GitHub exige isso pra qualquer PUT que não seja criação.
 */
export async function commitSiteConfig(
  githubToken: string,
  repoFullName: string,
  // deno-lint-ignore no-explicit-any
  siteConfig: Record<string, any>,
  commitMessage: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
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

  if (!fileResponse.ok) {
    return { ok: false, error: `Não achei content/site.config.json no repositório (${fileResponse.status}): ${await fileResponse.text()}` };
  }
  const fileData = await fileResponse.json();
  const fileSha = fileData.sha as string | undefined;
  if (!fileSha) {
    return { ok: false, error: 'Resposta do GitHub sem sha do arquivo atual.' };
  }

  const { encode: encodeBase64 } = await import('https://deno.land/std@0.190.0/encoding/base64.ts');
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
        message: commitMessage,
        content: contentBase64,
        sha: fileSha,
      }),
    },
  );

  if (!putResponse.ok) {
    return { ok: false, error: `Falha ao commitar site.config.json (${putResponse.status}): ${await putResponse.text()}` };
  }

  return { ok: true };
}
