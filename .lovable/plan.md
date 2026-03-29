

## Problema Encontrado: Pedidos de novos usuários não aparecem na tela de pagamentos

### O que está acontecendo

A query em `usePayments.ts` (linha 32) usa `profiles!inner(name, email)` — um JOIN INNER. Isso significa que apenas orders que têm `user_id` associado a um perfil existente são retornadas.

Quando um novo usuário faz checkout (não está logado), a order é criada com `user_id: null`. Esse pedido **nunca aparece** na tela de pagamentos do admin, mesmo depois de pago.

Resumo do impacto:
- Pedidos de novos usuários (a maioria dos checkouts) ficam invisíveis
- O admin não consegue ver tentativas de pagamento pendentes
- A receita total mostrada está incorreta

### Correção

**Arquivo:** `src/hooks/usePayments.ts`

Trocar o `profiles!inner(...)` por um LEFT JOIN e extrair nome/email do `payment_data` como fallback quando o perfil não existe:

```
// Antes:
.select(`*, profiles!inner(name, email)`)

// Depois:  
.select(`*, profiles(name, email)`)
```

E no mapeamento dos dados, usar o `payment_data` como fallback:

```typescript
const formattedOrders = data?.map((order: any) => ({
  ...existingFields,
  customerName: order.profiles?.name || order.payment_data?.customerData?.name || 'N/A',
  customerEmail: order.profiles?.email || order.payment_data?.customerData?.email || 'N/A',
}));
```

**Arquivo:** `src/pages/admin/PaymentsPage.tsx`

Adicionar colunas de Cliente (nome/email) na tabela para o admin ver quem fez o pedido, mesmo sem perfil vinculado.

### Arquivos a editar

1. `src/hooks/usePayments.ts` — Trocar INNER JOIN por LEFT JOIN, adicionar campos de cliente com fallback
2. `src/pages/admin/PaymentsPage.tsx` — Mostrar nome/email do cliente na tabela

