import { useState } from 'react';
import { useMaintenanceRequests, type MaintenanceRequest } from '@/hooks/useMaintenanceRequests';
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
import {
  Clock,
  Wrench,
  CheckCircle2,
  XCircle,
  Eye,
  Upload,
  Loader2,
  Zap,
  RotateCw,
  ExternalLink,
  Sparkles,
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { MaintenanceRequestChat } from '@/components/MaintenanceRequestChat';
import {
  EmptyState,
  LoadingState,
  PageHeader,
  SectionHeader,
  StatCard,
  StatusPill,
  type StatusTone,
} from '@/components/admin/ui';

const statusConfig: Record<string, { tone: StatusTone; label: string }> = {
  pending: { tone: 'warning', label: 'Pendente' },
  in_progress: { tone: 'info', label: 'Em andamento' },
  completed: { tone: 'success', label: 'Concluída' },
  rejected: { tone: 'destructive', label: 'Recusada' },
};

const headCell = 'font-mono text-[10px] uppercase tracking-[0.09em]';
const detailLabel = 'font-mono text-[10px] uppercase tracking-[0.09em] text-muted-foreground';

export default function MaintenanceRequestsPage() {
  const { requests, loading, updateRequestStatus, refetch } = useMaintenanceRequests();
  const [selectedRequest, setSelectedRequest] = useState<MaintenanceRequest | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [adminNotes, setAdminNotes] = useState('');
  const [beforeUrls, setBeforeUrls] = useState<string[]>([]);
  const [afterUrls, setAfterUrls] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [retrying, setRetrying] = useState(false);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'before' | 'after') => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    try {
      const uploadedUrls: string[] = [];

      for (const file of Array.from(files)) {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Math.random()}.${fileExt}`;
        const filePath = `maintenance-${type}/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('project-photos')
          .upload(filePath, file);

        if (uploadError) throw uploadError;

        const {
          data: { publicUrl },
        } = supabase.storage.from('project-photos').getPublicUrl(filePath);

        uploadedUrls.push(publicUrl);
      }

      if (type === 'before') {
        setBeforeUrls([...beforeUrls, ...uploadedUrls]);
      } else {
        setAfterUrls([...afterUrls, ...uploadedUrls]);
      }

      toast.success('Imagens enviadas com sucesso!');
    } catch (error) {
      console.error('Error uploading files:', error);
      toast.error('Erro ao enviar imagens');
    } finally {
      setUploading(false);
    }
  };

  const openDialog = (request: MaintenanceRequest) => {
    setSelectedRequest(request);
    setAdminNotes(request.admin_notes || '');
    setBeforeUrls(request.before_urls || []);
    setAfterUrls(request.after_urls || []);
    setDialogOpen(true);
  };

  const handleRetryAutoApply = async () => {
    if (!selectedRequest) return;
    setRetrying(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      const { data, error } = await supabase.functions.invoke('apply-maintenance-request', {
        body: { request_id: selectedRequest.id, requesting_user_id: user?.id },
      });
      if (error || !data?.success) {
        toast.error(data?.error || 'Falha ao aplicar automaticamente. Veja as notas do admin.');
      } else {
        toast.success('Alteração aplicada automaticamente!');
        setDialogOpen(false);
        setSelectedRequest(null);
      }
      await refetch();
    } catch (err) {
      console.error('Error retrying auto-apply:', err);
      toast.error('Falha ao tentar aplicar automaticamente');
    } finally {
      setRetrying(false);
    }
  };

  const handleUpdateStatus = async (newStatus: 'in_progress' | 'completed' | 'rejected') => {
    if (!selectedRequest) return;

    const success = await updateRequestStatus(
      selectedRequest.id,
      newStatus,
      adminNotes,
      beforeUrls,
      afterUrls,
    );

    if (success) {
      setDialogOpen(false);
      setSelectedRequest(null);
      setAdminNotes('');
      setBeforeUrls([]);
      setAfterUrls([]);
    }
  };

  if (loading) {
    return <LoadingState label="Carregando solicitações..." size="lg" fullScreen />;
  }

  const pendingRequests = requests.filter((r) => r.status === 'pending');
  const inProgressRequests = requests.filter((r) => r.status === 'in_progress');
  const completedRequests = requests.filter((r) => r.status === 'completed');

  /** Zona de upload: o input fica sr-only (não `hidden`), senão o campo
   *  some da ordem de tabulação e a zona vira inalcançável pelo teclado. */
  const uploadZone = (id: string, type: 'before' | 'after', label: string) => (
    <div className="space-y-1.5">
      <Label htmlFor={id} className={detailLabel}>
        {label}
      </Label>
      <input
        type="file"
        multiple
        accept="image/*"
        onChange={(e) => handleFileUpload(e, type)}
        className="peer sr-only"
        id={id}
        disabled={uploading}
      />
      <label
        htmlFor={id}
        className="flex cursor-pointer flex-col items-center gap-2 rounded-lg border-2 border-dashed border-border p-4 transition-colors hover:bg-muted peer-focus-visible:ring-2 peer-focus-visible:ring-ring"
      >
        {uploading ? (
          <Loader2 className="h-5 w-5 animate-spin text-primary" aria-hidden="true" />
        ) : (
          <Upload className="h-5 w-5 text-muted-foreground" aria-hidden="true" />
        )}
        <span className="text-center text-[12px] text-muted-foreground">
          Enviar imagens do estado {type === 'before' ? 'antes' : 'depois'}
        </span>
      </label>
    </div>
  );

  const thumbnails = (urls: string[], alt: string) =>
    urls.length > 0 && (
      <div className="grid grid-cols-2 gap-2">
        {urls.map((url, index) => (
          <img
            key={url}
            src={url}
            alt={`${alt} ${index + 1}`}
            loading="lazy"
            className="h-20 w-full rounded-lg border border-border object-cover"
          />
        ))}
      </div>
    );

  return (
    <div className="space-y-6">
      <PageHeader
        icon={Sparkles}
        eyebrow="Manutenções"
        title="Solicitações de customização"
        description="Gerencie as solicitações de manutenção dos clientes"
      />

      <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3">
        <StatCard label="Pendentes" value={pendingRequests.length} icon={Clock} tone="warning" />
        <StatCard label="Em andamento" value={inProgressRequests.length} icon={Wrench} tone="info" />
        <StatCard label="Concluídas" value={completedRequests.length} icon={CheckCircle2} tone="success" />
      </div>

      <div className="admin-card-elevated">
        <div className="border-b border-border p-4 sm:p-5">
          <SectionHeader title="Fila de solicitações" count={requests.length} />
        </div>

        {requests.length === 0 ? (
          <EmptyState
            icon={Sparkles}
            title="Nenhuma solicitação por aqui"
            description="Quando um cliente pedir uma alteração usando um crédito de manutenção, ela aparece nesta fila."
          />
        ) : (
          <div className="overflow-x-auto">
            <Table className="min-w-[840px]">
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className={headCell}>Cliente</TableHead>
                  <TableHead className={headCell}>Projeto</TableHead>
                  <TableHead className={headCell}>Título</TableHead>
                  <TableHead className={headCell}>Status</TableHead>
                  <TableHead className={headCell}>Data</TableHead>
                  <TableHead className="w-12" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {requests.map((request) => {
                  const config = statusConfig[request.status] ?? statusConfig.pending;

                  return (
                    <TableRow key={request.id}>
                      <TableCell className="max-w-[200px]">
                        <div className="truncate text-[13.5px] font-semibold">{request.profile?.name}</div>
                        <div className="truncate font-mono text-[11px] text-muted-foreground">
                          {request.profile?.email}
                        </div>
                      </TableCell>
                      <TableCell className="text-[13px] text-muted-foreground">
                        {request.project?.title}
                      </TableCell>
                      <TableCell className="text-[13.5px] font-semibold">{request.title}</TableCell>
                      <TableCell>
                        <div className="flex flex-wrap items-center gap-1.5">
                          <StatusPill label={config.label} tone={config.tone} />
                          {request.applied_automatically && (
                            <span className="inline-flex items-center gap-1 rounded-full border border-border bg-muted px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.06em] text-muted-foreground">
                              <Zap className="h-3 w-3" aria-hidden="true" />
                              Auto
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="whitespace-nowrap font-mono text-[11.5px] tabular-nums text-muted-foreground">
                        {format(new Date(request.created_at), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0"
                          aria-label={`Abrir solicitação ${request.title}`}
                          onClick={() => openDialog(request)}
                        >
                          <Eye className="h-4 w-4" aria-hidden="true" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
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
                {selectedRequest.change_type && selectedRequest.change_type !== 'other' && (
                  <span className="mt-1.5 inline-flex items-center gap-1.5 rounded-full border border-border bg-muted px-2 py-0.5 text-[11.5px] text-muted-foreground">
                    {selectedRequest.applied_automatically ? (
                      <Zap className="h-3 w-3" aria-hidden="true" />
                    ) : (
                      <Clock className="h-3 w-3" aria-hidden="true" />
                    )}
                    {selectedRequest.applied_automatically
                      ? 'Aplicado automaticamente via API'
                      : 'Estruturado — ainda não aplicado'}
                  </span>
                )}
              </div>

              <div>
                <p className={detailLabel}>Descrição</p>
                <p className="mt-1 whitespace-pre-wrap text-[13.5px] leading-relaxed">
                  {selectedRequest.description}
                </p>
              </div>

              {selectedRequest.attachments_urls && selectedRequest.attachments_urls.length > 0 && (
                <div>
                  <p className={detailLabel}>Anexos do cliente</p>
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

              <div className="space-y-1.5">
                <Label htmlFor="admin-notes" className={detailLabel}>
                  Notas do admin
                </Label>
                <Textarea
                  id="admin-notes"
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  placeholder="O que foi feito, o que ficou pendente, o que o cliente precisa saber..."
                  rows={4}
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  {uploadZone('before-upload', 'before', 'Antes (opcional)')}
                  {thumbnails(beforeUrls, 'Antes')}
                </div>
                <div className="space-y-2">
                  {uploadZone('after-upload', 'after', 'Depois (opcional)')}
                  {thumbnails(afterUrls, 'Depois')}
                </div>
              </div>

              <DialogFooter className="flex-wrap gap-2">
                {selectedRequest.status === 'pending' && (
                  <>
                    {selectedRequest.change_type &&
                      selectedRequest.change_type !== 'other' &&
                      !selectedRequest.applied_automatically && (
                        <Button variant="secondary" onClick={handleRetryAutoApply} disabled={retrying}>
                          {retrying ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
                          ) : (
                            <RotateCw className="mr-2 h-4 w-4" aria-hidden="true" />
                          )}
                          Tentar aplicar automaticamente
                        </Button>
                      )}
                    <Button variant="destructive" onClick={() => handleUpdateStatus('rejected')}>
                      <XCircle className="mr-2 h-4 w-4" aria-hidden="true" />
                      Recusar
                    </Button>
                    <Button onClick={() => handleUpdateStatus('in_progress')}>
                      <Wrench className="mr-2 h-4 w-4" aria-hidden="true" />
                      Iniciar
                    </Button>
                  </>
                )}
                {selectedRequest.status === 'in_progress' && (
                  <Button onClick={() => handleUpdateStatus('completed')}>
                    <CheckCircle2 className="mr-2 h-4 w-4" aria-hidden="true" />
                    Concluir
                  </Button>
                )}
              </DialogFooter>

              <div className="border-t border-border pt-5">
                <MaintenanceRequestChat
                  requestId={selectedRequest.id}
                  currentUserId={selectedRequest.user_id}
                />
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
