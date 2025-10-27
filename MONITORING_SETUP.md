# Sistema de Monitoramento e Testes - Implementado ✅

## Fase 2 - Item 11: Testes e Monitoramento

### ✅ Implementado

#### 1. **Health Check Endpoint**

**Endpoint:** `supabase/functions/health-check`

Verifica o status do sistema e suas dependências:

```bash
# Chamar health check
curl https://jsttoajuszshrivmgnmc.supabase.co/functions/v1/health-check
```

**Retorna:**
```json
{
  "status": "healthy",
  "timestamp": "2025-01-15T10:30:00.000Z",
  "uptime": 123,
  "checks": {
    "database": {
      "status": "healthy",
      "responseTime": 45
    },
    "environment": {
      "status": "healthy",
      "missing": []
    }
  },
  "version": "1.0.0"
}
```

**Uso recomendado:**
- Configure um serviço como UptimeRobot ou Pingdom para chamar este endpoint a cada 5 minutos
- Configure alertas para quando o status for "unhealthy"
- Use em pipelines de CI/CD para verificar deploy

#### 2. **Error Tracking System**

**Hook:** `useErrorTracking()`

Captura automaticamente:
- Erros não tratados (`window.onerror`)
- Promises rejeitadas não tratadas (`unhandledrejection`)
- Erros manuais via `trackError()`

**Recursos:**
- ✅ Log estruturado no console
- ✅ Armazenamento em `audit_logs` table
- ✅ Captura de stack trace em desenvolvimento
- ✅ Integração pronta para Sentry/LogRocket (placeholder)

**Uso:**

```typescript
import { useErrorTracking } from '@/hooks/useErrorTracking';

function MyComponent() {
  const { trackError } = useErrorTracking();

  const handleAction = async () => {
    try {
      await someRiskyOperation();
    } catch (error) {
      trackError(error as Error, 'manual', 'high');
    }
  };

  return <button onClick={handleAction}>Action</button>;
}
```

**Para adicionar Sentry:**

1. Instale: `npm install @sentry/react`
2. Configure no `main.tsx`:
```typescript
import * as Sentry from "@sentry/react";

Sentry.init({
  dsn: "YOUR_SENTRY_DSN",
  environment: import.meta.env.MODE,
});
```

3. No `useErrorTracking.ts`, descomente o código de integração

#### 3. **Analytics System**

**Hook:** `useAnalytics()`

Track de eventos do usuário:

```typescript
import { useAnalytics } from '@/hooks/useAnalytics';

function CheckoutPage() {
  const { trackPayment, trackConversion } = useAnalytics();

  const handlePayment = async () => {
    trackPayment('payment_initiated', amount);
    
    try {
      await processPayment();
      trackPayment('payment_success', amount);
      trackConversion('purchase', amount);
    } catch (error) {
      trackPayment('payment_failed', amount);
    }
  };
}
```

**Eventos disponíveis:**
- `trackPageView(path, title)` - Navegação
- `trackUserAction(action, metadata)` - Ações do usuário
- `trackFormSubmission(name, success)` - Submissões de formulários
- `trackPayment(action, amount)` - Eventos de pagamento
- `trackProject(action, projectId)` - Eventos de projetos
- `trackConversion(type, value)` - Conversões
- `trackFeatureUsage(feature, metadata)` - Uso de features

**Dados armazenados em:**
- `audit_logs` table (para análise interna)
- Console (desenvolvimento)
- Placeholder para Google Analytics/Plausible (produção)

**Para adicionar Google Analytics:**

1. Adicione o script no `index.html`:
```html
<script async src="https://www.googletagmanager.com/gtag/js?id=GA_MEASUREMENT_ID"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'GA_MEASUREMENT_ID');
</script>
```

2. No `useAnalytics.ts`, descomente as linhas do gtag

#### 4. **Structured Logging**

**Utility:** `logger` from `@/lib/logger`

Sistema de logging estruturado com níveis:

```typescript
import { logger } from '@/lib/logger';

// Diferentes níveis
logger.debug('Debug info', { userId: '123' });
logger.info('User logged in', { userId: '123' });
logger.warn('Slow operation', { operation: 'fetchUsers', duration: 1500 });
logger.error('API failed', { endpoint: '/api/users' }, error);

// Métodos de conveniência
logger.apiError('/api/payment', error, { userId: '123' });
logger.userAction('clicked_button', { buttonId: 'checkout' });
logger.performanceWarning('loadProjects', 2000, { count: 50 });

// Medição de performance
const result = await measurePerformance(
  'fetchProjects',
  async () => await supabase.from('projects').select(),
  { userId: '123' }
);
```

**Formato de log:**
```json
{
  "level": "error",
  "message": "API Error: /api/payment",
  "timestamp": "2025-01-15T10:30:00.000Z",
  "environment": "production",
  "context": {
    "userId": "123",
    "endpoint": "/api/payment",
    "action": "api_call"
  },
  "error": {
    "message": "Network error",
    "code": "NETWORK_ERROR"
  }
}
```

---

## 📊 Queries de Análise

### Erros mais comuns (últimas 24h)

