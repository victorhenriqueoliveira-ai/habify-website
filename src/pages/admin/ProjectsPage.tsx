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
import {
  MoreHorizontal,
  Plus,
  Eye,
  Edit,
  Trash2,
  ExternalLink,
  Filter,
  CheckCircle,
  XCircle,
  FolderKanban,
} from 'lucide-react';
import { ProjectStatus } from '@/types/admin';
import { useAuth } from '@/contexts/AuthContext';
import { useProjects } from '@/hooks/useProjects';
import { useUsers } from '@/hooks/useUsers';
import { useRealtimeProjects } from '@/hooks/useRealtimeProjects';
import { toast } from 'sonner';
import { ProjectsTableSkeleton } from '@/components/ui/skeleton-loaders';
import {
  EmptyState,
  FilterBar,
  PageHeader,
  SectionHeader,
  StatCard,
  StatusPill,
  type StatusTone,
} from '@/components/admin/ui';

const statusTones: Record<ProjectStatus, StatusTone> = {
  pending: 'warning',
  in_progress: 'info',
  in_review: 'primary',
  completed: 'success',
  approved: 'success',
  rejected: 'destructive',
};

const statusLabels: Record<ProjectStatus, string> = {
  pending: 'Pendente',
  in_progress: 'Em andamento',
  in_review: 'Em revisão',
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

const statusFilters: Array<{ value: ProjectStatus | 'all'; label: string }> = [
  { value: 'all', label: 'Todos os status' },
  { value: 'pending', label: 'Pendentes' },
  { value: 'in_progress', label: 'Em andamento' },
  { value: 'in_review', label: 'Em revisão' },
  { value: 'completed', label: 'Concluídos' },
  { value: 'rejected', label: 'Rejeitados' },
];

export const ProjectsPage = () => {
  const navigate = useNavigate();
  const { user, hasRole } = useAuth();
  const { projects, loading, updateProject, deleteProject } = useProjects();
  const { users } = useUsers();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<ProjectStatus | 'all'>('all');
  const isStaff = hasRole(['admin', 'dev']);

  // Enable realtime updates
  useRealtimeProjects();

  // Filter projects based on user role and search/status
  const userProjects = isStaff ? projects : projects.filter((p) => p.userId === user?.id);

  const filteredProjects = userProjects.filter((project) => {
    const term = searchTerm.toLowerCase();
    const matchesSearch =
      project.title.toLowerCase().includes(term) ||
      project.location.toLowerCase().includes(term) ||
      project.description.toLowerCase().includes(term);
    const matchesStatus = selectedStatus === 'all' || project.status === selectedStatus;
    return matchesSearch && matchesStatus;
  });

  const countByStatus = (status: ProjectStatus) =>
    userProjects.filter((p) => p.status === status).length;

  const handleStatusChange = async (projectId: string, newStatus: ProjectStatus) => {
    const project = projects.find((p) => p.id === projectId);
    if (!project) return;

    await updateProject(projectId, { status: newStatus });
    toast.success('Status atualizado', {
      description: `${project.title} — status alterado para: ${statusLabels[newStatus]}`,
    });
  };

  const handleDeleteProject = async (projectId: string) => {
    const project = projects.find((p) => p.id === projectId);
    if (!project) return;

    await deleteProject(projectId);
    toast.error('Projeto removido', { description: `${project.title} foi removido do sistema` });
  };

  const getUserName = (userId: string) => {
    const found = users.find((u) => u.userId === userId);
    return found?.name || 'Cliente não encontrado';
  };

  return (
    <div className="space-y-6">
      <PageHeader
        icon={FolderKanban}
        eyebrow="Projetos"
        title={isStaff ? 'Projetos' : 'Meus projetos'}
        description={
          isStaff ? 'Gerencie todos os projetos do sistema' : 'Acompanhe o status dos seus projetos'
        }
        actions={
          hasRole(['user']) && (
            <Button onClick={() => navigate('/admin/new-project')}>
              <Plus className="mr-2 h-4 w-4" aria-hidden="true" />
              Novo projeto
            </Button>
          )
        }
      />

      <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-5">
        <StatCard label="Total" value={userProjects.length} />
        <StatCard label="Pendentes" value={countByStatus('pending')} tone="warning" />
        <StatCard label="Em andamento" value={countByStatus('in_progress')} tone="info" />
        <StatCard label="Em revisão" value={countByStatus('in_review')} tone="primary" />
        <StatCard label="Concluídos" value={countByStatus('completed')} tone="success" />
      </div>

      <div className="admin-card-elevated">
        <div className="space-y-4 border-b border-border p-4 sm:p-5">
          <SectionHeader
            title="Lista de projetos"
            count={filteredProjects.length}
            description={
              selectedStatus === 'all'
                ? 'Todos os projetos'
                : `Filtrando por: ${statusLabels[selectedStatus]}`
            }
          />
          <FilterBar
            value={searchTerm}
            onChange={setSearchTerm}
            placeholder="Buscar por título, local ou descrição..."
          >
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="h-9 min-w-[150px] justify-start">
                  <Filter className="mr-2 h-4 w-4" aria-hidden="true" />
                  {selectedStatus === 'all' ? 'Todos' : statusLabels[selectedStatus]}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="shadow-admin-popover">
                {statusFilters.map((filter) => (
                  <DropdownMenuItem
                    key={filter.value}
                    onClick={() => setSelectedStatus(filter.value)}
                    className="cursor-pointer"
                  >
                    {filter.label}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </FilterBar>
        </div>

        {loading ? (
          <div className="p-4 sm:p-5">
            <ProjectsTableSkeleton />
          </div>
        ) : filteredProjects.length === 0 ? (
          <EmptyState
            icon={FolderKanban}
            title="Nenhum projeto encontrado"
            description={
              searchTerm || selectedStatus !== 'all'
                ? 'Nenhum projeto corresponde aos filtros aplicados. Tente limpar a busca ou escolher outro status.'
                : 'Os projetos criados vão aparecer aqui.'
            }
          />
        ) : (
          /* min-w na tabela + overflow só neste contêiner: a página em si
           *  nunca rola na horizontal, nem no celular. */
          <div className="overflow-x-auto">
            <Table className="min-w-[860px]">
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="font-mono text-[10px] uppercase tracking-[0.09em]">Projeto</TableHead>
                  {isStaff && (
                    <TableHead className="font-mono text-[10px] uppercase tracking-[0.09em]">Cliente</TableHead>
                  )}
                  <TableHead className="font-mono text-[10px] uppercase tracking-[0.09em]">
                    Tipo / Localização
                  </TableHead>
                  <TableHead className="text-right font-mono text-[10px] uppercase tracking-[0.09em]">
                    Valor
                  </TableHead>
                  <TableHead className="font-mono text-[10px] uppercase tracking-[0.09em]">Status</TableHead>
                  <TableHead className="font-mono text-[10px] uppercase tracking-[0.09em]">Criado</TableHead>
                  <TableHead className="w-12" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProjects.map((project) => (
                  <TableRow key={project.id}>
                    <TableCell className="max-w-[260px]">
                      <div className="truncate text-[13.5px] font-semibold">{project.title}</div>
                      <div className="line-clamp-1 text-[12.5px] text-muted-foreground">
                        {project.description}
                      </div>
                      {project.landingPageUrl && (
                        <a
                          href={project.landingPageUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-0.5 inline-flex items-center gap-1 text-[12.5px] font-medium text-primary hover:underline"
                        >
                          Ver landing page
                          <ExternalLink className="h-3 w-3" aria-hidden="true" />
                        </a>
                      )}
                    </TableCell>
                    {isStaff && (
                      <TableCell className="text-[13px] font-medium">{getUserName(project.userId)}</TableCell>
                    )}
                    <TableCell>
                      <div className="text-[13px] font-medium">
                        {propertyTypeLabels[project.propertyType]}
                      </div>
                      <div className="text-[12.5px] text-muted-foreground">{project.location}</div>
                      <div className="font-mono text-[11px] tabular-nums text-muted-foreground">
                        {project.area}m² · {project.bedrooms}q · {project.bathrooms}b
                      </div>
                    </TableCell>
                    <TableCell className="text-right text-[13px] font-semibold tabular-nums">
                      R$ {project.price.toLocaleString('pt-BR')}
                    </TableCell>
                    <TableCell>
                      <StatusPill label={statusLabels[project.status]} tone={statusTones[project.status]} />
                    </TableCell>
                    <TableCell className="font-mono text-[11.5px] tabular-nums text-muted-foreground">
                      {new Date(project.createdAt).toLocaleDateString('pt-BR')}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            className="h-8 w-8 p-0"
                            aria-label={`Ações de ${project.title}`}
                          >
                            <MoreHorizontal className="h-4 w-4" aria-hidden="true" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="shadow-admin-popover">
                          <DropdownMenuItem
                            className="cursor-pointer"
                            onClick={() => navigate(`/admin/projects/${project.id}`)}
                          >
                            <Eye className="mr-2 h-4 w-4" aria-hidden="true" />
                            Visualizar
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="cursor-pointer"
                            onClick={() => navigate(`/admin/projects/${project.id}/edit`)}
                          >
                            <Edit className="mr-2 h-4 w-4" aria-hidden="true" />
                            Editar
                          </DropdownMenuItem>
                          {isStaff && (
                            <>
                              {project.status === 'pending' && (
                                <>
                                  <DropdownMenuItem
                                    className="cursor-pointer"
                                    onClick={() => handleStatusChange(project.id, 'in_progress')}
                                  >
                                    <CheckCircle className="mr-2 h-4 w-4" aria-hidden="true" />
                                    Aprovar
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    className="cursor-pointer text-destructive focus:text-destructive"
                                    onClick={() => handleStatusChange(project.id, 'rejected')}
                                  >
                                    <XCircle className="mr-2 h-4 w-4" aria-hidden="true" />
                                    Rejeitar
                                  </DropdownMenuItem>
                                </>
                              )}
                              {project.status === 'in_progress' && (
                                <DropdownMenuItem
                                  className="cursor-pointer"
                                  onClick={() => handleStatusChange(project.id, 'completed')}
                                >
                                  <CheckCircle className="mr-2 h-4 w-4" aria-hidden="true" />
                                  Finalizar
                                </DropdownMenuItem>
                              )}
                              {project.status === 'in_review' && (
                                <>
                                  <DropdownMenuItem
                                    className="cursor-pointer"
                                    onClick={() => handleStatusChange(project.id, 'completed')}
                                  >
                                    <CheckCircle className="mr-2 h-4 w-4" aria-hidden="true" />
                                    Aprovar revisão
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    className="cursor-pointer text-destructive focus:text-destructive"
                                    onClick={() => handleStatusChange(project.id, 'rejected')}
                                  >
                                    <XCircle className="mr-2 h-4 w-4" aria-hidden="true" />
                                    Rejeitar
                                  </DropdownMenuItem>
                                </>
                              )}
                            </>
                          )}
                          <DropdownMenuItem
                            className="cursor-pointer text-destructive focus:text-destructive"
                            onClick={() => handleDeleteProject(project.id)}
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
