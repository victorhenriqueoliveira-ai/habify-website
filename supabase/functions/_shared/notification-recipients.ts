// Para onde vão os avisos internos da Habify.
//
// O endereço estava repetido em cinco funções, cada uma com sua própria
// string. Trocar o destinatário exigia achar todas — e esquecer uma
// significa um aviso que some sem ninguém notar.
//
// ADMIN_EMAIL continua tendo prioridade onde já era lido: se o secret
// existir, ele manda.

/** Caixa principal — quem responde o cliente. */
export const ADMIN_EMAIL = Deno.env.get('ADMIN_EMAIL') || 'habifybr@gmail.com';

/**
 * Cópia oculta de tudo que vai para a caixa principal.
 *
 * Oculta de propósito: o cliente que recebe um e-mail de confirmação não
 * precisa ver o endereço pessoal de quem acompanha internamente.
 */
export const ADMIN_BCC = (Deno.env.get('ADMIN_BCC') || 'victorhenriquesoares.oliveira@gmail.com')
  .split(',')
  .map((address) => address.trim())
  .filter(Boolean);
