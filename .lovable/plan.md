
# Plano de Migracão: Cartão de Crédito Hubla para AbacatePay

## Contexto

Atualmente o sistema usa dois gateways de pagamento:
- **AbacatePay** para pagamentos via PIX
- **Hubla** para pagamentos via cartão de crédito (12x)

O objetivo é unificar tudo na AbacatePay, que agora suporta o metodo `CARD` (em beta) alem do PIX.

## Descoberta Importante

A documentacao da AbacatePay confirma que o campo `methods` na API de billing aceita:
- `PIX` (estavel)
- `CARD` (beta)

O array aceita de 1 a 2 elementos, ou seja, podemos enviar `["PIX", "CARD"]` para oferecer ambos na mesma cobranca.

---

## Etapas de Implementacao

### 1. Atualizar Edge Function `create-payment`

**Arquivo:** `supabase/functions/create-payment/index.ts`

Alteracoes:
- Remover toda a logica condicional `useHubla` (linhas 54, 374-409)
- Quando o metodo for `CARD`, usar AbacatePay com `methods: ['CARD']` ao inves de redirecionar para Hubla
- Quando o metodo for `PIX`, manter `methods: ['PIX']` (sem alteracao)
- Remover a dependencia de `plan.hubla_checkout_url`
- Sempre usar gateway `ABACATEPAY` independente do metodo
- Salvar `abacatepay_id` para ambos os metodos (PIX e CARD)
- Remover referencia a `hubla_transaction_id` na criacao do order

### 2. Atualizar Edge Function `abacatepay-webhook`

**Arquivo:** `supabase/functions/abacatepay-webhook/index.ts`

O webhook ja processa pagamentos PIX da AbacatePay. Precisamos garantir que:
- Ele tambem processe pagamentos por cartao (mesmo fluxo, pois o webhook e o mesmo)
- Nenhuma alteracao significativa necessaria pois o fluxo de processamento pos-pagamento (criar usuario, adicionar plano, creditos, emails) ja existe e e identico

### 3. Remover Edge Function `hubla-webhook`

**Arquivo:** `supabase/functions/hubla-webhook/index.ts`

- Nao deletar imediatamente! Manter por 30 dias para processar webhooks pendentes
- Adicionar log de deprecacao no inicio da funcao
- Apos 30 dias sem uso, deletar a funcao

### 4. Atualizar Frontend - CheckoutPage

**Arquivo:** `src/pages/CheckoutPage.tsx`

Alteracoes:
- Remover mencao "via Hubla" na opcao de cartao (linha 339)
- Atualizar texto para "Cartao de Credito" sem referencia a gateway
- Remover bloco informativo sobre "Parcelamento via Hubla" (linhas 348-358)
- Manter a selecao PIX/CARD funcionando normalmente
- Ajustar texto do resumo do pedido (linha 285 "no cartao via Hubla" -> "no cartao")

### 5. Atualizar Frontend - MaintenanceCheckoutPage

**Arquivo:** `src/pages/admin/MaintenanceCheckoutPage.tsx`

- Sem alteracoes necessarias, pois manutencoes usam apenas PIX

### 6. Atualizar Hook `usePayment`

**Arquivo:** `src/hooks/usePayment.ts`

- Sem alteracoes necessarias na logica, pois o hook ja envia `paymentMethod` para o backend

### 7. Atualizar `verify-payment` e `verify-payment-status`

**Arquivos:**
- `supabase/functions/verify-payment/index.ts`
- `supabase/functions/verify-payment-status/index.ts`

- Manter busca por `abacatepay_id` (ja existente)
- Busca por `hubla_transaction_id` pode ser mantida para orders historicos

---

## Detalhes Tecnicos

### Payload da AbacatePay para CARD

```text
POST https://api.abacatepay.com/v1/billing/create

{
  "frequency": "ONE_TIME",
  "methods": ["CARD"],         // <-- diferenca principal
  "products": [{
    "externalId": "plan-id",
    "name": "Nome do Plano",
    "description": "Descricao",
    "quantity": 1,
    "price": 59700              // em centavos (R$ 597,00)
  }],
  "customerId": "cust_xxx",
  "returnUrl": "https://habify.com.br/payment-success",
  "completionUrl": "https://habify.com.br/payment-success",
  "webhookUrl": "https://xxx.supabase.co/functions/v1/abacatepay-webhook",
  "allowCoupons": true
}
```

O checkout da AbacatePay cuida do formulario de cartao, parcelamento, etc. O usuario e redirecionado para a pagina da AbacatePay (igual ao PIX) e la escolhe os dados do cartao.

### Questao sobre Parcelamento

A AbacatePay gerencia o parcelamento internamente na pagina de checkout. Os valores de parcela exibidos no frontend (12x R$ 98,77, etc.) podem precisar de ajuste dependendo das taxas da AbacatePay vs Hubla. Recomendo verificar no painel da AbacatePay como configurar parcelamento e taxas antes de implementar.

---

## Riscos e Mitigacoes

| Risco | Mitigacao |
|-------|-----------|
| CARD esta em beta na AbacatePay | Testar completamente antes de ir para producao. Manter Hubla webhook ativo por 30 dias |
| Valores de parcela podem diferir | Verificar taxas no painel da AbacatePay e ajustar textos no frontend |
| Orders historicos com hubla_transaction_id | Manter coluna no banco e logica de busca para compatibilidade |
| Webhook pendente da Hubla | Nao remover webhook imediatamente |

---

## Checklist Pre-Implementacao

Antes de aprovar, voce precisa:
1. Confirmar no painel da AbacatePay que sua conta tem acesso ao metodo CARD (beta)
2. Verificar as taxas de cartao da AbacatePay para calcular os novos valores de parcela
3. Testar uma cobranca CARD no modo dev da AbacatePay

---

## Ordem de Execucao

1. Atualizar `create-payment` para usar AbacatePay com CARD
2. Verificar que `abacatepay-webhook` processa pagamentos CARD
3. Atualizar frontend (CheckoutPage) removendo referencias a Hubla
4. Adicionar log de deprecacao no `hubla-webhook`
5. Testar fluxo completo (PIX + CARD) em ambiente de teste
6. Deploy para producao
