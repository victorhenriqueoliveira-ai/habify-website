# FASE 1 - AÇÕES MANUAIS (1.3 e 1.4)

## ✅ Status: Ações 1.1 e 1.2 CONCLUÍDAS
- ✅ Profiles existentes migrados (auth_user_id vinculado)
- ✅ Trigger handle_new_user corrigido
- ✅ Login desbloqueado para todos os usuários
- ✅ Novos usuários serão criados corretamente

---

## 🔧 AÇÃO 1.3: Processar Order Pendente

### Order ID: `bill_6NxmEgTAW2cQkYqpXk3h6wcT`
- **Valor**: R$ 597,00 (PIX)
- **Email**: `comercial@minashouse.com.br`
- **Status atual**: `pending`
- **Gateway**: AbacatePay

### Passos:

1. **Verificar no painel AbacatePay**:
   - Acesse: https://abacatepay.com/dashboard
   - Busque pelo ID: `bill_6NxmEgTAW2cQkYqpXk3h6wcT`
   - Verifique se o status é "PAID" (pago)

2. **Se estiver PAGO, simular webhook**:
```bash
curl -X POST \
  https://jsttoajuszshrivmgnmc.supabase.co/functions/v1/abacatepay-webhook \
  -H "Content-Type: application/json" \
  -H "webhook-secret: SEU_WEBHOOK_SECRET" \
  -d '{
    "id": "bill_6NxmEgTAW2cQkYqpXk3h6wcT",
    "status": "PAID",
    "amount": 597.00,
    "customer": {
      "email": "comercial@minashouse.com.br",
      "name": "Minas House"
    }
  }'
```

3. **Verificar processamento**:
   - Confira se o usuário foi criado
   - Confira se os créditos foram adicionados (1 crédito para plano básico)
   - Confira se o email de confirmação foi enviado

---

## 🌐 AÇÃO 1.4: Configurar Webhooks nos Gateways

### A) Webhook AbacatePay (PIX)

1. **Acesse o painel**: https://abacatepay.com/dashboard
2. **Navegue até**: Configurações → Webhooks
3. **Adicione novo webhook**:
   - **URL**: `https://jsttoajuszshrivmgnmc.supabase.co/functions/v1/abacatepay-webhook`
   - **Secret**: (use o valor do secret `ABACATEPAY_WEBHOOK_SECRET` no Supabase)
   - **Eventos**:
     - ✅ `bill.paid` (PIX confirmado)
     - ✅ `bill.expired` (PIX expirado)
     - ✅ `bill.cancelled` (PIX cancelado)
4. **Salve a configuração**

### B) Webhook Hubla (Cartão)

1. **Acesse o painel**: https://app.hubla.com.br/
2. **Navegue até**: Configurações → Webhooks / Integrações
3. **Adicione novo webhook**:
   - **URL**: `https://jsttoajuszshrivmgnmc.supabase.co/functions/v1/hubla-webhook`
   - **Token**: (use o valor do secret `HUBLA_WEBHOOK_TOKEN` no Supabase)
   - **Eventos**:
     - ✅ `transaction.approved` (Pagamento aprovado)
     - ✅ `transaction.refunded` (Pagamento estornado)
     - ✅ `transaction.chargeback` (Chargeback)
4. **Salve a configuração**

---

## 🧪 Testar Webhooks

### Teste AbacatePay (PIX):
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
      "email": "teste@teste.com",
      "name": "Usuario Teste"
    }
  }'
```

### Teste Hubla (Cartão):
```bash
curl -X POST \
  https://jsttoajuszshrivmgnmc.supabase.co/functions/v1/hubla-webhook \
  -H "Content-Type: application/json" \
  -H "hubla-webhook-token: SEU_HUBLA_TOKEN" \
  -d '{
    "event": "transaction.approved",
    "transaction_id": "test_txn_123",
    "status": "approved",
    "customer_email": "teste@teste.com",
    "amount": 972.06
  }'
```

---

## ✅ Verificação Final

Após configurar os webhooks, teste o fluxo completo:

1. **Teste PIX** (novo usuário):
   - Escolha um plano com PIX
   - Complete o pagamento no sandbox/teste
   - Verifique se recebeu email de confirmação
   - Faça login e veja os créditos

2. **Teste Cartão** (usuário existente):
   - Faça login
   - Compre mais créditos com cartão
   - Verifique se os créditos foram somados

---

## 📊 Monitoramento

Acompanhe os logs das edge functions:
- **AbacatePay**: https://supabase.com/dashboard/project/jsttoajuszshrivmgnmc/functions/abacatepay-webhook/logs
- **Hubla**: https://supabase.com/dashboard/project/jsttoajuszshrivmgnmc/functions/hubla-webhook/logs

---

## 🚨 Próximos Passos

Após completar as Ações 1.3 e 1.4:
- ✅ Sistema estará 100% funcional para pagamentos
- 🔄 Avançar para FASE 2 (Testes E2E)
- 🔐 Avançar para FASE 3 (Segurança - migrar roles)
