import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ProjectStatusSection } from '@/components/admin/ProjectStatusSection';
import { PageHeader, StatCard, EmptyState, LoadingState } from '@/components/admin/ui';
import {
  Clock,
  Hammer,
  Search,
  CheckCircle2,
  Plus,
  ShoppingCart,
  AlertTriangle,
  FolderKanban,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useProjects } from '@/hooks/useProjects';
import { useUsers } from '@/hooks/useUsers';
import { useRealtimeProjects } from '@/hooks/useRealtimeProjects';

import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useCanViewPlans } from '@/hooks/useCanViewPlans';
import { useUserPlans } from '@/hooks/useUserPlans';

export const MyProjectsPage = () => {
  const navigate = useNavigate();
  const { user, hasRole } = useAuth();
  const isRegularUser = hasRole(['user']);
  const { projects } = useProjects();
  const { users } = useUsers();
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
    return <LoadingState label="Carregando seus projetos..." fullScreen />;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        icon={FolderKanban}
        title={hasRole(['admin', 'dev']) ? 'Todos os Projetos' : 'Meus Projetos'}
        description={
          hasRole(['admin', 'dev'])
            ? 'Gerencie todos os projetos do sistema'
            : 'Acompanhe o status e gerencie seus projetos'
        }
        actions={
          <>
            {canCreateMoreProjects && (
              <Button onClick={handleNewProject}>
                <Plus className="mr-2 h-4 w-4" />
                Criar Novo Projeto
              </Button>
            )}
            {isRegularUser && (
              <Button
                onClick={() => navigate('/admin/new-project-purchase')}
                variant={canCreateMoreProjects ? 'outline' : 'default'}
              >
                <ShoppingCart className="mr-2 h-4 w-4" />
                Adquirir Mais Planos
              </Button>
            )}
          </>
        }
      />

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
      <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-5">
        <StatCard label="Total" value={userProjects.length} />
        <StatCard label="Pendentes" value={pendingProjects.length} icon={Clock} tone="warning" />
        <StatCard label="Em Andamento" value={inProgressProjects.length} icon={Hammer} tone="info" />
        <StatCard label="Em Revisão" value={inReviewProjects.length} icon={Search} tone="primary" />
        <StatCard label="Concluídos" value={completedProjects.length} icon={CheckCircle2} tone="success" />
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
            <CardContent>
              <EmptyState
                icon={FolderKanban}
                title="Nenhum projeto ainda"
                description="Comece criando seu primeiro projeto para ter sua landing page personalizada."
                action={{
                  label: 'Criar Primeiro Projeto',
                  icon: Plus,
                  onClick: () => navigate('/admin/new-project'),
                }}
              />
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};