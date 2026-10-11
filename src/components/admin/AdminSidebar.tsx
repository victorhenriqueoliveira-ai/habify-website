import { NavLink, useLocation } from 'react-router-dom';
import { User } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { navGroups, bottomItems } from './navConfig';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar';
import Logo from '/logotipo_habify.png';

/**
 * Sidebar do admin — sempre expandida (ícone + texto), agrupada por seção,
 * estilo Linear/Vercel. Usa o primitivo shadcn `sidebar.tsx` (já instalado,
 * nunca usado até aqui): resolve mobile (Sheet embutido) e desktop com uma
 * única implementação, em vez dos 3 caminhos de código que a versão
 * anterior (hover-to-expand com framer-motion) mantinha em paralelo.
 */
export function AdminSidebar() {
  const location = useLocation();
  const { user, hasRole } = useAuth();
  const { isMobile, setOpenMobile } = useSidebar();

  const isActive = (url: string) =>
    location.pathname === url || (url === '/admin' && location.pathname === '/admin/');

  // No mobile o menu é um Sheet por cima do conteúdo — sem isso, ele fica
  // aberto depois de navegar em vez de fechar sozinho.
  const handleNavClick = () => {
    if (isMobile) setOpenMobile(false);
  };

  return (
    <Sidebar collapsible="offcanvas">
      <SidebarHeader className="h-16 justify-center border-b border-sidebar-border px-4">
        <div className="flex items-center gap-3">
          <img src={Logo} alt="HabiFy" className="h-8 w-8 shrink-0 object-contain" />
          <span className="truncate font-bold text-lg">HabiFy</span>
        </div>
      </SidebarHeader>

      <SidebarContent>
        {navGroups.map((group) => {
          const items = group.items.filter((item) => hasRole(item.roles));
          if (items.length === 0) return null;

          return (
            <SidebarGroup key={group.label}>
              <SidebarGroupLabel>{group.label}</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {items.map((item) => (
                    <SidebarMenuItem key={item.url}>
                      <SidebarMenuButton asChild isActive={isActive(item.url)}>
                        <NavLink to={item.url} end onClick={handleNavClick}>
                          <item.icon />
                          <span>{item.title}</span>
                        </NavLink>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          );
        })}
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border">
        <SidebarMenu>
          {bottomItems
            .filter((item) => hasRole(item.roles))
            .map((item) => (
              <SidebarMenuItem key={item.url}>
                <SidebarMenuButton asChild isActive={isActive(item.url)}>
                  <NavLink to={item.url} end onClick={handleNavClick}>
                    <item.icon />
                    <span>{item.title}</span>
                  </NavLink>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
        </SidebarMenu>

        {user && (
          <div className="flex items-center gap-3 px-2 py-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-sidebar-primary/10">
              <User className="h-4 w-4 text-sidebar-primary" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{user.name}</p>
              <p className="truncate text-xs capitalize text-sidebar-foreground/60">{user.role}</p>
            </div>
          </div>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}
