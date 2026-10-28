import { Bell, ChevronRight, LogOut, Search, User as UserIcon } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { SidebarTrigger } from '@/components/ui/sidebar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAuth } from '@/contexts/AuthContext';
import { useNotifications } from '@/hooks/useNotifications';
import { findNavLabel } from './navConfig';
import { cn } from '@/lib/utils';

export const AdminTopbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { notifications, unreadCount, markAsRead } = useNotifications(user?.userId || user?.id);

  if (!user) return null;

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const current = (() => {
    const path = location.pathname;
    if (path === '/admin' || path === '/admin/') return null;

    const label = findNavLabel(path);
    if (label) return label;

    // Último recurso, pra rota sem rótulo cadastrado. Pula o trecho final
    // quando ele é um id: "Detalhes" é mais útil que um UUID na tela.
    const parts = path.split('/').filter(Boolean);
    const last = parts[parts.length - 1] ?? '';
    const looksLikeId = /^[0-9a-f-]{8,}$/i.test(last);
    const segment = looksLikeId ? parts[parts.length - 2] ?? last : last;
    return segment.replace(/-/g, ' ');
  })();

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border bg-background/90 backdrop-blur-md">
      <div className="flex h-[57px] items-center gap-3 px-4 sm:px-5">
        <SidebarTrigger className="h-9 w-9 shrink-0 rounded-lg border border-border md:hidden" />

        <nav className="flex min-w-0 items-center gap-1.5 text-[13.5px] text-muted-foreground">
          <Link to="/admin" className="hidden transition-colors hover:text-foreground sm:inline">
            Painel
          </Link>
          {current && (
            <>
              <ChevronRight className="hidden h-3.5 w-3.5 shrink-0 sm:block" aria-hidden="true" />
              <span className="truncate font-semibold capitalize text-foreground">{current}</span>
            </>
          )}
        </nav>

        {/* Busca visual — a lógica real entra numa rodada futura. */}
        <label className="ml-auto flex w-auto min-w-0 items-center gap-2 rounded-lg border border-border bg-muted px-2.5 py-1.5 text-muted-foreground lg:w-[280px]">
          <Search className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          <input
            placeholder="Buscar projeto, cliente…"
            aria-label="Buscar"
            className="hidden w-full border-0 bg-transparent text-[13.5px] text-foreground outline-none placeholder:text-muted-foreground lg:block"
          />
          <kbd className="hidden shrink-0 rounded border border-input px-1.5 font-mono text-[10px] lg:block">⌘K</kbd>
        </label>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              className="relative grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-border text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              aria-label={`Notificações${unreadCount > 0 ? ` (${unreadCount} não lidas)` : ''}`}
            >
              <Bell className="h-[17px] w-[17px]" />
              {unreadCount > 0 && (
                <span className="absolute right-1.5 top-1.5 h-[7px] w-[7px] rounded-full border-2 border-background bg-primary" />
              )}
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="max-h-[420px] w-80 overflow-y-auto p-0 shadow-admin-popover">
            <div className="sticky top-0 flex items-center gap-2 border-b border-border bg-background px-4 py-3">
              <h2 className="text-[14.5px] font-semibold">Notificações</h2>
              {unreadCount > 0 && (
                <span className="ml-auto rounded-full bg-primary/10 px-2 py-0.5 font-mono text-[10px] font-medium text-primary">
                  {unreadCount} nova{unreadCount > 1 ? 's' : ''}
                </span>
              )}
            </div>

            {notifications.length > 0 ? (
              <>
                {notifications.slice(0, 5).map((notification) => (
                  <DropdownMenuItem
                    key={notification.id}
                    className="cursor-pointer gap-0 border-b border-border px-4 py-3 last:border-b-0"
                    onClick={() => !notification.read && markAsRead(notification.id)}
                  >
                    <div className="w-full">
                      <div className="flex items-start gap-2">
                        <h3
                          className={cn(
                            'line-clamp-2 text-[13.5px]',
                            notification.read ? 'font-medium' : 'font-semibold',
                          )}
                        >
                          {notification.title}
                        </h3>
                        {!notification.read && (
                          <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                        )}
                      </div>
                      <p className="mt-1 line-clamp-2 text-[12.5px] text-muted-foreground">{notification.message}</p>
                      <p className="mt-1.5 font-mono text-[10px] text-muted-foreground">
                        {new Date(notification.createdAt).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                  </DropdownMenuItem>
                ))}
                <DropdownMenuItem
                  className="cursor-pointer justify-center py-3 text-[13.5px] font-semibold text-primary"
                  onClick={() => navigate('/admin/notifications')}
                >
                  Ver todas
                </DropdownMenuItem>
              </>
            ) : (
              <div className="px-4 py-8 text-center">
                <p className="text-[13.5px] text-muted-foreground">Nenhuma notificação por aqui.</p>
              </div>
            )}
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-foreground text-xs font-semibold text-background"
              aria-label="Menu da conta"
            >
              {user.name?.charAt(0).toUpperCase() ?? '—'}
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-72 p-0 shadow-admin-popover">
            <div className="flex items-center gap-3 border-b border-border p-4">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-foreground text-sm font-semibold text-background">
                {user.name?.charAt(0).toUpperCase() ?? '—'}
              </span>
              <div className="min-w-0">
                <p className="truncate text-[14px] font-semibold">{user.name}</p>
                <p className="truncate font-mono text-[11px] text-muted-foreground">{user.email}</p>
              </div>
            </div>
            <DropdownMenuItem onClick={() => navigate('/admin/profile')} className="cursor-pointer gap-2.5 px-4 py-2.5">
              <UserIcon className="h-4 w-4" aria-hidden="true" />
              Meu perfil
            </DropdownMenuItem>
            <DropdownMenuSeparator className="my-0" />
            <DropdownMenuItem
              onClick={handleLogout}
              className="cursor-pointer gap-2.5 px-4 py-2.5 text-destructive focus:text-destructive"
            >
              <LogOut className="h-4 w-4" aria-hidden="true" />
              Sair
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
};
