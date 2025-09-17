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

const menuItems = [
  {
    title: 'Meus Projetos',
    url: '/admin/my-projects',
    icon: Building2,
    roles: ['user'],
  },
  {
    title: 'Usuários',
    url: '/admin',
    icon: Users,
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
    <Sidebar className={cn('border-r', isCollapsed ? 'w-16' : 'w-64')} collapsible="icon">
      <SidebarContent>
        {/* Logo */}
        <div className="p-4 border-b">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <Shield className="w-5 h-5 text-primary-foreground" />
            </div>
            {!isCollapsed && (
              <div>
                <h1 className="font-bold text-lg">HabiFy</h1>
                <p className="text-xs text-muted-foreground">Painel</p>
              </div>
            )}
          </div>
        </div>

        {/* Navigation */}
        <SidebarGroup>
          <SidebarGroupLabel>Menu</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {filteredItems.map((item) => {
                const isActive = location.pathname === item.url || 
                  (item.url === '/admin' && location.pathname === '/admin/');
                
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild>
                      <NavLink 
                        to={item.url} 
                        end
                        className={getNavCls(isActive)}
                      >
                        <item.icon className="w-5 h-5" />
                        {!isCollapsed && <span>{item.title}</span>}
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
          <div className="mt-auto p-4 border-t">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-muted rounded-full flex items-center justify-center">
                <User className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{user.name}</p>
                <p className="text-xs text-muted-foreground capitalize">{user.role}</p>
              </div>
            </div>
          </div>
        )}
      </SidebarContent>
    </Sidebar>
  );
};