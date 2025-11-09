import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Building2,
  User,
  Settings,
  FileText,
  BarChart3,
  Shield,
  CreditCard,
  Package,
  Wrench
} from 'lucide-react';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import Logo from '../../../public/logotipo_habify.png';

const menuItems = [
  {
    title: 'Meus Projetos',
    url: '/admin/my-projects',
    icon: Building2,
    roles: ['user'],
  },
  {
    title: 'Assinaturas',
    url: '/admin/subscriptions',
    icon: Package,
    roles: ['user'],
  },
  {
    title: 'Manutenções',
    url: '/admin/my-maintenances',
    icon: Wrench,
    roles: ['user', 'corretor'],
  },
  {
    title: 'Usuários',
    url: '/admin',
    icon: Users,
    roles: ['admin', 'dev'],
  },
  {
    title: 'Criar Admin/Dev',
    url: '/admin/users/create-admin',
    icon: Shield,
    roles: ['admin', 'dev'],
  },
  {
    title: 'Projetos',
    url: '/admin/projects',
    icon: Building2,
    roles: ['admin', 'dev'],
  },
  {
    title: 'Pagamentos',
    url: '/admin/payments',
    icon: CreditCard,
    roles: ['admin', 'dev'],
  },
  {
    title: 'Manutenções Admin',
    url: '/admin/maintenances',
    icon: Wrench,
    roles: ['admin', 'dev'],
  },
  {
    title: 'Dashboard Manutenções',
    url: '/admin/maintenances-dashboard',
    icon: BarChart3,
    roles: ['admin', 'dev'],
  },
  {
    title: 'Relatórios',
    url: '/admin/reports',
    icon: BarChart3,
    roles: ['admin', 'dev'],
  },
  {
    title: 'Logs',
    url: '/admin/logs',
    icon: FileText,
    roles: ['dev'],
  },
  {
    title: 'Configurações',
    url: '/admin/settings',
    icon: Settings,
    roles: ['dev'],
  },
  {
    title: 'Gateway de Pagamento',
    url: '/admin/payment-settings',
    icon: CreditCard,
    roles: ['dev'],
  },
  {
    title: 'Meu Perfil',
    url: '/admin/profile',
    icon: User,
    roles: ['user', 'admin', 'dev'],
  },
];

export const AdminSidebar = () => {
  const { state } = useSidebar();
  const location = useLocation();
  const { user, hasRole } = useAuth();
  const isCollapsed = state === 'collapsed';

  const filteredItems = menuItems.filter(item => hasRole(item.roles));

  const getNavCls = (isActive: boolean) =>
    cn(
      'transition-colors duration-200',
      isActive 
        ? 'bg-primary text-primary-foreground font-medium' 
        : 'hover:bg-accent hover:text-accent-foreground'
    );

  return (
    <Sidebar className={cn('border-r bg-background', isCollapsed ? 'w-16' : 'w-56 sm:w-64')} collapsible="icon">
      <SidebarContent className="flex flex-col h-full">
        {/* Logo */}
        <div className="p-3 sm:p-4 border-b flex-shrink-0">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center flex-shrink-0">
              <img src={Logo} alt="HabiFy Logo" className="w-5 h-5 sm:w-6 sm:h-6 object-contain" />
            </div>
            {!isCollapsed && (
              <div className="min-w-0">
                <h1 className="font-bold text-base sm:text-lg truncate">HabiFy</h1>
                <p className="text-[10px] sm:text-xs text-muted-foreground truncate">
                  {hasRole(['admin']) && "Admin"} {hasRole(['dev']) && "Dev"} {hasRole(['user']) && "Usuário"} Painel
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Navigation */}
        <SidebarGroup className="flex-1 overflow-y-auto">
          {!isCollapsed && <SidebarGroupLabel className="text-xs">Menu</SidebarGroupLabel>}
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1">
              {filteredItems.map((item) => {
                const isActive = location.pathname === item.url || 
                  (item.url === '/admin' && location.pathname === '/admin/');
                
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild className="h-10">
                      <NavLink 
                        to={item.url} 
                        end
                        className={getNavCls(isActive)}
                      >
                        <item.icon className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
                        {!isCollapsed && <span className="text-sm truncate">{item.title}</span>}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* User Info */}
        {!isCollapsed && user && (
          <div className="mt-auto p-3 sm:p-4 border-t flex-shrink-0">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                <User className="w-4 h-4 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs sm:text-sm font-medium truncate">{user.name}</p>
                <p className="text-[10px] sm:text-xs text-muted-foreground capitalize truncate">{user.role}</p>
              </div>
            </div>
          </div>
        )}
      </SidebarContent>
    </Sidebar>
  );
};