# 🔧 Correção do Fluxo de Criação de Usuários nos Webhooks

## ❌ Problema Identificado

Quando o pagamento era aprovado:
- ✅ Order era atualizado para `status: paid`
- ❌ Usuário NÃO era criado no Auth
- ❌ Profile NÃO era criado
- ❌ `order.user_id` permanecia vazio
- ❌ Usuário não conseguia fazer login
- ❌ Planos e créditos não eram adicionados

## ✅ Solução Implementada

### Fluxo Simplificado e Robusto

**ETAPA 1: Verificar se order já tem user_id**
```typescript
if (profileId) {
  console.log('✅ Order already has user_id:', profileId);
}
```

**ETAPA 2: Buscar profile existente por email**
```typescript
const { data: existingProfile } = await supabaseService
  .from('profiles')
  .select('id, user_id, auth_user_id')
  .eq('email', customerData.email)
  .maybeSingle();

if (existingProfile) {
  profileId = existingProfile.id;
  // Vincular order ao profile existente
}
```

**ETAPA 3: Verificar se auth user existe**
```typescript
const { data: authUsers } = await supabaseService.auth.admin.listUsers();
const existingAuthUser = authUsers?.users.find(u => u.email === customerData.email);

if (existingAuthUser) {
  authUserId = existingAuthUser.id;
}
```

**ETAPA 4: Criar novo auth user (se necessário)**
```typescript
const { data: authData, error: authError } = await supabaseService.auth.admin.createUser({
  email: customerData.email,
  password: password,
  email_confirm: true,
  user_metadata: {
    name: customerData.name,
    phone: customerData.phone || null,
    cpf: customerData.cpf || null,
    created_via: 'WEBHOOK'
  }
});
```

**ETAPA 5: Criar profile**
```typescript
const { data: newProfile, error: profileError } = await supabaseService
  .from('profiles')
  .insert({
    auth_user_id: authUserId,
    user_id: authUserId,
    name: customerData.name,
    email: customerData.email,
    phone: customerData.phone?.replace(/\D/g, '') || null,
    cpf: customerData.cpf?.replace(/\D/g, '') || null,
    role: 'user',
    is_active: true,
    credits: 0
  })
  .select()
  .single();

// 🔄 ROLLBACK automático se falhar
if (profileError && !existingAuthUser) {
  await supabaseService.auth.admin.deleteUser(authUserId);
}
```

**ETAPA 6: ⚠️ CRÍTICO - Vincular order ao profile**
```typescript
const { error: orderLinkError } = await supabaseService
  .from('orders')
  .update({ user_id: profileId })
  .eq('id', order.id);
```

**ETAPA 7: Adicionar plano ao usuário**
```typescript
await supabaseService.rpc('add_user_plan', {
  _user_id: profileId,
  _plan_id: order.plan_id,
  _order_id: order.id
});
```

**ETAPA 8: Adicionar créditos**
```typescript
if (planData?.credits_granted && planData.credits_granted > 0) {
  await supabaseService.rpc('add_credits', {
    _user_id: profileId,
    _amount: planData.credits_granted,
    _type: 'purchase',
    _description: 'Compra via Gateway',
    _order_id: order.id
  });
}
```

**ETAPA 9: Enviar emails de confirmação**
```typescript
await supabaseService.functions.invoke('send-payment-confirmation', {
  body: { orderId: order.id }
});
```

**ETAPA 10: Notificar admin**
```typescript
await supabaseService.functions.invoke('send-admin-notification', {
  body: {
    type: 'new_payment',
    title: 'Novo pagamento confirmado',
    message: `Pagamento via Gateway: ${customerData.email}`,
    orderId: order.id,
    gateway: 'GATEWAY_NAME',
    amount: order.amount
  }
});
```

## 🛡️ Melhorias de Segurança e Rastreabilidade

### ✅ Validações Obrigatórias
- Validar presença de `customerData.email`
- Validar presença de `password` para novos usuários
- Validar retorno de IDs em todas as operações críticas

### ✅ Logging Completo
- Cada etapa gera logs detalhados com emoji para fácil identificação
- Erros são registrados em `payment_logs` com contexto completo
- Logs incluem: email, hasPassword, orderId, profileId, authUserId

### ✅ Rollback Automático
- Se criação de profile falhar, auth user é deletado automaticamente
- Previne inconsistências no banco de dados
- Garante que não ficam registros órfãos

### ✅ Tratamento de Casos Edge
- Order já tem user_id → usa existente
- Profile existe → vincula order
- Auth user existe mas profile não → cria profile
- Nada existe → cria tudo do zero

## 📊 Resultado Esperado

Após cada pagamento aprovado:
- ✅ Auth user criado ou vinculado
- ✅ Profile criado ou vinculado  
- ✅ `order.user_id` sempre preenchido
- ✅ Usuário pode fazer login imediatamente
- ✅ Plano adicionado ao usuário
- ✅ Créditos adicionados (se aplicável)
- ✅ Emails de confirmação enviados
- ✅ Admin notificado

## 🔍 Como Testar

1. **Realizar pagamento com email novo**
   - Verificar criação de auth user
   - Verificar criação de profile
   - Verificar `order.user_id` preenchido
   - Tentar fazer login

2. **Realizar pagamento com email existente**
   - Verificar vinculação ao profile existente
   - Verificar adição de novo plano
   - Verificar soma de créditos

3. **Verificar logs**
   ```sql
   SELECT * FROM payment_logs 
   WHERE gateway IN ('ABACATEPAY', 'HUBLA')
   ORDER BY created_at DESC 
   LIMIT 20;
   ```

4. **Verificar orders**
   ```sql
   SELECT id, status, user_id, payment_data->>'email' as email
   FROM orders 
   WHERE status = 'paid' 
   AND created_at > NOW() - INTERVAL '1 day'
   ORDER BY created_at DESC;
   ```

## 🚀 Gateways Atualizados

- ✅ **AbacatePay** - `supabase/functions/abacatepay-webhook/index.ts`
- ✅ **Hubla** - `supabase/functions/hubla-webhook/index.ts`

Ambos implementam o mesmo fluxo robusto e testado.
