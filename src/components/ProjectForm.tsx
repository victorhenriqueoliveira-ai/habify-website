import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Upload, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useState } from 'react';
import { ProjectData } from '@/hooks/useMultipleProjects';

interface ProjectFormProps {
  project: ProjectData;
  index: number;
  onUpdate: (field: keyof ProjectData, value: any) => void;
  onRemove?: () => void;
  showRemove?: boolean;
  isLastProject?: boolean;
}

export const ProjectForm = ({ 
  project, 
  index, 
  onUpdate, 
  onRemove, 
  showRemove = false,
  isLastProject = false 
}: ProjectFormProps) => {
  const [uploading, setUploading] = useState(false);

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    // Validações
    const maxFileSize = 5 * 1024 * 1024; // 5MB
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    const maxFiles = 10;
    
    // Verificar limite de arquivos
    if (project.photos.length + files.length > maxFiles) {
      toast.error(`Máximo de ${maxFiles} fotos por projeto`);
      return;
    }

    // Validar cada arquivo
    const validFiles: File[] = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      
      // Verificar tipo
      if (!allowedTypes.includes(file.type)) {
        toast.error(`Arquivo "${file.name}" não é um formato válido. Use JPG, PNG ou WEBP.`);
        continue;
      }
      
      // Verificar tamanho
      if (file.size > maxFileSize) {
        toast.error(`Arquivo "${file.name}" é muito grande. Máximo 5MB por arquivo.`);
        continue;
      }
      
      validFiles.push(file);
    }

    if (validFiles.length === 0) return;

    setUploading(true);
    
    try {
      const uploadPromises = validFiles.map(async (file) => {
        // Otimizar imagem antes do upload
        const optimizedFile = await optimizeImage(file);
        
        const fileExt = file.name.split('.').pop();
        const fileName = `${Math.random()}.${fileExt}`;
        const filePath = `${Date.now()}-${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('project-photos')
          .upload(filePath, optimizedFile);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('project-photos')
          .getPublicUrl(filePath);

        return publicUrl;
      });

      const uploadedUrls = await Promise.all(uploadPromises);
      
      onUpdate('photos', [...project.photos, ...uploadedUrls]);

      toast.success(`${uploadedUrls.length} foto(s) enviada(s) e otimizada(s) com sucesso!`);
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Erro ao enviar fotos');
    } finally {
      setUploading(false);
    }
  };

  const optimizeImage = (file: File): Promise<File> => {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();
      
      img.onload = () => {
        // Definir tamanho máximo
        const maxWidth = 1920;
        const maxHeight = 1920;
        
        let { width, height } = img;
        
        // Redimensionar proporcionalmente se necessário
        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height);
          width = width * ratio;
          height = height * ratio;
        }
        
        canvas.width = width;
        canvas.height = height;
        
        // Desenhar imagem redimensionada
        ctx?.drawImage(img, 0, 0, width, height);
        
        // Converter para blob com qualidade 80%
        canvas.toBlob((blob) => {
          if (blob) {
            const optimizedFile = new File([blob], file.name, {
              type: file.type,
              lastModified: Date.now()
            });
            resolve(optimizedFile);
          } else {
            resolve(file);
          }
        }, file.type, 0.8);
      };
      
      img.onerror = () => resolve(file);
      img.src = URL.createObjectURL(file);
    });
  };

  const removePhoto = (photoIndex: number) => {
    onUpdate('photos', project.photos.filter((_, i) => i !== photoIndex));
  };

  const formatCurrency = (value: string) => {
    if (!value) return '';
    const numericValue = parseFloat(value);
    if (isNaN(numericValue)) return '';
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 2
    }).format(numericValue / 100);
  };

  return (
    <Card className="relative">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Empreendimento {index + 1}</CardTitle>
        {showRemove && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onRemove}
            className="text-red-500 hover:text-red-700"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label htmlFor={`title-${index}`}>Título do Projeto *</Label>
          <Input
            id={`title-${index}`}
            value={project.title}
            onChange={(e) => onUpdate('title', e.target.value)}
            placeholder="Ex: Residencial Vila Nova"
            required
          />
        </div>

        <div>
          <Label htmlFor={`description-${index}`}>Descrição</Label>
          <Textarea
            id={`description-${index}`}
            value={project.description}
            onChange={(e) => onUpdate('description', e.target.value)}
            placeholder="Descreva o projeto, diferenciais, localização..."
            rows={3}
          />
        </div>

        <div>
          <Label htmlFor={`location-${index}`}>Localização</Label>
          <Input
            id={`location-${index}`}
            value={project.location}
            onChange={(e) => onUpdate('location', e.target.value)}
            placeholder="Ex: Vila Madalena, São Paulo - SP"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor={`propertyType-${index}`}>Tipo de Imóvel</Label>
            <Select 
              value={project.propertyType} 
              onValueChange={(value) => onUpdate('propertyType', value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="house">Casa</SelectItem>
                <SelectItem value="apartment">Apartamento</SelectItem>
                <SelectItem value="land">Terreno</SelectItem>
                <SelectItem value="commercial">Comercial</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor={`price-${index}`}>Preço (R$)</Label>
            <Input
              id={`price-${index}`}
              type="text"
              value={project.price ? formatCurrency(project.price) : ''}
              onChange={(e) => {
                const value = e.target.value.replace(/\D/g, '');
                onUpdate('price', value);
              }}
              placeholder="R$ 500.000,00"
              className="text-right"
            />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div>
            <Label htmlFor={`bedrooms-${index}`}>Quartos</Label>
            <Input
              id={`bedrooms-${index}`}
              type="number"
              value={project.bedrooms}
              onChange={(e) => onUpdate('bedrooms', e.target.value)}
              placeholder="3"
            />
          </div>

          <div>
            <Label htmlFor={`bathrooms-${index}`}>Banheiros</Label>
            <Input
              id={`bathrooms-${index}`}
              type="number"
              value={project.bathrooms}
              onChange={(e) => onUpdate('bathrooms', e.target.value)}
              placeholder="2"
            />
          </div>

          <div>
            <Label htmlFor={`area-${index}`}>Área (m²)</Label>
            <Input
              id={`area-${index}`}
              type="number"
              value={project.area}
              onChange={(e) => onUpdate('area', e.target.value)}
              placeholder="120"
            />
          </div>
        </div>

        {/* Photos Upload */}
        <div className="space-y-4">
              <div>
                <Label htmlFor={`photos-${index}`}>Fotos do Projeto</Label>
                <p className="text-sm text-muted-foreground mb-2">
                  Máximo 10 fotos • JPG, PNG ou WEBP • Até 5MB cada
                </p>
                <div className="mt-2">
                  <input
                    id={`photos-${index}`}
                    type="file"
                    accept="image/jpeg,image/jpg,image/png,image/webp"
                    multiple
                    onChange={handlePhotoUpload}
                    className="hidden"
                    disabled={uploading || project.photos.length >= 10}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => document.getElementById(`photos-${index}`)?.click()}
                    className="w-full"
                    disabled={uploading || project.photos.length >= 10}
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    {uploading ? 'Enviando...' : `Selecionar Fotos (${project.photos.length}/10)`}
                  </Button>
                </div>
              </div>

          {project.photos.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {project.photos.map((photo, photoIndex) => (
                <div key={photoIndex} className="relative">
                  <img
                    src={photo}
                    alt={`Foto ${photoIndex + 1}`}
                    className="w-full h-24 object-cover rounded-lg"
                  />
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    onClick={() => removePhoto(photoIndex)}
                    className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0"
                  >
                    ×
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};