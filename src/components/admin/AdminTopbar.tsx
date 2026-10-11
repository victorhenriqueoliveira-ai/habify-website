import { Bell, LogOut, ChevronRight, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { SidebarTrigger } from '@/components/ui/sidebar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { useNotifications } from '@/hooks/useNotifications';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { findNavLabel } from './navConfig';

export const AdminTopbar = () => {
  const { user, logout, hasRole } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
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

  const getBreadcrumbs = () => {
    const path = location.pathname;
    const parts = path.split('/').filter(Boolean);

    const breadcrumbs = [{ label: 'Painel', path: '/admin' }];

    if (path !== '/admin' && path !== '/admin/') {
      const label = findNavLabel(path) || parts[parts.length - 1]?.replace(/-/g, ' ');
      breadcrumbs.push({ label, path });
    }

    return breadcrumbs;
  };

  const breadcrumbs = getBreadcrumbs();

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border bg-background">
      <div className="flex h-16 items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        {/* Left side - Menu toggle, Breadcrumbs & Search */}
        <div className="flex min-w-0 flex-1 items-center gap-4">
          <SidebarTrigger className="h-10 w-10 shrink-0 md:hidden" />

          {/* Breadcrumbs */}
          <nav className="hidden min-w-0 items-center gap-2 text-sm text-muted-foreground md:flex">
            {breadcrumbs.map((crumb, index) => (
              <span key={crumb.path} className="contents">
                {index > 0 && <ChevronRight className="h-4 w-4 shrink-0" />}
                <Link
                  to={crumb.path}
                  className="truncate capitalize transition-colors hover:text-foreground"
                >
                  {crumb.label}
                </Link>
              </span>
            ))}
          </nav>

          <div className="relative ml-2 hidden max-w-xs flex-1 lg:block">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Buscar..." className="h-9 bg-muted/50 pl-9" />
          </div>
        </div>

        {/* Right side - Actions */}
        <div className="flex items-center gap-2 flex-shrink-0">

          {/* Role Badge */}
          <div className="hidden md:flex items-center px-3 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-medium">
            {getRoleLabel()}
          </div>

          {/* Notifications */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="relative h-10 w-10">
                <Bell className="h-5 w-5" />
                {unreadCount > 0 && (
                  <Badge 
                    variant="destructive" 
                    className="absolute -top-1 -right-1 h-5 min-w-5 p-0 flex items-center justify-center text-xs"
                  >
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </Badge>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="max-h-[400px] w-80 overflow-y-auto shadow-admin-popover">
              <div className="p-3 border-b sticky top-0 bg-background">
                <h3 className="font-semibold">Notificações</h3>
              </div>
              {notifications.length > 0 ? (
                <>
                {notifications.slice(0, 5).map((notification) => (
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
                ))}
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  className="p-3 cursor-pointer justify-center text-primary font-medium"
                  onClick={() => navigate('/admin/notifications')}
                >
                  Ver todas as notificações
                </DropdownMenuItem>
                </>
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
              <Button variant="ghost" className="relative h-10 w-10 rounded-full p-0">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={user.avatar} alt={user.name} />
                  <AvatarFallback>{user.name.charAt(0).toUpperCase()}</AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-72 shadow-admin-popover">
              <div className="flex items-center gap-3 p-3 border-b">
                <Avatar className="h-12 w-12">
                  <AvatarImage src={user.avatar} alt={user.name} />
                  <AvatarFallback>{user.name.charAt(0).toUpperCase()}</AvatarFallback>
                </Avatar>
                <div className="flex flex-col space-y-1 flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{user.name}</p>
                  <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                  <p className="text-xs text-muted-foreground">
                    {user.role === 'admin' ? 'Administrador' : user.role === 'dev' ? 'Desenvolvedor' : 'Usuário'}
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