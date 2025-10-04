# Sistema de Pagamentos - Documentação Completa

## Visão Geral

O sistema de pagamentos suporta duas formas de pagamento:
1. **PIX via AbacatePay** - Para pagamentos instantâneos
2. **Cartão de Crédito via Hubla** - Para pagamentos parcelados

## Fluxo de Pagamento

### 1. Criação do Pagamento (`create-payment` Edge Function)

**Endpoint**: `/functions/v1/create-payment`

**Parâmetros**:
```typescript
{
  planId: string;
  customerData: {
    name: string;
    email: string;
    phone?: string;
    cpf?: string;
    password: string;
    paymentMethod?: 'PIX' | 'CARD' | 'BOLETO';
    installments?: number;
    isLoggedInPurchase?: boolean;
    userId?: string;
  };
}
```

**Fluxo**:
1. Verifica o plano selecionado
2. Determina o gateway baseado no método de pagamento
3. Para usuários logados: busca o perfil existente
4. Para novos usuários: NÃO cria perfil (será criado no webhook)
5. Cria registro na tabela `orders` com status `pending`
6. Retorna URL de pagamento

**AbacatePay (PIX)**:
- Cria customer na AbacatePay
- Cria billing com produto e webhook URL
- Retorna checkout URL

**Hubla (Cartão)**:
- Usa `hubla_checkout_url` pré-configurado no plano
- Gera ID único para tracking

### 2. Confirmação de Pagamento (Webhooks)

#### AbacatePay Webhook (`abacatepay-webhook`)

**Endpoint**: `/functions/v1/abacatepay-webhook`

**Segurança**:
- Valida secret via query param ou header
- Secret esperado: configurado em `ABACATEPAY_WEBHOOK_SECRET`

**Fluxo**:
1. Recebe notificação da AbacatePay
2. Valida status do pagamento (PAID, APPROVED)
3. Atualiza ordem com status `paid`
4. Se usuário novo:
   - Cria usuário no Supabase Auth
   - Cria perfil na tabela `profiles`
   - Adiciona créditos baseado no plano
5. Se usuário logado:
   - Adiciona créditos ao perfil existente
6. Registra log na tabela `payment_logs`

#### Hubla Webhook (`hubla-webhook`)

**Endpoint**: `/functions/v1/hubla-webhook`

**Segurança**:
- Valida token via header Authorization
- Token esperado: configurado em `HUBLA_WEBHOOK_TOKEN`

**Fluxo**: Idêntico ao AbacatePay webhook

## Estrutura do Banco de Dados

### Tabela `orders`
```sql
CREATE TABLE orders (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES profiles(id), -- NULLABLE
  plan_id UUID REFERENCES plans(id),
  abacatepay_id TEXT,
  hubla_transaction_id TEXT,
  amount NUMERIC NOT NULL,
  status TEXT DEFAULT 'pending',
  payment_method TEXT,
  payment_data JSONB DEFAULT '{}',
  gateway TEXT DEFAULT 'ABACATEPAY',
  paid_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);
```

**Observação**: `user_id` pode ser NULL para novos usuários (será preenchido no webhook)

### Tabela `payment_logs`
```sql
CREATE TABLE payment_logs (
  id UUID PRIMARY KEY,
  gateway TEXT NOT NULL,
  status_code INTEGER,
  request_body JSONB,
  response_body JSONB,
  error_message TEXT,
  user_id UUID REFERENCES profiles(id),
  order_id UUID REFERENCES orders(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);
```

### Tabela `plans`
```sql
CREATE TABLE plans (
  id UUID PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  price NUMERIC NOT NULL,
  pix_price NUMERIC,
  stripe_price NUMERIC,
  description TEXT,
  features JSONB DEFAULT '[]',
  is_active BOOLEAN DEFAULT true,
  card_gateway TEXT DEFAULT 'HUBLA',
  hubla_checkout_url TEXT, -- URL pré-configurada do checkout Hubla
  credits_granted INTEGER DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);
```

## Sistema de Créditos

### Funções RPC

#### `add_credits`
```sql
FUNCTION add_credits(
  _user_id UUID,
  _amount INTEGER,
  _type TEXT,
  _description TEXT DEFAULT NULL,
  _order_id UUID DEFAULT NULL
) RETURNS VOID
```

