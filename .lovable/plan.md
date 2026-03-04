

## Varredura Completa do Sistema - Relatório de Auditoria

Analisei todos os fluxos críticos: checkout, pagamento, webhook, criação de projetos, autenticação e rotas. Encontrei **3 bugs** e **2 riscos** que precisam ser corrigidos.

---

### BUG 1 (CRÍTICO): `verify-payment-status` não está no `config.toml`

A edge function `verify-payment-status` é chamada pelo `usePostPaymentFlow.ts` (polling pós-pagamento), mas **não está configurada** no `supabase/config.toml`. Sem a entrada `verify_jwt = false`, a função exige JWT por padrão, e como o usuário pode ser novo (sem conta ainda), a chamada falha silenciosamente.

**Impacto**: Após pagar, o polling pode falhar para novos usuários, mostrando "Pagamento pendente" mesmo quando já foi pago.

**Correção**: Adicionar ao `config.toml`:
```toml
[functions.verify-payment-status]
verify_jwt = false
```

---

### BUG 2 (CRÍTICO): Variável `maintenance` não definida no webhook

No `abacatepay-webhook/index.ts`, linhas 388 e 397, o código referencia `maintenance.id`, mas a variável `maintenance` nunca foi declarada. O insert na tabela `maintenances` não captura o resultado em uma variável — ele apenas verifica `maintenanceError`. Isso causa um `ReferenceError` que impede o envio de emails de confirmação de manutenção.

**Impacto**: Quando um cliente paga manutenção, o registro é criado mas os emails de confirmação (cliente e admin) nunca são enviados.

**Correção**: Capturar o retorno do insert:
```typescript
const { data: maintenance, error: maintenanceError } = await supabaseService
  .from('maintenances')
  .insert({...})
  .select()
  .single();
```

---

### BUG 3 (MENOR): CORS headers incompletos nas edge functions

As edge functions `create-payment`, `verify-payment-status` e `abacatepay-webhook` usam CORS headers simplificados que não incluem os headers padrão do Supabase client (`x-supabase-client-platform`, etc.). Isso pode causar falhas em alguns browsers.

**Correção**: Atualizar os `corsHeaders` nas 3 funções para incluir:
```
'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version'
```

---

### RISCO 1: Número de WhatsApp inconsistente

- `PaymentCanceled.tsx` linha 62: `5511999999999` (placeholder)
- `PaymentSuccess.tsx` linha 214 e 357: `+55 (11) 96176-9504` (correto)
- O botão "Falar no WhatsApp" no PaymentCanceled usa um número incorreto.

**Correção**: Atualizar para o número correto `5511961769504`.

---

### RISCO 2: Audit log RLS bloqueando analytics anônimos

O console mostra erro 401 ao inserir em `audit_logs` com anon key. A policy exige `auth.uid() = user_id`, mas visitantes não autenticados tentam registrar `analytics_navigation`. Não é um bug funcional (o site funciona), mas gera ruído nos logs.

---

### Funcionalidades OK (sem problemas encontrados)

- **Checkout flow**: Validação de formulário, criação de payment, redirect para AbacatePay ✅
- **Webhook processing**: Criação de usuário, profile, plano e créditos via webhook ✅ (exceto bug 2 para manutenções)
- **Autenticação**: Login, logout, roles via `user_roles`, protected routes ✅
- **Criação de projetos**: Validação de planos, consumo de crédito, rollback em falha ✅
- **Rotas**: Todas as rotas públicas e protegidas estão corretas ✅
- **Lazy loading**: Todas as páginas com code splitting ✅
- **Realtime**: Subscription para projetos ativa ✅

---

### Arquivos a editar

1. `supabase/config.toml` — Adicionar `verify-payment-status`
2. `supabase/functions/abacatepay-webhook/index.ts` — Fix variável `maintenance`, atualizar CORS
3. `supabase/functions/create-payment/index.ts` — Atualizar CORS
4. `supabase/functions/verify-payment-status/index.ts` — Atualizar CORS
5. `src/pages/PaymentCanceled.tsx` — Corrigir número WhatsApp

