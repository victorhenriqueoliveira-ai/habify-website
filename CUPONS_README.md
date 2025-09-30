# Sistema de Cupons de Desconto - Habify + AbacatePay

## Como Funciona (Versão Atualizada)

O sistema de cupons foi implementado para aplicar descontos **automaticamente no checkout da Habify**, enviando o valor final já com desconto para a AbacatePay.

## Fluxo de Integração

### 1. Usuário Insere Cupom (Frontend)
```typescript
// O usuário digita o código do cupom
const couponCode = "DANILO20";

// Sistema valida com a AbacatePay
const { data } = await supabase.functions.invoke('validate-coupon', {
  body: { couponId: couponCode }
});

// Resposta:
{
  "success": true,
  "coupon": {
    "id": "DANILO20",
    "discountKind": "PERCENTAGE",
    "discount": 20
  }
}
```

### 2. Cálculo do Desconto (Frontend)
```typescript
// Desconto percentual
const finalPrice = originalPrice * (1 - discount / 100);
// Ex: R$ 897 * (1 - 20/100) = R$ 717,60

// Ou desconto fixo
const finalPrice = Math.max(0, originalPrice - discount);
// Ex: R$ 897 - R$ 50 = R$ 847
```

### 3. Criação do Billing (Backend)
```typescript
// Edge Function: create-payment
const finalPrice = plan.price; // R$ 897

if (couponId) {
  // Valida cupom na AbacatePay
  const coupon = await validateCouponWithAbacatePay(couponId);
  
  if (coupon.discountKind === 'PERCENTAGE') {
    finalPrice = plan.price * (1 - coupon.discount / 100);
  } else {
    finalPrice = Math.max(0, plan.price - coupon.discount);
  }
}

// Envia para AbacatePay com preço final
const billingPayload = {
  products: [{
    name: plan.name,
    price: Math.round(finalPrice * 100), // Valor JÁ com desconto
    description: `${plan.name} (Cupom ${couponId} aplicado)`
  }],
  // ...outros campos
};
```

### 4. Checkout na AbacatePay
- O usuário vê o valor final **já com desconto aplicado**
- Não precisa inserir o cupom novamente
- O pagamento é processado com o valor correto

## Estrutura do Cupom

```json
{
  "id": "DANILO20",
  "discountKind": "PERCENTAGE",  // ou "FIXED"
  "discount": 20,  // 20% ou R$ 20,00
  "maxRedeems": -1,  // -1 = ilimitado
  "redeems": 5,  // Quantos já foram usados
  "status": "ACTIVE",
  "devMode": true
}
```

## Validações Implementadas

### Edge Function: `validate-coupon`
- ✅ Lista todos os cupons da AbacatePay
- ✅ Encontra o cupom pelo ID (case-insensitive)
- ✅ Verifica se está `ACTIVE`
- ✅ Verifica se não atingiu `maxRedeems`
- ✅ Retorna tipo e valor do desconto

### Edge Function: `create-payment`
- ✅ Valida cupom antes de criar billing
- ✅ Calcula preço final com desconto
- ✅ Envia valor já descontado para AbacatePay
- ✅ Salva informações do cupom em `payment_data`

### Frontend: `CheckoutModal`
- ✅ Validação em tempo real
- ✅ Exibição do desconto antes do checkout
- ✅ Cálculo do total com desconto
- ✅ Feedback visual do cupom aplicado

## Metadados Salvos

```json
{
  "originalPrice": 897,
  "appliedCoupon": {
    "id": "DANILO20",
    "discountKind": "PERCENTAGE",
    "discount": 20
  },
  "customerData": { /* ... */ },
  "abacatePayData": { /* ... */ }
}
```

## Vantagens desta Abordagem

✅ **Transparência Total**
- Usuário vê o desconto ANTES de ir para AbacatePay
- Cálculo em tempo real
- Feedback imediato

✅ **Automático**
- Não precisa inserir cupom na AbacatePay
- Valor já vem com desconto
- Experiência fluida

✅ **Seguro**
- Validação com API oficial da AbacatePay
- Verificação de status e limites
- Rastreabilidade completa

✅ **Rastreável**
- Informações salvas no pedido
- Histórico de cupons aplicados
- Auditoria completa

## Limitações da AbacatePay (Contornadas)

❌ **A AbacatePay NÃO suporta:**
- Aplicação automática via campo `coupons`
- Pré-aplicação de cupons no checkout
- Validação via endpoint `/v1/coupon/{id}`

✅ **Nossa Solução:**
- Validamos via `/v1/coupon/list`
- Aplicamos desconto no lado da Habify
- Enviamos valor final para AbacatePay
- Experiência melhor para o usuário

## Testando Cupons

### 1. Criar Cupom na AbacatePay
```
- Acesse o painel da AbacatePay
- Vá em Cupons > Criar Novo
- Configure: ID, tipo, valor, limite
- Ative o cupom (status: ACTIVE)
```

### 2. Testar no Checkout
```
1. Abra o checkout da Habify
2. Digite o código do cupom
3. Clique em "Validar Cupom"
4. Veja o desconto sendo aplicado
5. Prossiga para pagamento
6. Confirme valor na AbacatePay
```

### 3. Verificar Logs
```
- Edge Function: validate-coupon
  - Logs de validação
  - Status do cupom
  
- Edge Function: create-payment
  - Preço original
  - Preço final
  - Cupom aplicado
```

## API Endpoints

### Validar Cupom
```typescript
POST /functions/v1/validate-coupon
Body: { couponId: "DANILO20" }

Response: {
  success: true,
  coupon: {
    id: "DANILO20",
    discountKind: "PERCENTAGE",
    discount: 20
  }
}
```

### Criar Pagamento (com cupom)
```typescript
POST /functions/v1/create-payment
Body: {
  planId: "uuid",
  customerData: { /* ... */ },
  couponId: "DANILO20"  // Opcional
}

Response: {
  success: true,
  paymentUrl: "https://...",
  orderId: "uuid"
}
```

## Documentação Oficial

- [API AbacatePay - Criar Cobrança](https://docs.abacatepay.com/pages/payment/create)
- [API AbacatePay - Listar Cupons](https://docs.abacatepay.com/api-reference/listar-todos-os-cupons)
- [Documentação de Cupons](https://docs.abacatepay.com/pages/payment/create#body-coupons)
