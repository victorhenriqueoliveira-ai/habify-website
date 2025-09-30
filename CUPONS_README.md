# Sistema de Cupons - Habify + AbacatePay

## Visão Geral

O sistema de cupons da Habify está integrado com a AbacatePay. Os cupons são aplicados **diretamente no checkout da AbacatePay**, não na interface da Habify.

## Fluxo Atualizado

### 1. Checkout na Habify

- O usuário seleciona um plano e preenche seus dados
- **NÃO há campo de cupom na Habify**
- O preço exibido é sempre o preço original do plano
- Há uma nota informando: "Cupons de desconto podem ser aplicados no checkout da AbacatePay"

### 2. Criação do Pagamento

Quando o usuário clica em "Pagar Agora":

1. A edge function `create-payment` cria o billing na AbacatePay
2. O payload inclui `allowCoupons: true` para habilitar o campo de cupom
3. O usuário é redirecionado para o checkout da AbacatePay

**Payload enviado para AbacatePay:**
```json
{
  "frequency": "ONE_TIME",
  "methods": ["PIX"],
  "products": [{
    "externalId": "plan-uuid",
    "name": "Nome do Plano",
    "description": "Descrição do Plano",
    "quantity": 1,
    "price": 89700
  }],
  "customerId": "customer-id",
  "returnUrl": "https://habify.com.br/payment-success",
  "completionUrl": "https://habify.com.br/payment-success",
  "webhookUrl": "https://jsttoajuszshrivmgnmc.supabase.co/functions/v1/abacatepay-webhook",
  "externalId": "habify-plan-uuid-timestamp",
  "allowCoupons": true
}
```

### 3. Aplicação do Cupom (No Checkout da AbacatePay)

No checkout da AbacatePay, o usuário:

1. Visualiza o campo para inserir código de cupom
2. Digita o código do cupom diretamente lá
3. A AbacatePay valida e aplica o desconto automaticamente
4. O valor final é atualizado com o desconto aplicado
5. O usuário conclui o pagamento

### 4. Webhook e Confirmação

Quando o pagamento é confirmado:

1. AbacatePay envia webhook para `/abacatepay-webhook`
2. Webhook contém informações do pagamento, incluindo:
   - Valor original
   - Cupom aplicado (se houver)
   - Valor final pago
3. Sistema registra o pedido com os dados corretos
4. Usuário recebe acesso ao serviço contratado

## Configuração Técnica

### Edge Function: create-payment

**Código relevante:**
```typescript
const billingPayload: any = {
  frequency: 'ONE_TIME',
  methods: paymentMethods,
  products: [{
    externalId: planId,
    name: plan.name,
    description: plan.description || plan.name,
    quantity: 1,
    price: Math.round(plan.price * 100), // Preço original em centavos
  }],
  customerId: customerId,
  returnUrl: 'https://habify.com.br/payment-success',
  completionUrl: 'https://habify.com.br/payment-success',
  webhookUrl: 'https://jsttoajuszshrivmgnmc.supabase.co/functions/v1/abacatepay-webhook',
  externalId: `habify-${planId}-${Date.now()}`,
  allowCoupons: true, // ← HABILITA O CAMPO DE CUPOM NO CHECKOUT
};
```

### Parâmetro Importante

- **`allowCoupons: true`**: Este parâmetro ativa o campo de cupom no checkout da AbacatePay
- Sem este parâmetro, o campo de cupom não será exibido no checkout

## Interface do Usuário

### CheckoutModal (Habify)

**Exibe:**
- ✅ Formulário com dados do usuário
- ✅ Seleção de método de pagamento (PIX/Cartão)
- ✅ Preço original do plano
- ✅ Nota: "Cupons de desconto podem ser aplicados no checkout da AbacatePay"
- ✅ Botão "Pagar Agora"

**NÃO exibe:**
- ❌ Campo de cupom
- ❌ Validação de cupom
- ❌ Cálculo de desconto
- ❌ Preço com desconto

