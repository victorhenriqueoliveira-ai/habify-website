# Configuração da Integração com Hubla

## Visão Geral

O sistema agora está configurado para aceitar pagamentos via:
- **PIX**: AbacatePay (à vista)
- **Cartão de Crédito**: Hubla (com parcelamento em até 12x)

## Valores dos Planos Atualizados

### Plano 1 - Só o Site
- PIX (AbacatePay): **R$ 597,00** à vista
- Cartão (Hubla): **R$ 972,06** total - **12x de R$ 81,01**

### Plano 2 - Site + Manutenção 1 Mês
- PIX (AbacatePay): **R$ 897,00** à vista
- Cartão (Hubla): **R$ 1.341,44** total - **12x de R$ 111,79**

### Plano 3 - Site + Manutenção 6 Meses
- PIX (AbacatePay): **R$ 1.597,00** à vista
- Cartão (Hubla): **R$ 1.955,84** total - **12x de R$ 199,02**

## Passos para Configurar a Hubla

### 1. Criar Produtos e Ofertas na Hubla

Acesse sua conta na [Hubla](https://app.hub.la) e crie 3 ofertas (uma para cada plano):

#### Oferta 1 - Só o Site
- **Nome**: Só o Site
- **Preço**: R$ 972,06
- **Parcelamento**: Habilitar até 12x (R$ 81,01 por parcela)
- **Método de Pagamento**: Cartão de Crédito
- **Cupons**: Ativar suporte a cupons de desconto

#### Oferta 2 - Site + Manutenção 1 Mês  
- **Nome**: Site + Manutenção 1 Mês
- **Preço**: R$ 1.341,44
- **Parcelamento**: Habilitar até 12x (R$ 111,79 por parcela)
- **Método de Pagamento**: Cartão de Crédito
- **Cupons**: Ativar suporte a cupons de desconto

#### Oferta 3 - Site + Manutenção 6 Meses
- **Nome**: Site + Manutenção 6 Meses
- **Preço**: R$ 1.955,84
- **Parcelamento**: Habilitar até 12x (R$ 199,02 por parcela)
- **Método de Pagamento**: Cartão de Crédito
- **Cupons**: Ativar suporte a cupons de desconto

### 2. Copiar Links de Checkout

Após criar cada oferta, copie o **link de checkout** que a Hubla gera.

### 3. Configurar Webhook na Hubla

1. Acesse **Integrações** > **Webhooks** na Hubla
2. Clique em **Ativar Integração**
3. Copie o **Token de Autenticação** gerado (você já adicionou via Lovable)
4. Clique em **Adicionar Regra** e configure:
   - **Nome**: Habify Webhook
   - **URL**: `https://jsttoajuszshrivmgnmc.supabase.co/functions/v1/hubla-webhook`
   - **Produtos/Ofertas**: Selecione as 3 ofertas criadas
   - **Eventos**: Marque os seguintes:
     - ✅ Fatura Paga (invoice.paid)
     - ✅ Acesso Concedido (member.access_granted)
     - ✅ Assinatura Ativada (subscription.activated)

### 4. Atualizar Links no Banco de Dados

Acesse seu banco de dados Supabase e execute o seguinte SQL na tabela `plans`:

```sql
-- Atualizar Plano 1 (Só o Site)
UPDATE plans 
SET hubla_checkout_url = 'COLE_AQUI_O_LINK_DA_OFERTA_1'
WHERE type = 'website_only';

-- Atualizar Plano 2 (Site + Manutenção 1 Mês)
UPDATE plans 
SET hubla_checkout_url = 'COLE_AQUI_O_LINK_DA_OFERTA_2'
WHERE type = 'website_maintenance_1m';

-- Atualizar Plano 3 (Site + Manutenção 6 Meses)
UPDATE plans 
SET hubla_checkout_url = 'COLE_AQUI_O_LINK_DA_OFERTA_3'
WHERE type = 'website_maintenance_6m';
```

Substitua `COLE_AQUI_O_LINK_DA_OFERTA_X` pelos links reais copiados da Hubla.

## Fluxo de Pagamento Atualizado

### Novo Comportamento
- ✅ **Usuário NÃO é criado** até que o pagamento seja confirmado
- ✅ Quando o usuário inicia o checkout, apenas um **perfil inativo** é criado
- ✅ Quando o **webhook da Hubla ou AbacatePay** confirma o pagamento:
  1. O usuário é criado no Supabase Auth
  2. O perfil é ativado
  3. O login fica disponível

### Vantagens
- ✅ Sem contas "travadas" de pagamentos não concluídos
- ✅ Login só disponível após pagamento confirmado
- ✅ Sincronização automática entre gateway e sistema

## Teste do Fluxo

### Teste com PIX (AbacatePay)
1. Acesse o site e escolha um plano
2. Selecione **PIX** como método de pagamento
3. Preencha os dados
4. Você será redirecionado para AbacatePay
5. Após pagar, o webhook criará sua conta automaticamente

### Teste com Cartão (Hubla)
1. Acesse o site e escolha um plano
2. Selecione **Cartão de Crédito** como método de pagamento
3. Preencha os dados
4. Você será redirecionado para o checkout da Hubla
5. Escolha o número de parcelas (até 12x)
6. Após pagar, o webhook criará sua conta automaticamente

## Monitoramento

### Logs do Webhook
- **Hubla**: https://supabase.com/dashboard/project/jsttoajuszshrivmgnmc/functions/hubla-webhook/logs
- **AbacatePay**: https://supabase.com/dashboard/project/jsttoajuszshrivmgnmc/functions/abacatepay-webhook/logs

### Verificar Pedidos
Consulte a tabela `orders` no Supabase para ver todos os pedidos:
```sql
SELECT * FROM orders ORDER BY created_at DESC;
```

## Segurança Configurada

✅ **Webhook Token**: Validação via `HUBLA_WEBHOOK_TOKEN`  
✅ **AbacatePay**: Validação via secret `VictorOliveira@123`  
✅ **RLS Policies**: Usuários só veem seus próprios dados  
✅ **Perfis Inativos**: Não podem fazer login até pagamento confirmado  

## Suporte

Se tiver problemas:
1. Verifique os logs das edge functions
2. Confirme que os links da Hubla estão corretos na tabela `plans`
3. Teste o webhook usando o teste de eventos na Hubla
4. Verifique se o token do webhook está correto

---

**Importante**: Após configurar os links da Hubla no banco de dados, o sistema estará 100% funcional! 🚀
