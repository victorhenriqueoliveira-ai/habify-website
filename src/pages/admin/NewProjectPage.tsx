import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Plus, Eye, MessageSquare, ExternalLink } from 'lucide-react';
import { useProjects } from '@/hooks/useProjects';
import { useAuth } from '@/contexts/AuthContext';
import { useUsers } from '@/hooks/useUsers';
import { useRealtimeProjects } from '@/hooks/useRealtimeProjects';
import { PlanSelector } from '@/components/PlanSelector';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useProjectLimits } from '@/hooks/useProjectLimits';
import { Project, ProjectStatus } from '@/types/admin';

const statusLabels = {
  pending: 'Pendente',
  in_progress: 'Em Andamento',
  in_review: 'Em Revisão',
  completed: 'Concluído',
  approved: 'Aprovado',
  rejected: 'Rejeitado',
};

const statusColors = {
  pending: 'secondary',
  in_progress: 'default',
  in_review: 'outline',
  completed: 'default',
  approved: 'default',
  rejected: 'destructive',
} as const;

const NewProjectPage = () => {
  const navigate = useNavigate();
  const { projects, createProject, loading: projectsLoading } = useProjects();
  const { user, hasRole } = useAuth();
  const { users } = useUsers();
  const { canCreateProject } = useProjectLimits();
  const [loading, setLoading] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  
  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<ProjectStatus>('pending');
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);

  // For devs/admins, always allow project creation
  const isDevOrAdmin = hasRole(['admin', 'dev']);
  
  // Enable realtime updates
  useRealtimeProjects();
  
  // Redirect if regular user can't create projects
  if (!isDevOrAdmin && !canCreateProject) {
    navigate('/admin/new-project-purchase');
    return null;
  }

  // Filter projects for current user vs all projects for admin/dev
  const userProjects = isDevOrAdmin 
    ? projects 
    : projects.filter(p => p.userId === user?.id || p.userId === user?.userId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // For devs/admins, use selected user; for regular users, use their own ID
    const targetUserId = isDevOrAdmin ? selectedUserId : (user?.userId || user?.id);
    
    if (!targetUserId) {
      toast.error('Você precisa selecionar um cliente para criar o projeto');
      return;
    }

    if (!title.trim()) {
      toast.error('O título do projeto é obrigatório');
      return;
    }

    setLoading(true);
    
    try {
      // Verificar se o plano foi selecionado (apenas para usuários regulares)
      if (!isDevOrAdmin && !selectedPlanId) {
        toast.error('Selecione um plano para criar o projeto');
        setLoading(false);
        return;
      }

      const result = await createProject({
        userId: targetUserId,
        title: title.trim(),
        description: description.trim(),
        status: status,
        location: '',
        propertyType: 'house',
        price: 0,
        selectedPlanId: selectedPlanId || undefined,
        isAdminOrDev: isDevOrAdmin,
      });
      
      if (result.success) {
        const selectedUser = users.find(u => u.userId === targetUserId);
        toast.success(`Projeto criado para ${selectedUser?.name || 'cliente'} com sucesso!`);
        
        // Reset form
        setTitle('');
        setDescription('');
        setStatus('pending');
        setSelectedUserId('');
        setSelectedPlanId(null);
        
        // Don't navigate, stay on page to create more projects
      } else {
        toast.error('Erro ao criar projeto');
      }
    } catch (error) {
      toast.error('Erro interno do servidor');
    } finally {
      setLoading(false);
    }
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
          <h1 className="text-3xl font-bold tracking-tight">Gerenciar Projetos</h1>
          <p className="text-muted-foreground">
            Crie novos projetos e gerencie projetos existentes
          </p>
        </div>
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => navigate('/admin/projects')}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar para Projetos
        </Button>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Create New Project Form */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Criar Novo Projeto</CardTitle>
              <CardDescription>
                Preencha os dados para criar um novo projeto
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Client Selection for Dev/Admin */}
                {isDevOrAdmin && (
                  <div className="space-y-2">
                    <Label htmlFor="client">Cliente</Label>
                    <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione um cliente" />
                      </SelectTrigger>
                      <SelectContent>
                        {users
                          .filter(user => user.role === 'user')
                          .map((client) => (
                            <SelectItem key={client.userId} value={client.userId}>
                              {client.name} ({client.email})
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {/* Plan Selection for Regular Users */}
                {!isDevOrAdmin && (
                  <div className="space-y-2">
                    <PlanSelector
                      selectedPlanId={selectedPlanId}
                      onPlanSelect={setSelectedPlanId}
                    />
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="title">Nome do Projeto</Label>
                  <Input
                    id="title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Digite o nome do projeto"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Descrição</Label>
                  <Textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Descreva o projeto"
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Select value={status} onValueChange={(value: ProjectStatus) => setStatus(value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pendente</SelectItem>
                      <SelectItem value="in_progress">Em Andamento</SelectItem>
                      <SelectItem value="in_review">Em Revisão</SelectItem>
                      <SelectItem value="completed">Concluído</SelectItem>
                      <SelectItem value="approved">Aprovado</SelectItem>
                      <SelectItem value="rejected">Rejeitado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Button 
                  type="submit" 
                  disabled={
                    loading || 
                    (isDevOrAdmin && !selectedUserId) || 
                    (!isDevOrAdmin && !selectedPlanId) ||
                    !title.trim()
                  }
                  className="w-full"
                >
                  {loading ? 'Criando...' : 'Criar Projeto'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

      {/* Projects Display */}
        <div className="lg:col-span-2 space-y-6">
          {/* Stats Cards */}
          <div className="grid gap-4 md:grid-cols-5">
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
                <CardTitle className="text-sm font-medium">🔎 Em Revisão</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-primary">
                  {userProjects.filter(p => p.status === 'in_review').length}
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
          <div className="space-y-6">
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
                            {isDevOrAdmin && (
                              <p className="text-sm text-muted-foreground">
                                Cliente: {getUserName(project.userId)}
                              </p>
                            )}
                            <p className="text-sm text-muted-foreground">{project.location || 'Local não definido'}</p>
                            <div className="text-sm">
                              <p className="text-muted-foreground">
                                {format(new Date(project.createdAt), 'dd/MM/yyyy', { locale: ptBR })}
                              </p>
                            </div>
                            <Button 
                              size="sm" 
                              variant="outline" 
                              onClick={() => setSelectedProject(project)}
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
                    Projetos sendo desenvolvidos pela equipe
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {userProjects.filter(p => p.status === 'in_progress').map((project) => (
                      <Card key={project.id} className="border-blue-200">
                        <CardContent className="pt-4">
                          <div className="space-y-2">
                            <h3 className="font-medium">{project.title}</h3>
                            {isDevOrAdmin && (
                              <p className="text-sm text-muted-foreground">
                                Cliente: {getUserName(project.userId)}
                              </p>
                            )}
                            <p className="text-sm text-muted-foreground">{project.location || 'Local não definido'}</p>
                            <div className="text-sm">
                              <p className="text-muted-foreground">
                                {format(new Date(project.createdAt), 'dd/MM/yyyy', { locale: ptBR })}
                              </p>
                            </div>
                            <div className="flex space-x-2">
                              <Button 
                                size="sm" 
                                variant="outline" 
                                onClick={() => setSelectedProject(project)}
                                className="flex-1"
                              >
                                <Eye className="mr-2 h-4 w-4" />
                                Ver Detalhes
                              </Button>
                              <Button 
                                size="sm" 
                                onClick={() => setSelectedProject(project)}
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

            {/* In Review Projects */}
            {userProjects.filter(p => p.status === 'in_review').length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    🔎 Projetos Em Revisão ({userProjects.filter(p => p.status === 'in_review').length})
                  </CardTitle>
                  <CardDescription>
                    Site gerado automaticamente — aguardando conferência antes de finalizar
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {userProjects.filter(p => p.status === 'in_review').map((project) => (
                      <Card key={project.id} className="border-primary/30">
                        <CardContent className="pt-4">
                          <div className="space-y-2">
                            <h3 className="font-medium">{project.title}</h3>
                            {isDevOrAdmin && (
                              <p className="text-sm text-muted-foreground">
                                Cliente: {getUserName(project.userId)}
                              </p>
                            )}
                            <p className="text-sm text-muted-foreground">{project.location || 'Local não definido'}</p>
                            <div className="text-sm">
                              <p className="text-muted-foreground">
                                {format(new Date(project.createdAt), 'dd/MM/yyyy', { locale: ptBR })}
                              </p>
                            </div>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setSelectedProject(project)}
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
                            {isDevOrAdmin && (
                              <p className="text-sm text-muted-foreground">
                                Cliente: {getUserName(project.userId)}
                              </p>
                            )}
                            <p className="text-sm text-muted-foreground">{project.location || 'Local não definido'}</p>
                            <div className="text-sm">
                              <p className="text-muted-foreground">
                                Concluído em {format(new Date(project.completedAt || project.updatedAt), 'dd/MM/yyyy', { locale: ptBR })}
                              </p>
                            </div>
                            <div className="flex space-x-2">
                              <Button 
                                size="sm" 
                                variant="outline" 
                                onClick={() => setSelectedProject(project)}
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
                      Use o formulário ao lado para criar seu primeiro projeto.
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default NewProjectPage;