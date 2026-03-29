

## Varredura Completa do Sistema de Pagamento — Relatório

Analisei todos os fluxos: checkout, criação de pagamento, webhooks (AbacatePay + Hubla), verificação, polling, tela de sucesso, painel admin e edge function de recuperação.

---

### ESTADO ATUAL: O que está funcionando

- **Checkout (PIX + Cartão)**: Validação completa de CPF, email, telefone, senha. Verificação de unicidade via `check-unique-fields`. Prevenção de pedidos duplicados (15 min para novos, pedidos pendentes para logados). LGPD consent checkbox ativo.
- **create-payment**: Criação de customer e billing no AbacatePay para PIX e CARD. Order criada no banco com `payment_data` contendo dados do cliente. Senha removida para compras de usuários logados (`undefined`).
- **abacatepay-webhook**: Validação de secret, atualização de order, criação de auth user + profile, adição de plano + créditos, envio de emails, sanitização de senha do `payment_data` após criação do usuário.
- **verify-payment**: Busca por `orderId`, `abacatepay_id` ou `hubla_transaction_id`. Validação de profile + auth_user_id + is_active.
- **verify-payment-status**: Retorna dados do order + plano + créditos. Usado pelo polling.
- **usePostPaymentFlow**: Polling a cada 3s, máximo 20 tentativas (60s). Salva `transactionData` no localStorage quando confirmado.
- **PaymentSuccess**: Exibe estados processing/confirmed/pending/error. Auto-redirect após 5s.
- **usePayments (admin)**: LEFT JOIN com profiles, fallback para `payment_data.customerData`. Realtime subscription com debounce.
- **process-pending-paid-orders**: Recuperação de orders pagos sem `user_id` após 1 hora.
- **hubla-webhook**: Depreciado mas funcional para transações legadas.

---

### BUG 1 (ALTO): Hubla webhook não remove senha do payment_data

O webhook da AbacatePay remove a senha após criar o usuário (linhas 349-355), mas o webhook da Hubla **não faz essa sanitização**. Se um pagamento legado da Hubla for processado, a senha do cliente fica permanentemente no campo `payment_data` da tabela `orders`.

**Arquivo:** `supabase/functions/hubla-webhook/index.ts`
**Correção:** Adicionar `delete sanitizedPaymentData.password` após linking do order ao profile (após linha 406).

---

### BUG 2 (ALTO): PaymentDetailPage expõe payment_data completo incluindo senha

Na página de detalhes do pagamento (`PaymentDetailPage.tsx`, linha 223), o `payment_data` é renderizado como JSON bruto na tela. Isso pode expor:
- Senha do cliente (se não foi sanitizada)
- CPF completo
- Dados do webhook

**Arquivo:** `src/pages/admin/PaymentDetailPage.tsx`
**Correção:** Filtrar campos sensíveis antes de exibir. Remover `password`, `cpf`, e dados brutos do webhook. Mostrar apenas campos relevantes.

---

### BUG 3 (MÉDIO): process-pending-paid-orders cria profile manualmente (possível duplicata)

Na edge function `process-pending-paid-orders` (linhas 104-117), quando o usuário não existe, ela cria o auth user E insere manualmente um profile. Porém, o trigger `handle_new_user` já cria o profile automaticamente quando um auth user é criado. Isso pode gerar **profiles duplicados** com IDs diferentes.

O webhook da AbacatePay resolve isso corretamente: cria o auth user, espera 2s, e busca o profile criado pelo trigger. A edge function de recuperação deveria seguir o mesmo padrão.

**Arquivo:** `supabase/functions/process-pending-paid-orders/index.ts`
**Correção:** Remover o INSERT manual de profile. Após criar o auth user, aguardar 2s e buscar o profile criado pelo trigger (mesmo padrão do abacatepay-webhook).

---

### BUG 4 (MÉDIO): CORS headers incompletos em verify-payment e process-pending-paid-orders

As edge functions `verify-payment` e `process-pending-paid-orders` usam headers CORS antigos sem os headers `x-supabase-client-*`. Isso pode causar falhas em navegadores que enviam esses headers.

**Arquivos:** `supabase/functions/verify-payment/index.ts`, `supabase/functions/process-pending-paid-orders/index.ts`
**Correção:** Atualizar `corsHeaders` para incluir todos os headers do padrão do projeto.

---

### BUG 5 (MENOR): PaymentDetailPage não mostra cliente quando user_id é null

Na `PaymentDetailPage.tsx` (linha 174), as informações do cliente só são exibidas se `order.profiles` existir. Para orders sem `user_id` (novos clientes antes do webhook processar), o admin não vê nome/email do cliente.

**Arquivo:** `src/pages/admin/PaymentDetailPage.tsx`
**Correção:** Adicionar fallback para `payment_data.customerData` quando `profiles` é null.

---

### Resumo dos arquivos a editar

1. **`supabase/functions/hubla-webhook/index.ts`** — Sanitizar senha do payment_data após linking
2. **`src/pages/admin/PaymentDetailPage.tsx`** — Filtrar campos sensíveis do payment_data + fallback de cliente
3. **`supabase/functions/process-pending-paid-orders/index.ts`** — Usar trigger ao invés de INSERT manual + atualizar CORS
4. **`supabase/functions/verify-payment/index.ts`** — Atualizar CORS headers

