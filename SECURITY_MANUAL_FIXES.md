# CORREÇÕES DE SEGURANÇA - INSTRUÇÕES MANUAIS

## Status Atual: ⚠️ 3 WARNINGS PENDENTES

Após as correções automatizadas via migrations, restam **3 warnings de segurança** que requerem ação manual:

---

## ✅ JÁ CORRIGIDO AUTOMATICAMENTE

### 1. Function Search Path Mutable (RESOLVIDO)

**Status**: ✅ **CORRIGIDO**

Todas as funções `SECURITY DEFINER` agora têm `SET search_path TO 'public'`:

- ✅ `use_user_plan` - Corrigido
- ✅ `get_available_user_plans` - Corrigido
- ✅ `notify_message_sent` - Corrigido
- ✅ `handle_new_user` - Corrigido
- ✅ `validate_user_plan_role` - Corrigido
- ✅ `add_credits` - Já estava correto
- ✅ `add_user_plan` - Já estava correto
- ✅ `admin_assign_plan_to_user` - Já estava correto
- ✅ `get_current_user_role` - Já estava correto
- ✅ `get_database_stats` - Já estava correto
- ✅ `get_system_metrics` - Já estava correto
- ✅ `is_admin_or_dev` - Já estava correto
- ✅ `link_user_transaction` - Já estava correto
- ✅ `use_credits` - Já estava correto

---

## ⚠️ PENDENTES - REQUEREM AÇÃO MANUAL

### 2. Security Definer View (FALSO POSITIVO - IGNORAR)

**Status**: ✅ **IDENTIFICADO - SEGURO**

**Descrição**: O linter detecta views com propriedade SECURITY DEFINER, mas após investigação, foram identificadas apenas views do **sistema Supabase**.

**Views identificadas**:

1. ✅ **`extensions.pg_stat_statements`** - View do PostgreSQL para estatísticas de queries
2. ✅ **`extensions.pg_stat_statements_info`** - View de informações do pg_stat_statements
3. ✅ **`vault.decrypted_secrets`** - View do Supabase Vault para gerenciar secrets

**Impacto**:
- ✅ **NENHUM** - São views gerenciadas pelo Supabase
- ✅ **SEGURAS** - Fazem parte da infraestrutura do sistema
- ✅ **NECESSÁRIAS** - Requeridas para funcionamento do Supabase

**Recomendação**:

⚠️ **NÃO MODIFICAR** essas views. Elas são gerenciadas automaticamente pelo Supabase e são essenciais para:
- Monitoramento de performance (pg_stat_statements)
- Gerenciamento de secrets (vault)
- Operações internas do Supabase

**Conclusão**:
Este warning é um **falso positivo**. O linter detecta essas views do sistema, mas elas são seguras e necessárias. Não requer nenhuma ação.

---

### 3. Leaked Password Protection Disabled (AÇÃO OBRIGATÓRIA)

**Status**: ❌ **PENDENTE - AÇÃO MANUAL NECESSÁRIA**

**Descrição**: Proteção contra senhas vazadas está desabilitada. Isso permite que usuários usem senhas que foram comprometidas em vazamentos de dados conhecidos.

**Impacto**:
- 🔴 **ALTO** - Usuários podem usar senhas inseguras
- 🔴 **RISCO** - Contas podem ser comprometidas facilmente

**Como habilitar**:

1. **Acesse o Supabase Dashboard**: 
   ```
   https://supabase.com/dashboard/project/jsttoajuszshrivmgnmc/auth/policies
   ```

2. **Navegue até**: Authentication → Policies

3. **Ative as seguintes opções**:

   - ✅ **Password Strength**
     - Minimum length: 8 caracteres (recomendado: 12)
     - Require uppercase letters
     - Require lowercase letters
     - Require numbers
     - Require special characters
   
   - ✅ **Leaked Password Protection**
     - Habilitar verificação contra base de senhas vazadas
     - Bloquear registro com senhas comprometidas
     - Forçar redefinição de senhas comprometidas em login

4. **Salvar alterações**

**Documentação oficial**:
https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection

**Após habilitar**:
- ✅ Senhas fracas serão rejeitadas
- ✅ Senhas vazadas serão bloqueadas
- ✅ Sistema fica mais seguro

---

### 4. Postgres Version Outdated (AÇÃO RECOMENDADA)

**Status**: ⚠️ **PENDENTE - AÇÃO MANUAL RECOMENDADA**

**Descrição**: Existem patches de segurança disponíveis para a versão atual do PostgreSQL.

**Impacto**:
- ⚠️ **MÉDIO** - Vulnerabilidades conhecidas podem não estar corrigidas
- ⚠️ **ESTABILIDADE** - Bugs corrigidos em versões mais recentes

