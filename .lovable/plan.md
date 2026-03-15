

## Varredura Completa do Sistema — Relatório

Revisei todos os fluxos críticos: checkout, pagamento, webhook, criação de projetos, autenticação e rotas. Comparado com a última auditoria, os 3 bugs anteriores já foram corrigidos. Encontrei **1 bug remanescente**.

---

### BUG (MENOR): Número de WhatsApp placeholder na página de Pagamento Pendente

No `PaymentSuccess.tsx`, linha 255, a seção de "Pagamento Pendente" ainda exibe o número placeholder `(11) 99999-9999` ao invés do número correto `+55 (11) 96176-9504`. As outras duas seções da mesma página (erro e confirmado) já têm o número correto.

**Arquivo:** `src/pages/PaymentSuccess.tsx` linha 255

---

### Funcionalidades OK

- **Checkout flow (CheckoutPage)**: Validação de formulário, limpeza de localStorage antes de novo pagamento, criação via `create-payment`, redirect ✅
- **Edge function `create-payment`**: CORS atualizado, criação de customer + billing no AbacatePay, registro de order, log de erros ✅
- **Edge function `verify-payment-status`**: CORS atualizado, configurado com `verify_jwt = false` no config.toml, busca order por ID, retorna dados completos ✅
- **Polling pós-pagamento (`usePostPaymentFlow`)**: 20 tentativas a cada 3s, tratamento de paid/pending/failed, cleanup de localStorage ✅
- **Webhook (`abacatepay-webhook`)**: Variável `maintenance` corrigida com `.select().single()`, CORS atualizado ✅
- **PaymentCanceled**: Número WhatsApp corrigido ✅
- **Criação de projetos**: Verificação de role via `user_roles`, consumo de crédito com rollback, admin bypass ✅
- **Autenticação**: Login/logout, roles via `user_roles` + `has_role()`, rotas protegidas ✅
- **Rotas**: Todas públicas e protegidas corretas, lazy loading ativo ✅
- **Realtime**: Subscription para projetos ativa ✅

---

### Correção necessária

**Arquivo:** `src/pages/PaymentSuccess.tsx`
- Linha 255: Trocar `(11) 99999-9999` por `+55 (11) 96176-9504`

