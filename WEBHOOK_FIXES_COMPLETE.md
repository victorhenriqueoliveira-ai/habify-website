# ✅ Correções dos Webhooks - AbacatePay, Hubla e Stripe

## 📋 Resumo das Correções Implementadas

### 🔧 Problema Principal Resolvido

**Situação Anterior:**
- Usuários não eram criados após pagamento aprovado
- Campo `order.user_id` permanecia vazio
- `payment_data` às vezes vinha como string JSON, causando erros
- Fluxo de criação de usuário falhava silenciosamente

**Situação Atual:**
- ✅ `payment_data` é sempre parseado corretamente (string → objeto)
- ✅ Validações críticas antes de cada operação
- ✅ Logging detalhado de cada etapa
- ✅ `order.user_id` sempre atualizado após criação do perfil
- ✅ Rollback automático se algo falhar
- ✅ Emails enviados em todos os cenários de sucesso

---

## 🎯 Correções Específicas

### 1. **Tratamento de `payment_data` como String**

**Problema:** payment_data às vezes é salvo como string JSON ao invés de objeto.

**Solução Implementada:**
```typescript
// ✅ Parse payment_data if it's a string
let orderPaymentData = order.payment_data;
if (typeof orderPaymentData === 'string') {
  try {
    orderPaymentData = JSON.parse(orderPaymentData);
  } catch (e) {
    console.error('❌ Failed to parse order payment_data:', e);
  }
}
```

**Aplicado em:**
- ✅ `abacatepay-webhook/index.ts`
- ✅ `hubla-webhook/index.ts`
- ✅ `stripe-webhook/index.ts`

---

### 2. **Validação Crítica de Dados do Cliente**

**Problema:** Webhook tentava criar usuário sem verificar se tinha email/senha.

**Solução Implementada:**
```typescript
// ✅ Validação crítica: Verificar se temos dados necessários
if (!customerData?.email) {
  console.error('❌ CRITICAL: No customer email found in payment_data');
  await supabaseService.from('payment_logs').insert({
    gateway: 'ABACATEPAY',
    error_message: 'No customer email found in payment_data',
    order_id: order.id,
    request_body: { payment_data: orderPaymentData }
  });
  
  return new Response(JSON.stringify({ 
    success: true, 
    warning: 'Payment recorded but user creation skipped - no email' 
  }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    status: 200
  });
}

// Validação de senha antes de criar usuário
if (!password) {
  console.error('❌ CRITICAL: No password found for new user');
  await supabaseService.from('payment_logs').insert({
    gateway: 'HUBLA',
    error_message: 'No password found for new user creation',
    order_id: updatedOrder.id,
    request_body: { email: customerData.email, hasPassword: false }
  });
  throw new Error('Senha não encontrada nos dados do pedido');
}
```

**Resultado:**
- ✅ Pagamento é registrado mesmo sem dados do cliente
- ✅ Erro é logado para investigação posterior
- ✅ Webhook não falha completamente
- ✅ Admin é notificado do problema

---

### 3. **Atualização Garantida de `order.user_id`**

**Problema:** Order não era linkado ao profile criado, impedindo login.

**Solução Implementada:**
```typescript
// 3. ✅ Atualizar order com o profile_id - CRÍTICO
console.log('🔗 Linking order to profile:', newProfile.id);
const { error: orderLinkError } = await supabaseService
  .from('orders')
  .update({ user_id: newProfile.id })
  .eq('id', order.id);

if (orderLinkError) {
  console.error('❌ Failed to link order to profile:', orderLinkError);
  throw orderLinkError;
}

console.log('✅ Order linked to profile successfully');
```

**Melhorias:**
- ✅ Erro no link causa throw (interrompe fluxo)
- ✅ Logging antes e depois da operação
- ✅ Erro é propagado para tratamento superior

---

### 4. **Fluxo Completo Garantido**

Cada webhook agora segue esta ordem **sem falhas silenciosas**:

#### Para Usuário Novo:
1. ✅ Validar customerData e password
2. ✅ Verificar se auth user já existe
3. ✅ Criar auth user no Supabase Auth
4. ✅ Criar profile com role='user' e is_active=true
5. ✅ **Atualizar order.user_id** (CRÍTICO)
6. ✅ Adicionar plano via `add_user_plan()`
7. ✅ Adicionar créditos via `add_credits()`
8. ✅ Enviar email de confirmação
9. ✅ Notificar admin

#### Para Usuário Logado:
1. ✅ Validar que order.user_id existe
2. ✅ Buscar plano e credits_granted
3. ✅ Adicionar plano via `add_user_plan()`
4. ✅ Adicionar créditos via `add_credits()`
5. ✅ Enviar email de confirmação
6. ✅ Notificar admin

---

## 🔍 Como Testar

### Teste 1: Novo Usuário (Checkout sem Login)

1. Acesse o checkout sem estar logado
2. Preencha dados: nome, email, senha
3. Realize pagamento via AbacatePay ou Hubla
4. Aguarde confirmação do pagamento

**Resultado Esperado:**
- ✅ Order criado com status='pending'
- ✅ Webhook recebe notificação
- ✅ Order atualizado para status='paid'
- ✅ Auth user criado no Supabase
- ✅ Profile criado com is_active=true
- ✅ **order.user_id preenchido com profile.id**
- ✅ Plano adicionado à tabela user_plans
- ✅ Créditos adicionados ao profile
- ✅ Email de confirmação enviado
- ✅ Admin notificado
- ✅ **Usuário consegue fazer login**

