/**
 * Para onde cada papel entra no painel.
 *
 * Existe porque esse destino era decidido em dois lugares — no login e no
 * fallback do `RoleBasedRoute` — e os dois discordavam: o guard mandava
 * todo mundo pra `/admin/my-projects`, que é rota de corretor. Um admin
 * caía lá, falhava a checagem de papel, era redirecionado pra própria
 * rota de novo e a tela ficava em branco.
 */
export const landingPathForRole = (role?: string | null): string =>
  role === 'admin' || role === 'dev' ? '/admin/users' : '/admin/my-projects';
