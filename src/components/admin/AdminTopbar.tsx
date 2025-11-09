import React, { useState } from 'react';
import { Bell, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { useAuth } from '@/contexts/AuthContext';
import { useNotifications } from '@/hooks/useNotifications';
import { useNavigate } from 'react-router-dom';
import { useSidebar } from '@/components/ui/sidebar';

export const AdminTopbar = () => {
  const { user, logout, hasRole } = useAuth();
  const navigate = useNavigate();
  const { open } = useSidebar();
  const { notifications, unreadCount, markAsRead } = useNotifications(user?.userId || user?.id);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (!user) return null;

  const getRoleLabel = () => {
    if (hasRole('admin')) return 'Admin';
    if (hasRole('dev')) return 'Dev';
    return 'Usuário';
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-14 sm:h-16 items-center justify-between px-3 sm:px-4 lg:px-6 gap-2">
        {/* Left side - Trigger and Logo */}
        <div className="flex items-center gap-2 sm:gap-3">
          <SidebarTrigger className="h-9 w-9 sm:h-10 sm:w-10" />
          {!open && (
            <div className="hidden sm:flex items-center gap-2">
              <img src="/logotipo_habify.png" alt="HabiFy" className="h-7 w-auto" />
            </div>
          )}
        </div>

        {/* Right side - Actions */}
        <div className="flex items-center gap-1 sm:gap-2">
          {/* Role Badge - Hidden on small screens */}
          <div className="hidden md:flex items-center px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium">
            {getRoleLabel()}
          </div>

          {/* Notifications */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="relative h-9 w-9 sm:h-10 sm:w-10">
                <Bell className="h-4 w-4 sm:h-5 sm:w-5" />
                {unreadCount > 0 && (
                  <Badge 
                    variant="destructive" 
                    className="absolute -top-1 -right-1 h-4 min-w-4 sm:h-5 sm:min-w-5 p-0 flex items-center justify-center text-[10px] sm:text-xs"
                  >
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </Badge>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-[calc(100vw-2rem)] sm:w-80 max-h-[400px] overflow-y-auto z-50 bg-background">
              <div className="p-3 border-b sticky top-0 bg-background">
                <h3 className="font-semibold text-sm sm:text-base">Notificações</h3>
              </div>
              {notifications.length > 0 ? (
                notifications.slice(0, 5).map((notification) => (
                  <DropdownMenuItem 
                    key={notification.id} 
                    className="p-3 cursor-pointer focus:bg-accent"
                    onClick={() => !notification.read && markAsRead(notification.id)}
                  >
                    <div className="w-full">
                      <div className="flex items-start justify-between gap-2">
                        <h4 className="font-medium text-sm line-clamp-2">{notification.title}</h4>
                        {!notification.read && (
                          <div className="w-2 h-2 bg-primary rounded-full mt-1 flex-shrink-0" />
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                        {notification.message}
                      </p>
                      <p className="text-xs text-muted-foreground mt-2">
                        {new Date(notification.createdAt).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                  </DropdownMenuItem>
                ))
              ) : (
                <DropdownMenuItem disabled className="p-3">
                  <p className="text-sm text-muted-foreground">Nenhuma notificação</p>
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-9 w-9 sm:h-10 sm:w-10 rounded-full p-0">
                <Avatar className="h-9 w-9 sm:h-10 sm:w-10">
                  <AvatarImage src={user.avatar} alt={user.name} />
                  <AvatarFallback className="text-xs sm:text-sm">{user.name.charAt(0).toUpperCase()}</AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-[calc(100vw-2rem)] sm:w-72 z-50 bg-background">
              <div className="flex items-center gap-3 p-3 border-b">
                <Avatar className="h-12 w-12">
                  <AvatarImage src={user.avatar} alt={user.name} />
                  <AvatarFallback>{user.name.charAt(0).toUpperCase()}</AvatarFallback>
                </Avatar>
                <div className="flex flex-col space-y-1 flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{user.name}</p>
                  <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                  <p className="text-xs text-muted-foreground">
                    Painel: {user.role === 'admin' ? 'Administrador' : user.role === 'dev' ? 'Desenvolvedor' : 'Usuário'}
                  </p>
                </div>
              </div>
              <DropdownMenuItem onClick={() => navigate('/admin/profile')} className="cursor-pointer">
                Meu Perfil
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout} className="text-destructive cursor-pointer focus:text-destructive">
                <LogOut className="mr-2 h-4 w-4" />
                Sair
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
};