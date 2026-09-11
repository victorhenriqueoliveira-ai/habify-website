import { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
  Search,
  Filter,
  Github,
  ExternalLink,
  Globe,
  CheckCircle2,
  XCircle,
  Loader2,
  Clock,
  Route,
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { usePipelineOverview, PipelineProjectRow } from '@/hooks/usePipelineOverview';
import { useUsers } from '@/hooks/useUsers';
import { PipelineTimeline } from '@/components/admin/PipelineTimeline';

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

const getAiStatusBadge = (status: string | null) => {
  const s = status || 'idle';
  if (s === 'done') {
    return (
      <Badge className="gap-1">
        <CheckCircle2 className="h-3 w-3" />
        {AI_STATUS_LABELS[s]}
      </Badge>
    );
  }
  if (s === 'failed') {
    return (
      <Badge variant="destructive" className="gap-1">
        <XCircle className="h-3 w-3" />
        {AI_STATUS_LABELS[s]}
      </Badge>
    );
  }
  if (isInProgress(s)) {
    return (
      <Badge variant="secondary" className="gap-1">
        <Loader2 className="h-3 w-3 animate-spin" />
        {AI_STATUS_LABELS[s] || s}
      </Badge>
    );
  }
  return (
    <Badge variant="outline" className="gap-1 text-muted-foreground">
      <Clock className="h-3 w-3" />
      {AI_STATUS_LABELS.idle}
    </Badge>
  );
};

const FILTER_LABELS: Record<StatusFilter, string> = {
  all: 'Todos',
  failed: 'Falharam',
  in_progress: 'Em andamento',
  done: 'Concluídos',
  never_run: 'Nunca gerados',
};

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
      <div>
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
          <Route className="h-7 w-7 text-primary" />
          Pipeline de Geração
        </h1>
        <p className="text-muted-foreground">
          Trajeto completo de cada projeto — GitHub, Vercel e domínio — pra saber exatamente onde parou quando algo não funciona.
        </p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total de projetos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{counts.total}</div>
          </CardContent>
        </Card>
        <Card className="border-destructive/30">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Falharam</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{counts.failed}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Em andamento</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{counts.inProgress}</div>
          </CardContent>
        </Card>
        <Card className="border-success/30">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Concluídos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">{counts.done}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Buscar por projeto ou cliente..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="min-w-[160px]">
                  <Filter className="mr-2 h-4 w-4" />
                  {FILTER_LABELS[statusFilter]}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                {(Object.keys(FILTER_LABELS) as StatusFilter[]).map((key) => (
                  <DropdownMenuItem key={key} onClick={() => setStatusFilter(key)}>
                    {FILTER_LABELS[key]}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle>Projetos ({filteredProjects.length})</CardTitle>
          <CardDescription>Clique em um projeto para ver o trajeto completo, passo a passo.</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center items-center p-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <div className="overflow-x-auto -mx-6 px-6">
              <Table className="min-w-[900px]">
                <TableHeader>
                  <TableRow>
                    <TableHead>Projeto</TableHead>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Status da geração</TableHead>
                    <TableHead>GitHub</TableHead>
                    <TableHead>Vercel</TableHead>
                    <TableHead>Domínio</TableHead>
                    <TableHead>Atualizado</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredProjects.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                        Nenhum projeto encontrado.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredProjects.map((project) => (
                      <TableRow
                        key={project.id}
                        className="cursor-pointer hover:bg-accent/50"
                        onClick={() => setSelectedProject(project)}
                      >
                        <TableCell className="font-medium">{project.title}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">
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
                              className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
                            >
                              <Github className="h-3.5 w-3.5" />
                              Repo
                            </a>
                          ) : (
                            <span className="text-sm text-muted-foreground">—</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {project.vercel_deployment_url ? (
                            <a
                              href={project.vercel_deployment_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
                            >
                              <ExternalLink className="h-3.5 w-3.5" />
                              Site
                            </a>
                          ) : (
                            <span className="text-sm text-muted-foreground">—</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {project.vercel_custom_domain ? (
                            <span className="inline-flex items-center gap-1.5 text-sm">
                              <Globe className="h-3.5 w-3.5 text-muted-foreground" />
                              {project.vercel_custom_domain}
                              {project.vercel_domain_verified ? (
                                <CheckCircle2 className="h-3.5 w-3.5 text-success" />
                              ) : (
                                <Clock className="h-3.5 w-3.5 text-warning" />
                              )}
                            </span>
                          ) : (
                            <span className="text-sm text-muted-foreground">—</span>
                          )}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                          {format(new Date(project.updated_at), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!selectedProject} onOpenChange={(open) => !open && setSelectedProject(null)}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedProject?.title}</DialogTitle>
            <DialogDescription>
              Cliente: {selectedProject ? getUserName(selectedProject.user_id) : ''}
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
                    className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
                  >
                    <Github className="h-3.5 w-3.5" />
                    {selectedProject.github_repo_name || 'Repositório'}
                  </a>
                )}
                {selectedProject.vercel_deployment_url && (
                  <a
                    href={selectedProject.vercel_deployment_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
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
