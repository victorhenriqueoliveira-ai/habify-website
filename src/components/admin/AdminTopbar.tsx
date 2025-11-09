import React from 'react';
import { Bell, LogOut, Menu, Home, ChevronRight, Plus } from 'lucide-react';
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
import { useAuth } from '@/contexts/AuthContext';
import { useNotifications } from '@/hooks/useNotifications';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import Logo from '../../../public/logotipo_habify.png';

interface AdminTopbarProps {
  onMenuClick: () => void;
}

const routeLabels: Record<string, string> = {
  '/admin': 'Usuários',
  '/admin/my-projects': 'Meus Projetos',
  '/admin/subscriptions': 'Assinaturas',
  '/admin/my-maintenances': 'Manutenções',
  '/admin/projects': 'Projetos',
  '/admin/payments': 'Pagamentos',
  '/admin/maintenances': 'Manutenções Admin',
  '/admin/maintenances-dashboard': 'Dashboard Manutenções',
  '/admin/reports': 'Relatórios',
  '/admin/logs': 'Logs',
  '/admin/settings': 'Configurações',
  '/admin/payment-settings': 'Gateway de Pagamento',
  '/admin/profile': 'Meu Perfil',
  '/admin/users/create-admin': 'Criar Admin/Dev',
};

export const AdminTopbar = ({ onMenuClick }: AdminTopbarProps) => {
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
    
    const breadcrumbs = [
      { label: 'Painel', path: '/admin' }
    ];

    if (path !== '/admin' && path !== '/admin/') {
      const label = routeLabels[path] || parts[parts.length - 1]?.replace(/-/g, ' ');
      breadcrumbs.push({ label, path });
    }

    return breadcrumbs;
  };

  const breadcrumbs = getBreadcrumbs();

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background shadow-sm">
      <div className="flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8 gap-4">
        {/* Left side - Menu, Logo & Breadcrumbs */}
        <div className="flex items-center gap-4 min-w-0 flex-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={onMenuClick}
            className="lg:hidden h-10 w-10 flex-shrink-0"
          >
            <Menu className="h-5 w-5" />
          </Button>
          
          <div className="hidden sm:flex items-center gap-3 flex-shrink-0">
            <img src={Logo} alt="HabiFy" className="h-8 w-8 object-contain" />
            <span className="font-bold text-lg hidden md:inline">HabiFy</span>
          </div>

          {/* Breadcrumbs */}
          <nav className="hidden md:flex items-center gap-2 text-sm text-muted-foreground min-w-0">
            {breadcrumbs.map((crumb, index) => (
              <React.Fragment key={crumb.path}>
                {index > 0 && <ChevronRight className="w-4 h-4 flex-shrink-0" />}
                <Link
                  to={crumb.path}
                  className="hover:text-foreground transition-colors truncate capitalize"
                >
                  {crumb.label}
                </Link>
              </React.Fragment>
            ))}
          </nav>
        </div>

        {/* Right side - Actions */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {/* CTA Button - Hidden on small screens */}
          {hasRole(['user']) && (
            <Button
              onClick={() => navigate('/admin/my-projects')}
              className="hidden lg:flex items-center gap-2 bg-primary hover:bg-primary/90"
              size="sm"
            >
              <Plus className="w-4 h-4" />
              <span>Novo Projeto</span>
            </Button>
          )}

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
            <DropdownMenuContent align="end" className="w-80 max-h-[400px] overflow-y-auto">
              <div className="p-3 border-b sticky top-0 bg-background">
                <h3 className="font-semibold">Notificações</h3>
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
              <Button variant="ghost" className="relative h-10 w-10 rounded-full p-0">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={user.avatar} alt={user.name} />
                  <AvatarFallback>{user.name.charAt(0).toUpperCase()}</AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-72">
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