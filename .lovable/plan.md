

## Varredura de Segurança e LGPD — Relatório Completo

Analisei autenticação, checkout, armazenamento de dados, logs, console e conformidade com a LGPD. Encontrei **5 problemas** e **3 ausências críticas de LGPD**.

---

### PROBLEMA 1 (ALTO): Dados sensíveis no localStorage

No `CheckoutPage.tsx` (linha 172), dados do cliente (email, nome, plano) são salvos em `localStorage` com `checkoutData`. O `MaintenanceCheckoutPage.tsx` faz o mesmo com `maintenanceData`. O `localStorage` é acessível por qualquer JavaScript na página, incluindo scripts de terceiros (Google Tag Manager, analytics). Dados pessoais nunca devem ser armazenados em `localStorage`.

**Correção:** Remover o armazenamento de `checkoutData` e `maintenanceData` no localStorage. Manter apenas IDs técnicos (`orderId`, `paymentId`, `gateway`) que já são necessários para o fluxo de verificação.

---

### PROBLEMA 2 (ALTO): Console.log vazando dados de pagamento em produção

No `CheckoutPage.tsx` (linha 151) e `MaintenanceCheckoutPage.tsx` (linha 93), há `console.log` ativo logando `orderId`, `paymentId`, `gateway`, `planId`, `amount`, `paymentMethod`. Apesar do Vite estar configurado com `drop_console: true` e `pure_funcs: ['console.log']` no build de produção, isso só funciona em builds otimizados — em desenvolvimento ou se o minificador falhar, esses dados ficam expostos no console do navegador.

**Correção:** Remover os `console.log` desses arquivos. O `console.error` em `ForgotPasswordPage.tsx` (linha 60) e `ResetPasswordPage.tsx` (linha 77) também vazam detalhes de erros de autenticação.

---

### PROBLEMA 3 (MÉDIO): Senha enviada via Edge Function no checkout

No `usePayment.ts`, o `customerData` inclui `password` que é enviado para a edge function `create-payment`. A senha trafega como parte do body JSON para o servidor. Isso é necessário para criar a conta, mas precisa garantir que a senha **não é logada** na edge function nem armazenada no `payment_data` das tabelas `orders`/`transactions`.

**Correção:** Verificar na edge function `create-payment` que a senha é removida do objeto antes de salvar em `payment_data`. Adicionar sanitização explícita.

---

### PROBLEMA 4 (MÉDIO): AuthPage.tsx permite cadastro aberto

A página `AuthPage.tsx` tem aba de "Cadastro" que permite qualquer pessoa criar uma conta. Isso pode ser intencional, mas combinado com o fato de que novos usuários recebem role `user` automaticamente, é um risco se o sistema não deveria permitir auto-registro.

**Correção:** Confirmar se o auto-registro é desejado. Se não, remover a aba de cadastro ou protegê-la.

---

### PROBLEMA 5 (MENOR): console.error em 44 arquivos

Existem `console.error` em 44 arquivos do frontend. Embora `drop_console` no Vite só remova `console.log` (não `console.error`), esses erros podem expor detalhes internos do sistema (nomes de tabelas, estrutura de dados, mensagens de erro do Supabase) no console do navegador em produção.

**Correção:** Substituir `console.error` por logging silencioso ou pelo hook `useErrorTracking` que já existe no projeto.

---

### AUSÊNCIA LGPD 1 (CRÍTICO): Não existe Política de Privacidade

Os Termos de Uso mencionam "nossa Política de Privacidade" em múltiplos lugares, mas **não existe uma página de Política de Privacidade** no sistema. A LGPD (Lei 13.709/2018) exige que o controlador de dados tenha uma política clara informando:
- Quais dados são coletados (nome, email, CPF, telefone, IP)
- Finalidade do tratamento
- Base legal (consentimento, execução contratual)
- Tempo de retenção
- Direitos do titular (acesso, correção, exclusão)
- Contato do encarregado (DPO)

**Correção:** Criar página `/politica-privacidade` com todos os itens obrigatórios da LGPD.

---

### AUSÊNCIA LGPD 2 (CRÍTICO): Checkout não tem consentimento explícito

O formulário de checkout coleta CPF, email, telefone e nome sem checkbox de consentimento para tratamento de dados. A LGPD exige consentimento explícito ou indicação clara da base legal.

**Correção:** Adicionar checkbox obrigatório no checkout: "Li e aceito os Termos de Uso e a Política de Privacidade" com links para ambos os documentos.

---

### AUSÊNCIA LGPD 3 (MÉDIO): Sem mecanismo de exclusão de dados

Não existe funcionalidade para o usuário solicitar a exclusão dos seus dados pessoais (direito ao esquecimento, Art. 18 da LGPD). O perfil permite editar dados, mas não deletar a conta.

**Correção:** Adicionar botão "Solicitar exclusão da minha conta" na página de perfil, que cria uma notificação para o admin processar ou executa a exclusão automaticamente.

---

### O que está OK

- Senhas usam `type="password"` em todos os formulários
- Reset de senha tem validação forte (8 chars, maiúscula, número, especial)
- RLS está ativa em todas as tabelas
- Roles vêm da tabela `user_roles` (não de localStorage)
- Session tokens são gerenciados pelo Supabase SDK (HttpOnly)
- CPF é validado antes de envio
- `drop_console` está configurado no Vite para builds

---

### Arquivos a editar

1. **Criar** `src/pages/PoliticaPrivacidade.tsx` — Página completa de Política de Privacidade LGPD
2. **Editar** `src/App.tsx` — Adicionar rota `/politica-privacidade`
3. **Editar** `src/pages/CheckoutPage.tsx` — Remover `checkoutData` do localStorage, remover `console.log`, adicionar checkbox de consentimento LGPD
4. **Editar** `src/pages/admin/MaintenanceCheckoutPage.tsx` — Remover `maintenanceData` do localStorage, remover `console.log`
5. **Editar** `src/pages/admin/ForgotPasswordPage.tsx` — Remover `console.error`
6. **Editar** `src/pages/admin/ResetPasswordPage.tsx` — Remover `console.error`
7. **Editar** `src/pages/admin/ProfilePage.tsx` — Adicionar botão de solicitação de exclusão de conta
8. **Editar** `src/components/Footer.tsx` — Adicionar link para Política de Privacidade
9. **Verificar** `supabase/functions/create-payment/index.ts` — Garantir que `password` não é salvo em `payment_data`