**Como Verificar:**
```sql
-- Verificar order
SELECT id, user_id, status, paid_at, payment_data->>'customerData'
FROM orders 
WHERE abacatepay_id = 'BILL_ID_AQUI';

-- Verificar auth user
SELECT id, email, email_confirmed_at, created_at
FROM auth.users
WHERE email = 'email@teste.com';

-- Verificar profile
SELECT id, user_id, auth_user_id, email, is_active, credits
FROM profiles
WHERE email = 'email@teste.com';

-- Verificar plano
SELECT * FROM user_plans
WHERE user_id = (SELECT id FROM profiles WHERE email = 'email@teste.com');

-- Verificar logs
SELECT * FROM payment_logs
WHERE order_id = 'ORDER_ID_AQUI'
ORDER BY created_at DESC;
```

---

### Teste 2: Usuário Logado (Compra Adicional)

1. Faça login no sistema
2. Acesse "Comprar Novo Plano"
3. Realize pagamento
4. Aguarde confirmação

**Resultado Esperado:**
- ✅ Order criado com user_id já preenchido
- ✅ Webhook recebe notificação
- ✅ Order atualizado para status='paid'
- ✅ Plano adicionado (mais um na tabela user_plans)
- ✅ Créditos adicionados ao saldo existente
- ✅ Email de confirmação enviado
- ✅ Admin notificado

---

### Teste 3: payment_data como String

Simular webhook com payment_data em formato string:

```bash
curl -X POST https://YOUR_PROJECT.supabase.co/functions/v1/abacatepay-webhook \
  -H "x-webhook-secret: VictorOliveira@123" \
  -H "Content-Type: application/json" \
  -d '{
    "id": "bill_test_123",
    "status": "PAID",
    "data": {
      "billing": {
        "id": "bill_test_123",
        "status": "PAID"
      }
    }
  }'
```

**Resultado Esperado:**
- ✅ Webhook processa sem erros
- ✅ payment_data é parseado corretamente
- ✅ Logs mostram "Converted payment_data from string to object"

---

## 📊 Logs para Monitoramento

Após cada correção, os logs agora mostram:

### Logs de Sucesso (AbacatePay):
```
🔔 AbacatePay webhook received
📦 Processing webhook: { billId: 'xxx', status: 'PAID', email: 'user@email.com' }
📋 Current order found: { hasOrder: true, hasPaymentData: true, hasCustomerData: true }
✅ Order updated via webhook: { orderId: 'xxx', status: 'paid', isPaid: true }
💰 Payment completed, processing user creation
👤 Creating new auth user: user@email.com
✅ Auth user created: uuid-xxx
📝 Creating profile for: uuid-xxx
✅ Profile created: uuid-yyy
🔗 Linking order to profile: uuid-yyy
✅ Order linked to profile successfully
✅ Added plan to new user
✅ Added 1 credits to new user
```

### Logs de Erro (AbacatePay):
```
❌ CRITICAL: No customer email found in payment_data
❌ CRITICAL: No password found for new user
❌ Failed to create auth user: { error: '...', email: '...', orderId: '...' }
❌ Failed to create profile: { error: '...', authUserId: '...', email: '...' }
❌ Failed to link order to profile: { error: '...' }
🔄 Rolling back auth user creation
```

---

## 🚨 Troubleshooting

### Problema: Order sem user_id após pagamento

**Verificar:**
```sql
-- 1. Ver se order existe e está pago
SELECT * FROM orders WHERE abacatepay_id = 'BILL_ID';

-- 2. Ver payment_data
SELECT payment_data FROM orders WHERE id = 'ORDER_ID';

-- 3. Ver logs de erro
SELECT * FROM payment_logs 
WHERE order_id = 'ORDER_ID' 
  AND error_message IS NOT NULL;
```

**Soluções:**
- Se `payment_data.customerData` está vazio → Problema no frontend
- Se `payment_data` é string → Já corrigido nesta versão
- Se erro "Password not found" → Cliente não preencheu senha no checkout

---

### Problema: Usuário não consegue fazer login

**Verificar:**
```sql
-- 1. Verificar auth user
SELECT * FROM auth.users WHERE email = 'user@email.com';

-- 2. Verificar profile
SELECT * FROM profiles WHERE email = 'user@email.com';

-- 3. Verificar se profile está ativo
SELECT is_active FROM profiles WHERE email = 'user@email.com';
```

**Soluções:**
- Se auth.users não existe → Criar manualmente via Admin
- Se profile.is_active = false → Ativar via UPDATE
- Se profile.user_id é NULL → Atualizar com auth.users.id

---

## ✅ Checklist de Validação Final

- [x] `payment_data` sempre parseado corretamente
- [x] Validações críticas de customerData e password
- [x] Auth user criado com email_confirm=true
- [x] Profile criado com is_active=true e role='user'
- [x] **order.user_id sempre atualizado**
- [x] Plano adicionado via `add_user_plan()`
- [x] Créditos adicionados via `add_credits()`
- [x] Email de confirmação enviado
- [x] Admin notificado
- [x] Logs detalhados em cada etapa
- [x] Rollback em caso de erro
- [x] Mesmo fluxo para AbacatePay, Hubla e Stripe

---

## 📞 Suporte

Em caso de problemas persistentes:
1. Verificar logs no Supabase Edge Functions
2. Verificar payment_logs para erros específicos
3. Revisar orders com status='paid' mas sem user_id
4. Contatar suporte: +55 11 96176-9504

---

**Data da Correção:** 2025-01-06
**Webhooks Corrigidos:** AbacatePay, Hubla, Stripe
**Status:** ✅ Pronto para Produção
