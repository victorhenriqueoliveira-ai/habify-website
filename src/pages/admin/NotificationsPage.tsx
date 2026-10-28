import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, CheckCheck, Trash2, Info, CheckCircle, AlertTriangle, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { EmptyState, PageHeader, SkeletonRows } from '@/components/admin/ui';
import { useNotifications } from '@/hooks/useNotifications';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { format, formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import type { Notification } from '@/types/admin';

// Reuse navigation logic from NotificationBell
const getNotificationActionUrl = (notification: { title: string; message: string }): string | null => {
  const uuidPattern = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i;
  const projectId = notification.message.match(uuidPattern)?.[0] || null;
  const requestId = notification.message.match(/Request ID: ([0-9a-f-]+)/i)?.[1] || null;

  if (requestId && (
    notification.title.toLowerCase().includes('manutenção') ||
    notification.title.toLowerCase().includes('resposta') ||
    notification.message.toLowerCase().includes('solicitação')
  )) {
    return `/admin/maintenance-requests?request=${requestId}`;
  }

  if (notification.title.toLowerCase().includes('mensagem') ||
      notification.title.toLowerCase().includes('chat') ||
      notification.message.toLowerCase().includes('mensagem')) {
    if (projectId) return `/admin/projects/${projectId}?tab=chat`;
  }

  if (notification.title.toLowerCase().includes('projeto') ||
      notification.message.toLowerCase().includes('projeto')) {
    if (projectId) return `/admin/projects/${projectId}`;
  }

  if (notification.title.toLowerCase().includes('manutenção') ||
      notification.message.toLowerCase().includes('manutenção')) {
    return '/admin/maintenance-requests';
  }

  return null;
};

const typeConfig = {
  info: { icon: Info, label: 'Info', color: 'text-info', bg: 'bg-info/10' },
  success: { icon: CheckCircle, label: 'Sucesso', color: 'text-success', bg: 'bg-success/10' },
  warning: { icon: AlertTriangle, label: 'Aviso', color: 'text-warning', bg: 'bg-warning/10' },
  error: { icon: XCircle, label: 'Erro', color: 'text-destructive', bg: 'bg-destructive/10' },
};

type FilterType = 'all' | 'unread' | 'info' | 'success' | 'warning' | 'error';

const NotificationsPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const {
    notifications,
    loading,
    unreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    fetchNotifications,
  } = useNotifications(user?.userId || user?.id);

  const [filter, setFilter] = useState<FilterType>('all');

  // Realtime subscription
  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel('notifications-page-realtime')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${user.userId || user.id}`,
      }, () => {
        fetchNotifications();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user, fetchNotifications]);

  const filteredNotifications = notifications.filter((n) => {
    if (filter === 'unread') return !n.read;
    if (filter === 'info' || filter === 'success' || filter === 'warning' || filter === 'error') return n.type === filter;
    return true;
  });

  const handleClick = async (notification: Notification) => {
    if (!notification.read) await markAsRead(notification.id);
    const url = getNotificationActionUrl(notification);
    if (url) navigate(url);
  };

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    const result = await deleteNotification(id);
    if (result.success) {
      toast.success('Notificação removida');
    } else {
      toast.error('Erro ao remover notificação');
    }
  };

  const handleMarkAllRead = async () => {
    const result = await markAllAsRead();
    if (result.success) {
      toast.success('Todas marcadas como lidas');
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        icon={Bell}
        eyebrow="Conta"
        title="Notificações"
        description={
          unreadCount > 0
            ? `Você tem ${unreadCount} notificação${unreadCount > 1 ? 'ões' : ''} não lida${unreadCount > 1 ? 's' : ''}`
            : 'Tudo lido por aqui.'
        }
        actions={
          unreadCount > 0 && (
            <Button variant="outline" size="sm" onClick={handleMarkAllRead}>
              <CheckCheck className="mr-2 h-4 w-4" aria-hidden="true" />
              Marcar todas como lidas
            </Button>
          )
        }
      />

      {/* Seis filtros não cabem em 390px — a faixa rola em vez de quebrar
       *  em três linhas ou empurrar a página pro lado. */}
      <Tabs value={filter} onValueChange={(v) => setFilter(v as FilterType)}>
        <div className="-mx-1 overflow-x-auto px-1">
          <TabsList className="w-max gap-1">
            <TabsTrigger value="all">Todas</TabsTrigger>
            <TabsTrigger value="unread" className="gap-1.5">
              Não lidas
              {unreadCount > 0 && (
                <span className="rounded-full bg-primary/15 px-1.5 font-mono text-[10px] font-medium tabular-nums text-primary">
                  {unreadCount}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="info" className="gap-1.5">
              <Info className="h-3.5 w-3.5" aria-hidden="true" />
              Info
            </TabsTrigger>
            <TabsTrigger value="success" className="gap-1.5">
              <CheckCircle className="h-3.5 w-3.5" aria-hidden="true" />
              Sucesso
            </TabsTrigger>
            <TabsTrigger value="warning" className="gap-1.5">
              <AlertTriangle className="h-3.5 w-3.5" aria-hidden="true" />
              Aviso
            </TabsTrigger>
            <TabsTrigger value="error" className="gap-1.5">
              <XCircle className="h-3.5 w-3.5" aria-hidden="true" />
              Erro
            </TabsTrigger>
          </TabsList>
        </div>
      </Tabs>

      {/* Notifications List */}
      {loading ? (
        <SkeletonRows rows={4} />
      ) : filteredNotifications.length === 0 ? (
        <EmptyState
          className="admin-card-elevated"
          icon={Bell}
          title="Nenhuma notificação"
          description={
            filter === 'unread'
              ? 'Você não tem notificações não lidas.'
              : 'Quando houver novidades sobre seus projetos, mensagens ou manutenções, elas aparecem aqui.'
          }
        />
      ) : (
        <ul className="space-y-2">
          {filteredNotifications.map((notification) => {
            const config = typeConfig[notification.type as keyof typeof typeConfig] || typeConfig.info;
            const actionUrl = getNotificationActionUrl(notification);

            return (
              <li key={notification.id}>
                {/* O card inteiro navega, então é um <button> de verdade —
                 *  antes era um <div> com onClick, inalcançável pelo teclado. */}
                <div
                  className={cn(
                    'admin-card-elevated relative flex items-start gap-3 p-4 transition-colors',
                    !notification.read && 'border-primary/25 bg-primary/[0.04]',
                  )}
                >
                  <span className={cn('mt-0.5 shrink-0 rounded-full p-1.5', config.bg)}>
                    <config.icon className={cn('h-4 w-4', config.color)} aria-hidden="true" />
                  </span>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <button
                        type="button"
                        onClick={() => handleClick(notification)}
                        className="min-w-0 flex-1 text-left after:absolute after:inset-0 after:content-[''] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      >
                        <span
                          className={cn(
                            'block text-[13.5px]',
                            notification.read ? 'font-medium' : 'font-semibold',
                          )}
                        >
                          {notification.title}
                        </span>
                      </button>

                      <div className="relative z-10 flex shrink-0 items-center gap-1">
                        {!notification.read && (
                          <span className="h-2 w-2 rounded-full bg-primary" aria-hidden="true" />
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-muted-foreground hover:text-destructive"
                          aria-label={`Remover notificação: ${notification.title}`}
                          onClick={(e) => handleDelete(e, notification.id)}
                        >
                          <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                        </Button>
                      </div>
                    </div>

                    <p className="mt-1 text-[13px] leading-relaxed text-muted-foreground">
                      {notification.message}
                    </p>

                    <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
                      <p className="font-mono text-[10.5px] tabular-nums text-muted-foreground">
                        {formatDistanceToNow(new Date(notification.createdAt), {
                          addSuffix: true,
                          locale: ptBR,
                        })}
                        {' · '}
                        {format(new Date(notification.createdAt), 'dd/MM/yy HH:mm', { locale: ptBR })}
                      </p>
                      {actionUrl && (
                        <span className="text-[12px] font-semibold text-primary">Ver detalhes →</span>
                      )}
                    </div>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
};

export default NotificationsPage;
