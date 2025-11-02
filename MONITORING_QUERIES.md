# Queries de Monitoramento - Sistema Habify

## 📊 Queries SQL para Monitoramento e Alertas

Este documento contém queries SQL para monitorar a saúde do sistema de pagamentos e identificar problemas proativamente.

---

## 🚨 ALERTAS CRÍTICOS

Execute estas queries diariamente ou configure alertas automáticos.

### 1. Profiles sem auth_user_id
**Problema**: Usuários que não conseguem fazer login.

```sql
SELECT 
  p.id,
  p.email,
  p.name,
  p.created_at,
  p.is_active,
  p.credits,
  EXISTS(SELECT 1 FROM auth.users WHERE id = p.user_id) as has_auth_user
FROM profiles p
WHERE p.auth_user_id IS NULL
ORDER BY p.created_at DESC;
```

**Ação**: Se houver resultados, execute:
```sql
-- Corrigir profiles sem auth_user_id
UPDATE public.profiles p
SET 
  auth_user_id = u.id,
  user_id = u.id
FROM auth.users u
WHERE p.email = u.email 
  AND p.auth_user_id IS NULL;
```

---

### 2. Orders Pendentes > 24 horas
**Problema**: Pagamentos não confirmados que podem estar perdidos.

```sql
SELECT 
  o.id,
  o.created_at,
  o.amount,
  o.gateway,
  o.payment_method,
  o.abacatepay_id,
  o.hubla_transaction_id,
  o.payment_data->>'email' as customer_email,
  o.payment_data->>'name' as customer_name,
  NOW() - o.created_at as time_pending
FROM orders o
WHERE o.status = 'pending'
  AND o.created_at < NOW() - INTERVAL '24 hours'
ORDER BY o.created_at ASC;
```

**Ação**:
1. Verificar no painel do gateway se o pagamento foi confirmado
2. Se sim, simular webhook manualmente (ver `WEBHOOK_TROUBLESHOOTING.md`)
3. Se não, considerar cancelar o order

---

### 3. Erros de Webhook nas Últimas 24h
**Problema**: Webhooks falhando podem bloquear confirmações de pagamento.

```sql
SELECT 
  pl.id,
  pl.created_at,
  pl.gateway,
  pl.status_code,
  pl.error_message,
  pl.request_body->>'id' as transaction_id,
  pl.request_body->>'email' as customer_email,
  pl.response_body
FROM payment_logs pl
WHERE pl.created_at >= NOW() - INTERVAL '24 hours'
  AND (pl.error_message IS NOT NULL OR pl.status_code >= 400)
ORDER BY pl.created_at DESC;
```

**Ação**: Investigar erros e corrigir configuração de webhooks se necessário.

---

### 4. Usuários com Créditos mas sem Planos
**Problema**: Inconsistência no sistema de créditos/planos.

```sql
SELECT 
  p.id,
  p.email,
  p.name,
  p.credits,
  p.created_at,
  COUNT(up.id) as plan_count,
  COUNT(ch.id) as credit_transactions
FROM profiles p
LEFT JOIN user_plans up ON up.user_id = p.id AND up.status = 'active'
LEFT JOIN credits_history ch ON ch.user_id = p.id
WHERE p.credits > 0
  AND p.is_active = true
GROUP BY p.id
HAVING COUNT(up.id) = 0
ORDER BY p.credits DESC;
```

**Ação**: Investigar se os créditos foram adicionados corretamente.

---

### 5. Pagamentos Completados sem Usuário Vinculado
**Problema**: Pagamentos processados mas usuário não foi criado.

```sql
SELECT 
  o.id,
  o.created_at,
  o.paid_at,
  o.amount,
  o.gateway,
  o.payment_data->>'email' as customer_email,
  o.payment_data->>'name' as customer_name,
  pl.id as plan_id,
  pl.name as plan_name,
  pl.credits_granted
FROM orders o
JOIN plans pl ON pl.id = o.plan_id
WHERE o.status = 'completed'
  AND o.user_id IS NULL
ORDER BY o.paid_at DESC;
```

**Ação**: Criar usuário manualmente e vincular ao order (ver `WEBHOOK_TROUBLESHOOTING.md`).

---

## 📈 MÉTRICAS DE DESEMPENHO

Execute estas queries semanalmente para acompanhar a saúde do sistema.

### 6. Taxa de Conversão de Pagamentos
**Objetivo**: Medir quantos orders se tornam pagamentos confirmados.

