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

    setUploading(true);
    
    try {
      const uploadPromises = Array.from(files).map(async (file) => {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Math.random()}.${fileExt}`;
        const filePath = `${Date.now()}-${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('project-photos')
          .upload(filePath, file);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('project-photos')
          .getPublicUrl(filePath);

        return publicUrl;
      });

      const uploadedUrls = await Promise.all(uploadPromises);
      
      onUpdate('photos', [...project.photos, ...uploadedUrls]);

      toast.success(`${uploadedUrls.length} foto(s) enviada(s) com sucesso!`);
    } catch (error) {
      toast.error('Erro ao enviar fotos');
    } finally {
      setUploading(false);
    }
  };

  const removePhoto = (photoIndex: number) => {
    onUpdate('photos', project.photos.filter((_, i) => i !== photoIndex));
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
              type="number"
              value={project.price}
              onChange={(e) => onUpdate('price', e.target.value)}
              placeholder="500000"
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
            <div className="mt-2">
              <input
                id={`photos-${index}`}
                type="file"
                accept="image/*"
                multiple
                onChange={handlePhotoUpload}
                className="hidden"
                disabled={uploading}
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => document.getElementById(`photos-${index}`)?.click()}
                className="w-full"
                disabled={uploading}
              >
                <Upload className="h-4 w-4 mr-2" />
                {uploading ? 'Enviando...' : 'Selecionar Fotos'}
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