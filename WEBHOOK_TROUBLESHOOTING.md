# Troubleshooting de Webhooks - Sistema Habify

## 🔍 Guia de Diagnóstico e Resolução

Este documento fornece comandos e procedimentos para diagnosticar e resolver problemas com webhooks.

---

## 🚨 Problema: Webhook não está sendo recebido

### Diagnóstico

1. **Verificar se o webhook está configurado no gateway**
```bash
# AbacatePay: Acesse https://abacatepay.com/dashboard → Webhooks
# Hubla: Acesse https://app.hubla.com.br/ → Configurações → Webhooks
```

2. **Testar manualmente o webhook**

**AbacatePay:**
```bash
curl -X POST \
  https://jsttoajuszshrivmgnmc.supabase.co/functions/v1/abacatepay-webhook \
  -H "Content-Type: application/json" \
  -H "webhook-secret: $(supabase secrets list | grep ABACATEPAY_WEBHOOK_SECRET | awk '{print $3}')" \
  -d '{
    "id": "test_bill_debug",
    "status": "PAID",
    "amount": 597.00,
    "customer": {
      "email": "debug@teste.com",
      "name": "Debug Test"
    }
  }' -v
```

**Hubla:**
```bash
curl -X POST \
  https://jsttoajuszshrivmgnmc.supabase.co/functions/v1/hubla-webhook \
  -H "Content-Type: application/json" \
  -H "hubla-webhook-token: $(supabase secrets list | grep HUBLA_WEBHOOK_TOKEN | awk '{print $3}')" \
  -d '{
    "event": "transaction.approved",
    "transaction_id": "test_txn_debug",
    "status": "approved",
    "amount": 972.06,
    "customer_email": "debug@teste.com"
  }' -v
```

3. **Verificar logs da edge function**
```bash
# Via Supabase CLI
supabase functions logs abacatepay-webhook --tail
supabase functions logs hubla-webhook --tail

# Via Dashboard
# https://supabase.com/dashboard/project/jsttoajuszshrivmgnmc/functions/abacatepay-webhook/logs
# https://supabase.com/dashboard/project/jsttoajuszshrivmgnmc/functions/hubla-webhook/logs
```

### Soluções

- ✅ Reconfigurar webhook no painel do gateway
- ✅ Verificar se a URL está correta
- ✅ Verificar se os eventos estão habilitados
- ✅ Testar com payload de exemplo

---

## 🔐 Problema: Erro 401 - Unauthorized

### Diagnóstico

1. **Verificar se o secret/token está correto**
```sql
-- No SQL Editor do Supabase
SELECT decrypted_secret 
FROM vault.decrypted_secrets 
WHERE name IN ('ABACATEPAY_WEBHOOK_SECRET', 'HUBLA_WEBHOOK_TOKEN');
```

2. **Verificar header enviado pelo gateway**
- Verifique os logs da edge function para ver o header recebido
- Compare com o secret configurado

### Soluções

**Atualizar secret no Supabase:**
```bash
# Via Supabase CLI
supabase secrets set ABACATEPAY_WEBHOOK_SECRET=novo_secret
supabase secrets set HUBLA_WEBHOOK_TOKEN=novo_token

# Via Dashboard
# https://supabase.com/dashboard/project/jsttoajuszshrivmgnmc/settings/functions
```

**Atualizar webhook no gateway:**
- Acesse o painel do gateway
- Edite o webhook
- Atualize o secret/token com o mesmo valor do Supabase
- Salve

---

## 📦 Problema: Order não encontrado

### Diagnóstico

1. **Verificar se o order existe**
```sql
-- Buscar por bill_id (AbacatePay)
SELECT * FROM orders 
WHERE abacatepay_id = 'bill_ABC123XYZ';

-- Buscar por transaction_id (Hubla)
SELECT * FROM orders 
WHERE hubla_transaction_id = 'TXN123456';

-- Buscar por email
SELECT * FROM orders 
WHERE payment_data->>'email' = 'cliente@exemplo.com'
ORDER BY created_at DESC;
```

2. **Verificar logs de payment_logs**
```sql
SELECT * FROM payment_logs
WHERE gateway = 'ABACATEPAY' 
  AND request_body->>'id' = 'bill_ABC123XYZ'
ORDER BY created_at DESC
LIMIT 5;
```

### Soluções

**Criar order manualmente (se necessário):**
```sql
INSERT INTO orders (
  plan_id,
  amount,
  status,
  gateway,
  payment_method,
  abacatepay_id,
  payment_data
)
VALUES (
  (SELECT id FROM plans WHERE type = 'website_only' LIMIT 1),
  597.00,
  'pending',
  'ABACATEPAY',
  'PIX',
  'bill_ABC123XYZ',
  jsonb_build_object(
    'email', 'cliente@exemplo.com',
    'name', 'Nome do Cliente'
  )
);
```

