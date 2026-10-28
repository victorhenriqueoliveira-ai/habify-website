// Constantes de negócio centralizadas
export const BUSINESS = {
  whatsapp: {
    number: '5511911103963',
    display: '+55 (11) 91110-3963',
    url: (msg: string) => `https://wa.me/5511911103963?text=${encodeURIComponent(msg)}`,
  },
  email: {
    contact: 'contato@habify.com.br',
  },
  pricing: {
    // Fonte única do preço EXIBIDO. Não vem do Supabase de propósito: a
    // landing é pré-renderizada, e trocar o número em runtime depois que o
    // fetch responde causa um salto no maior texto da página (CLS no LCP).
    // `scripts/check-price.mjs` roda antes do build e falha se este valor
    // divergir do plano ativo no banco — então ficar estático é seguro.
    sitePrice: 74.9,
    domainYearly: 40,
    maintenanceMonthly: 54.9,
    guaranteeDays: 30,
  },
  competitor: {
    monthlyPrice: 169,
    yearlyCost: 169 * 12, // 2.028
  },
} as const;

/**
 * Acréscimo efetivo do cartão parcelado, repassado ao cliente
 * (`card.passFeesToCustomer` no checkout da AbacatePay).
 *
 * Valor observado no checkout real deles em 27/10/2026: R$ 74,90 em 7x
 * saiu R$ 86,18, ou seja +15,06%. Serve **apenas** para a estimativa que
 * mostramos antes do redirect, pra ninguém ser surpreendido com um valor
 * maior na etapa seguinte — quem calcula e cobra é a AbacatePay, e o
 * total confirmado é sempre o da página deles. Se a taxa mudar, só este
 * número precisa ser atualizado.
 */
export const CARD_SURCHARGE_RATE = 0.1506;

/** Estimativa do total no cartão parcelado, com a taxa já repassada. */
export function estimateCardTotal(price: number): number {
  return Math.round(price * (1 + CARD_SURCHARGE_RATE) * 100) / 100;
}

/** Formata em real brasileiro: 74.9 -> "74,90" (sem o prefixo "R$"). */
export function formatBRL(value: number): string {
  return value.toFixed(2).replace('.', ',');
}

/**
 * Parcelamento no cartão via AbacatePay. Eles exigem no mínimo R$10 por
 * parcela, então o número máximo depende do preço — 12x fixo era rejeitado
 * com "Total below minimum for 12x". Mesma regra do `create-payment`.
 */
export function maxInstallmentsFor(price: number): number {
  return Math.min(12, Math.max(1, Math.floor(Math.round(price * 100) / 1000)));
}
