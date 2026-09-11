import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ProjectStatusSection } from '@/components/admin/ProjectStatusSection';
import {
  Clock,
  Hammer,
  Search,
  CheckCircle2,
  Plus,
  ShoppingCart,
  AlertTriangle,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useProjects } from '@/hooks/useProjects';
import { useUsers } from '@/hooks/useUsers';
import { useRealtimeProjects } from '@/hooks/useRealtimeProjects';

import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useProjectLimits } from '@/hooks/useProjectLimits';
import { useCanViewPlans } from '@/hooks/useCanViewPlans';
import { useUserPlans } from '@/hooks/useUserPlans';

export const MyProjectsPage = () => {
  const navigate = useNavigate();
  const { user, hasRole } = useAuth();
  const isRegularUser = hasRole(['user']);
  const { projects } = useProjects();
  const { users } = useUsers();
  useProjectLimits();
  useCanViewPlans();
  const { availablePlans, loading } = useUserPlans();

  // Enable realtime updates
  useRealtimeProjects();

  // Determine if user can create more projects
  const canCreateMoreProjects = hasRole(['admin', 'dev']) || availablePlans.length > 0;

  const handleNewProject = () => {
    navigate('/admin/new-project');
  };

  // Filter projects - dev/admin see all projects, users see only their own
  const userProjects = hasRole(['admin', 'dev'])
    ? projects
    : projects.filter(p => p.userId === user?.id || p.userId === user?.userId);

  const pendingProjects = userProjects.filter(p => p.status === 'pending');
  const inProgressProjects = userProjects.filter(p => p.status === 'in_progress');
  const inReviewProjects = userProjects.filter(p => p.status === 'in_review');
  const completedProjects = userProjects.filter(p => p.status === 'completed' || p.status === 'approved');

  const getUserName = (userId: string) => {
    const user = users.find(u => u.userId === userId);
    return user?.name || 'Cliente não encontrado';
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">Carregando seus projetos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between md:flex-row flex-col gap-4">
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
      <div className="flex flex-col md:flex-row gap-3">
          {canCreateMoreProjects && (
            <Button onClick={handleNewProject}>
              <Plus className="mr-2 h-4 w-4" />
              Criar Novo Projeto
            </Button>
          )}
          {isRegularUser && (
            <Button 
              onClick={() => navigate('/admin/new-project-purchase')}
              variant={canCreateMoreProjects ? "outline" : "default"}
            >
              <ShoppingCart className="mr-2 h-4 w-4" />
              Adquirir Mais Planos
            </Button>
          )}
        </div>
      </div>

      {/* Alert: Sem planos disponíveis */}
      {isRegularUser && !canCreateMoreProjects && (
        <Card className="border-warning/30 bg-warning/5">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 rounded-full bg-warning/15 flex items-center justify-center flex-shrink-0">
                  <AlertTriangle className="h-3.5 w-3.5 text-warning" />
                </div>
                <div>
                  <h3 className="font-medium text-foreground">Nenhum Plano Disponível</h3>
                  <p className="text-sm text-muted-foreground">
                    Adquira um novo plano para criar projetos.
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
      {isRegularUser && canCreateMoreProjects && availablePlans.length > 0 && (
        <Card className="border-success/30 bg-success/5">
          <CardContent className="pt-6">
            <div className="flex items-start space-x-3">
              <div className="w-6 h-6 rounded-full bg-success/15 flex items-center justify-center flex-shrink-0">
                <CheckCircle2 className="h-3.5 w-3.5 text-success" />
              </div>
              <div>
                <h3 className="font-medium text-foreground">
                  Você tem {availablePlans.length} {availablePlans.length === 1 ? 'plano disponível' : 'planos disponíveis'}!
                </h3>
                <p className="text-sm text-muted-foreground">
                  Clique em "Criar Novo Projeto" para usar um de seus planos ativos e criar uma nova landing page.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

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
          <CardHeader className="pb-2 flex flex-row items-center gap-2 space-y-0">
            <Clock className="h-4 w-4 text-warning" />
            <CardTitle className="text-sm font-medium">Pendentes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-warning">{pendingProjects.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2 flex flex-row items-center gap-2 space-y-0">
            <Hammer className="h-4 w-4 text-info" />
            <CardTitle className="text-sm font-medium">Em Andamento</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-info">{inProgressProjects.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2 flex flex-row items-center gap-2 space-y-0">
            <Search className="h-4 w-4 text-primary" />
            <CardTitle className="text-sm font-medium">Em Revisão</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{inReviewProjects.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2 flex flex-row items-center gap-2 space-y-0">
            <CheckCircle2 className="h-4 w-4 text-success" />
            <CardTitle className="text-sm font-medium">Concluídos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">{completedProjects.length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Projects by Status Sections */}
      <div className="space-y-8">
        <ProjectStatusSection
          icon={Clock}
          tone="warning"
          title="Projetos Pendentes"
          description="Projetos aguardando aprovação e início dos trabalhos"
          projects={pendingProjects}
          showClientName={hasRole(['admin', 'dev'])}
          getUserName={getUserName}
          onViewDetails={(id) => navigate(`/admin/projects/${id}`)}
          onOpenChat={(id) => navigate(`/admin/projects/${id}?tab=chat`)}
        />

        <ProjectStatusSection
          icon={Hammer}
          tone="info"
          title="Projetos Em Andamento"
          description="Projetos sendo desenvolvidos pela nossa equipe"
          projects={inProgressProjects}
          showClientName={hasRole(['admin', 'dev'])}
          getUserName={getUserName}
          onViewDetails={(id) => navigate(`/admin/projects/${id}`)}
          onOpenChat={(id) => navigate(`/admin/projects/${id}?tab=chat`)}
        />

        <ProjectStatusSection
          icon={Search}
          tone="review"
          title="Projetos Em Revisão"
          description="Site gerado automaticamente — aguardando conferência antes de finalizar"
          projects={inReviewProjects}
          showClientName={hasRole(['admin', 'dev'])}
          getUserName={getUserName}
          onViewDetails={(id) => navigate(`/admin/projects/${id}`)}
          onOpenChat={(id) => navigate(`/admin/projects/${id}?tab=chat`)}
        />

        <ProjectStatusSection
          icon={CheckCircle2}
          tone="success"
          title="Projetos Concluídos"
          description="Projetos finalizados e entregues"
          projects={completedProjects}
          showClientName={hasRole(['admin', 'dev'])}
          getUserName={getUserName}
          dateLabel={(project) =>
            `Concluído em ${format(new Date(project.completedAt || project.updatedAt), 'dd/MM/yyyy', { locale: ptBR })}`
          }
          onViewDetails={(id) => navigate(`/admin/projects/${id}`)}
          onOpenChat={(id) => navigate(`/admin/projects/${id}?tab=chat`)}
        />

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