**Simular webhook manualmente:**
```bash
# Substitua os valores com os dados reais
curl -X POST \
  https://jsttoajuszshrivmgnmc.supabase.co/functions/v1/abacatepay-webhook \
  -H "Content-Type: application/json" \
  -H "webhook-secret: SEU_SECRET" \
  -d '{
    "id": "bill_ABC123XYZ",
    "status": "PAID",
    "amount": 597.00,
    "customer": {
      "email": "cliente@exemplo.com",
      "name": "Nome do Cliente"
    }
  }'
```

---

## 👤 Problema: Usuário não foi criado após pagamento

### Diagnóstico

1. **Verificar se o order foi processado**
```sql
SELECT o.*, p.email, p.name
FROM orders o
LEFT JOIN profiles p ON p.email = o.payment_data->>'email'
WHERE o.id = 'order_uuid_aqui';
```

2. **Verificar logs de auth**
```sql
-- Via Supabase Dashboard → Authentication → Logs
-- Ou via SQL:
SELECT * FROM auth.users 
WHERE email = 'cliente@exemplo.com';
```

3. **Verificar se o trigger está ativo**
```sql
SELECT * FROM information_schema.triggers 
WHERE trigger_name = 'on_auth_user_created';
```

### Soluções

**Criar usuário manualmente:**
```sql
-- IMPORTANTE: Isso deve ser feito via webhook normalmente
-- Apenas use em casos excepcionais

-- 1. Criar usuário no auth
-- Via Supabase Dashboard → Authentication → Users → Add User

-- 2. Verificar se profile foi criado automaticamente
SELECT * FROM profiles WHERE email = 'cliente@exemplo.com';

-- 3. Vincular order ao profile
UPDATE orders 
SET user_id = (SELECT id FROM profiles WHERE email = 'cliente@exemplo.com')
WHERE payment_data->>'email' = 'cliente@exemplo.com'
  AND user_id IS NULL;

-- 4. Adicionar créditos
SELECT add_credits(
  (SELECT id FROM profiles WHERE email = 'cliente@exemplo.com'),
  1, -- quantidade de créditos
  'admin_grant',
  'Créditos adicionados manualmente após troubleshooting'
);

-- 5. Adicionar plano
SELECT add_user_plan(
  (SELECT id FROM profiles WHERE email = 'cliente@exemplo.com'),
  (SELECT id FROM plans WHERE type = 'website_only'),
  (SELECT id FROM orders WHERE payment_data->>'email' = 'cliente@exemplo.com' LIMIT 1)
);
```

**Reprocessar webhook:**
```bash
# Buscar dados do order
ORDER_ID="uuid-do-order"

# Simular webhook com dados do order
curl -X POST \
  https://jsttoajuszshrivmgnmc.supabase.co/functions/v1/abacatepay-webhook \
  -H "Content-Type: application/json" \
  -H "webhook-secret: SEU_SECRET" \
  -d "$(echo "SELECT jsonb_build_object(
    'id', abacatepay_id,
    'status', 'PAID',
    'amount', amount,
    'customer', payment_data
  ) FROM orders WHERE id = '$ORDER_ID'" | psql)"
```

---

## 💳 Problema: Créditos não foram adicionados

### Diagnóstico

1. **Verificar se o plano tem créditos configurados**
```sql
SELECT id, name, type, credits_granted 
FROM plans 
WHERE id = 'plan_uuid_aqui';
```

2. **Verificar histórico de créditos**
```sql
SELECT ch.*, p.email, p.name
FROM credits_history ch
JOIN profiles p ON p.id = ch.user_id
WHERE p.email = 'cliente@exemplo.com'
ORDER BY ch.created_at DESC;
```

3. **Verificar créditos atuais do usuário**
```sql
SELECT p.email, p.name, p.credits
FROM profiles p
WHERE p.email = 'cliente@exemplo.com';
```

### Soluções

**Adicionar créditos manualmente:**
```sql
-- Buscar profile_id
SELECT id, email, credits FROM profiles WHERE email = 'cliente@exemplo.com';

-- Adicionar créditos
SELECT add_credits(
  'profile_id_aqui'::uuid,
  1, -- quantidade de créditos
  'admin_grant',
  'Créditos adicionados manualmente - Order ID: order_uuid_aqui',
  'order_uuid_aqui'::uuid
);

-- Verificar atualização
SELECT email, credits FROM profiles WHERE email = 'cliente@exemplo.com';
```

**Verificar e corrigir função add_credits:**
```sql
-- Testar função
SELECT add_credits(
  (SELECT id FROM profiles WHERE email = 'teste@exemplo.com'),
  1,
  'purchase',
  'Teste de adição de créditos'
);

-- Se houver erro, verificar função
SELECT proname, prosrc 
FROM pg_proc 
WHERE proname = 'add_credits';
```

---

## 📧 Problema: Email de confirmação não foi enviado

### Diagnóstico

