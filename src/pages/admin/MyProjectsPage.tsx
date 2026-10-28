import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ProjectStatusSection } from '@/components/admin/ProjectStatusSection';
import { AdminNotice, PageHeader, StatCard, EmptyState, LoadingState } from '@/components/admin/ui';
import { Clock, Hammer, Search, CheckCircle2, Plus, ShoppingCart, FolderKanban } from 'lucide-react';
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
        eyebrow="Projetos"
        title={hasRole(['admin', 'dev']) ? 'Todos os projetos' : 'Meus projetos'}
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
                Criar novo projeto
              </Button>
            )}
            {isRegularUser && (
              <Button
                onClick={() => navigate('/admin/new-project-purchase')}
                variant={canCreateMoreProjects ? 'outline' : 'default'}
              >
                <ShoppingCart className="mr-2 h-4 w-4" />
                Adquirir mais planos
              </Button>
            )}
          </>
        }
      />

      {/* Alert: Sem planos disponíveis */}
      {isRegularUser && !canCreateMoreProjects && (
        <AdminNotice
          tone="warning"
          title="Nenhum plano disponível"
          description="Adquira um novo plano para criar projetos."
          action={
            <Button size="sm" onClick={() => navigate('/admin/new-project-purchase')}>
              Adquirir plano
            </Button>
          }
        />
      )}

      {/* Info: Planos disponíveis */}
      {isRegularUser && canCreateMoreProjects && availablePlans.length > 0 && (
        <AdminNotice
          tone="success"
          title={`Você tem ${availablePlans.length} ${availablePlans.length === 1 ? 'plano disponível' : 'planos disponíveis'}`}
          description='Clique em "Criar novo projeto" para usar um dos seus planos ativos e montar uma nova landing page.'
        />
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-5">
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
          <EmptyState
            className="admin-card-elevated"
            icon={FolderKanban}
            title="Nenhum projeto ainda"
            description="Comece criando seu primeiro projeto para ter sua landing page personalizada."
            action={{
              label: 'Criar primeiro projeto',
              icon: Plus,
              onClick: () => navigate('/admin/new-project'),
            }}
          />
        )}
      </div>
    </div>
  );
};