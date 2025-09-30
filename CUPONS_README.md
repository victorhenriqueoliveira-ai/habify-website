# Sistema de Cupons de Desconto - AbacatePay

## Como Funciona

A AbacatePay **não possui um endpoint separado** para validar cupons antes de criar uma cobrança. Os cupons são aplicados diretamente na página de checkout da AbacatePay.

## Fluxo de Integração

### 1. No Checkout (Frontend)
```typescript
// O usuário insere o código do cupom
const couponCode = "DANILO20";

// O sistema salva localmente para enviar no payload
setCouponData({ id: couponCode });
```

### 2. Criação do Billing (Backend)
```typescript
const billingPayload = {
  // ... outros campos
  allowCoupons: true,  // Permite uso de cupons
  coupons: ["DANILO20"],  // Array com códigos disponíveis
};

// POST https://api.abacatepay.com/v1/billing/create
```

### 3. Na Página da AbacatePay
- O usuário é redirecionado para o checkout da AbacatePay
- O cupom é automaticamente aplicado se for válido
- O desconto é calculado e exibido
- O valor final já vem com desconto aplicado

## Estrutura do Cupom

```json
{
  "id": "DANILO20",
  "discountKind": "PERCENTAGE",  // ou "FIXED"
  "discount": 20,  // 20% ou R$ 20,00 (em centavos: 2000)
  "maxRedeems": -1,  // -1 = ilimitado
  "redeemsCount": 5,
  "status": "ACTIVE",
  "devMode": true
}
```

## Validações Automáticas da AbacatePay

A AbacatePay valida automaticamente:
- ✅ Se o cupom existe
- ✅ Se está ativo (`status === "ACTIVE"`)
- ✅ Se não atingiu o limite de usos
- ✅ Se está no ambiente correto (devMode)

## Limitações

❌ **Não é possível:**
- Validar cupons ANTES de criar o billing
- Mostrar o desconto exato no seu checkout
- Verificar se o cupom existe sem criar uma cobrança

✅ **Alternativa:**
- Mostrar mensagem informativa: "O desconto será calculado automaticamente"
- Enviar o cupom e deixar a AbacatePay aplicar
- Verificar na resposta do webhook se o cupom foi aplicado

## Payload Exemplo

### Request
```json
{
  "frequency": "ONE_TIME",
  "methods": ["PIX", "CARD"],
  "products": [{
    "externalId": "plan-123",
    "name": "Plano Premium",
    "price": 10000
  }],
  "allowCoupons": true,
  "coupons": ["DANILO20", "PROMO10"],
  "customerId": "cust_abc123"
}
```

### Response (com cupom aplicado)
```json
{
  "data": {
    "id": "bill_123456",
    "url": "https://pay.abacatepay.com/bill-123456",
    "amount": 10000,
    "discountApplied": 2000,  // Desconto de R$ 20,00
    "amountFinal": 8000,  // R$ 80,00 final
    "status": "PENDING",
    "coupon": {
      "id": "DANILO20",
      "discountKind": "PERCENTAGE",
      "discount": 20
    }
  }
}
```

## Documentação Oficial

- [Criar Cobrança](https://docs.abacatepay.com/api-reference/criar-uma-nova-cobran%C3%A7a)
- [Parâmetro allowCoupons](https://docs.abacatepay.com/api-reference/criar-uma-nova-cobran%C3%A7a#body-allow-coupons)
- [Parâmetro coupons](https://docs.abacatepay.com/api-reference/criar-uma-nova-cobran%C3%A7a#body-coupons)
