import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Tabs, TabsList, TabsTrigger } from './ui/tabs';
import { Loader2, Upload, X } from 'lucide-react';
import { useMaintenanceRequests, MaintenanceChangeType } from '@/hooks/useMaintenanceRequests';
import { usePortfolioProperties } from '@/hooks/usePortfolioProperties';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface MaintenanceRequestFormProps {
  projectId: string;
  projectTitle: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated?: (request: unknown) => void;
}

interface PropertyFieldOption {
  value: string;
  label: string;
  currentValue: (p: { title: string; location: string; price: number; description?: string; bedrooms?: number; bathrooms?: number; area: number; parkingSpaces?: number; condominiumFee?: number; iptu?: number }) => string;
  type: 'text' | 'textarea' | 'number';
}

const PROPERTY_FIELDS: PropertyFieldOption[] = [
  { value: 'title', label: 'Título do imóvel', type: 'text', currentValue: (p) => p.title },
  { value: 'location', label: 'Localização', type: 'text', currentValue: (p) => p.location },
  { value: 'price', label: 'Preço', type: 'number', currentValue: (p) => String(p.price) },
  { value: 'description', label: 'Descrição', type: 'textarea', currentValue: (p) => p.description || '' },
  { value: 'bedrooms', label: 'Quartos', type: 'number', currentValue: (p) => String(p.bedrooms ?? '') },
  { value: 'bathrooms', label: 'Banheiros', type: 'number', currentValue: (p) => String(p.bathrooms ?? '') },
  { value: 'area', label: 'Área (m²)', type: 'number', currentValue: (p) => String(p.area) },
  { value: 'parking_spaces', label: 'Vagas de garagem', type: 'number', currentValue: (p) => String(p.parkingSpaces ?? '') },
  { value: 'condominium_fee', label: 'Condomínio', type: 'number', currentValue: (p) => String(p.condominiumFee ?? '') },
  { value: 'iptu', label: 'IPTU', type: 'number', currentValue: (p) => String(p.iptu ?? '') },
];

const CONTACT_FIELDS: { value: string; label: string }[] = [
  { value: 'contactPhone', label: 'Telefone fixo' },
  { value: 'contactMobile', label: 'WhatsApp / celular' },
  { value: 'contactEmail', label: 'E-mail de contato' },
  { value: 'companyName', label: 'Nome da empresa/imobiliária' },
  { value: 'ownerName', label: 'Nome do corretor/responsável' },
];

