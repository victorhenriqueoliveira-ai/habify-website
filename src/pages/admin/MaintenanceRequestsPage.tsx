import { useState } from 'react';
import { useMaintenanceRequests } from '@/hooks/useMaintenanceRequests';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Clock, Wrench, CheckCircle2, XCircle, Eye, Upload, Loader2, Zap, RotateCw } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { MaintenanceRequestChat } from '@/components/MaintenanceRequestChat';

export default function MaintenanceRequestsPage() {
  const { requests, loading, updateRequestStatus, refetch } = useMaintenanceRequests();
  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [adminNotes, setAdminNotes] = useState('');
  const [beforeUrls, setBeforeUrls] = useState<string[]>([]);
  const [afterUrls, setAfterUrls] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [retrying, setRetrying] = useState(false);

  const getStatusConfig = (status: string) => {
    const configs: Record<string, any> = {
      pending: { variant: 'secondary', icon: Clock, label: 'Pendente' },
      in_progress: { variant: 'default', icon: Wrench, label: 'Em Andamento' },
      completed: { variant: 'default', icon: CheckCircle2, label: 'Concluída' },
      rejected: { variant: 'destructive', icon: XCircle, label: 'Rejeitada' },
    };
    return configs[status] || configs.pending;
  };

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

        const { data: { publicUrl } } = supabase.storage
          .from('project-photos')
          .getPublicUrl(filePath);

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

  const openDialog = (request: any) => {
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
      const { data: { user } } = await supabase.auth.getUser();
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
      afterUrls
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
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const pendingRequests = requests.filter(r => r.status === 'pending');
  const inProgressRequests = requests.filter(r => r.status === 'in_progress');
  const completedRequests = requests.filter(r => r.status === 'completed');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Solicitações de Customização</h1>
        <p className="text-muted-foreground">
          Gerencie as solicitações de manutenção dos clientes
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4">
          <div className="text-sm text-muted-foreground">Pendentes</div>
          <div className="text-2xl font-bold">{pendingRequests.length}</div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-muted-foreground">Em Andamento</div>
          <div className="text-2xl font-bold">{inProgressRequests.length}</div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-muted-foreground">Concluídas</div>
          <div className="text-2xl font-bold">{completedRequests.length}</div>
        </Card>
      </div>

      <Card className="p-6">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Cliente</TableHead>
              <TableHead>Projeto</TableHead>
              <TableHead>Título</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Data</TableHead>
              <TableHead>Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {requests.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground">
                  Nenhuma solicitação encontrada
                </TableCell>
              </TableRow>
            ) : (
              requests.map((request) => {
                const config = getStatusConfig(request.status);
                const Icon = config.icon;

                return (
                  <TableRow key={request.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{request.profile?.name}</div>
                        <div className="text-xs text-muted-foreground">{request.profile?.email}</div>
                      </div>
                    </TableCell>
                    <TableCell>{request.project?.title}</TableCell>
                    <TableCell className="font-medium">{request.title}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap items-center gap-1">
                        <Badge variant={config.variant} className="gap-1">
                          <Icon className="h-3 w-3" />
                          {config.label}
                        </Badge>
                        {request.applied_automatically && (
                          <Badge variant="outline" className="gap-1">
                            <Zap className="h-3 w-3" />
                            Automático
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {format(new Date(request.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openDialog(request)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
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
                {selectedRequest.change_type && selectedRequest.change_type !== 'other' && (
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="outline" className="gap-1">
                      {selectedRequest.applied_automatically ? <Zap className="h-3 w-3" /> : <Clock className="h-3 w-3" />}
                      {selectedRequest.applied_automatically ? 'Aplicado automaticamente via API' : 'Estruturado — ainda não aplicado'}
                    </Badge>
                  </div>
                )}
              </div>

              <div>
                <Label className="text-muted-foreground">Descrição</Label>
                <p className="text-sm whitespace-pre-wrap">{selectedRequest.description}</p>
              </div>

              {selectedRequest.attachments_urls && selectedRequest.attachments_urls.length > 0 && (
                <div>
                  <Label className="text-muted-foreground">Anexos do Cliente</Label>
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

              <div className="space-y-2">
                <Label htmlFor="admin-notes">Notas do Admin</Label>
                <Textarea
                  id="admin-notes"
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  placeholder="Adicione observações sobre o andamento..."
                  rows={4}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Antes (Opcional)</Label>
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={(e) => handleFileUpload(e, 'before')}
                    className="hidden"
                    id="before-upload"
                    disabled={uploading}
                  />
                  <label htmlFor="before-upload">
                    <div className="border-2 border-dashed rounded p-4 cursor-pointer hover:bg-accent/50">
                      <div className="flex flex-col items-center gap-2">
                        {uploading ? (
                          <Loader2 className="h-6 w-6 animate-spin" />
                        ) : (
                          <Upload className="h-6 w-6 text-muted-foreground" />
                        )}
                        <p className="text-xs text-center text-muted-foreground">
                          Upload de imagens do estado antes
                        </p>
                      </div>
                    </div>
                  </label>
                  {beforeUrls.length > 0 && (
                    <div className="grid grid-cols-2 gap-2">
                      {beforeUrls.map((url, index) => (
                        <img
                          key={index}
                          src={url}
                          alt={`Antes ${index + 1}`}
                          className="w-full h-20 object-cover rounded"
                        />
                      ))}
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>Depois (Opcional)</Label>
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={(e) => handleFileUpload(e, 'after')}
                    className="hidden"
                    id="after-upload"
                    disabled={uploading}
                  />
                  <label htmlFor="after-upload">
                    <div className="border-2 border-dashed rounded p-4 cursor-pointer hover:bg-accent/50">
                      <div className="flex flex-col items-center gap-2">
                        {uploading ? (
                          <Loader2 className="h-6 w-6 animate-spin" />
                        ) : (
                          <Upload className="h-6 w-6 text-muted-foreground" />
                        )}
                        <p className="text-xs text-center text-muted-foreground">
                          Upload de imagens do estado depois
                        </p>
                      </div>
                    </div>
                  </label>
                  {afterUrls.length > 0 && (
                    <div className="grid grid-cols-2 gap-2">
                      {afterUrls.map((url, index) => (
                        <img
                          key={index}
                          src={url}
                          alt={`Depois ${index + 1}`}
                          className="w-full h-20 object-cover rounded"
                        />
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <DialogFooter className="gap-2">
                {selectedRequest.status === 'pending' && (
                  <>
                    {selectedRequest.change_type && selectedRequest.change_type !== 'other' && !selectedRequest.applied_automatically && (
                      <Button
                        variant="secondary"
                        onClick={handleRetryAutoApply}
                        disabled={retrying}
                      >
                        {retrying ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <RotateCw className="h-4 w-4 mr-2" />}
                        Tentar aplicar automaticamente
                      </Button>
                    )}
                    <Button
                      variant="destructive"
                      onClick={() => handleUpdateStatus('rejected')}
                    >
                      <XCircle className="h-4 w-4 mr-2" />
                      Rejeitar
                    </Button>
                    <Button
                      variant="default"
                      onClick={() => handleUpdateStatus('in_progress')}
                    >
                      <Wrench className="h-4 w-4 mr-2" />
                      Iniciar
                    </Button>
                  </>
                )}
                {selectedRequest.status === 'in_progress' && (
                  <Button
                    variant="default"
                    onClick={() => handleUpdateStatus('completed')}
                  >
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                    Concluir
                  </Button>
                )}
              </DialogFooter>

              <div className="mt-6 pt-6 border-t">
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
