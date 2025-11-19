import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useMaintenances } from '@/hooks/useMaintenances';
import { useProjects } from '@/hooks/useProjects';
import { useMaintenanceRequests } from '@/hooks/useMaintenanceRequests';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Wrench, Clock, CheckCircle, XCircle, Plus, CreditCard, Sparkles, Eye } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';
import { MaintenanceCreditsDisplay } from '@/components/MaintenanceCreditsDisplay';
import { MaintenanceRequestForm } from '@/components/MaintenanceRequestForm';

const UserMaintenancesPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { maintenances, loading, getActiveMaintenances, fetchMaintenances } = useMaintenances(user?.id);
  const { projects } = useProjects();
  const { requests, refetch } = useMaintenanceRequests(user?.userId);
  const [requestFormOpen, setRequestFormOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<any>(null);
  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  const [viewRequestOpen, setViewRequestOpen] = useState(false);
  const [creditsRefreshKey, setCreditsRefreshKey] = useState<number>(0);

  const getStatusBadge = (status: string) => {
    const variants: Record<string, any> = {
      pending: { variant: 'secondary', icon: Clock, label: 'Pendente' },
      in_progress: { variant: 'default', icon: Wrench, label: 'Em Andamento' },
      completed: { variant: 'default', icon: CheckCircle, label: 'Concluída' },
      cancelled: { variant: 'destructive', icon: XCircle, label: 'Cancelada' },
    };

    const config = variants[status] || variants.pending;
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className="gap-1">
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    );
  };

  const handlePurchaseMaintenance = (project: any) => {
    navigate(`/admin/maintenance-checkout/${project.id}`);
  };

  const activeMaintenances = getActiveMaintenances();
  const completedProjects = projects.filter(p => p.status === 'completed');

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground">Carregando manutenções...</div>
      </div>
    );
  }

  const openRequestForm = (project: any) => {
    setSelectedProject(project);
    setRequestFormOpen(true);
  };

  return (
    <>
    <div className="space-y-6">
        <div>
        {/* Maintenance Request Form Modal */}
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
          <h1 className="text-3xl font-bold">Minhas Manutenções</h1>
          <p className="text-muted-foreground">
            Gerencie créditos e solicite customizações nos seus projetos
          </p>
        </div>

  {/* Créditos de Manutenção */}
  <MaintenanceCreditsDisplay refreshTrigger={creditsRefreshKey} />

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="p-4">
            <div className="text-sm text-muted-foreground">Manutenções Ativas</div>
            <div className="text-2xl font-bold">{activeMaintenances.length}</div>
          </Card>
          <Card className="p-4">
            <div className="text-sm text-muted-foreground">Solicitações Pendentes</div>
            <div className="text-2xl font-bold">
              {requests.filter(r => r.status === 'pending').length}
            </div>
          </Card>
          <Card className="p-4">
            <div className="text-sm text-muted-foreground">Total de Manutenções</div>
            <div className="text-2xl font-bold">{maintenances.length}</div>
          </Card>
          <Card className="p-4">
            <div className="text-sm text-muted-foreground">Projetos Disponíveis</div>
            <div className="text-2xl font-bold">{completedProjects.length}</div>
          </Card>
        </div>

        {/* Solicitações de Customização */}
        {completedProjects.length > 0 && (
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-xl font-semibold flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-primary" />
                  Solicitar Customização
                </h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Use seus créditos de manutenção para solicitar alterações em seus projetos
                </p>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {completedProjects.map((project) => (
                <Card key={project.id} className="p-4 hover:border-primary/50 transition-colors">
                  <div className="space-y-3">
                    <div>
                      <h3 className="font-semibold">{project.title}</h3>
                      {project.landingPageUrl && (
                        <a
                          href={project.landingPageUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-primary hover:underline"
                        >
                          Ver projeto online
                        </a>
                      )}
                    </div>
                    <Button
                      onClick={() => openRequestForm(project)}
                      variant="outline"
                      size="sm"
                      className="w-full"
                    >
                      <Sparkles className="h-4 w-4 mr-2" />
                      Solicitar Customização
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          </Card>
        )}

        {/* Histórico de Solicitações */}
        {requests.length > 0 && (
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Histórico de Solicitações</h2>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Título</TableHead>
                  <TableHead>Projeto</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {requests.map((request) => (
                  <TableRow key={request.id}>
                    <TableCell className="font-medium">{request.title}</TableCell>
                    <TableCell>{request.project?.title}</TableCell>
                    <TableCell>{getStatusBadge(request.status)}</TableCell>
                    <TableCell>
                      {format(new Date(request.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSelectedRequest(request);
                          setViewRequestOpen(true);
                        }}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        )}

        {/* Visualizar Solicitação (somente leitura) */}
        <Dialog open={viewRequestOpen} onOpenChange={setViewRequestOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Detalhes da Solicitação</DialogTitle>
            </DialogHeader>

            {selectedRequest && (
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-muted-foreground">Cliente</Label>
                    <p className="font-medium">{selectedRequest.profile?.name}</p>
                    <p className="text-sm text-muted-foreground">{selectedRequest.profile?.email}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Projeto</Label>
                    <p className="font-medium">{selectedRequest.project?.title}</p>
                    {selectedRequest.project?.landing_page_url && (
                      <a
                        href={selectedRequest.project.landing_page_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-primary hover:underline"
                      >
                        Ver projeto online
                      </a>
                    )}
                  </div>
                </div>

                <div>
                  <Label className="text-muted-foreground">Título</Label>
                  <p className="font-medium">{selectedRequest.title}</p>
                </div>

                <div>
                  <Label className="text-muted-foreground">Descrição</Label>
                  <p className="text-sm whitespace-pre-wrap">{selectedRequest.description}</p>
                </div>

                {selectedRequest.attachments_urls && selectedRequest.attachments_urls.length > 0 && (
                  <div>
                    <Label className="text-muted-foreground">Anexos</Label>
                    <div className="grid grid-cols-3 gap-2 mt-2">
                      {selectedRequest.attachments_urls.map((url: string, index: number) => (
                        <img
                          key={index}
                          src={url}
                          alt={`Anexo ${index + 1}`}
                          className="w-full h-32 object-cover rounded border"
                        />
                      ))}
                    </div>
                  </div>
                )}

                {selectedRequest.admin_notes && (
                  <div>
                    <Label className="text-muted-foreground">Notas do Admin</Label>
                    <Textarea value={selectedRequest.admin_notes} readOnly rows={4} />
                  </div>
                )}

                {selectedRequest.before_urls?.length > 0 && (
                  <div>
                    <Label className="text-muted-foreground">Antes</Label>
                    <div className="grid grid-cols-2 gap-2">
                      {selectedRequest.before_urls.map((url: string, i: number) => (
                        <img key={i} src={url} alt={`Antes ${i}`} className="w-full h-20 object-cover rounded" />
                      ))}
                    </div>
                  </div>
                )}

                {selectedRequest.after_urls?.length > 0 && (
                  <div>
                    <Label className="text-muted-foreground">Depois</Label>
                    <div className="grid grid-cols-2 gap-2">
                      {selectedRequest.after_urls.map((url: string, i: number) => (
                        <img key={i} src={url} alt={`Depois ${i}`} className="w-full h-20 object-cover rounded" />
                      ))}
                    </div>
                  </div>
                )}

                <DialogFooter>
                  <Button variant="outline" onClick={() => setViewRequestOpen(false)}>Fechar</Button>
                </DialogFooter>
              </div>
            )}
          </DialogContent>
  </Dialog>

  {/* Available Projects */}
        {completedProjects.length > 0 && (
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Contratar Manutenção</h2>
            <p className="text-muted-foreground mb-4">
              Contrate manutenção mensal para seus projetos concluídos por apenas R$ 79,90/mês
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {completedProjects.map((project) => {
                const hasActiveMaintenance = activeMaintenances.some(
                  m => m.project_id === project.id
                );

                return (
                  <Card key={project.id} className="p-4">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h3 className="font-semibold">{project.title}</h3>
                        <p className="text-sm text-muted-foreground">
                          {project.description}
                        </p>
                      </div>
                      {hasActiveMaintenance && (
                        <Badge variant="default">Ativa</Badge>
                      )}
                    </div>
                    <div className="mt-4">
                      <Button
                        onClick={() => handlePurchaseMaintenance(project)}
                        disabled={hasActiveMaintenance}
                        className="w-full"
                      >
                        <CreditCard className="h-4 w-4 mr-2" />
                        {hasActiveMaintenance ? 'Manutenção Ativa' : 'Contratar por R$ 79,90'}
                      </Button>
                    </div>
                  </Card>
                );
              })}
            </div>
          </Card>
        )}

        {/* Maintenances History */}
        <Card>
          <div className="p-6">
            <h2 className="text-xl font-semibold mb-4">Histórico de Manutenções</h2>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Projeto</TableHead>
                <TableHead>Valor</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Contratação</TableHead>
                <TableHead>Expira em</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {maintenances.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground">
                    Você ainda não possui manutenções contratadas
                  </TableCell>
                </TableRow>
              ) : (
                maintenances.map((maintenance) => (
                  <TableRow key={maintenance.id}>
                    <TableCell className="font-medium">
                      {maintenance.project?.title}
                    </TableCell>
                    <TableCell>R$ {Number(maintenance.amount).toFixed(2)}</TableCell>
                    <TableCell>{getStatusBadge(maintenance.status)}</TableCell>
                    <TableCell>
                      {format(new Date(maintenance.contracted_at), 'dd/MM/yyyy', { locale: ptBR })}
                    </TableCell>
                    <TableCell>
                      {format(new Date(maintenance.expires_at), 'dd/MM/yyyy', { locale: ptBR })}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </Card>

      </div>
      </>
  );
};

export default UserMaintenancesPage;
