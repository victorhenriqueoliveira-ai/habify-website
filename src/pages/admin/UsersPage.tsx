import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { MoreHorizontal, UserPlus, Edit, Trash2, Shield, Filter, Package, Users } from 'lucide-react';
import { UserRole } from '@/types/admin';
import { useUsers } from '@/hooks/useUsers';
import { toast } from 'sonner';
import { UsersTableSkeleton } from '@/components/ui/skeleton-loaders';
import {
  EmptyState,
  FilterBar,
  PageHeader,
  SectionHeader,
  StatusPill,
  type StatusTone,
} from '@/components/admin/ui';

const roleTones: Record<UserRole, StatusTone> = {
  user: 'neutral',
  admin: 'info',
  dev: 'primary',
};

const roleLabels: Record<UserRole, string> = {
  user: 'Corretor',
  admin: 'Admin',
  dev: 'Desenvolvedor',
};

const roleFilters: Array<{ value: UserRole | 'all'; label: string }> = [
  { value: 'all', label: 'Todos os perfis' },
  { value: 'user', label: 'Corretores' },
  { value: 'admin', label: 'Administradores' },
  { value: 'dev', label: 'Desenvolvedores' },
];

const headCell = 'font-mono text-[10px] uppercase tracking-[0.09em]';

/** Iniciais pro avatar: "João Ferreira" -> "JF". */
function initials(name: string) {
  const parts = name.trim().split(/\s+/);
  return ((parts[0]?.[0] ?? '') + (parts.length > 1 ? parts[parts.length - 1][0] : '')).toUpperCase();
}

export const UsersPage = () => {
  const navigate = useNavigate();
  const { users, loading, updateUser, deleteUser } = useUsers();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRole, setSelectedRole] = useState<UserRole | 'all'>('all');

  if (loading) {
    return <UsersTableSkeleton />;
  }

  // Filter users based on search and role
  const filteredUsers = users.filter((user) => {
    const term = searchTerm.toLowerCase();
    const matchesSearch =
      user.name.toLowerCase().includes(term) ||
      user.email.toLowerCase().includes(term) ||
      user.company?.toLowerCase().includes(term);
    const matchesRole = selectedRole === 'all' || user.role === selectedRole;
    return matchesSearch && matchesRole;
  });

  const handleToggleStatus = async (userId: string) => {
    const user = users.find((u) => u.id === userId);
    if (!user) return;

    await updateUser(userId, { isActive: !user.isActive });
    toast.success('Status atualizado', {
      description: `${user.name} foi ${user.isActive ? 'desativado' : 'ativado'}`,
    });
  };

  const handleDeleteUser = async (userId: string) => {
    const user = users.find((u) => u.id === userId);
    if (!user) return;

    await deleteUser(userId);
    toast.error('Usuário removido', { description: `${user.name} foi removido do sistema` });
  };

  return (
    <div className="space-y-6">
      <PageHeader
        icon={Users}
        eyebrow="Pessoas"
        title="Usuários"
        description="Gerencie todos os usuários do sistema"
        actions={
          <>
            <Button variant="outline" onClick={() => navigate('/admin/users/create-admin')}>
              <Shield className="mr-2 h-4 w-4" aria-hidden="true" />
              Criar admin/dev
            </Button>
            <Button onClick={() => navigate('/admin/users/new')}>
              <UserPlus className="mr-2 h-4 w-4" aria-hidden="true" />
              Novo usuário
            </Button>
          </>
        }
      />

      <div className="admin-card-elevated">
        <div className="space-y-4 border-b border-border p-4 sm:p-5">
          <SectionHeader
            title="Lista de usuários"
            count={filteredUsers.length}
            description={
              selectedRole === 'all'
                ? 'Todos os usuários cadastrados'
                : `Filtrando por: ${roleLabels[selectedRole]}`
            }
          />
          <FilterBar
            value={searchTerm}
            onChange={setSearchTerm}
            placeholder="Buscar por nome, e-mail ou empresa..."
          >
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="h-9 min-w-[150px] justify-start">
                  <Filter className="mr-2 h-4 w-4" aria-hidden="true" />
                  {selectedRole === 'all' ? 'Todos' : roleLabels[selectedRole]}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="shadow-admin-popover">
                {roleFilters.map((filter) => (
                  <DropdownMenuItem
                    key={filter.value}
                    className="cursor-pointer"
                    onClick={() => setSelectedRole(filter.value)}
                  >
                    {filter.label}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </FilterBar>
        </div>

        {filteredUsers.length === 0 ? (
          <EmptyState
            icon={Users}
            title="Nenhum usuário encontrado"
            description="Nenhum usuário corresponde aos filtros aplicados. Tente limpar a busca ou escolher outro perfil."
          />
        ) : (
          <div className="overflow-x-auto">
            <Table className="min-w-[620px]">
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className={headCell}>Usuário</TableHead>
                  <TableHead className={headCell}>Perfil</TableHead>
                  <TableHead className={headCell}>Status</TableHead>
                  <TableHead className="w-12" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-9 w-9">
                          <AvatarImage src={user.avatar} alt={user.name} />
                          <AvatarFallback className="bg-foreground text-xs font-semibold text-background">
                            {initials(user.name)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <div className="truncate text-[13.5px] font-semibold">{user.name}</div>
                          <div className="truncate font-mono text-[11px] text-muted-foreground">
                            {user.email}
                          </div>
                          {user.phone && (
                            <div className="font-mono text-[11px] tabular-nums text-muted-foreground">
                              {user.phone}
                            </div>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <StatusPill label={roleLabels[user.role]} tone={roleTones[user.role]} />
                    </TableCell>
                    <TableCell>
                      <StatusPill
                        label={user.isActive ? 'Ativo' : 'Inativo'}
                        tone={user.isActive ? 'success' : 'neutral'}
                      />
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            className="h-8 w-8 p-0"
                            aria-label={`Ações de ${user.name}`}
                          >
                            <MoreHorizontal className="h-4 w-4" aria-hidden="true" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="shadow-admin-popover">
                          <DropdownMenuItem
                            className="cursor-pointer"
                            onClick={() => navigate(`/admin/users/${user.id}/edit`)}
                          >
                            <Edit className="mr-2 h-4 w-4" aria-hidden="true" />
                            Editar
                          </DropdownMenuItem>
                          {user.role === 'user' && (
                            <>
                              <DropdownMenuItem
                                className="cursor-pointer"
                                onClick={() => navigate(`/admin/users/${user.id}/assign-plan`)}
                              >
                                <UserPlus className="mr-2 h-4 w-4" aria-hidden="true" />
                                Atribuir plano
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                className="cursor-pointer"
                                onClick={() => navigate(`/admin/users/${user.id}/subscriptions`)}
                              >
                                <Package className="mr-2 h-4 w-4" aria-hidden="true" />
                                Ver assinaturas
                              </DropdownMenuItem>
                            </>
                          )}
                          <DropdownMenuItem
                            className="cursor-pointer"
                            onClick={() => handleToggleStatus(user.id)}
                          >
                            {user.isActive ? 'Desativar' : 'Ativar'}
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="cursor-pointer text-destructive focus:text-destructive"
                            onClick={() => handleDeleteUser(user.id)}
                          >
                            <Trash2 className="mr-2 h-4 w-4" aria-hidden="true" />
                            Remover
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </div>
  );
};
