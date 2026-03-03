

# Plano: Simplificacao de Planos e Precos

## Resumo da Mudanca

**Antes:** 3 planos ativos (R$ 597, R$ 897, R$ 1.597) + Enterprise
**Depois:** 1 plano unico (R$ 74,90) + Enterprise + Manutencao avulsa (R$ 54,90)

---

## Etapa 1: Atualizar Banco de Dados (plans)

Desativar os 3 planos antigos e criar 1 novo plano:

- **Desativar** os planos existentes (`is_active = false`) para manter historico
- **Criar** novo plano:
  - Nome: "Site Profissional"
  - Tipo: `website_only`
  - Preco (cartao): R$ 74,90
  - Preco PIX: R$ 74,90
  - Features: Site personalizado, Design responsivo, Otimizacao SEO, Google Analytics
  - credits_granted: 1

- **Atualizar** preco da manutencao avulsa no `create-payment` de R$ 79,90 para R$ 54,90

---

## Etapa 2: Atualizar PricingSection

**Arquivo:** `src/components/PricingSection.tsx`

Simplificar drasticamente:
- Remover grid de 4 colunas, logica de multiplos planos, badges "Recomendado"/"Mais Popular"
- Exibir apenas 1 card com o plano unico (R$ 74,90)
- Manter card Enterprise (WhatsApp) ao lado
- Remover funcoes `getInstallmentValue`, `getPlanBadge` (nao ha mais parcelamento complexo)
- Atualizar texto rodape: remover mencoes a Hubla, atualizar para "AbacatePay"
- Mostrar preco simples: "R$ 74,90" (mesmo valor PIX e cartao)
- Adicionar nota sobre dominio: "Dominio por conta do cliente (~R$ 40/ano)"

---

## Etapa 3: Atualizar CheckoutPage

**Arquivo:** `src/pages/CheckoutPage.tsx`

- Remover funcao `getInstallmentValue` (preco unico sem parcelamento complexo)
- Simplificar exibicao de preco: R$ 74,90 para ambos os metodos
- Remover logica de valores hardcoded por planId
- Manter selecao PIX/CARD funcionando (AbacatePay gerencia parcelamento do cartao)
- No resumo do pedido, mostrar preco direto do plano sem calculos de parcela

---

## Etapa 4: Atualizar MaintenanceCheckoutPage

**Arquivo:** `src/pages/admin/MaintenanceCheckoutPage.tsx`

- Atualizar valor de R$ 79,90 para R$ 54,90 em todas as referencias

---

## Etapa 5: Atualizar Edge Function create-payment

**Arquivo:** `supabase/functions/create-payment/index.ts`

- Atualizar preco fixo da manutencao mensal de R$ 79,90 para R$ 54,90

---

## Etapa 6: Atualizar Edge Function abacatepay-webhook (se necessario)

Verificar se ha referencia ao valor 79.90 hardcoded e atualizar para 54.90.

---

## Detalhes Tecnicos

### Novo Plano no Banco

```text
INSERT INTO plans (name, type, price, pix_price, description, features, is_active, credits_granted, card_gateway)
VALUES (
  'Site Profissional',
  'website_only',
  74.90,
  74.90,
  'Seu site imobiliario profissional',
  '["Site personalizado", "Design responsivo", "Otimizacao SEO", "Google Analytics", "Dominio proprio"]',
  true,
  1,
  'ABACATEPAY'
);
```

### Desativar planos antigos

```text
UPDATE plans SET is_active = false WHERE id IN (
  '9fb31f78-ed65-44e7-a67d-271a0cad8eb9',
  'fd32cbd6-84d1-4f0e-9ece-5fccb911eeb8',
  '377030c9-efe1-461d-9bca-9fc6717d99ed'
);
```

---

## Impacto nos Componentes

| Arquivo | Mudanca |
|---------|---------|
| `PricingSection.tsx` | Simplificar para 1 plano + Enterprise |
| `CheckoutPage.tsx` | Remover logica de parcelas hardcoded |
| `MaintenanceCheckoutPage.tsx` | Atualizar valor 79.90 -> 54.90 |
| `create-payment/index.ts` | Atualizar valor manutencao 79.90 -> 54.90 |
| `usePlans.ts` | Sem alteracao (ja busca planos ativos dinamicamente) |
| `usePayment.ts` | Sem alteracao |
| Banco `plans` | Desativar 3 planos, criar 1 novo |

---

## O que NAO muda

- Fluxo de pagamento AbacatePay (PIX + CARD) ja implementado
- Webhook de pagamento (abacatepay-webhook)
- Sistema de creditos e user_plans
- Plano Enterprise (WhatsApp)
- Autenticacao e criacao de usuario pos-pagamento

---

## Ordem de Execucao

1. Desativar planos antigos e criar novo plano no banco
2. Atualizar `create-payment` (manutencao 54.90)
3. Atualizar `PricingSection.tsx` (UI simplificada)
4. Atualizar `CheckoutPage.tsx` (remover parcelas hardcoded)
5. Atualizar `MaintenanceCheckoutPage.tsx` (54.90)
6. Deploy edge function e testar fluxo completo

