// Pré-build: confere se o preço exibido na landing (BUSINESS.pricing.sitePrice)
// ainda bate com o plano ativo no Supabase.
//
// Por quê: a landing mostra o preço a partir de uma constante estática, e não
// do fetch do banco. Isso é de propósito — a página é pré-renderizada, e
// trocar o número depois que o fetch responde faria o maior texto da página
// saltar (CLS no LCP). O risco dessa escolha é o preço ficar desatualizado em
// silêncio; este script transforma isso num build que falha.

import { readFile } from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');

function readEnvValue(envText, key) {
  const match = envText.match(new RegExp(`^${key}\\s*=\\s*"?([^"\\n\\r]+)"?`, 'm'));
  return match ? match[1].trim() : null;
}

async function main() {
  const businessSrc = await readFile(path.join(root, 'src/config/business.ts'), 'utf-8');
  const priceMatch = businessSrc.match(/sitePrice:\s*([\d.]+)/);
  if (!priceMatch) {
    throw new Error('Não encontrei BUSINESS.pricing.sitePrice em src/config/business.ts');
  }
  const expected = Number(priceMatch[1]);

  let envText = '';
  try {
    envText = await readFile(path.join(root, '.env'), 'utf-8');
  } catch {
    /* no CI as variáveis vêm do ambiente, não do arquivo */
  }

  const url = process.env.VITE_SUPABASE_URL || readEnvValue(envText, 'VITE_SUPABASE_URL');
  const key =
    process.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
    readEnvValue(envText, 'VITE_SUPABASE_PUBLISHABLE_KEY');

  if (!url || !key) {
    console.warn('[check-price] sem credenciais do Supabase — pulando a verificação.');
    return;
  }

  const endpoint =
    `${url}/rest/v1/plans` +
    `?select=name,price,type&is_active=eq.true&type=neq.domain_registration&order=price.asc&limit=1`;

  let rows;
  try {
    const res = await fetch(endpoint, { headers: { apikey: key, Authorization: `Bearer ${key}` } });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    rows = await res.json();
  } catch (err) {
    // Indisponibilidade do Supabase não deve derrubar o build — o objetivo
    // aqui é pegar divergência de preço, não disponibilidade de rede.
    console.warn(`[check-price] não consegui consultar os planos (${err.message}) — pulando.`);
    return;
  }

  const plan = rows?.[0];
  if (!plan) {
    console.warn('[check-price] nenhum plano ativo encontrado — pulando a verificação.');
    return;
  }

  const actual = Number(plan.price);
  if (Math.abs(actual - expected) > 0.001) {
    console.error(
      `\n[check-price] PREÇO FORA DE SINCRONIA\n` +
      `  banco  (${plan.name}): R$ ${actual.toFixed(2)}\n` +
      `  código (BUSINESS.pricing.sitePrice): R$ ${expected.toFixed(2)}\n\n` +
      `  Atualize src/config/business.ts para o valor do banco e rode o build de novo.\n`
    );
    process.exit(1);
  }

  console.log(`[check-price] ok — R$ ${actual.toFixed(2)} bate com o banco.`);
}

main().catch((err) => {
  console.error('[check-price] falhou:', err.message);
  process.exit(1);
});
