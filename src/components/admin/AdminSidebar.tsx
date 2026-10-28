import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { navGroups, bottomItems } from './navConfig';
import { HabifyMark } from '@/components/landing/HabifyMark';
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
import { cn } from '@/lib/utils';

/** Iniciais pro avatar: "João Ferreira" -> "JF". */
function initials(name?: string) {
  if (!name) return '—';
  const parts = name.trim().split(/\s+/);
  return ((parts[0]?.[0] ?? '') + (parts.length > 1 ? parts[parts.length - 1][0] : '')).toUpperCase();
}

/**
 * Sidebar do admin — sempre expandida, agrupada por seção.
 *
 * Continua sobre o primitivo shadcn `sidebar.tsx`, que já resolve a gaveta
 * no mobile (Sheet) e o desktop com uma implementação só. O que muda aqui
 * é a estética: o item ativo usa o laranja da marca com uma barra na
 * borda, os rótulos de grupo vão em mono, e a marca é o SVG em vez do PNG.
 */
export function AdminSidebar() {
  const location = useLocation();
  const { user, hasRole } = useAuth();
  const { isMobile, setOpenMobile } = useSidebar();

  const isActive = (url: string) =>
    location.pathname === url || (url === '/admin' && location.pathname === '/admin/');

  // No mobile o menu é um Sheet por cima do conteúdo — sem isso ele fica
  // aberto depois de navegar em vez de fechar sozinho.
  const handleNavClick = () => {
    if (isMobile) setOpenMobile(false);
  };

  const itemClasses = (active: boolean) =>
    cn(
      'relative h-9 gap-2.5 rounded-lg px-2.5 text-sm transition-colors',
      active
        ? 'bg-primary/10 font-semibold text-primary before:absolute before:-left-2.5 before:top-1/2 before:h-[17px] before:w-[3px] before:-translate-y-1/2 before:rounded-r-sm before:bg-primary'
        : 'text-muted-foreground hover:bg-muted hover:text-foreground',
    );

  return (
    <Sidebar collapsible="offcanvas" className="border-r border-border bg-background">
      <SidebarHeader className="h-[57px] justify-center border-b border-border px-4">
        <div className="flex items-center gap-2.5">
          <HabifyMark className="h-5 w-auto shrink-0 text-primary" />
          <span className="font-display text-[17px] font-bold tracking-[-0.035em]">Habify</span>
          {user?.role && (
            <span className="ml-auto rounded border border-border px-1.5 py-0.5 font-mono text-[9.5px] text-muted-foreground">
              {user.role}
            </span>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent className="px-2.5 py-3">
        {navGroups.map((group) => {
          const items = group.items.filter((item) => hasRole(item.roles));
          if (items.length === 0) return null;

          return (
            <SidebarGroup key={group.label} className="px-0 py-0">
              <SidebarGroupLabel className="px-2 font-mono text-[10px] uppercase tracking-[0.09em] text-muted-foreground">
                {group.label}
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {items.map((item) => (
                    <SidebarMenuItem key={item.url}>
                      <SidebarMenuButton asChild isActive={isActive(item.url)} className={itemClasses(isActive(item.url))}>
                        <NavLink to={item.url} end onClick={handleNavClick}>
                          <item.icon className="h-4 w-4" />
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

        <SidebarGroup className="px-0 py-0">
          <SidebarGroupLabel className="px-2 font-mono text-[10px] uppercase tracking-[0.09em] text-muted-foreground">
            Conta
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {bottomItems
                .filter((item) => hasRole(item.roles))
                .map((item) => (
                  <SidebarMenuItem key={item.url}>
                    <SidebarMenuButton asChild isActive={isActive(item.url)} className={itemClasses(isActive(item.url))}>
                      <NavLink to={item.url} end onClick={handleNavClick}>
                        <item.icon className="h-4 w-4" />
                        <span>{item.title}</span>
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      {user && (
        <SidebarFooter className="border-t border-border p-2.5">
          <NavLink
            to="/admin/profile"
            onClick={handleNavClick}
            className="flex items-center gap-2.5 rounded-lg p-2 transition-colors hover:bg-muted"
          >
            <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-foreground text-xs font-semibold text-background">
              {initials(user.name)}
            </span>
            <span className="min-w-0 leading-tight">
              <span className="block truncate text-[13.5px] font-semibold">{user.name}</span>
              <span className="block font-mono text-[10px] text-muted-foreground">{user.role}</span>
            </span>
          </NavLink>
        </SidebarFooter>
      )}
    </Sidebar>
  );
}