```sql
WITH stats AS (
  SELECT 
    gateway,
    payment_method,
    COUNT(*) as total_orders,
    COUNT(*) FILTER (WHERE status = 'completed') as completed_orders,
    COUNT(*) FILTER (WHERE status = 'pending') as pending_orders,
    COUNT(*) FILTER (WHERE status = 'failed') as failed_orders,
    AVG(EXTRACT(EPOCH FROM (paid_at - created_at))/60) FILTER (WHERE paid_at IS NOT NULL) as avg_payment_time_minutes
  FROM orders
  WHERE created_at >= NOW() - INTERVAL '30 days'
  GROUP BY gateway, payment_method
)
SELECT 
  gateway,
  payment_method,
  total_orders,
  completed_orders,
  pending_orders,
  failed_orders,
  ROUND(100.0 * completed_orders / NULLIF(total_orders, 0), 2) as conversion_rate,
  ROUND(avg_payment_time_minutes::numeric, 2) as avg_payment_time_minutes
FROM stats
ORDER BY total_orders DESC;
```

---

### 7. Receita por Gateway (Últimos 30 dias)
**Objetivo**: Entender qual gateway gera mais receita.

```sql
SELECT 
  o.gateway,
  o.payment_method,
  COUNT(*) as total_sales,
  SUM(o.amount) as total_revenue,
  AVG(o.amount) as avg_ticket,
  COUNT(DISTINCT o.user_id) as unique_customers
FROM orders o
WHERE o.status = 'completed'
  AND o.paid_at >= NOW() - INTERVAL '30 days'
GROUP BY o.gateway, o.payment_method
ORDER BY total_revenue DESC;
```

---

### 8. Desempenho de Webhooks
**Objetivo**: Medir latência e taxa de erro de webhooks.

```sql
WITH webhook_stats AS (
  SELECT 
    gateway,
    DATE_TRUNC('day', created_at) as day,
    COUNT(*) as total_webhooks,
    COUNT(*) FILTER (WHERE status_code >= 200 AND status_code < 300) as successful,
    COUNT(*) FILTER (WHERE status_code >= 400) as errors,
    COUNT(*) FILTER (WHERE error_message IS NOT NULL) as with_error_message
  FROM payment_logs
  WHERE created_at >= NOW() - INTERVAL '7 days'
  GROUP BY gateway, DATE_TRUNC('day', created_at)
)
SELECT 
  gateway,
  day,
  total_webhooks,
  successful,
  errors,
  with_error_message,
  ROUND(100.0 * successful / NULLIF(total_webhooks, 0), 2) as success_rate,
  ROUND(100.0 * errors / NULLIF(total_webhooks, 0), 2) as error_rate
FROM webhook_stats
ORDER BY day DESC, gateway;
```

---

### 9. Tempo Médio de Processamento de Webhook
**Objetivo**: Identificar gargalos no processamento.

```sql
SELECT 
  pl.gateway,
  DATE_TRUNC('hour', pl.created_at) as hour,
  COUNT(*) as webhooks_processed,
  ROUND(AVG(EXTRACT(EPOCH FROM (o.updated_at - pl.created_at)))::numeric, 2) as avg_processing_seconds,
  MAX(EXTRACT(EPOCH FROM (o.updated_at - pl.created_at))) as max_processing_seconds
FROM payment_logs pl
JOIN orders o ON o.id = pl.order_id
WHERE pl.created_at >= NOW() - INTERVAL '24 hours'
  AND pl.status_code >= 200 
  AND pl.status_code < 300
GROUP BY pl.gateway, DATE_TRUNC('hour', pl.created_at)
ORDER BY hour DESC;
```

---

## 💰 MÉTRICAS DE CRÉDITOS

### 10. Distribuição de Créditos por Usuário
**Objetivo**: Entender como os créditos estão distribuídos.

```sql
SELECT 
  CASE 
    WHEN credits = 0 THEN '0 créditos'
    WHEN credits BETWEEN 1 AND 2 THEN '1-2 créditos'
    WHEN credits BETWEEN 3 AND 5 THEN '3-5 créditos'
    WHEN credits BETWEEN 6 AND 10 THEN '6-10 créditos'
    ELSE '10+ créditos'
  END as credit_range,
  COUNT(*) as user_count,
  SUM(credits) as total_credits
FROM profiles
WHERE is_active = true
GROUP BY 
  CASE 
    WHEN credits = 0 THEN '0 créditos'
    WHEN credits BETWEEN 1 AND 2 THEN '1-2 créditos'
    WHEN credits BETWEEN 3 AND 5 THEN '3-5 créditos'
    WHEN credits BETWEEN 6 AND 10 THEN '6-10 créditos'
    ELSE '10+ créditos'
  END
ORDER BY MIN(credits);
```