Adiciona créditos ao usuário e registra no histórico.

#### `use_credits`
```sql
FUNCTION use_credits(
  _user_id UUID,
  _amount INTEGER,
  _description TEXT DEFAULT NULL
) RETURNS BOOLEAN
```

Debita créditos do usuário. Retorna `false` se não houver créditos suficientes.

### Tabela `credits_history`
```sql
CREATE TABLE credits_history (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES profiles(id),
  amount INTEGER NOT NULL,
  type TEXT NOT NULL, -- 'purchase', 'usage', 'admin_grant', 'refund'
  description TEXT,
  order_id UUID REFERENCES orders(id),
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);
```

## Criação de Usuários pelo Admin

### Fluxo (`useUsers.createUser`)

1. Cria usuário no Supabase Auth com `email_confirm: true`
2. Aguarda 500ms para trigger criar perfil
3. Busca perfil criado pelo trigger
4. Atualiza perfil com dados adicionais (phone, role, company)
5. Adiciona créditos iniciais se fornecidos
6. Registra log de auditoria

**Observação**: O perfil é criado automaticamente pelo trigger `on_auth_user_created` da tabela `auth.users`.

## Segurança

### Row Level Security (RLS)

**Tabela `orders`**:
- INSERT: Sistema pode criar orders sem user_id (public users)
- SELECT: Usuários veem suas próprias orders + admins/devs veem tudo
- UPDATE: Sistema pode atualizar (webhooks)

**Tabela `payment_logs`**:
- INSERT: Sistema pode criar logs
- SELECT: Apenas admins/devs

**Tabela `credits_history`**:
- INSERT: Sistema pode criar registros
- SELECT: Usuários veem seu próprio histórico + admins/devs veem tudo

### Validações

1. **Webhooks**: Todos os webhooks validam secret/token antes de processar
2. **Edge Functions**: Erros são logados na tabela `payment_logs`
3. **Créditos**: Verificação antes de permitir criação de site

## Configuração

### Secrets Necessários

```bash
ABACATEPAY_API_KEY=seu_token_aqui
HUBLA_WEBHOOK_TOKEN=seu_token_aqui
SUPABASE_URL=https://seu-projeto.supabase.co
SUPABASE_SERVICE_ROLE_KEY=seu_service_role_key
```

### Configuração de Planos

Para cada plano no banco de dados:

1. **Para PIX (AbacatePay)**:
   - Preencher `pix_price` (preço em reais)
   
2. **Para Cartão (Hubla)**:
   - Criar oferta no dashboard da Hubla
   - Copiar URL do checkout
   - Preencher `hubla_checkout_url` no plano
   - Preencher `stripe_price` (preço parcelado)

3. **Créditos**:
   - Preencher `credits_granted` (quantidade de sites que o plano libera)

## Tratamento de Erros

### Edge Functions

Todos os erros são:
1. Logados no console
2. Registrados na tabela `payment_logs`
3. Retornados com mensagem amigável ao usuário

### Frontend

- Toast notifications para feedback
- Redirecionamento automático após pagamento
- Atualização de créditos em tempo real

## Monitoramento

### Logs de Pagamento

Para verificar logs de pagamento:

```sql
SELECT 
  gateway,
  status_code,
  error_message,
  created_at
FROM payment_logs
ORDER BY created_at DESC
LIMIT 100;
```

### Pedidos Pendentes

Para verificar pedidos pendentes:

```sql
SELECT 
  id,
  gateway,
  amount,
  status,
  created_at
FROM orders
WHERE status = 'pending'
  AND created_at > NOW() - INTERVAL '24 hours'
ORDER BY created_at DESC;
```

## Troubleshooting

### Pagamento não confirmado

1. Verificar logs na tabela `payment_logs`
2. Verificar se webhook está configurado corretamente no gateway
3. Verificar secrets das edge functions
4. Verificar status da ordem na tabela `orders`

### Créditos não atualizados

1. Verificar se plano tem `credits_granted > 0`
2. Verificar `credits_history` para ver se foi registrado
3. Verificar logs da edge function do webhook

### Erro ao criar usuário (Admin)

1. Verificar logs no console do navegador
2. Verificar se trigger `on_auth_user_created` existe
3. Verificar permissões RLS na tabela `profiles`