1. **Verificar se o email foi tentado**
```sql
-- Verificar logs de payment_logs
SELECT * FROM payment_logs
WHERE gateway = 'RESEND'
  AND request_body->>'to' LIKE '%cliente@exemplo.com%'
ORDER BY created_at DESC;
```

2. **Verificar logs da edge function**
```bash
supabase functions logs send-payment-confirmation --tail
```

3. **Verificar configuração do Resend**
- Acesse: https://resend.com/domains
- Verifique se o domínio está verificado
- Verifique se há limite de envio atingido

### Soluções

**Enviar email manualmente:**
```sql
-- Invocar edge function diretamente
SELECT * FROM http_post(
  'https://jsttoajuszshrivmgnmc.supabase.co/functions/v1/send-payment-confirmation',
  jsonb_build_object(
    'orderId', 'order_uuid_aqui'
  )::text,
  'application/json'
);
```

**Verificar secret do Resend:**
```bash
# Atualizar se necessário
supabase secrets set RESEND_API_KEY=re_nova_chave
```

---

## 🔄 Problema: Pagamento duplicado processado

### Diagnóstico

1. **Verificar orders duplicados**
```sql
SELECT 
  abacatepay_id,
  COUNT(*) as count,
  array_agg(id) as order_ids,
  array_agg(status) as statuses
FROM orders
WHERE abacatepay_id IS NOT NULL
GROUP BY abacatepay_id
HAVING COUNT(*) > 1;
```

2. **Verificar créditos duplicados**
```sql
SELECT 
  ch.user_id,
  ch.order_id,
  COUNT(*) as count,
  SUM(ch.amount) as total_credits
FROM credits_history ch
WHERE ch.order_id IS NOT NULL
GROUP BY ch.user_id, ch.order_id
HAVING COUNT(*) > 1;
```

### Soluções

**Remover duplicatas:**
```sql
-- CUIDADO: Execute com atenção!

-- 1. Manter apenas o primeiro order
DELETE FROM orders 
WHERE id IN (
  SELECT id FROM (
    SELECT id, ROW_NUMBER() OVER (
      PARTITION BY abacatepay_id 
      ORDER BY created_at
    ) as rn
    FROM orders
    WHERE abacatepay_id IS NOT NULL
  ) t
  WHERE t.rn > 1
);

-- 2. Ajustar créditos duplicados
-- Primeiro, calcule o total de créditos duplicados
SELECT 
  user_id,
  order_id,
  SUM(amount) - (SELECT credits_granted FROM plans WHERE id = (SELECT plan_id FROM orders WHERE id = order_id)) as excess_credits
FROM credits_history
WHERE order_id IS NOT NULL
GROUP BY user_id, order_id
HAVING COUNT(*) > 1;

-- Então, remova o excesso de créditos
SELECT use_credits(
  'user_id_aqui'::uuid,
  excesso_de_creditos,
  'Ajuste por créditos duplicados'
);
```

---

## 📊 Queries de Diagnóstico Rápido

### Status Geral do Sistema
```sql
SELECT 
  'Profiles sem auth_user_id' as metric,
  COUNT(*) as count
FROM profiles
WHERE auth_user_id IS NULL

UNION ALL

SELECT 
  'Orders pendentes > 24h',
  COUNT(*)
FROM orders
WHERE status = 'pending' 
  AND created_at < NOW() - INTERVAL '24 hours'

UNION ALL

SELECT 
  'Webhooks com erro hoje',
  COUNT(*)
FROM payment_logs
WHERE created_at >= CURRENT_DATE
  AND error_message IS NOT NULL

UNION ALL

SELECT 
  'Usuários sem créditos',
  COUNT(*)
FROM profiles
WHERE credits = 0
  AND is_active = true;
```

### Últimos 10 Webhooks
```sql
SELECT 
  pl.id,
  pl.gateway,
  pl.created_at,
  pl.status_code,
  pl.error_message,
  pl.request_body->>'id' as transaction_id,
  pl.request_body->>'status' as status
FROM payment_logs pl
ORDER BY pl.created_at DESC
LIMIT 10;
```

### Últimos 10 Pagamentos Confirmados
```sql
SELECT 
  o.id,
  o.created_at,
  o.paid_at,
  o.status,
  o.amount,
  o.gateway,
  o.payment_method,
  o.payment_data->>'email' as customer_email,
  p.email as profile_email,
  p.credits
FROM orders o
LEFT JOIN profiles p ON p.id = o.user_id
WHERE o.status = 'completed'
ORDER BY o.paid_at DESC
LIMIT 10;
```

---

## 🆘 Quando Contatar Suporte

Entre em contato com o time de dev se:
- ✅ Seguiu todos os passos de troubleshooting
- ✅ O problema persiste após 2 tentativas
- ✅ Há erro crítico nos logs (5xx)
- ✅ Há inconsistência de dados no banco
- ✅ Há suspeita de problema no gateway

---

**Última atualização**: 2025-01-15
**Versão**: 1.0
