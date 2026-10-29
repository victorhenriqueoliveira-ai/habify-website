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
import {
  PROPERTY_FIELDS,
  SITE_FIELDS,
  optionLabel,
  validateFieldValue,
  type EditableField,
} from '@/config/maintenanceCatalog';
import { supabase } from '@/integrations/supabase/client';

interface MaintenanceRequestFormProps {
  projectId: string;
  projectTitle: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated?: (request: unknown) => void;
}

// As listas de campos moravam aqui, numa terceira cópia: uma no
// formulário, uma na edge function e uma implícita no que o site renderiza.
// Agora as três leem o mesmo catálogo — é ele que decide o que o cliente
// pode alterar sozinho, e ele também carrega a regra de cada valor.
const toCamel = (key: string) => key.replace(/_([a-z])/g, (_, c: string) => c.toUpperCase());

/** Valor atual de um campo, pro formulário mostrar o "de → para". */
function currentValueOf(source: Record<string, unknown> | undefined, field: EditableField): string {
  if (!source) return '';
  const value = source[toCamel(field.key)] ?? source[field.key];
  if (Array.isArray(value)) return value.join(', ');
  return value === null || value === undefined ? '' : String(value);
}

/** Converte o que foi digitado no formato que o catálogo espera. */
function parseInputValue(field: EditableField, raw: string): string | number | string[] {
  if (field.kind === 'stringList') {
    return raw.split(',').map((item) => item.trim()).filter(Boolean);
  }
  if (field.kind === 'number' || field.kind === 'currency') {
    return Number(raw.replace(',', '.'));
  }
  return raw;
}

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
  const selectedFieldOption = PROPERTY_FIELDS.find((f) => f.key === fieldName);
  const selectedSiteField = SITE_FIELDS.find((f) => f.key === contactField);

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
        if (!selectedFieldOption) {
          toast.error('Selecione o campo a alterar');
          return;
        }

        const value = parseInputValue(selectedFieldOption, newValue);

        // Valida aqui com a mesma função que a edge function usa: o erro
        // aparece antes de gastar o crédito de manutenção, em vez de a
        // solicitação nascer e falhar do outro lado.
        const checked = validateFieldValue(selectedFieldOption, value);
        if (!checked.ok) {
          toast.error(checked.error);
          return;
        }

        const before = currentValueOf(selectedProperty as unknown as Record<string, unknown>, selectedFieldOption);
        const title = `Alterar ${selectedFieldOption.label.toLowerCase()} — ${selectedProperty?.title}`;
        const description = `Alterar "${selectedFieldOption.label}" de "${before || '(vazio)'}" para "${newValue}" no imóvel "${selectedProperty?.title}".`;
        result = await createRequest(projectId, title, description, [], 'property_field', {
          property_id: propertyId,
          field: fieldName,
          new_value: checked.value,
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
        const siteField = SITE_FIELDS.find((f) => f.key === contactField);
        if (!siteField) {
          toast.error('Selecione o campo a alterar');
          return;
        }

        const siteValue = parseInputValue(siteField, contactNewValue);
        const checkedSite = validateFieldValue(siteField, siteValue);
        if (!checkedSite.ok) {
          toast.error(checkedSite.error);
          return;
        }

        const title = `Alterar ${siteField.label.toLowerCase()}`;
        const description = `Alterar "${siteField.label}" de "${contactCurrentValue || '(vazio)'}" para "${contactNewValue}".`;
        result = await createRequest(projectId, title, description, [], 'contact_info', {
          field: contactField,
          new_value: checkedSite.value,
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
                          <SelectItem key={f.key} value={f.key}>{f.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {selectedFieldOption && selectedProperty && (
                    <div className="space-y-2">
                      <Label htmlFor="novo-valor">Novo valor</Label>
                      <p className="text-xs text-muted-foreground">
                        Valor atual:{' '}
                        {currentValueOf(
                          selectedProperty as unknown as Record<string, unknown>,
                          selectedFieldOption,
                        ) || '(vazio)'}
                      </p>

                      <FieldInput
                        id="novo-valor"
                        field={selectedFieldOption}
                        value={newValue}
                        onChange={setNewValue}
                      />
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
                    {SITE_FIELDS.map((f) => (
                      <SelectItem key={f.key} value={f.key}>{f.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {selectedSiteField && (
                <div className="space-y-2">
                  <Label htmlFor="novo-valor-site">Novo valor</Label>
                  <p className="text-xs text-muted-foreground">
                    {loadingContact ? 'Carregando valor atual...' : `Valor atual: ${contactCurrentValue || '(vazio)'}`}
                  </p>
                  <FieldInput
                    id="novo-valor-site"
                    field={selectedSiteField}
                    value={contactNewValue}
                    onChange={setContactNewValue}
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

/**
 * Entrada que respeita o tipo declarado no catálogo.
 *
 * Antes o formulário só tinha texto, número e textarea — então um campo de
 * enum (tipo do imóvel, finalidade) viraria caixa de texto livre, e o
 * cliente digitaria "Apartamento" num campo que só aceita "apartment".
 */
function FieldInput({
  id,
  field,
  value,
  onChange,
}: {
  id: string;
  field: EditableField;
  value: string;
  onChange: (value: string) => void;
}) {
  if (field.kind === 'enum') {
    return (
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger id={id}>
          <SelectValue placeholder="Selecione" />
        </SelectTrigger>
        <SelectContent>
          {(field.options ?? []).map((option) => (
            <SelectItem key={option} value={option}>
              {optionLabel(field, option)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    );
  }

  if (field.kind === 'longtext') {
    return (
      <Textarea id={id} value={value} onChange={(e) => onChange(e.target.value)} rows={5} required />
    );
  }

  if (field.kind === 'stringList') {
    return (
      <>
        <Input
          id={id}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Piscina, Academia, Portaria 24h"
          required
        />
        <p className="text-xs text-muted-foreground">Separe os itens por vírgula.</p>
      </>
    );
  }

  return (
    <Input
      id={id}
      type={field.kind === 'number' || field.kind === 'currency' ? 'number' : 'text'}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      maxLength={field.kind === 'text' ? field.max : undefined}
      required
    />
  );
}
