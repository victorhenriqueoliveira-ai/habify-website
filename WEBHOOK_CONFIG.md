# Configuração de Webhooks - Sistema Habify

## 📋 Resumo

Este documento detalha a configuração completa dos webhooks para processamento de pagamentos no sistema Habify.

---

## 🔗 URLs dos Webhooks

### AbacatePay (PIX)
```
https://jsttoajuszshrivmgnmc.supabase.co/functions/v1/abacatepay-webhook
```

### Hubla (Cartão de Crédito)
```
https://jsttoajuszshrivmgnmc.supabase.co/functions/v1/hubla-webhook
```

---

## 🔐 Secrets Necessários

### Supabase Secrets
Os seguintes secrets devem estar configurados no Supabase:

| Secret Name | Descrição | Usado Por |
|------------|-----------|-----------|
| `ABACATEPAY_API_KEY` | API Key do AbacatePay | abacatepay-webhook |
| `ABACATEPAY_WEBHOOK_SECRET` | Secret para validar webhooks AbacatePay | abacatepay-webhook |
| `HUBLA_WEBHOOK_TOKEN` | Token para validar webhooks Hubla | hubla-webhook |
| `RESEND_API_KEY` | API Key do Resend para envio de emails | send-payment-confirmation |
| `ADMIN_EMAIL` | Email do administrador para notificações | send-admin-notification |
| `SUPABASE_URL` | URL do projeto Supabase | Todos os webhooks |
| `SUPABASE_SERVICE_ROLE_KEY` | Service Role Key do Supabase | Todos os webhooks |

---

## ⚙️ Configuração no AbacatePay

### 1. Acessar Painel
- URL: https://abacatepay.com/dashboard
- Login com suas credenciais

### 2. Configurar Webhook
1. Navegue até **Configurações** → **Webhooks**
2. Clique em **Adicionar Webhook**
3. Preencha os campos:

**URL do Webhook:**
```
https://jsttoajuszshrivmgnmc.supabase.co/functions/v1/abacatepay-webhook
```

**Secret:**
- Use o valor configurado em `ABACATEPAY_WEBHOOK_SECRET`
- Para obter: `supabase secrets list` ou no painel Supabase

**Eventos a Monitorar:**
- ✅ `bill.paid` - PIX confirmado
- ✅ `bill.expired` - PIX expirado
- ✅ `bill.cancelled` - PIX cancelado
- ✅ `bill.refunded` - PIX estornado

### 3. Salvar e Testar
- Salve a configuração
- Use o botão "Testar Webhook" no painel
- Verifique os logs em: https://supabase.com/dashboard/project/jsttoajuszshrivmgnmc/functions/abacatepay-webhook/logs

---

## ⚙️ Configuração no Hubla

### 1. Acessar Painel
- URL: https://app.hubla.com.br/
- Login com suas credenciais

### 2. Configurar Webhook
1. Navegue até **Configurações** → **Webhooks** ou **Integrações**
2. Clique em **Adicionar Webhook**
3. Preencha os campos:

**URL do Webhook:**
```
https://jsttoajuszshrivmgnmc.supabase.co/functions/v1/hubla-webhook
```

**Token de Autenticação:**
- Use o valor configurado em `HUBLA_WEBHOOK_TOKEN`
- Para obter: `supabase secrets list` ou no painel Supabase

**Eventos a Monitorar:**
- ✅ `transaction.approved` - Pagamento aprovado
- ✅ `transaction.refunded` - Pagamento estornado
- ✅ `transaction.chargeback` - Chargeback
- ✅ `transaction.cancelled` - Pagamento cancelado

### 3. Salvar e Testar
- Salve a configuração
- Use o botão "Testar Webhook" no painel
- Verifique os logs em: https://supabase.com/dashboard/project/jsttoajuszshrivmgnmc/functions/hubla-webhook/logs

---

## 📊 Estrutura de Dados dos Webhooks

### AbacatePay Payload
```json
{
  "id": "bill_ABC123XYZ",
  "status": "PAID",
  "amount": 597.00,
  "customer": {
    "email": "cliente@exemplo.com",
    "name": "Nome do Cliente"
  },
  "metadata": {
    "plan_id": "uuid-do-plano",
    "user_email": "cliente@exemplo.com"
  },
  "created_at": "2024-01-01T10:00:00Z",
  "paid_at": "2024-01-01T10:05:00Z"
}
```

