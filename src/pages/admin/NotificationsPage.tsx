import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, CheckCheck, Trash2, Filter, Info, CheckCircle, AlertTriangle, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
  info: { icon: Info, label: 'Info', emoji: '💬', color: 'text-blue-500' },
  success: { icon: CheckCircle, label: 'Sucesso', emoji: '✅', color: 'text-green-500' },
  warning: { icon: AlertTriangle, label: 'Aviso', emoji: '⚠️', color: 'text-yellow-500' },
  error: { icon: XCircle, label: 'Erro', emoji: '❌', color: 'text-destructive' },
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
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Notificações</h1>
          <p className="text-muted-foreground">
            {unreadCount > 0
              ? `Você tem ${unreadCount} notificação${unreadCount > 1 ? 'ões' : ''} não lida${unreadCount > 1 ? 's' : ''}`
              : 'Todas as notificações lidas'}
          </p>
        </div>

        {unreadCount > 0 && (
          <Button variant="outline" size="sm" onClick={handleMarkAllRead} className="gap-2 self-start">
            <CheckCheck className="h-4 w-4" />
            Marcar todas como lidas
          </Button>
        )}
      </div>

      {/* Filters */}
      <Tabs value={filter} onValueChange={(v) => setFilter(v as FilterType)}>
        <TabsList className="flex-wrap h-auto gap-1">
          <TabsTrigger value="all">Todas</TabsTrigger>
          <TabsTrigger value="unread" className="gap-1">
            Não lidas
            {unreadCount > 0 && (
              <Badge variant="destructive" className="h-5 min-w-5 p-0 flex items-center justify-center text-xs">
                {unreadCount}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="info">💬 Info</TabsTrigger>
          <TabsTrigger value="success">✅ Sucesso</TabsTrigger>
          <TabsTrigger value="warning">⚠️ Aviso</TabsTrigger>
          <TabsTrigger value="error">❌ Erro</TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Notifications List */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-4">
                <div className="h-4 bg-muted rounded w-1/3 mb-2" />
                <div className="h-3 bg-muted rounded w-2/3" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : filteredNotifications.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
              <Bell className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="font-semibold text-lg mb-1">Nenhuma notificação</h3>
            <p className="text-muted-foreground text-sm max-w-sm">
              {filter === 'unread'
                ? 'Você não tem notificações não lidas. Bom trabalho!'
                : 'Quando houver novidades sobre seus projetos, mensagens ou manutenções, elas aparecerão aqui.'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {filteredNotifications.map((notification) => {
            const config = typeConfig[notification.type as keyof typeof typeConfig] || typeConfig.info;
            const actionUrl = getNotificationActionUrl(notification);

            return (
              <Card
                key={notification.id}
                className={cn(
                  'cursor-pointer transition-all hover:shadow-md',
                  !notification.read && 'border-primary/30 bg-primary/5'
                )}
                onClick={() => handleClick(notification)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="text-xl flex-shrink-0 mt-0.5">{config.emoji}</div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <h4 className={cn('text-sm', !notification.read ? 'font-semibold' : 'font-medium')}>
                          {notification.title}
                        </h4>
                        <div className="flex items-center gap-1 flex-shrink-0">
                          {!notification.read && (
                            <div className="w-2.5 h-2.5 bg-primary rounded-full" />
                          )}
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-muted-foreground hover:text-destructive"
                            onClick={(e) => handleDelete(e, notification.id)}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>

                      <p className="text-sm text-muted-foreground mt-1">{notification.message}</p>

                      <div className="flex items-center justify-between mt-2">
                        <p className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true, locale: ptBR })}
                          {' · '}
                          {format(new Date(notification.createdAt), 'dd/MM/yy HH:mm', { locale: ptBR })}
                        </p>
                        {actionUrl && (
                          <span className="text-xs text-primary font-medium">Ver detalhes →</span>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default NotificationsPage;
