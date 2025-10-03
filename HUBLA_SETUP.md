# Configuração Hubla - Sistema de Créditos

## 1. Criar Ofertas no Hubla

Acesse sua conta Hubla e crie uma oferta para cada plano:

### Plano 1 - Site Básico
- Preço no cartão: R$ 972,06 (PIX: R$ 597)
- Parcelamento: até 12x de R$ 81,01
- **Créditos concedidos: 1**

### Plano 2 - Site + 1 Mês
- Preço no cartão: R$ 1.341,44 (PIX: R$ 897)
- Parcelamento: até 12x de R$ 111,79
- **Créditos concedidos: 2**

### Plano 3 - Site + 6 Meses
- Preço no cartão: R$ 1.955,84 (PIX: R$ 1.597)
- Parcelamento: até 12x de R$ 199,02
- **Créditos concedidos: 5**

## 2. Configurar Webhook

URL: `https://jsttoajuszshrivmgnmc.supabase.co/functions/v1/hubla-webhook`
Token: Use o secret `HUBLA_WEBHOOK_TOKEN`

## 3. Atualizar Banco de Dados

```sql
-- Configurar URLs e créditos
UPDATE plans SET hubla_checkout_url = 'SEU_LINK_1', credits_granted = 1 WHERE type = 'website_only';
UPDATE plans SET hubla_checkout_url = 'SEU_LINK_2', credits_granted = 2 WHERE type = 'website_maintenance_1m';
UPDATE plans SET hubla_checkout_url = 'SEU_LINK_3', credits_granted = 5 WHERE type = 'website_maintenance_6m';
```

## Fluxo Completo

1. **Usuário escolhe plano** → paga via Hubla/AbacatePay
2. **Webhook confirma** → cria usuário (se novo) + adiciona créditos
3. **Usuário acessa painel** → vê créditos disponíveis
4. **Cria site** → 1 crédito é debitado automaticamente

Consulte `CREDITS_SYSTEM.md` para detalhes completos do sistema de créditos.