### Hubla Payload
```json
{
  "event": "transaction.approved",
  "transaction_id": "TXN123456",
  "status": "approved",
  "amount": 972.06,
  "customer_email": "cliente@exemplo.com",
  "customer_name": "Nome do Cliente",
  "product_id": "uuid-do-produto",
  "metadata": {
    "plan_id": "uuid-do-plano"
  },
  "approved_at": "2024-01-01T10:05:00Z"
}
```

---

## 🔄 Fluxo de Processamento

### 1. Recebimento do Webhook
```
Gateway (AbacatePay/Hubla)
    ↓
Edge Function (webhook)
    ↓
Validação de Secret/Token
    ↓
Busca Order no DB
```

### 2. Atualização do Order
```
Atualiza status do order
    ↓
Registra em payment_logs
    ↓
Se status = completed → Processar
```

### 3. Processamento de Pagamento Confirmado
```
Verificar se usuário existe
    ├─ SIM → Adicionar créditos
    │         ↓
    │     Adicionar plano (user_plans)
    │         ↓
    │     Enviar email confirmação
    │
    └─ NÃO → Criar usuário (auth.users)
              ↓
          Criar profile
              ↓
          Vincular order ao profile
              ↓
          Adicionar créditos
              ↓
          Adicionar plano
              ↓
          Enviar email boas-vindas
```

### 4. Notificações
```
Enviar email ao cliente
    ↓
Enviar notificação ao admin
    ↓
Retornar 200 OK ao gateway
```

---

## 🧪 Testando Webhooks

### Teste Manual via cURL

**AbacatePay:**
```bash
curl -X POST \
  https://jsttoajuszshrivmgnmc.supabase.co/functions/v1/abacatepay-webhook \
  -H "Content-Type: application/json" \
  -H "webhook-secret: SEU_WEBHOOK_SECRET" \
  -d '{
    "id": "test_bill_123",
    "status": "PAID",
    "amount": 597.00,
    "customer": {
      "email": "teste@exemplo.com",
      "name": "Usuario Teste"
    }
  }'
```

**Hubla:**
```bash
curl -X POST \
  https://jsttoajuszshrivmgnmc.supabase.co/functions/v1/hubla-webhook \
  -H "Content-Type: application/json" \
  -H "hubla-webhook-token: SEU_HUBLA_TOKEN" \
  -d '{
    "event": "transaction.approved",
    "transaction_id": "test_txn_123",
    "status": "approved",
    "amount": 972.06,
    "customer_email": "teste@exemplo.com",
    "customer_name": "Usuario Teste"
  }'
```

---

## 📝 Logs e Monitoramento

### Acessar Logs
- **AbacatePay**: https://supabase.com/dashboard/project/jsttoajuszshrivmgnmc/functions/abacatepay-webhook/logs
- **Hubla**: https://supabase.com/dashboard/project/jsttoajuszshrivmgnmc/functions/hubla-webhook/logs

### O que Monitorar
- ✅ Requisições recebidas
- ✅ Erros de validação de secret/token
- ✅ Falhas ao criar usuário
- ✅ Falhas ao adicionar créditos
- ✅ Falhas ao enviar emails
- ✅ Orders não encontrados
- ✅ Tempo de processamento

### Consultas SQL para Monitoramento
Ver arquivo `MONITORING_QUERIES.md` para queries detalhadas.

---

## 🚨 Problemas Comuns

### Webhook não está sendo chamado
1. Verificar se a URL está correta nos painéis
2. Verificar se os eventos estão habilitados
3. Verificar se o gateway tem permissão para acessar a URL

### Erro 401 - Unauthorized
1. Verificar se o secret/token está correto
2. Verificar se o header está sendo enviado corretamente
3. Verificar se o secret no Supabase está atualizado

### Order não encontrado
1. Verificar se o order foi criado antes do webhook
2. Verificar se o ID do bill/transaction está correto
3. Verificar se o email do cliente está correto

### Usuário não criado
1. Verificar logs da edge function
2. Verificar se o email é válido
3. Verificar se não há usuário duplicado
4. Verificar se o trigger `handle_new_user` está ativo

### Créditos não adicionados
1. Verificar se o plano tem `credits_granted` configurado
2. Verificar se a função `add_credits` foi chamada com sucesso
3. Verificar logs em `credits_history`

---

## 📞 Suporte

Para problemas ou dúvidas:
1. Consulte `WEBHOOK_TROUBLESHOOTING.md`
2. Verifique os logs das edge functions
3. Execute queries de monitoramento em `MONITORING_QUERIES.md`
4. Entre em contato com o time de dev

---

**Última atualização**: 2025-01-15
**Versão**: 1.0
