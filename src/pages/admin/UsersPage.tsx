import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
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
import { 
  Search, 
  MoreHorizontal, 
  UserPlus, 
  Edit, 
  Trash2, 
  Shield,
  Filter,
  Package,
} from 'lucide-react';
import { User, UserRole } from '@/types/admin';
import { useUsers } from '@/hooks/useUsers';
import { useAuth } from '@/contexts/AuthContext';

import { AssignPlanModal } from '@/components/admin/AssignPlanModal';
import { toast } from '@/hooks/use-toast';

const roleColors = {
  user: 'default',
  admin: 'secondary',
  dev: 'destructive',
} as const;

const roleLabels = {
  user: 'Corretor',
  admin: 'Admin',
  dev: 'Desenvolvedor',
};

export const UsersPage = () => {
  const navigate = useNavigate();
  const { users, loading, updateUser, deleteUser } = useUsers();
  const { hasRole } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRole, setSelectedRole] = useState<UserRole | 'all'>('all');
  const [assigningPlanUser, setAssigningPlanUser] = useState<User | null>(null);

  // Filter users based on search and role
  const filteredUsers = users.filter((user) => {
    const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.company?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = selectedRole === 'all' || user.role === selectedRole;
    return matchesSearch && matchesRole;
  });

  const handleToggleStatus = async (userId: string) => {
    const user = users.find(u => u.id === userId);
    if (!user) return;
    
    await updateUser(userId, { isActive: !user.isActive });
    toast({
      title: 'Status atualizado',
      description: `${user.name} foi ${user.isActive ? 'desativado' : 'ativado'}`,
    });
  };

  const handleDeleteUser = async (userId: string) => {
    const user = users.find(u => u.id === userId);
    if (!user) return;
    
    await deleteUser(userId);
    toast({
      title: 'Usuário removido',
      description: `${user.name} foi removido do sistema`,
      variant: 'destructive',
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Usuários</h1>
          <p className="text-muted-foreground">
            Gerencie todos os usuários do sistema
          </p>
        </div>
        <Button onClick={() => navigate('/admin/users/new')}>
          <UserPlus className="mr-2 h-4 w-4" />
          Novo Usuário
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Buscar usuários..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="min-w-[120px]">
                  <Filter className="mr-2 h-4 w-4" />
                  {selectedRole === 'all' ? 'Todos' : roleLabels[selectedRole]}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={() => setSelectedRole('all')}>
                  Todos os perfis
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSelectedRole('user')}>
                  Corretores
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSelectedRole('admin')}>
                  Administradores
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSelectedRole('dev')}>
                  Desenvolvedores
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle>
            Lista de Usuários ({filteredUsers.length})
          </CardTitle>
          <CardDescription>
            {selectedRole === 'all' 
              ? 'Todos os usuários cadastrados' 
              : `Filtrando por: ${roleLabels[selectedRole]}`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center items-center p-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Usuário</TableHead>
                    <TableHead>Perfil</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Último Login</TableHead>
                    <TableHead className="w-12"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>
                        <div className="flex items-center space-x-3">
                          <Avatar className="h-10 w-10">
                            <AvatarImage src={user.avatar} alt={user.name} />
                            <AvatarFallback>
                              {user.name.split(' ').map(n => n[0]).join('')}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium">{user.name}</div>
                            <div className="text-sm text-muted-foreground">
                              {user.email}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {user.phone}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={roleColors[user.role]}>
                          {user.role === 'dev' && <Shield className="mr-1 h-3 w-3" />}
                          {roleLabels[user.role]}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={user.isActive ? 'default' : 'secondary'}>
                          {user.isActive ? 'Ativo' : 'Inativo'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {user.lastLogin ? new Date(user.lastLogin).toLocaleDateString('pt-BR') : 'Nunca'}
                        </div>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => navigate(`/admin/users/${user.id}/edit`)}>
                              <Edit className="mr-2 h-4 w-4" />
                              Editar
                            </DropdownMenuItem>
                            {user.role === 'user' && (
                              <>
                                <DropdownMenuItem onClick={() => setAssigningPlanUser(user)}>
                                  <UserPlus className="mr-2 h-4 w-4" />
                                  Atribuir Plano
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => navigate(`/admin/users/${user.id}/subscriptions`)}>
                                  <Package className="mr-2 h-4 w-4" />
                                  Ver Assinaturas
                                </DropdownMenuItem>
                              </>
                            )}
                            <DropdownMenuItem onClick={() => handleToggleStatus(user.id)}>
                              {user.isActive ? 'Desativar' : 'Ativar'}
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => handleDeleteUser(user.id)}
                              className="text-red-600"
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Remover
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              
              {filteredUsers.length === 0 && (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">
                    Nenhum usuário encontrado com os filtros aplicados.
                  </p>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Assign Plan Modal */}
      {assigningPlanUser && (
        <AssignPlanModal
          open={!!assigningPlanUser}
          onClose={() => setAssigningPlanUser(null)}
          userId={assigningPlanUser.id}
          userName={assigningPlanUser.name}
          onSuccess={() => {
            toast({
              title: 'Plano atribuído!',
              description: `Plano foi atribuído com sucesso para ${assigningPlanUser.name}`,
            });
          }}
        />
      )}
    </div>
  );
};