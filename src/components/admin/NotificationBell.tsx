import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Bell, CheckCheck, ExternalLink } from 'lucide-react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent } from '@/components/ui/card';
import { useNotifications } from '@/hooks/useNotifications';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';

// Helper to extract project ID from notification message
const extractProjectId = (message: string): string | null => {
  // Try to find UUID pattern in message
  const uuidPattern = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i;
  const match = message.match(uuidPattern);
  return match ? match[0] : null;
};

// Helper to determine notification action URL
const getNotificationActionUrl = (notification: { title: string; message: string }): string | null => {
  const projectId = extractProjectId(notification.message);
  
  // Check if it's a message notification
  if (notification.title.toLowerCase().includes('mensagem') || 
      notification.title.toLowerCase().includes('chat') ||
      notification.message.toLowerCase().includes('mensagem')) {
    if (projectId) {
      return `/admin/projects/${projectId}?tab=chat`;
    }
  }
  
  // Check if it's a project notification
  if (notification.title.toLowerCase().includes('projeto') ||
      notification.message.toLowerCase().includes('projeto')) {
    if (projectId) {
      return `/admin/projects/${projectId}`;
    }
  }
  
  // Check if it's a maintenance notification
  if (notification.title.toLowerCase().includes('manutenção') ||
      notification.title.toLowerCase().includes('customização') ||
      notification.message.toLowerCase().includes('manutenção') ||
      notification.message.toLowerCase().includes('customização')) {
    return '/admin/maintenance-requests';
  }
  
  return null;
};

export const NotificationBell = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { 
    notifications, 
    unreadCount, 
    markAsRead, 
    markAllAsRead, 
    fetchNotifications 
  } = useNotifications(user?.userId || user?.id);
  
  const [isOpen, setIsOpen] = useState(false);

  // Setup realtime subscription for notifications
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('user-notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.userId || user.id}`
        },
        () => {
          fetchNotifications();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, fetchNotifications]);

  const handleNotificationClick = async (notification: any) => {
    if (!notification.read) {
      await markAsRead(notification.id);
    }
    
    const actionUrl = getNotificationActionUrl(notification);
    if (actionUrl) {
      setIsOpen(false);
      navigate(actionUrl);
    }
  };

  const handleMarkAllAsRead = async () => {
    await markAllAsRead();
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'success':
        return '✅';
      case 'warning':
        return '⚠️';
      case 'error':
        return '❌';
      default:
        return '💬';
    }
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 text-xs flex items-center justify-center"
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      
      <PopoverContent className="w-80 p-0" align="end">
        <div className="p-4 border-b">
          <div className="flex items-center justify-between">
            <h4 className="font-semibold">Notificações</h4>
            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleMarkAllAsRead}
                className="text-sm gap-1"
              >
                <CheckCheck className="h-4 w-4" />
                Ler todas
              </Button>
            )}
          </div>
        </div>
        
        <ScrollArea className="h-96">
          {notifications.length === 0 ? (
            <div className="p-4 text-center text-muted-foreground">
              <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>Nenhuma notificação</p>
            </div>
          ) : (
            <div className="divide-y">
              {notifications.slice(0, 10).map((notification) => {
                const actionUrl = getNotificationActionUrl(notification);
                return (
                  <Card
                    key={notification.id}
                    className={cn(
                      "border-0 rounded-none cursor-pointer hover:bg-muted/50 transition-colors",
                      !notification.read && "bg-blue-50/50"
                    )}
                    onClick={() => handleNotificationClick(notification)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start space-x-3">
                        <div className="text-lg flex-shrink-0">
                          {getNotificationIcon(notification.type)}
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between">
                            <h5 className={cn(
                              "font-medium text-sm",
                              !notification.read && "font-semibold"
                            )}>
                              {notification.title}
                            </h5>
                            {!notification.read && (
                              <div className="w-2 h-2 bg-primary rounded-full flex-shrink-0 mt-1" />
                            )}
                          </div>
                          
                          <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                            {notification.message}
                          </p>
                          
                          <div className="flex items-center justify-between mt-2">
                            <p className="text-xs text-muted-foreground">
                              {format(new Date(notification.createdAt), 'dd/MM/yy HH:mm', { locale: ptBR })}
                            </p>
                            {actionUrl && (
                              <span className="text-xs text-primary flex items-center gap-1">
                                <ExternalLink className="h-3 w-3" />
                                Ver
                              </span>
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
        </ScrollArea>
        
        {notifications.length > 10 && (
          <div className="p-4 border-t text-center">
            <Button variant="ghost" size="sm" className="text-sm">
              Ver todas as notificações
            </Button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
};
