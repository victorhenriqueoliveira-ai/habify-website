import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Filter,
  Github,
  ExternalLink,
  Globe,
  CheckCircle2,
  XCircle,
  Clock,
  Route,
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { usePipelineOverview, PipelineProjectRow } from '@/hooks/usePipelineOverview';
import { useUsers } from '@/hooks/useUsers';
import { PipelineTimeline } from '@/components/admin/PipelineTimeline';
import {
  EmptyState,
  FilterBar,
  LoadingState,
  PageHeader,
  SectionHeader,
  StatCard,
  StatCardGrid,
  StatusPill,
} from '@/components/admin/ui';

type StatusFilter = 'all' | 'failed' | 'in_progress' | 'done' | 'never_run';

const AI_STATUS_LABELS: Record<string, string> = {
  idle: 'Nunca gerado',
  queued: 'Na fila',
  generating_structure: 'Estruturando',
  generating_content: 'Gerando conteúdo',
  rendering: 'Criando repositório',
  pushing_github: 'Publicando no GitHub',
  deploying: 'Publicando na Vercel',
  done: 'Concluído',
  failed: 'Falhou',
};

const isInProgress = (status: string | null): boolean =>
  !!status && !['idle', 'done', 'failed'].includes(status);

/** O ponto pulsando é o que distingue "em curso" de "parado" à distância. */
const getAiStatusBadge = (status: string | null) => {
  const s = status || 'idle';
  if (s === 'done') return <StatusPill label={AI_STATUS_LABELS[s]} tone="success" />;
  if (s === 'failed') return <StatusPill label={AI_STATUS_LABELS[s]} tone="destructive" />;
  if (isInProgress(s)) return <StatusPill label={AI_STATUS_LABELS[s] || s} tone="info" pulse />;
  return <StatusPill label={AI_STATUS_LABELS.idle} tone="neutral" />;
};

const FILTER_LABELS: Record<StatusFilter, string> = {
  all: 'Todos',
  failed: 'Falharam',
  in_progress: 'Em andamento',
  done: 'Concluídos',
  never_run: 'Nunca gerados',
};

const headCell = 'font-mono text-[10px] uppercase tracking-[0.09em]';