---

### 11. Histórico de Créditos (Últimos 30 dias)
**Objetivo**: Ver movimentação de créditos no tempo.

```sql
SELECT 
  DATE_TRUNC('day', ch.created_at) as day,
  ch.type,
  COUNT(*) as transactions,
  SUM(ch.amount) as total_credits,
  AVG(ch.amount) as avg_credits_per_transaction
FROM credits_history ch
WHERE ch.created_at >= NOW() - INTERVAL '30 days'
GROUP BY DATE_TRUNC('day', ch.created_at), ch.type
ORDER BY day DESC, ch.type;
```

---

### 12. Usuários que Usaram Créditos
**Objetivo**: Taxa de ativação de créditos.

```sql
WITH credit_usage AS (
  SELECT 
    p.id,
    p.email,
    p.credits as current_credits,
    COALESCE(SUM(ch.amount) FILTER (WHERE ch.type = 'purchase'), 0) as total_purchased,
    COALESCE(SUM(ch.amount) FILTER (WHERE ch.type = 'usage'), 0) as total_used,
    COUNT(*) FILTER (WHERE ch.type = 'usage') as usage_count
  FROM profiles p
  LEFT JOIN credits_history ch ON ch.user_id = p.id
  WHERE p.is_active = true
  GROUP BY p.id
)
SELECT 
  COUNT(*) as total_users,
  COUNT(*) FILTER (WHERE total_purchased > 0) as users_with_credits,
  COUNT(*) FILTER (WHERE usage_count > 0) as users_who_used_credits,
  ROUND(100.0 * COUNT(*) FILTER (WHERE usage_count > 0) / NULLIF(COUNT(*) FILTER (WHERE total_purchased > 0), 0), 2) as activation_rate,
  AVG(total_purchased) as avg_credits_purchased,
  AVG(total_used) as avg_credits_used
FROM credit_usage;
```

---

## 👥 MÉTRICAS DE USUÁRIOS

### 13. Novos Usuários por Dia (Últimos 30 dias)
**Objetivo**: Crescimento de usuários.

```sql
SELECT 
  DATE_TRUNC('day', p.created_at) as day,
  COUNT(*) as new_users,
  COUNT(*) FILTER (WHERE p.credits > 0) as users_with_credits,
  COUNT(DISTINCT o.id) as associated_orders,
  SUM(o.amount) FILTER (WHERE o.status = 'completed') as total_revenue
FROM profiles p
LEFT JOIN orders o ON o.user_id = p.id AND o.status = 'completed'
WHERE p.created_at >= NOW() - INTERVAL '30 days'
GROUP BY DATE_TRUNC('day', p.created_at)
ORDER BY day DESC;
```

---

### 14. Usuários Ativos vs Inativos
**Objetivo**: Ver distribuição de ativação.

```sql
SELECT 
  is_active,
  role,
  COUNT(*) as user_count,
  SUM(credits) as total_credits,
  AVG(credits) as avg_credits
FROM profiles
GROUP BY is_active, role
ORDER BY is_active DESC, role;
```

---

## 🎯 MÉTRICAS DE PLANOS

### 15. Planos Mais Vendidos (Últimos 30 dias)
**Objetivo**: Identificar planos populares.

```sql
SELECT 
  pl.id,
  pl.name,
  pl.type,
  pl.price,
  pl.pix_price,
  pl.credits_granted,
  COUNT(o.id) as total_sales,
  SUM(o.amount) as total_revenue,
  COUNT(DISTINCT o.user_id) as unique_customers
FROM plans pl
LEFT JOIN orders o ON o.plan_id = pl.id 
  AND o.status = 'completed'
  AND o.paid_at >= NOW() - INTERVAL '30 days'
WHERE pl.is_active = true
GROUP BY pl.id
ORDER BY total_sales DESC;
```

---

### 16. Planos Ativos por Usuário
**Objetivo**: Ver quantos planos cada usuário tem.

```sql
SELECT 
  p.email,
  p.name,
  p.credits,
  COUNT(up.id) as active_plans,
  string_agg(DISTINCT pl.name, ', ') as plan_names,
  MIN(up.expires_at) as earliest_expiration
FROM profiles p
JOIN user_plans up ON up.user_id = p.id
JOIN plans pl ON pl.id = up.plan_id
WHERE up.status = 'active'
  AND (up.expires_at IS NULL OR up.expires_at > NOW())
GROUP BY p.id
ORDER BY active_plans DESC;
```

