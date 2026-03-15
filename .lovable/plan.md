

## Plano: Tela de Notificações Dedicada

### O que será feito

Criar uma página completa de notificações (`/admin/notifications`) acessível por todos os usuários logados, com listagem completa, filtros, ações em lote e navegação contextual. Também adicionar um link "Ver todas" no dropdown de notificações existente no topbar e um item no sidebar.

### Estrutura

1. **Nova página `src/pages/admin/NotificationsPage.tsx`**
   - Lista completa de notificações com scroll infinito (todas, não apenas 5)
   - Filtros: Todas / Não lidas / Por tipo (info, success, warning, error)
   - Botão "Marcar todas como lidas"
   - Cada notificação: ícone por tipo, título, mensagem, data formatada, indicador de não lida
   - Clique na notificação: marca como lida + navega para o contexto (chat do projeto, solicitação de manutenção, etc.) usando a mesma lógica do `NotificationBell.tsx`
   - Botão de deletar notificação individual
   - Estado vazio com ilustração quando não há notificações
   - Realtime subscription para atualizar automaticamente

2. **Atualizar `src/components/admin/AdminSidebar.tsx`**
   - Adicionar item "Notificações" com ícone `Bell` e badge de contagem de não lidas
   - Visível para todas as roles: `['user', 'admin', 'dev', 'corretor']`

3. **Atualizar `src/components/admin/AdminTopbar.tsx`**
   - Adicionar link "Ver todas" no dropdown de notificações apontando para `/admin/notifications`

4. **Atualizar `src/App.tsx`**
   - Adicionar rota `/admin/notifications` acessível para todas as roles

5. **Atualizar `src/hooks/useNotifications.ts`**
   - Adicionar função `deleteNotification` para remover notificações individuais

6. **Migração SQL**
   - Adicionar RLS policy para DELETE de notificações pelo próprio usuário (já existe conforme schema)
   - Não são necessárias alterações no banco — a tabela `notifications` já suporta tudo

### Detalhes técnicos

- Reutiliza o hook `useNotifications` existente e a lógica de navegação contextual do `NotificationBell.tsx`
- RLS já permite que usuários vejam/atualizem/deletem suas próprias notificações
- Realtime via `supabase.channel` para INSERT na tabela `notifications`
- Filtro por tipo usando state local (sem query adicional)

### Arquivos a criar/editar

1. **Criar** `src/pages/admin/NotificationsPage.tsx`
2. **Editar** `src/components/admin/AdminSidebar.tsx` — adicionar item Notificações com badge
3. **Editar** `src/components/admin/AdminTopbar.tsx` — link "Ver todas"
4. **Editar** `src/App.tsx` — adicionar rota
5. **Editar** `src/hooks/useNotifications.ts` — adicionar `deleteNotification`