export default function PipelineLogsPage() {
  const { projects, loading } = usePipelineOverview();
  const { users } = useUsers();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [selectedProject, setSelectedProject] = useState<PipelineProjectRow | null>(null);

  const getUserName = (userId: string) => {
    const found = users.find((u) => u.userId === userId);
    return found?.name || 'Cliente não encontrado';
  };

  const filteredProjects = useMemo(() => {
    return projects.filter((project) => {
      const matchesSearch =
        project.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        getUserName(project.user_id).toLowerCase().includes(searchTerm.toLowerCase());

      const status = project.ai_generation_status || 'idle';
      const matchesFilter =
        statusFilter === 'all' ||
        (statusFilter === 'failed' && status === 'failed') ||
        (statusFilter === 'done' && status === 'done') ||
        (statusFilter === 'never_run' && status === 'idle') ||
        (statusFilter === 'in_progress' && isInProgress(status));

      return matchesSearch && matchesFilter;
    });
  }, [projects, searchTerm, statusFilter, users]); // eslint-disable-line react-hooks/exhaustive-deps -- getUserName is derived from `users`, already listed

  const counts = useMemo(() => {
    return {
      total: projects.length,
      failed: projects.filter((p) => p.ai_generation_status === 'failed').length,
      inProgress: projects.filter((p) => isInProgress(p.ai_generation_status)).length,
      done: projects.filter((p) => p.ai_generation_status === 'done').length,
    };
  }, [projects]);

  return (
    <div className="space-y-6">
      <PageHeader
        icon={Route}
        eyebrow="Infraestrutura"
        title="Pipeline de geração"
        description="Trajeto completo de cada projeto — GitHub, Vercel e domínio — pra saber exatamente onde parou quando algo não funciona."
      />

      <StatCardGrid>
        <StatCard label="Total de projetos" value={counts.total} />
        <StatCard label="Falharam" value={counts.failed} icon={XCircle} tone="destructive" />
        <StatCard label="Em andamento" value={counts.inProgress} icon={Clock} tone="info" />
        <StatCard label="Concluídos" value={counts.done} icon={CheckCircle2} tone="success" />
      </StatCardGrid>

      <div className="admin-card-elevated">
        <div className="space-y-4 border-b border-border p-4 sm:p-5">
          <SectionHeader
            title="Projetos"
            count={filteredProjects.length}
            description="Clique em um projeto para ver o trajeto completo, passo a passo."
          />
          <FilterBar
            value={searchTerm}
            onChange={setSearchTerm}
            placeholder="Buscar por projeto ou cliente..."
          >
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="h-9 min-w-[160px] justify-start">
                  <Filter className="mr-2 h-4 w-4" aria-hidden="true" />
                  {FILTER_LABELS[statusFilter]}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="shadow-admin-popover">
                {(Object.keys(FILTER_LABELS) as StatusFilter[]).map((key) => (
                  <DropdownMenuItem
                    key={key}
                    className="cursor-pointer"
                    onClick={() => setStatusFilter(key)}
                  >
                    {FILTER_LABELS[key]}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </FilterBar>
        </div>

        {loading ? (
          <div className="p-8">
            <LoadingState label="Carregando pipeline..." />
          </div>
        ) : filteredProjects.length === 0 ? (
          <EmptyState
            icon={Route}
            title="Nenhum projeto encontrado"
            description="Nenhum projeto corresponde à busca ou ao filtro de status aplicado."
          />
        ) : (
          <div className="overflow-x-auto">
            <Table className="min-w-[940px]">
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className={headCell}>Projeto</TableHead>
                  <TableHead className={headCell}>Cliente</TableHead>
                  <TableHead className={headCell}>Status da geração</TableHead>
                  <TableHead className={headCell}>GitHub</TableHead>
                  <TableHead className={headCell}>Vercel</TableHead>
                  <TableHead className={headCell}>Domínio</TableHead>
                  <TableHead className={headCell}>Atualizado</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProjects.map((project) => (
                  /* A linha abre o detalhe, então precisa ser alcançável pelo
                   *  teclado — não só clicável com o mouse. */
                  <TableRow
                    key={project.id}
                    tabIndex={0}
                    aria-label={`Ver pipeline de ${project.title}`}
                    className="cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    onClick={() => setSelectedProject(project)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault();
                        setSelectedProject(project);
                      }
                    }}
                  >
                    <TableCell className="text-[13.5px] font-semibold">{project.title}</TableCell>
                    <TableCell className="text-[13px] text-muted-foreground">
                      {getUserName(project.user_id)}
                    </TableCell>
                    <TableCell>{getAiStatusBadge(project.ai_generation_status)}</TableCell>
                    <TableCell>
                      {project.github_repo_url ? (
                        <a
                          href={project.github_repo_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="inline-flex items-center gap-1 text-[13px] font-medium text-primary hover:underline"
                        >
                          <Github className="h-3.5 w-3.5" aria-hidden="true" />
                          Repo
                        </a>
                      ) : (
                        <span className="text-[13px] text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {project.vercel_deployment_url ? (
                        <a
                          href={project.vercel_deployment_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="inline-flex items-center gap-1 text-[13px] font-medium text-primary hover:underline"
                        >
                          <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
                          Site
                        </a>
                      ) : (
                        <span className="text-[13px] text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {project.vercel_custom_domain ? (
                        <span className="inline-flex items-center gap-1.5 font-mono text-[11.5px]">
                          <Globe className="h-3.5 w-3.5 shrink-0 text-muted-foreground" aria-hidden="true" />
                          {project.vercel_custom_domain}
                          {project.vercel_domain_verified ? (
                            <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-success" aria-label="Domínio verificado" />
                          ) : (
                            <Clock className="h-3.5 w-3.5 shrink-0 text-warning" aria-label="Verificação pendente" />
                          )}
                        </span>
                      ) : (
                        <span className="text-[13px] text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell className="whitespace-nowrap font-mono text-[11.5px] tabular-nums text-muted-foreground">
                      {format(new Date(project.updated_at), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      <Dialog open={!!selectedProject} onOpenChange={(open) => !open && setSelectedProject(null)}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-display text-[19px] font-bold tracking-[-0.025em]">
              {selectedProject?.title}
            </DialogTitle>
            <DialogDescription className="font-mono text-[11px] uppercase tracking-[0.08em]">
              {selectedProject ? getUserName(selectedProject.user_id) : ''}
            </DialogDescription>
          </DialogHeader>

          {selectedProject && (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center gap-2">
                {getAiStatusBadge(selectedProject.ai_generation_status)}
                {selectedProject.github_repo_url && (
                  <a
                    href={selectedProject.github_repo_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-lg border border-border px-2.5 py-1 text-[13px] font-medium transition-colors hover:bg-muted"
                  >
                    <Github className="h-3.5 w-3.5" aria-hidden="true" />
                    {selectedProject.github_repo_name || 'Repositório'}
                  </a>
                )}
                {selectedProject.vercel_deployment_url && (
                  <a
                    href={selectedProject.vercel_deployment_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-lg border border-border px-2.5 py-1 text-[13px] font-medium transition-colors hover:bg-muted"
                  >
                    <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
                    Ver site
                  </a>
                )}
              </div>

              <div className="border-t pt-4">
                <PipelineTimeline projectId={selectedProject.id} />
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