export const MaintenanceRequestForm = ({
  projectId,
  projectTitle,
  open,
  onOpenChange,
  onCreated,
}: MaintenanceRequestFormProps) => {
  const [category, setCategory] = useState<MaintenanceChangeType>('property_field');
  const [submitting, setSubmitting] = useState(false);
  const { createRequest } = useMaintenanceRequests();
  const { properties, loading: loadingProperties } = usePortfolioProperties(open ? projectId : undefined);

  // Campo/imóvel
  const [propertyId, setPropertyId] = useState('');
  const [fieldName, setFieldName] = useState('');
  const [newValue, setNewValue] = useState('');

  // Fotos
  const [photosPropertyId, setPhotosPropertyId] = useState('');
  const [photos, setPhotos] = useState<string[]>([]);
  const [uploadingPhotos, setUploadingPhotos] = useState(false);

  // Contato
  const [contactField, setContactField] = useState('');
  const [contactCurrentValue, setContactCurrentValue] = useState('');
  const [contactNewValue, setContactNewValue] = useState('');
  const [loadingContact, setLoadingContact] = useState(false);

  // Outro (texto livre)
  const [freeTitle, setFreeTitle] = useState('');
  const [freeDescription, setFreeDescription] = useState('');
  const [freeUploading, setFreeUploading] = useState(false);
  const [freeAttachments, setFreeAttachments] = useState<string[]>([]);

  useEffect(() => {
    if (!open) return;
    setCategory('property_field');
    setPropertyId('');
    setFieldName('');
    setNewValue('');
    setPhotosPropertyId('');
    setPhotos([]);
    setContactField('');
    setContactCurrentValue('');
    setContactNewValue('');
    setFreeTitle('');
    setFreeDescription('');
    setFreeAttachments([]);
  }, [open]);

  useEffect(() => {
    if (properties.length > 0 && !propertyId) setPropertyId(properties[0].id);
    if (properties.length > 0 && !photosPropertyId) {
      setPhotosPropertyId(properties[0].id);
      setPhotos(properties[0].photos || []);
    }
  }, [properties]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const selected = properties.find((p) => p.id === photosPropertyId);
    if (selected) setPhotos(selected.photos || []);
  }, [photosPropertyId, properties]);

  useEffect(() => {
    if (!contactField) {
      setContactCurrentValue('');
      return;
    }
    let cancelled = false;
    setLoadingContact(true);
    supabase
      .from('projects')
      .select('wizard_data')
      .eq('id', projectId)
      .single()
      .then(({ data }) => {
        if (cancelled) return;
        const wizardData = (data?.wizard_data as Record<string, unknown>) || {};
        const current = wizardData[contactField];
        setContactCurrentValue(typeof current === 'string' ? current : '');
      })
      .finally(() => {
        if (!cancelled) setLoadingContact(false);
      });
    return () => {
      cancelled = true;
    };
  }, [contactField, projectId]);

  const selectedProperty = properties.find((p) => p.id === propertyId);
  const selectedFieldOption = PROPERTY_FIELDS.find((f) => f.value === fieldName);

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploadingPhotos(true);
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
      setPhotos((prev) => [...prev, ...uploadedUrls]);
      toast.success('Fotos enviadas com sucesso!');
    } catch (error) {
      console.error('Error uploading photos:', error);
      toast.error('Erro ao enviar fotos');
    } finally {
      setUploadingPhotos(false);
    }
  };

  const handleFreeAttachmentUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setFreeUploading(true);
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
      setFreeAttachments((prev) => [...prev, ...uploadedUrls]);
      toast.success('Arquivos enviados com sucesso!');
    } catch (error) {
      console.error('Error uploading files:', error);
      toast.error('Erro ao enviar arquivos');
    } finally {
      setFreeUploading(false);
    }
  };

  const resetAndClose = () => {
    onOpenChange(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      let result;

      if (category === 'property_field') {
        if (!propertyId || !fieldName || !newValue.trim()) {
          toast.error('Selecione o imóvel, o campo e informe o novo valor');
          return;
        }
        const title = `Alterar ${selectedFieldOption?.label.toLowerCase()} — ${selectedProperty?.title}`;
        const description = `Alterar "${selectedFieldOption?.label}" de "${selectedFieldOption?.currentValue(selectedProperty!)}" para "${newValue}" no imóvel "${selectedProperty?.title}".`;
        const value = selectedFieldOption?.type === 'number' ? Number(newValue) : newValue;
        result = await createRequest(projectId, title, description, [], 'property_field', {
          property_id: propertyId,
          field: fieldName,
          new_value: value,
        });
      } else if (category === 'property_photos') {
        if (!photosPropertyId) {
          toast.error('Selecione o imóvel');
          return;
        }
        const propertyForPhotos = properties.find((p) => p.id === photosPropertyId);
        const title = `Atualizar fotos — ${propertyForPhotos?.title}`;
        const description = `Atualizar galeria de fotos do imóvel "${propertyForPhotos?.title}" (${photos.length} foto(s)).`;
        result = await createRequest(projectId, title, description, [], 'property_photos', {
          property_id: photosPropertyId,
          photos,
        });
      } else if (category === 'contact_info') {
        if (!contactField || !contactNewValue.trim()) {
          toast.error('Selecione o campo e informe o novo valor');
          return;
        }
        const fieldLabel = CONTACT_FIELDS.find((f) => f.value === contactField)?.label || contactField;
        const title = `Alterar ${fieldLabel.toLowerCase()}`;
        const description = `Alterar "${fieldLabel}" de "${contactCurrentValue || '(vazio)'}" para "${contactNewValue}".`;
        result = await createRequest(projectId, title, description, [], 'contact_info', {
          field: contactField,
          new_value: contactNewValue,
        });
      } else {
        if (!freeTitle.trim() || !freeDescription.trim()) {
          toast.error('Preencha o título e descrição');
          return;
        }
        result = await createRequest(projectId, freeTitle, freeDescription, freeAttachments, 'other');
      }

      if (result) {
        resetAndClose();
        if (onCreated) onCreated(result);
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Nova Solicitação de Manutenção</DialogTitle>
          <DialogDescription>
            Projeto: {projectTitle}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Tabs value={category} onValueChange={(v) => setCategory(v as MaintenanceChangeType)}>
            <TabsList className="grid grid-cols-4 w-full">
              <TabsTrigger value="property_field">Dados do imóvel</TabsTrigger>
              <TabsTrigger value="property_photos">Fotos</TabsTrigger>
              <TabsTrigger value="contact_info">Contato</TabsTrigger>
              <TabsTrigger value="other">Outro</TabsTrigger>
            </TabsList>
          </Tabs>

          <p className="text-xs text-muted-foreground">
            {category === 'other'
              ? 'Pedidos de texto livre são atendidos manualmente pela nossa equipe.'
              : 'Essa alteração é aplicada automaticamente no seu site assim que você enviar.'}
          </p>

          {category === 'property_field' && (
            <div className="space-y-4">
              {loadingProperties ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" /> Carregando imóveis...
                </div>
              ) : properties.length === 0 ? (
                <p className="text-sm text-muted-foreground">Nenhum imóvel cadastrado ainda neste projeto.</p>
              ) : (
                <>
                  <div className="space-y-2">
                    <Label>Imóvel</Label>
                    <Select value={propertyId} onValueChange={(v) => { setPropertyId(v); setFieldName(''); setNewValue(''); }}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o imóvel" />
                      </SelectTrigger>
                      <SelectContent>
                        {properties.map((p) => (
                          <SelectItem key={p.id} value={p.id}>{p.title}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Campo a alterar</Label>
                    <Select value={fieldName} onValueChange={(v) => { setFieldName(v); setNewValue(''); }}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o campo" />
                      </SelectTrigger>
                      <SelectContent>
                        {PROPERTY_FIELDS.map((f) => (
                          <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {selectedFieldOption && selectedProperty && (
                    <div className="space-y-2">
                      <Label>Novo valor</Label>
                      <p className="text-xs text-muted-foreground">
                        Valor atual: {selectedFieldOption.currentValue(selectedProperty) || '(vazio)'}
                      </p>
                      {selectedFieldOption.type === 'textarea' ? (
                        <Textarea
                          value={newValue}
                          onChange={(e) => setNewValue(e.target.value)}
                          rows={5}
                          required
                        />
                      ) : (
                        <Input
                          type={selectedFieldOption.type === 'number' ? 'number' : 'text'}
                          value={newValue}
                          onChange={(e) => setNewValue(e.target.value)}
                          required
                        />
                      )}
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {category === 'property_photos' && (
            <div className="space-y-4">
              {loadingProperties ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" /> Carregando imóveis...
                </div>
              ) : properties.length === 0 ? (
                <p className="text-sm text-muted-foreground">Nenhum imóvel cadastrado ainda neste projeto.</p>
              ) : (
                <>
                  <div className="space-y-2">
                    <Label>Imóvel</Label>
                    <Select value={photosPropertyId} onValueChange={setPhotosPropertyId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o imóvel" />
                      </SelectTrigger>
                      <SelectContent>
                        {properties.map((p) => (
                          <SelectItem key={p.id} value={p.id}>{p.title}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Fotos do imóvel</Label>
                    {photos.length > 0 && (
                      <div className="grid grid-cols-3 gap-2">
                        {photos.map((url, index) => (
                          <div key={url + index} className="relative group">
                            <img src={url} alt={`Foto ${index + 1}`} className="w-full h-24 object-cover rounded" />
                            <button
                              type="button"
                              onClick={() => setPhotos(photos.filter((p) => p !== url))}
                              className="absolute top-1 right-1 p-1 bg-destructive text-destructive-foreground rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                    <div className="border-2 border-dashed rounded-lg p-4 text-center">
                      <input
                        type="file"
                        multiple
                        accept="image/*"
                        onChange={handlePhotoUpload}
                        className="hidden"
                        id="photo-upload"
                        disabled={uploadingPhotos}
                      />
                      <label htmlFor="photo-upload" className="cursor-pointer flex flex-col items-center gap-2">
                        {uploadingPhotos ? (
                          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                        ) : (
                          <Upload className="h-8 w-8 text-muted-foreground" />
                        )}
                        <p className="text-sm text-muted-foreground">Clique para adicionar fotos</p>
                      </label>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {category === 'contact_info' && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Campo a alterar</Label>
                <Select value={contactField} onValueChange={(v) => { setContactField(v); setContactNewValue(''); }}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o campo" />
                  </SelectTrigger>
                  <SelectContent>
                    {CONTACT_FIELDS.map((f) => (
                      <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {contactField && (
                <div className="space-y-2">
                  <Label>Novo valor</Label>
                  <p className="text-xs text-muted-foreground">
                    {loadingContact ? 'Carregando valor atual...' : `Valor atual: ${contactCurrentValue || '(vazio)'}`}
                  </p>
                  <Input
                    value={contactNewValue}
                    onChange={(e) => setContactNewValue(e.target.value)}
                    required
                  />
                </div>
              )}
            </div>
          )}

          {category === 'other' && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="free-title">Título da Solicitação</Label>
                <Input
                  id="free-title"
                  value={freeTitle}
                  onChange={(e) => setFreeTitle(e.target.value)}
                  placeholder="Ex: Alterar cor do botão principal"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="free-description">Descrição Detalhada</Label>
                <Textarea
                  id="free-description"
                  value={freeDescription}
                  onChange={(e) => setFreeDescription(e.target.value)}
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
                    onChange={handleFreeAttachmentUpload}
                    className="hidden"
                    id="file-upload"
                    disabled={freeUploading}
                  />
                  <label htmlFor="file-upload" className="cursor-pointer flex flex-col items-center gap-2">
                    {freeUploading ? (
                      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                    ) : (
                      <Upload className="h-8 w-8 text-muted-foreground" />
                    )}
                    <p className="text-sm text-muted-foreground">
                      Clique para adicionar imagens ou documentos
                    </p>
                  </label>
                </div>

                {freeAttachments.length > 0 && (
                  <div className="grid grid-cols-3 gap-2 mt-2">
                    {freeAttachments.map((url, index) => (
                      <div key={index} className="relative group">
                        <img src={url} alt={`Anexo ${index + 1}`} className="w-full h-24 object-cover rounded" />
                        <button
                          type="button"
                          onClick={() => setFreeAttachments(freeAttachments.filter(a => a !== url))}
                          className="absolute top-1 right-1 p-1 bg-destructive text-destructive-foreground rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={resetAndClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={submitting || uploadingPhotos || freeUploading}>
              {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Enviar Solicitação
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
