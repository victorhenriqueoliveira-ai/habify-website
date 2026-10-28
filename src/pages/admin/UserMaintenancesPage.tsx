import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useMaintenances, type Maintenance } from '@/hooks/useMaintenances';
import { useProjects } from '@/hooks/useProjects';
import { useMaintenanceRequests, type MaintenanceRequest } from '@/hooks/useMaintenanceRequests';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Wrench,
  Clock,
  CheckCircle,
  Plus,
  CreditCard,
  Sparkles,
  Eye,
  ExternalLink,
  FolderKanban,
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { MaintenanceCreditsDisplay } from '@/components/MaintenanceCreditsDisplay';
import { MaintenanceRequestForm } from '@/components/MaintenanceRequestForm';
import { BUSINESS } from '@/config/business';
import type { Project } from '@/types/admin';
import {
  EmptyState,
  LoadingState,
  PageHeader,
  SectionHeader,
  StatCard,
  StatCardGrid,
  StatusPill,
  type StatusTone,
} from '@/components/admin/ui';

const statusConfig: Record<string, { tone: StatusTone; label: string }> = {
  pending: { tone: 'warning', label: 'Pendente' },
  in_progress: { tone: 'info', label: 'Em andamento' },
  completed: { tone: 'success', label: 'Concluída' },
  cancelled: { tone: 'destructive', label: 'Cancelada' },
  rejected: { tone: 'destructive', label: 'Recusada' },
};

const headCell = 'font-mono text-[10px] uppercase tracking-[0.09em]';
const detailLabel = 'font-mono text-[10px] uppercase tracking-[0.09em] text-muted-foreground';

const statusPill = (status: string) => {
  const config = statusConfig[status] ?? statusConfig.pending;
  return <StatusPill label={config.label} tone={config.tone} />;
};

const monthly = BUSINESS.pricing.maintenanceMonthly.toFixed(2).replace('.', ',');

const UserMaintenancesPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { maintenances, loading, getActiveMaintenances, fetchMaintenances } = useMaintenances(user?.id);
  const { projects } = useProjects();
  const { requests, refetch } = useMaintenanceRequests(user?.userId);
  const [requestFormOpen, setRequestFormOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [selectedRequest, setSelectedRequest] = useState<MaintenanceRequest | null>(null);
  const [viewRequestOpen, setViewRequestOpen] = useState(false);
  const [creditsRefreshKey, setCreditsRefreshKey] = useState<number>(0);

  const activeMaintenances = getActiveMaintenances();
  // Elegível pra manutenção é "site no ar", não só status === 'completed':
  // projetos gerados automaticamente ficam em 'in_review' até um admin
  // aprovar manualmente, e sem isso o cliente nunca via a opção de comprar
  // manutenção pro próprio site que já está funcionando.
  const completedProjects = projects.filter(
    (p) => ['completed', 'approved', 'in_review'].includes(p.status) || !!p.landingPageUrl,
  );

  const openRequestForm = (project: Project) => {
    setSelectedProject(project);
    setRequestFormOpen(true);
  };

  if (loading) {
    return <LoadingState label="Carregando manutenções..." size="lg" fullScreen />;
  }

  return (
    <div className="space-y-6">
      {requestFormOpen && selectedProject && (
        <MaintenanceRequestForm
          projectId={selectedProject.id}
          projectTitle={selectedProject.title}
          open={requestFormOpen}
          onOpenChange={(open: boolean) => setRequestFormOpen(open)}
          onCreated={() => {
            if (refetch) refetch();
            if (typeof fetchMaintenances === 'function') fetchMaintenances();
            setCreditsRefreshKey((k) => k + 1);
          }}
        />
      )}

      <PageHeader
        icon={Wrench}
        eyebrow="Manutenções"
        title="Minhas manutenções"
        description="Gerencie créditos e solicite customizações nos seus projetos"
      />

      <MaintenanceCreditsDisplay refreshTrigger={creditsRefreshKey} />

      <StatCardGrid>
        <StatCard label="Manutenções ativas" value={activeMaintenances.length} icon={CheckCircle} tone="success" />
        <StatCard
          label="Solicitações pendentes"
          value={requests.filter((r) => r.status === 'pending').length}
          icon={Clock}
          tone="warning"
        />
        <StatCard label="Total de manutenções" value={maintenances.length} icon={Wrench} />
        <StatCard label="Projetos elegíveis" value={completedProjects.length} icon={FolderKanban} />
      </StatCardGrid>

      {/* Antes esta lista aparecia duas vezes na página: um bloco "Solicitar
       *  customização" e outro "Contratar manutenção", ambos iterando os
       *  mesmos projetos. Agora cada projeto é um card só, com as duas ações. */}
      {completedProjects.length > 0 && (
        <section className="space-y-3.5">
          <SectionHeader
            icon={Sparkles}
            title="Seus sites no ar"
            count={completedProjects.length}
            description={`Use um crédito para pedir alterações, ou contrate manutenção mensal por R$ ${monthly}.`}
          />

          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {completedProjects.map((project) => {
              const hasActiveMaintenance = activeMaintenances.some((m) => m.project_id === project.id);

              return (
                <article key={project.id} className="admin-card-elevated flex flex-col gap-3 p-4">
                  <div className="min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="min-w-0 text-[14.5px] font-semibold leading-snug">{project.title}</h3>
                      {hasActiveMaintenance && <StatusPill label="Manutenção ativa" tone="success" />}
                    </div>
                    {project.landingPageUrl && (
                      <a
                        href={project.landingPageUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-1 inline-flex items-center gap-1 text-[12.5px] font-medium text-primary hover:underline"
                      >
                        Ver site
                        <ExternalLink className="h-3 w-3" aria-hidden="true" />
                      </a>
                    )}
                  </div>

                  <div className="mt-auto flex flex-col gap-2">
                    <Button onClick={() => openRequestForm(project)} variant="outline" size="sm">
                      <Sparkles className="mr-2 h-4 w-4" aria-hidden="true" />
                      Solicitar customização
                    </Button>
                    <Button
                      onClick={() => navigate(`/admin/maintenance-checkout/${project.id}`)}
                      disabled={hasActiveMaintenance}
                      size="sm"
                    >
                      <CreditCard className="mr-2 h-4 w-4" aria-hidden="true" />
                      {hasActiveMaintenance ? 'Manutenção ativa' : `Contratar por R$ ${monthly}/mês`}
                    </Button>
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      )}

      {completedProjects.length === 0 && (
        <EmptyState
          className="admin-card-elevated"
          icon={FolderKanban}
          title="Nenhum site no ar ainda"
          description="Assim que seu primeiro projeto for publicado, as opções de customização e manutenção aparecem aqui."
          action={{
            label: 'Criar meu site',
            icon: Plus,
            onClick: () => navigate('/admin/new-project'),
          }}
        />
      )}

      {requests.length > 0 && (
        <div className="admin-card-elevated">
          <div className="border-b border-border p-4 sm:p-5">
            <SectionHeader title="Histórico de solicitações" count={requests.length} />
          </div>
          <div className="overflow-x-auto">
            <Table className="min-w-[700px]">
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className={headCell}>Título</TableHead>
                  <TableHead className={headCell}>Projeto</TableHead>
                  <TableHead className={headCell}>Status</TableHead>
                  <TableHead className={headCell}>Data</TableHead>
                  <TableHead className="w-12" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {requests.map((request) => (
                  <TableRow key={request.id}>
                    <TableCell className="text-[13.5px] font-semibold">{request.title}</TableCell>
                    <TableCell className="text-[13px] text-muted-foreground">
                      {request.project?.title}
                    </TableCell>
                    <TableCell>{statusPill(request.status)}</TableCell>
                    <TableCell className="whitespace-nowrap font-mono text-[11.5px] tabular-nums text-muted-foreground">
                      {format(new Date(request.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0"
                        aria-label={`Ver detalhes de ${request.title}`}
                        onClick={() => {
                          setSelectedRequest(request);
                          setViewRequestOpen(true);
                        }}
                      >
                        <Eye className="h-4 w-4" aria-hidden="true" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      )}

      <div className="admin-card-elevated">
        <div className="border-b border-border p-4 sm:p-5">
          <SectionHeader title="Histórico de manutenções" count={maintenances.length} />
        </div>

        {maintenances.length === 0 ? (
          <EmptyState
            icon={Wrench}
            title="Nenhuma manutenção contratada"
            description="As manutenções que você contratar aparecem aqui, com data de contratação e validade."
          />
        ) : (
          <div className="overflow-x-auto">
            <Table className="min-w-[700px]">
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className={headCell}>Projeto</TableHead>
                  <TableHead className={`${headCell} text-right`}>Valor</TableHead>
                  <TableHead className={headCell}>Status</TableHead>
                  <TableHead className={headCell}>Contratação</TableHead>
                  <TableHead className={headCell}>Expira em</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {maintenances.map((maintenance: Maintenance) => (
                  <TableRow key={maintenance.id}>
                    <TableCell className="text-[13.5px] font-semibold">
                      {maintenance.project?.title}
                    </TableCell>
                    <TableCell className="text-right text-[13.5px] font-semibold tabular-nums">
                      R$ {Number(maintenance.amount).toFixed(2)}
                    </TableCell>
                    <TableCell>{statusPill(maintenance.status)}</TableCell>
                    <TableCell className="font-mono text-[11.5px] tabular-nums text-muted-foreground">
                      {format(new Date(maintenance.contracted_at), 'dd/MM/yyyy', { locale: ptBR })}
                    </TableCell>
                    <TableCell className="font-mono text-[11.5px] tabular-nums text-muted-foreground">
                      {format(new Date(maintenance.expires_at), 'dd/MM/yyyy', { locale: ptBR })}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      <Dialog open={viewRequestOpen} onOpenChange={setViewRequestOpen}>
        <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-display text-[19px] font-bold tracking-[-0.025em]">
              Detalhes da solicitação
            </DialogTitle>
          </DialogHeader>

          {selectedRequest && (
            <div className="space-y-5">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <p className={detailLabel}>Cliente</p>
                  <p className="mt-0.5 text-[14px] font-semibold">{selectedRequest.profile?.name}</p>
                  <p className="font-mono text-[11px] text-muted-foreground">
                    {selectedRequest.profile?.email}
                  </p>
                </div>
                <div>
                  <p className={detailLabel}>Projeto</p>
                  <p className="mt-0.5 text-[14px] font-semibold">{selectedRequest.project?.title}</p>
                  {selectedRequest.project?.landing_page_url && (
                    <a
                      href={selectedRequest.project.landing_page_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-[12.5px] font-medium text-primary hover:underline"
                    >
                      Ver site
                      <ExternalLink className="h-3 w-3" aria-hidden="true" />
                    </a>
                  )}
                </div>
              </div>

              <div>
                <p className={detailLabel}>Título</p>
                <p className="mt-0.5 text-[14px] font-semibold">{selectedRequest.title}</p>
              </div>

              <div>
                <p className={detailLabel}>Descrição</p>
                <p className="mt-1 whitespace-pre-wrap text-[13.5px] leading-relaxed">
                  {selectedRequest.description}
                </p>
              </div>

              {selectedRequest.attachments_urls && selectedRequest.attachments_urls.length > 0 && (
                <div>
                  <p className={detailLabel}>Anexos</p>
                  <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3">
                    {selectedRequest.attachments_urls.map((url: string, index: number) => (
                      <img
                        key={url}
                        src={url}
                        alt={`Anexo ${index + 1}`}
                        loading="lazy"
                        className="h-32 w-full rounded-lg border border-border object-cover"
                      />
                    ))}
                  </div>
                </div>
              )}

              {selectedRequest.admin_notes && (
                <div>
                  <p className={detailLabel}>Notas do admin</p>
                  <Textarea className="mt-1" value={selectedRequest.admin_notes} readOnly rows={4} />
                </div>
              )}

              {selectedRequest.before_urls && selectedRequest.before_urls.length > 0 && (
                <div>
                  <p className={detailLabel}>Antes</p>
                  <div className="mt-2 grid grid-cols-2 gap-2">
                    {selectedRequest.before_urls.map((url: string, i: number) => (
                      <img
                        key={url}
                        src={url}
                        alt={`Antes ${i + 1}`}
                        loading="lazy"
                        className="h-24 w-full rounded-lg border border-border object-cover"
                      />
                    ))}
                  </div>
                </div>
              )}

              {selectedRequest.after_urls && selectedRequest.after_urls.length > 0 && (
                <div>
                  <p className={detailLabel}>Depois</p>
                  <div className="mt-2 grid grid-cols-2 gap-2">
                    {selectedRequest.after_urls.map((url: string, i: number) => (
                      <img
                        key={url}
                        src={url}
                        alt={`Depois ${i + 1}`}
                        loading="lazy"
                        className="h-24 w-full rounded-lg border border-border object-cover"
                      />
                    ))}
                  </div>
                </div>
              )}

              <DialogFooter>
                <Button variant="outline" onClick={() => setViewRequestOpen(false)}>
                  Fechar
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default UserMaintenancesPage;
