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
import { 
  Search, 
  MoreHorizontal, 
  Plus, 
  Eye, 
  ExternalLink,
  Filter,
  MessageSquare,
  Calendar,
} from 'lucide-react';
import { Project, ProjectStatus } from '@/types/admin';
import { useAuth } from '@/contexts/AuthContext';
import { useProjects } from '@/hooks/useProjects';
import { useUsers } from '@/hooks/useUsers';
import { useRealtimeProjects } from '@/hooks/useRealtimeProjects';

import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useProjectLimits } from '@/hooks/useProjectLimits';
import { useCanViewPlans } from '@/hooks/useCanViewPlans';

const statusColors = {
  pending: 'secondary',
  in_progress: 'default',
  completed: 'default',
  approved: 'default',
  rejected: 'destructive',
} as const;

const statusLabels = {
  pending: 'Pendente',
  in_progress: 'Em Andamento',
  completed: 'Concluído',
  approved: 'Aprovado',
  rejected: 'Rejeitado',
};

const propertyTypeLabels = {
  house: 'Casa',
  apartment: 'Apartamento',
  land: 'Terreno',
  commercial: 'Comercial',
};

export const MyProjectsPage = () => {
  const navigate = useNavigate();
  const { user, hasRole } = useAuth();
  const isRegularUser = hasRole(['user']);
  const { projects, loading } = useProjects();
  const { users } = useUsers();
  const { canCreateProject, activeProjectsCount } = useProjectLimits();
  const { canViewPlans } = useCanViewPlans();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<ProjectStatus | 'all'>('all');
  
  // Enable realtime updates
  useRealtimeProjects();

  // Filter projects - dev/admin see all projects, users see only their own
  const userProjects = hasRole(['admin', 'dev']) 
    ? projects 
    : projects.filter(p => p.userId === user?.id || p.userId === user?.userId);
    
  const filteredProjects = userProjects.filter((project) => {
    const matchesSearch = project.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         project.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         project.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = selectedStatus === 'all' || project.status === selectedStatus;
    return matchesSearch && matchesStatus;
  });

  const getUserName = (userId: string) => {
    const user = users.find(u => u.userId === userId);
    return user?.name || 'Cliente não encontrado';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            {hasRole(['admin', 'dev']) ? 'Todos os Projetos' : 'Meus Projetos'}
          </h1>
          <p className="text-muted-foreground">
            {hasRole(['admin', 'dev']) 
              ? 'Gerencie todos os projetos do sistema'
              : 'Acompanhe o status e gerencie seus projetos'}
          </p>
        </div>
      <div className="flex gap-2">
          {canViewPlans && isRegularUser ? (
            <>
              {/* Sempre mostrar botão "Criar Projeto" se houver planos disponíveis */}
              {canCreateProject && (
                <Button onClick={() => navigate('/admin/new-project')}>
                  <Plus className="mr-2 h-4 w-4" />
                  Criar Projeto
                </Button>
              )}
              {/* Botão secundário para adquirir mais planos */}
              <Button 
                variant="outline" 
                onClick={() => navigate('/admin/new-project-purchase')}
              >
                <Plus className="mr-2 h-4 w-4" />
                Adquirir Mais Planos
              </Button>
            </>
          ) : (
            <Button onClick={() => navigate('/admin/new-project')}>
              <Plus className="mr-2 h-4 w-4" />
              Novo Projeto
            </Button>
          )}
        </div>
      </div>

      {/* Alert: Sem planos disponíveis */}
      {canViewPlans && isRegularUser && !canCreateProject && (
        <Card className="border-amber-200 bg-amber-50">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 rounded-full bg-amber-500 flex items-center justify-center flex-shrink-0">
                  <span className="text-white text-xs font-bold">!</span>
                </div>
                <div>
                  <h3 className="font-medium text-amber-800">Nenhum Plano Disponível</h3>
                  <p className="text-sm text-amber-700">
                    Você tem {activeProjectsCount} projeto(s) ativo(s). Adquira um novo plano para criar mais projetos.
                  </p>
                </div>
              </div>
              <Button 
                size="sm" 
                onClick={() => navigate('/admin/new-project-purchase')}
              >
                Adquirir Plano
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Info: Planos disponíveis */}
      {canViewPlans && isRegularUser && canCreateProject && (
        <Card className="border-green-200 bg-green-50">
          <CardContent className="pt-6">
            <div className="flex items-start space-x-3">
              <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0">
                <span className="text-white text-xs font-bold">✓</span>
              </div>
              <div>
                <h3 className="font-medium text-green-800">Você tem planos disponíveis!</h3>
                <p className="text-sm text-green-700">
                  Clique em "Criar Projeto" para usar um de seus planos ativos e criar uma nova landing page.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{userProjects.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">⏳ Pendentes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {userProjects.filter(p => p.status === 'pending').length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">🚧 Em Andamento</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {userProjects.filter(p => p.status === 'in_progress').length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">✅ Concluídos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {userProjects.filter(p => p.status === 'completed' || p.status === 'approved').length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Projects by Status Sections */}
      <div className="space-y-8">
        {/* Pending Projects */}
        {userProjects.filter(p => p.status === 'pending').length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                ⏳ Projetos Pendentes ({userProjects.filter(p => p.status === 'pending').length})
              </CardTitle>
              <CardDescription>
                Projetos aguardando aprovação e início dos trabalhos
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {userProjects.filter(p => p.status === 'pending').map((project) => (
                  <Card key={project.id} className="border-yellow-200">
                    <CardContent className="pt-4">
                      <div className="space-y-2">
                        <h3 className="font-medium">{project.title}</h3>
                        {hasRole(['admin', 'dev']) && (
                          <p className="text-sm text-muted-foreground">
                            Cliente: {getUserName(project.userId)}
                          </p>
                        )}
                        <p className="text-sm text-muted-foreground">{project.location || 'Local não definido'}</p>
                        <div className="text-sm">
                          {project.price > 0 && (
                            <p className="font-medium">R$ {project.price.toLocaleString('pt-BR')}</p>
                          )}
                          <p className="text-muted-foreground">
                            {format(new Date(project.createdAt), 'dd/MM/yyyy', { locale: ptBR })}
                          </p>
                        </div>
          <Button 
            size="sm" 
            variant="outline" 
            onClick={() => navigate(`/admin/projects/${project.id}`)}
            className="w-full"
          >
                          <Eye className="mr-2 h-4 w-4" />
                          Ver Detalhes
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* In Progress Projects */}
        {userProjects.filter(p => p.status === 'in_progress').length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                🚧 Projetos Em Andamento ({userProjects.filter(p => p.status === 'in_progress').length})
              </CardTitle>
              <CardDescription>
                Projetos sendo desenvolvidos pela nossa equipe
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {userProjects.filter(p => p.status === 'in_progress').map((project) => (
                  <Card key={project.id} className="border-blue-200">
                    <CardContent className="pt-4">
                      <div className="space-y-2">
                        <h3 className="font-medium">{project.title}</h3>
                        {hasRole(['admin', 'dev']) && (
                          <p className="text-sm text-muted-foreground">
                            Cliente: {getUserName(project.userId)}
                          </p>
                        )}
                        <p className="text-sm text-muted-foreground">{project.location || 'Local não definido'}</p>
                        <div className="text-sm">
                          {project.price > 0 && (
                            <p className="font-medium">R$ {project.price.toLocaleString('pt-BR')}</p>
                          )}
                          <p className="text-muted-foreground">
                            {format(new Date(project.createdAt), 'dd/MM/yyyy', { locale: ptBR })}
                          </p>
                        </div>
                        <div className="flex space-x-2">
                          <Button 
                            size="sm" 
                            variant="outline" 
                            onClick={() => navigate(`/admin/projects/${project.id}`)}
                            className="flex-1"
                          >
                            <Eye className="mr-2 h-4 w-4" />
                            Ver Detalhes
                          </Button>
                          <Button 
                            size="sm" 
                            onClick={() => navigate(`/admin/projects/${project.id}?tab=chat`)}
                            className="flex-1"
                          >
                            <MessageSquare className="mr-2 h-4 w-4" />
                            Chat
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Completed Projects */}
        {userProjects.filter(p => p.status === 'completed' || p.status === 'approved').length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                ✅ Projetos Concluídos ({userProjects.filter(p => p.status === 'completed' || p.status === 'approved').length})
              </CardTitle>
              <CardDescription>
                Projetos finalizados e entregues
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {userProjects.filter(p => p.status === 'completed' || p.status === 'approved').map((project) => (
                  <Card key={project.id} className="border-green-200">
                    <CardContent className="pt-4">
                      <div className="space-y-2">
                        <h3 className="font-medium">{project.title}</h3>
                        {hasRole(['admin', 'dev']) && (
                          <p className="text-sm text-muted-foreground">
                            Cliente: {getUserName(project.userId)}
                          </p>
                        )}
                        <p className="text-sm text-muted-foreground">{project.location || 'Local não definido'}</p>
                        <div className="text-sm">
                          {project.price > 0 && (
                            <p className="font-medium">R$ {project.price.toLocaleString('pt-BR')}</p>
                          )}
                          <p className="text-muted-foreground">
                            Concluído em {format(new Date(project.completedAt || project.updatedAt), 'dd/MM/yyyy', { locale: ptBR })}
                          </p>
                        </div>
                        <div className="flex space-x-2">
                          <Button 
                            size="sm" 
                            variant="outline" 
                            onClick={() => navigate(`/admin/projects/${project.id}`)}
                            className="flex-1"
                          >
                            <Eye className="mr-2 h-4 w-4" />
                            Ver Detalhes
                          </Button>
                          {project.landingPageUrl && (
                            <Button 
                              size="sm" 
                              onClick={() => window.open(project.landingPageUrl, '_blank')}
                              className="flex-1"
                            >
                              <ExternalLink className="mr-2 h-4 w-4" />
                              Ver Site
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Empty State */}
        {userProjects.length === 0 && (
          <Card>
            <CardContent className="text-center py-12">
              <div className="max-w-md mx-auto">
                <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                  <Plus className="w-8 h-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-medium mb-2">Nenhum projeto ainda</h3>
                <p className="text-muted-foreground mb-6">
                  Comece criando seu primeiro projeto para ter sua landing page personalizada.
                </p>
                <Button onClick={() => navigate('/admin/new-project')}>
                  <Plus className="mr-2 h-4 w-4" />
                  Criar Primeiro Projeto
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};