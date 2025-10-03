# Sistema de Créditos - Habify

## Visão Geral

O sistema de créditos permite que usuários comprem planos que concedem créditos para criar sites. Cada site criado consome 1 crédito.

## Configuração dos Planos

Cada plano na tabela `plans` deve ter:
- `credits_granted`: Número de créditos que o plano concede (padrão: 1)

### Exemplo de Configuração

```sql
-- Atualizar planos existentes para conceder créditos
UPDATE plans 
SET credits_granted = 1 
WHERE type = 'website_only';

UPDATE plans 
SET credits_granted = 2 
WHERE type = 'website_maintenance_1m';

UPDATE plans 
SET credits_granted = 5 
WHERE type = 'website_maintenance_6m';
```

## Como Funciona

### 1. Compra de Créditos (Novos Usuários)

1. Usuário escolhe um plano e paga via PIX (AbacatePay) ou Cartão (Hubla)
2. Webhook confirma pagamento
3. Sistema cria usuário automaticamente
4. Créditos são adicionados ao perfil do usuário
5. Usuário recebe email de confirmação (se configurado)

### 2. Compra de Créditos (Usuários Existentes)

1. Usuário logado acessa `/admin/new-project-purchase`
2. Escolhe plano e forma de pagamento
3. Webhook confirma pagamento
4. Créditos são adicionados ao perfil existente
5. Usuário pode criar sites imediatamente

### 3. Uso de Créditos

1. Usuário inicia criação de site no wizard
2. Sistema verifica se tem créditos suficientes (mínimo 1)
3. Se não tiver créditos, mostra mensagem com botão para comprar
4. Após criar site com sucesso, 1 crédito é debitado automaticamente
5. Créditos atualizados são exibidos no topbar

### 4. Administração de Créditos

Admins podem conceder créditos manualmente ao criar usuários em `/admin/users/new`:
- Campo "Créditos Iniciais" permite definir quantidade
- Útil para usuários VIP, parcerias, ou permuta
- Registro automático no histórico de créditos

## Tabelas do Sistema

### `profiles.credits`
- Armazena saldo atual de créditos do usuário
- Atualizado automaticamente por triggers e funções

### `credits_history`
- Registra todas as transações de créditos
- Tipos: 'purchase', 'usage', 'admin_grant', 'refund'
- Vinculado a orders quando aplicável

## Funções Disponíveis

### `add_credits(_user_id, _amount, _type, _description, _order_id)`
Adiciona créditos ao usuário e registra no histórico.

```sql
SELECT add_credits(
  '123e4567-e89b-12d3-a456-426614174000'::uuid,
  5,
  'purchase',
  'Compra de plano Premium',
  'order-id-here'::uuid
);
```

### `use_credits(_user_id, _amount, _description)`
Usa créditos do usuário e registra no histórico. Retorna `false` se não houver créditos suficientes.

```sql
SELECT use_credits(
  '123e4567-e89b-12d3-a456-426614174000'::uuid,
  1,
  'Criação de site'
);
```

## Fluxo de Pagamento Integrado

### AbacatePay (PIX)
1. Edge function `create-payment` cria order pendente
2. Usuário paga via PIX
3. Webhook `abacatepay-webhook` confirma pagamento
4. Cria usuário (se novo) e adiciona créditos
5. Redireciona para `/payment-success`

### Hubla (Cartão)
1. Edge function `create-payment` redireciona para Hubla checkout
2. Usuário paga via cartão
3. Webhook `hubla-webhook` confirma pagamento
4. Cria usuário (se novo) e adiciona créditos
5. Redireciona para `/payment-success`

## Monitoramento

### Consultar Créditos de um Usuário
```sql
SELECT p.name, p.email, p.credits
FROM profiles p
WHERE p.id = 'user-id-here';
```

### Consultar Histórico de Créditos
```sql
SELECT ch.*, p.name, p.email
FROM credits_history ch
JOIN profiles p ON p.id = ch.user_id
WHERE ch.user_id = 'user-id-here'
ORDER BY ch.created_at DESC;
```

### Usuários com Poucos Créditos
```sql
SELECT name, email, credits
FROM profiles
WHERE credits < 2
  AND role = 'user'
ORDER BY credits ASC;
```

## Segurança

- RLS policies garantem que usuários só vejam seus próprios créditos
- Funções usam `SECURITY DEFINER` para operações seguras
- Histórico é imutável (apenas INSERT permitido)
- Admins podem ver e gerenciar todos os créditos

## Troubleshooting

### Créditos não foram adicionados após pagamento
1. Verificar logs do webhook relevante (abacatepay ou hubla)
2. Confirmar que order foi atualizado para status 'paid'
3. Verificar se plano tem `credits_granted` configurado
4. Checar se função `add_credits` foi executada nos logs

### Usuário criou site mas crédito não foi debitado
1. Verificar logs da função `use_credits`
2. Confirmar se projeto foi criado com sucesso
3. Verificar histórico de créditos do usuário

### Créditos negativos
Não é possível ter créditos negativos. A função `use_credits` retorna false se não houver créditos suficientes.