```sql
SELECT 
  details->>'error_message' as error,
  COUNT(*) as occurrences,
  MAX(created_at) as last_seen
FROM audit_logs
WHERE action = 'error_occurred'
  AND created_at > NOW() - INTERVAL '24 hours'
GROUP BY details->>'error_message'
ORDER BY occurrences DESC
LIMIT 10;
```

### Eventos mais rastreados (últimas 7 dias)

```sql
SELECT 
  details->>'action' as action,
  details->>'category' as category,
  COUNT(*) as count
FROM audit_logs
WHERE action LIKE 'analytics_%'
  AND created_at > NOW() - INTERVAL '7 days'
GROUP BY details->>'action', details->>'category'
ORDER BY count DESC
LIMIT 20;
```

### Conversões por dia

```sql
SELECT 
  DATE(created_at) as date,
  COUNT(*) as conversions,
  SUM((details->>'value')::numeric) as total_value
FROM audit_logs
WHERE action = 'analytics_user_action'
  AND details->>'action' = 'conversion'
GROUP BY DATE(created_at)
ORDER BY date DESC
LIMIT 30;
```

---

## 🧪 Testes (Para Implementação Futura)

### Estrutura Recomendada

```
tests/
├── unit/              # Testes unitários
│   ├── hooks/
│   │   ├── useProjects.test.ts
│   │   ├── useUserPlans.test.ts
│   │   └── usePayments.test.ts
│   └── lib/
│       ├── logger.test.ts
│       └── validations.test.ts
├── integration/       # Testes de integração
│   ├── payment-flow.test.ts
│   ├── project-creation.test.ts
│   └── user-registration.test.ts
└── e2e/              # Testes E2E
    ├── user-journey.spec.ts
    ├── admin-workflow.spec.ts
    └── payment-flow.spec.ts
```

### Ferramentas Recomendadas

**Unit & Integration:**
- Vitest (mais rápido que Jest)
- @testing-library/react
- @testing-library/user-event

**E2E:**
- Playwright (recomendado)
- Cypress (alternativa)

**Setup básico:**

```bash
npm install -D vitest @testing-library/react @testing-library/jest-dom
npm install -D @vitest/ui
npm install -D playwright @playwright/test
```

**vitest.config.ts:**
```typescript
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: './tests/setup.ts',
  },
});
```

---

## 🔔 Alertas Recomendados

### 1. Error Rate Alert
Configure alerta quando taxa de erro > 5% em 5 minutos:

```sql
-- Query para monitorar
SELECT 
  COUNT(*) as error_count
FROM audit_logs
WHERE action = 'error_occurred'
  AND created_at > NOW() - INTERVAL '5 minutes';
```

### 2. Health Check Alert
Configure alerta quando health check falha 3 vezes consecutivas

### 3. Payment Failure Alert
Configure alerta imediato para falhas de pagamento:

```sql
SELECT 
  details->>'error_message' as error,
  user_id,
  created_at
FROM audit_logs
WHERE action = 'analytics_payment'
  AND details->>'action' = 'payment_failed'
  AND created_at > NOW() - INTERVAL '1 hour';
```

---

## 📈 Métricas Recomendadas para Monitorar

### Performance
- ✅ Response time médio das queries
- ✅ Tempo de carregamento de páginas
- ✅ Uptime do sistema

### Negócio
- ✅ Taxa de conversão
- ✅ Abandono de carrinho
- ✅ Projetos criados por dia
- ✅ Revenue por gateway de pagamento

### Técnicas
- ✅ Taxa de erro por endpoint
- ✅ Latência do banco de dados
- ✅ Uso de créditos
- ✅ Rejeições de pagamento

---

## 🎯 Próximos Passos

### Curto Prazo (1-2 semanas)
- [ ] Integrar com Sentry para error tracking
- [ ] Adicionar Google Analytics ou Plausible
- [ ] Configurar UptimeRobot para health checks
- [ ] Criar dashboard de analytics no Supabase

### Médio Prazo (1 mês)
- [ ] Implementar testes unitários para hooks críticos
- [ ] Adicionar testes de integração para fluxos de pagamento
- [ ] Configurar alertas automáticos
- [ ] Criar relatórios semanais automáticos

### Longo Prazo (2-3 meses)
- [ ] Implementar testes E2E com Playwright
- [ ] Adicionar performance monitoring (Web Vitals)
- [ ] Criar sistema de feature flags
- [ ] Implementar A/B testing

---

## 🔧 Integração com Serviços Externos

### Sentry (Error Tracking)
- **Free tier:** 5,000 eventos/mês
- **Preço:** $26/mês para 50k eventos
- **Setup:** 10 minutos

### Plausible (Analytics)
- **Privacy-friendly**, sem cookies
- **Preço:** $9/mês para 10k pageviews
- **Setup:** 5 minutos

### UptimeRobot (Monitoring)
- **Free tier:** 50 monitores
- **Checks:** A cada 5 minutos
- **Setup:** 2 minutos

### LogRocket (Session Replay)
- **Free tier:** 1,000 sessões/mês
- **Preço:** $99/mês para 10k sessões
- **Setup:** 15 minutos