### Checkout (AbacatePay)

A AbacatePay é responsável por:
- ✅ Exibir campo de cupom (porque `allowCoupons: true`)
- ✅ Validar códigos de cupom
- ✅ Calcular e aplicar descontos
- ✅ Atualizar o valor total
- ✅ Processar o pagamento

## Vantagens desta Abordagem

1. **Simplicidade**: A Habify não precisa gerenciar lógica de cupons
2. **Segurança**: Validação e aplicação de cupons acontecem no servidor da AbacatePay
3. **Flexibilidade**: AbacatePay gerencia seus próprios cupons e regras
4. **Manutenção**: Menos código para manter na Habify
5. **Consistência**: Usuário aplica cupom no mesmo lugar onde paga
6. **Centralização**: Todas as regras de cupom ficam no painel da AbacatePay

## Gerenciamento de Cupons

Cupons devem ser criados e gerenciados **diretamente no painel da AbacatePay**:

### Como criar um cupom:

1. Acesse o painel da AbacatePay
2. Navegue até a seção de **Cupons**
3. Clique em **Criar Novo Cupom**
4. Configure:
   - **Código único** (ex: DESCONTO20, PROMO50)
   - **Tipo de desconto**: Percentual ou Fixo
   - **Valor do desconto**: Porcentagem ou valor em reais
   - **Limite de usos**: Número máximo de vezes que pode ser usado (-1 = ilimitado)
   - **Status**: Ativo/Inativo
   - **Validade**: Data de início e fim (opcional)
5. Salve o cupom

### Exemplo de cupom:
```json
{
  "id": "DESCONTO20",
  "discountKind": "PERCENTAGE",
  "discount": 20,
  "maxRedeems": 100,
  "status": "ACTIVE",
  "devMode": false
}
```

## Logs e Depuração

Para depuração, verifique os logs das edge functions:

```bash
# Logs da criação de pagamento
supabase functions logs create-payment

# Logs do webhook (para ver cupons aplicados)
supabase functions logs abacatepay-webhook
```

### O que aparece nos logs:

**create-payment:**
```
Creating payment with AbacatePay for plan: Plano Premium, price: 897
AbacatePay billing payload with webhook: {
  ...
  "allowCoupons": true
}
```

**abacatepay-webhook (quando cupom é aplicado):**
```
Payment confirmed with coupon applied
Original price: 897
Coupon: DESCONTO20 (20% off)
Final price: 717.60
```

## Documentação Oficial

- [API AbacatePay - Criar Cobrança](https://docs.abacatepay.com/pages/payment/create)
- [AbacatePay - Parâmetro allowCoupons](https://docs.abacatepay.com/pages/payment/create#body-allowcoupons)
- [Gerenciamento de Cupons](https://docs.abacatepay.com/pages/coupons)

## Resumo

### ✅ O que a Habify faz:
- Exibe preço original do plano
- Envia `allowCoupons: true` no payload
- Redireciona para checkout da AbacatePay
- Processa webhook com dados do cupom aplicado

### ❌ O que a Habify NÃO faz:
- NÃO valida cupons
- NÃO aplica descontos
- NÃO exibe campo de cupom
- NÃO calcula preços com desconto

### 🎯 Responsabilidade da AbacatePay:
- Exibir campo de cupom no checkout
- Validar códigos de cupom
- Aplicar descontos
- Calcular valor final
- Processar pagamento com valor correto
- Enviar dados do cupom no webhook

## Testando o Fluxo

1. **Criar cupom no painel da AbacatePay** (ex: TESTE10)
2. **Acessar checkout na Habify** e preencher dados
3. **Clicar em "Pagar Agora"** → Redireciona para AbacatePay
4. **No checkout da AbacatePay**, inserir cupom TESTE10
5. **Verificar desconto aplicado** no valor total
6. **Concluir pagamento**
7. **Verificar webhook logs** para confirmar cupom foi registrado