---

## 🔧 QUERIES DE MANUTENÇÃO

### 17. Limpar Orders Pendentes Antigos (> 7 dias)
**Objetivo**: Arquivar orders que nunca foram pagos.

```sql
-- Primeiro, visualize o que será afetado
SELECT 
  id,
  created_at,
  amount,
  gateway,
  payment_data->>'email' as email,
  NOW() - created_at as age
FROM orders
WHERE status = 'pending'
  AND created_at < NOW() - INTERVAL '7 days';

-- Se estiver tudo certo, atualize para 'failed'
-- UPDATE orders
-- SET status = 'failed'
-- WHERE status = 'pending'
--   AND created_at < NOW() - INTERVAL '7 days';
```

---

### 18. Identificar Duplicatas de Orders
**Objetivo**: Detectar possíveis duplicatas.

```sql
SELECT 
  abacatepay_id,
  hubla_transaction_id,
  payment_data->>'email' as email,
  COUNT(*) as duplicate_count,
  array_agg(id) as order_ids,
  array_agg(status) as statuses,
  array_agg(created_at) as created_ats
FROM orders
WHERE (abacatepay_id IS NOT NULL OR hubla_transaction_id IS NOT NULL)
GROUP BY abacatepay_id, hubla_transaction_id, payment_data->>'email'
HAVING COUNT(*) > 1;
```

---

## 📅 QUERY DE DASHBOARD EXECUTIVO

### 19. Dashboard Resumo (Últimos 30 dias)
**Objetivo**: Visão geral do sistema em uma query.

```sql
WITH metrics AS (
  SELECT 
    COUNT(DISTINCT p.id) as total_users,
    COUNT(DISTINCT p.id) FILTER (WHERE p.created_at >= NOW() - INTERVAL '30 days') as new_users_30d,
    SUM(p.credits) as total_credits_system,
    COUNT(DISTINCT o.id) as total_orders,
    COUNT(DISTINCT o.id) FILTER (WHERE o.status = 'completed') as completed_orders,
    SUM(o.amount) FILTER (WHERE o.status = 'completed') as total_revenue,
    COUNT(DISTINCT o.id) FILTER (WHERE o.created_at >= NOW() - INTERVAL '30 days') as orders_30d,
    SUM(o.amount) FILTER (WHERE o.status = 'completed' AND o.paid_at >= NOW() - INTERVAL '30 days') as revenue_30d,
    COUNT(DISTINCT pl.id) FILTER (WHERE pl.error_message IS NOT NULL AND pl.created_at >= NOW() - INTERVAL '24 hours') as webhook_errors_24h,
    COUNT(DISTINCT up.id) FILTER (WHERE up.status = 'active') as active_plans
  FROM profiles p
  FULL OUTER JOIN orders o ON o.user_id = p.id
  FULL OUTER JOIN payment_logs pl ON pl.order_id = o.id
  FULL OUTER JOIN user_plans up ON up.user_id = p.id
)
SELECT 
  total_users as "Total de Usuários",
  new_users_30d as "Novos Usuários (30d)",
  total_credits_system as "Créditos no Sistema",
  total_orders as "Total de Orders",
  completed_orders as "Orders Completados",
  ROUND(100.0 * completed_orders / NULLIF(total_orders, 0), 2) as "Taxa de Conversão (%)",
  total_revenue as "Receita Total (R$)",
  revenue_30d as "Receita 30d (R$)",
  orders_30d as "Orders 30d",
  webhook_errors_24h as "Erros Webhook (24h)",
  active_plans as "Planos Ativos"
FROM metrics;
```

---

## 🔔 Configurar Alertas Automáticos

Para receber alertas automáticos, configure estas queries como scheduled jobs no Supabase ou use ferramentas como:
- Supabase Edge Functions com cron
- GitHub Actions com cron schedule
- Ferramentas de monitoramento como Datadog, New Relic

**Exemplo de alerta crítico**:
```sql
-- Se retornar > 0, enviar alerta
SELECT COUNT(*) FROM profiles WHERE auth_user_id IS NULL;
SELECT COUNT(*) FROM orders WHERE status = 'pending' AND created_at < NOW() - INTERVAL '24 hours';
SELECT COUNT(*) FROM payment_logs WHERE created_at >= NOW() - INTERVAL '1 hour' AND error_message IS NOT NULL;
```

---

**Última atualização**: 2025-01-15
**Versão**: 1.0
