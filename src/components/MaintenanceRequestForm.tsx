import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Loader2, Upload, X } from 'lucide-react';
import { useMaintenanceRequests } from '@/hooks/useMaintenanceRequests';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface MaintenanceRequestFormProps {
  projectId: string;
  projectTitle: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated?: (request: any) => void;
}

export const MaintenanceRequestForm = ({
  projectId,
  projectTitle,
  open,
  onOpenChange,
  onCreated,
}: MaintenanceRequestFormProps) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [uploading, setUploading] = useState(false);
  const [attachments, setAttachments] = useState<string[]>([]);
  const { createRequest } = useMaintenanceRequests();

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    try {
      const uploadedUrls: string[] = [];

      for (const file of Array.from(files)) {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Math.random()}.${fileExt}`;
        const filePath = `maintenance-requests/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('project-photos')
          .upload(filePath, file);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('project-photos')
          .getPublicUrl(filePath);

        uploadedUrls.push(publicUrl);
      }

      setAttachments([...attachments, ...uploadedUrls]);
      toast.success('Arquivos enviados com sucesso!');
    } catch (error) {
      console.error('Error uploading files:', error);
      toast.error('Erro ao enviar arquivos');
    } finally {
      setUploading(false);
    }
  };

  const removeAttachment = (url: string) => {
    setAttachments(attachments.filter(a => a !== url));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim() || !description.trim()) {
      toast.error('Preencha o título e descrição');
      return;
    }

    const result = await createRequest(projectId, title, description, attachments);
    
    if (result) {
      setTitle('');
      setDescription('');
      setAttachments([]);
      onOpenChange(false);
      if (onCreated) onCreated(result);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Nova Solicitação de Customização</DialogTitle>
          <DialogDescription>
            Projeto: {projectTitle}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Título da Solicitação</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex: Alterar cor do botão principal"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descrição Detalhada</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Descreva o que você gostaria de modificar no seu projeto..."
              rows={6}
              required
            />
          </div>

          <div className="space-y-2">
            <Label>Anexos (opcional)</Label>
            <div className="border-2 border-dashed rounded-lg p-4 text-center">
              <input
                type="file"
                multiple
                accept="image/*,.pdf"
                onChange={handleFileUpload}
                className="hidden"
                id="file-upload"
                disabled={uploading}
              />
              <label
                htmlFor="file-upload"
                className="cursor-pointer flex flex-col items-center gap-2"
              >
                {uploading ? (
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                ) : (
                  <Upload className="h-8 w-8 text-muted-foreground" />
                )}
                <p className="text-sm text-muted-foreground">
                  Clique para adicionar imagens ou documentos
                </p>
              </label>
            </div>

            {attachments.length > 0 && (
              <div className="grid grid-cols-3 gap-2 mt-2">
                {attachments.map((url, index) => (
                  <div key={index} className="relative group">
                    <img
                      src={url}
                      alt={`Anexo ${index + 1}`}
                      className="w-full h-24 object-cover rounded"
                    />
                    <button
                      type="button"
                      onClick={() => removeAttachment(url)}
                      className="absolute top-1 right-1 p-1 bg-destructive text-destructive-foreground rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={uploading}>
              Enviar Solicitação
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
