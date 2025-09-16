import React, { useState } from 'react';
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
  Edit, 
  Trash2,
  ExternalLink,
  Filter,
  CheckCircle,
  XCircle,
} from 'lucide-react';
import { Project, ProjectStatus } from '@/types/admin';
import { useAuth } from '@/contexts/AuthContext';
import { useProjects } from '@/hooks/useProjects';
import { useUsers } from '@/hooks/useUsers';
import { useRealtimeProjects } from '@/hooks/useRealtimeProjects';
import { ProjectDetailsModal } from '@/components/ProjectDetailsModal';
import { toast } from '@/hooks/use-toast';

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

export const ProjectsPage = () => {
  const { user, hasRole } = useAuth();
  const { projects, loading, updateProject, deleteProject } = useProjects();
  const { users } = useUsers();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<ProjectStatus | 'all'>('all');
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  
  // Enable realtime updates
  useRealtimeProjects();

  // Filter projects based on user role and search/status
  const userProjects = hasRole(['admin', 'dev']) 
    ? projects 
    : projects.filter(p => p.userId === user?.id);
    
  const filteredProjects = userProjects.filter((project) => {
    const matchesSearch = project.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         project.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         project.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = selectedStatus === 'all' || project.status === selectedStatus;
    return matchesSearch && matchesStatus;
  });

  const handleStatusChange = async (projectId: string, newStatus: ProjectStatus) => {
    const project = projects.find(p => p.id === projectId);
    if (!project) return;
    
    await updateProject(projectId, { status: newStatus });
    toast({
      title: 'Status atualizado',
      description: `${project.title} - Status alterado para: ${statusLabels[newStatus]}`,
    });
  };

  const handleDeleteProject = async (projectId: string) => {
    const project = projects.find(p => p.id === projectId);
    if (!project) return;
    
    await deleteProject(projectId);
    toast({
      title: 'Projeto removido',
      description: `${project.title} foi removido do sistema`,
      variant: 'destructive',
    });
  };

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
            {hasRole(['admin', 'dev']) ? 'Projetos' : 'Meus Projetos'}
          </h1>
          <p className="text-muted-foreground">
            {hasRole(['admin', 'dev']) 
              ? 'Gerencie todos os projetos do sistema'
              : 'Acompanhe o status dos seus projetos'}
          </p>
        </div>
        <Button onClick={() => window.location.href = '/admin/new-project'}>
          <Plus className="mr-2 h-4 w-4" />
          Novo Projeto
        </Button>
      </div>

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
            <CardTitle className="text-sm font-medium">Pendentes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {userProjects.filter(p => p.status === 'pending').length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Em Andamento</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {userProjects.filter(p => p.status === 'in_progress').length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Concluídos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {userProjects.filter(p => p.status === 'completed').length}
            </div>
          </CardContent>
        </Card>
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
                  placeholder="Buscar projetos..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="min-w-[140px]">
                  <Filter className="mr-2 h-4 w-4" />
                  {selectedStatus === 'all' ? 'Todos' : statusLabels[selectedStatus]}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={() => setSelectedStatus('all')}>
                  Todos os status
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSelectedStatus('pending')}>
                  Pendentes
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSelectedStatus('in_progress')}>
                  Em Andamento
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSelectedStatus('completed')}>
                  Concluídos
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSelectedStatus('rejected')}>
                  Rejeitados
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardContent>
      </Card>

      {/* Projects Table */}
      <Card>
        <CardHeader>
          <CardTitle>
            Lista de Projetos ({filteredProjects.length})
          </CardTitle>
          <CardDescription>
            {selectedStatus === 'all' 
              ? 'Todos os projetos' 
              : `Filtrando por: ${statusLabels[selectedStatus]}`}
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
                    <TableHead>Projeto</TableHead>
                    {hasRole(['admin', 'dev']) && <TableHead>Cliente</TableHead>}
                    <TableHead>Tipo/Localização</TableHead>
                    <TableHead>Valor</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Criado</TableHead>
                    <TableHead className="w-12"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredProjects.map((project) => (
                    <TableRow key={project.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{project.title}</div>
                          <div className="text-sm text-muted-foreground line-clamp-1">
                            {project.description}
                          </div>
                          {project.landingPageUrl && (
                            <a 
                              href={project.landingPageUrl} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-sm text-primary hover:underline inline-flex items-center"
                            >
                              Ver Landing Page
                              <ExternalLink className="ml-1 h-3 w-3" />
                            </a>
                          )}
                        </div>
                      </TableCell>
                      {hasRole(['admin', 'dev']) && (
                        <TableCell>
                          <div className="font-medium">{getUserName(project.userId)}</div>
                        </TableCell>
                      )}
                      <TableCell>
                        <div>
                          <div className="font-medium">{propertyTypeLabels[project.propertyType]}</div>
                          <div className="text-sm text-muted-foreground">{project.location}</div>
                          <div className="text-sm text-muted-foreground">
                            {project.area}m² • {project.bedrooms}q • {project.bathrooms}b
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">
                          R$ {project.price.toLocaleString('pt-BR')}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={statusColors[project.status]}>
                          {statusLabels[project.status]}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {new Date(project.createdAt).toLocaleDateString('pt-BR')}
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
                            <DropdownMenuItem onClick={() => setSelectedProject(project)}>
                              <Eye className="mr-2 h-4 w-4" />
                              Visualizar
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Edit className="mr-2 h-4 w-4" />
                              Editar
                            </DropdownMenuItem>
                            {hasRole(['admin', 'dev']) && (
                              <>
                                {project.status === 'pending' && (
                                  <>
                                    <DropdownMenuItem 
                                      onClick={() => handleStatusChange(project.id, 'in_progress')}
                                    >
                                      <CheckCircle className="mr-2 h-4 w-4" />
                                      Aprovar
                                    </DropdownMenuItem>
                                    <DropdownMenuItem 
                                      onClick={() => handleStatusChange(project.id, 'rejected')}
                                      className="text-red-600"
                                    >
                                      <XCircle className="mr-2 h-4 w-4" />
                                      Rejeitar
                                    </DropdownMenuItem>
                                  </>
                                )}
                                {project.status === 'in_progress' && (
                                  <DropdownMenuItem 
                                    onClick={() => handleStatusChange(project.id, 'completed')}
                                  >
                                    <CheckCircle className="mr-2 h-4 w-4" />
                                    Finalizar
                                  </DropdownMenuItem>
                                )}
                              </>
                            )}
                            <DropdownMenuItem 
                              onClick={() => handleDeleteProject(project.id)}
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
              
              {filteredProjects.length === 0 && (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">
                    Nenhum projeto encontrado com os filtros aplicados.
                  </p>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Project Details Modal */}
      <ProjectDetailsModal
        project={selectedProject}
        open={!!selectedProject}
        onClose={() => setSelectedProject(null)}
      />
    </div>
  );
};