**Como atualizar**:

1. **Acesse o Supabase Dashboard**:
   ```
   https://supabase.com/dashboard/project/jsttoajuszshrivmgnmc/settings/infrastructure
   ```

2. **Navegue até**: Settings → Infrastructure

3. **Localize** a seção "Postgres Version"

4. **Verifique** a versão atual e a versão disponível

5. **Agende o upgrade**:
   - ⚠️ **IMPORTANTE**: Faça backup antes do upgrade
   - ⚠️ **PLANEJE**: Escolha um horário de baixo tráfego
   - ⚠️ **TESTE**: Teste a aplicação após o upgrade

6. **Execute o upgrade** seguindo as instruções do Supabase

**Documentação oficial**:
https://supabase.com/docs/guides/platform/upgrading

**Recomendações**:

1. **Backup automático**: Verifique se backups automáticos estão habilitados
2. **Janela de manutenção**: Agende para horário de menor uso
3. **Teste imediato**: Após upgrade, teste funcionalidades críticas
4. **Plano de rollback**: Saiba como reverter se necessário

---

## 📊 RESUMO EXECUTIVO

### Status Geral de Segurança:

| Item | Status | Prioridade | Ação Requerida |
|------|--------|------------|----------------|
| Function Search Path | ✅ Corrigido | - | Nenhuma |
| Security Definer View | ✅ Falso Positivo | - | Nenhuma (views do sistema) |
| Password Protection | ❌ Pendente | **ALTA** | **Habilitar manualmente** |
| Postgres Upgrade | ⚠️ Recomendado | Média | Agendar upgrade |

---

## 🎯 PLANO DE AÇÃO IMEDIATO

### Prioridade 1 (HOJE): 

✅ **Habilitar Leaked Password Protection**
- Tempo estimado: 5 minutos
- Impacto: Alto
- Risco atual: Alto
- **AÇÃO**: Seguir instruções no item #3

### Prioridade 2 (ESTA SEMANA):

⚠️ **Planejar Upgrade do Postgres**
- Tempo estimado: 1 hora (planejamento + execução)
- Impacto: Médio
- **AÇÃO**: Agendar para horário de baixo tráfego

---

## 📝 CHECKLIST DE SEGURANÇA

Antes de ir para produção, verifique:

- [ ] **Leaked Password Protection habilitado**
- [ ] **Todos os warnings do linter verificados**
- [ ] **Postgres atualizado para versão mais recente**
- [ ] **RLS habilitado em todas as tabelas públicas**
- [ ] **Funções SECURITY DEFINER com search_path definido**
- [ ] **Backups automáticos configurados**
- [ ] **Rate limiting implementado** (opcional, mas recomendado)
- [ ] **SSL/HTTPS obrigatório**
- [ ] **Secrets rotacionados recentemente**
- [ ] **Logs de auditoria funcionando**

---

## 🔗 LINKS ÚTEIS

### Documentação Oficial:
- [Supabase Security](https://supabase.com/docs/guides/security)
- [Row Level Security](https://supabase.com/docs/guides/database/postgres/row-level-security)
- [Password Security](https://supabase.com/docs/guides/auth/password-security)
- [Database Linter](https://supabase.com/docs/guides/database/database-linter)
- [Platform Upgrading](https://supabase.com/docs/guides/platform/upgrading)

### Seu Projeto:
- [Security Linter](https://supabase.com/dashboard/project/jsttoajuszshrivmgnmc/settings/security)
- [Auth Policies](https://supabase.com/dashboard/project/jsttoajuszshrivmgnmc/auth/policies)
- [Infrastructure](https://supabase.com/dashboard/project/jsttoajuszshrivmgnmc/settings/infrastructure)
- [Database Health](https://supabase.com/dashboard/project/jsttoajuszshrivmgnmc/settings/database)

---

## ⏱️ TIMELINE SUGERIDA

**Hoje (Urgente)**:
- ✅ Habilitar Password Protection (5 min)

**Esta Semana**:
- 🔍 Re-executar linter após cache limpar (5 min)
- ⚠️ Investigar Security Definer View se persistir (15 min)

**Próximas 2 Semanas**:
- 📅 Agendar upgrade do Postgres
- 🧪 Preparar ambiente de teste
- 🚀 Executar upgrade em janela de manutenção

---

## 📞 SUPORTE

Se encontrar dificuldades:

1. **Documentação Supabase**: https://supabase.com/docs
2. **Community Discord**: https://discord.supabase.com
3. **GitHub Issues**: https://github.com/supabase/supabase/issues
4. **Stack Overflow**: Tag `supabase`

---

**Última atualização**: 27/10/2025
**Próxima revisão**: Após habilitar Password Protection e re-executar linter
