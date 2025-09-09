import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Upload, Building, User, ArrowLeft, Plus } from 'lucide-react';
import { useProjects } from '@/hooks/useProjects';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

type ProjectType = 'single_property' | 'realtor_multiple';

const NewProjectPage = () => {
  const navigate = useNavigate();
  const { createProject } = useProjects();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  
  const [projectData, setProjectData] = useState({
    title: '',
    description: '',
    projectType: 'single_property' as ProjectType,
    price: '',
    location: '',
    propertyType: 'house' as 'house' | 'apartment' | 'land' | 'commercial',
    bedrooms: '',
    bathrooms: '',
    area: '',
    photos: [] as string[],
  });

  const handleInputChange = (field: string, value: string | number) => {
    setProjectData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user?.id) {
      toast.error('Você precisa estar logado para criar um projeto');
      return;
    }

    if (!projectData.title.trim()) {
      toast.error('Título é obrigatório');
      return;
    }

    setLoading(true);
    
    try {
      const result = await createProject({
        userId: user.id,
        title: projectData.title.trim(),
        description: projectData.description.trim(),
        projectType: projectData.projectType,
        price: projectData.price ? Number(projectData.price) : undefined,
        location: projectData.location.trim(),
        propertyType: projectData.propertyType,
        bedrooms: projectData.bedrooms ? Number(projectData.bedrooms) : undefined,
        bathrooms: projectData.bathrooms ? Number(projectData.bathrooms) : undefined,
        area: projectData.area ? Number(projectData.area) : undefined,
        photos: projectData.photos,
      });

      if (result.success) {
        toast.success('Projeto criado com sucesso!');
        navigate('/admin/my-projects');
      } else {
        toast.error('Erro ao criar projeto');
      }
    } catch (error) {
      toast.error('Erro interno do servidor');
    } finally {
      setLoading(false);
    }
  };

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
      
      setProjectData(prev => ({
        ...prev,
        photos: [...prev.photos, ...uploadedUrls]
      }));

      toast.success(`${uploadedUrls.length} foto(s) enviada(s) com sucesso!`);
    } catch (error) {
      toast.error('Erro ao enviar fotos');
    } finally {
      setUploading(false);
    }
  };

  const removePhoto = (index: number) => {
    setProjectData(prev => ({
      ...prev,
      photos: prev.photos.filter((_, i) => i !== index)
    }));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => navigate('/admin/my-projects')}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
          <h1 className="text-3xl font-bold">Novo Projeto</h1>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Project Type Selection */}
            <Card>
              <CardHeader>
                <CardTitle>Tipo de Projeto</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card 
                    className={`cursor-pointer transition-colors ${
                      projectData.projectType === 'single_property' 
                        ? 'border-primary bg-primary/5' 
                        : 'hover:border-primary/50'
                    }`}
                    onClick={() => handleInputChange('projectType', 'single_property')}
                  >
                    <CardContent className="flex flex-col items-center text-center p-6">
                      <Building className="h-8 w-8 mb-2" />
                      <h3 className="font-semibold">Empreendimento Único</h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        Site para um empreendimento específico
                      </p>
                    </CardContent>
                  </Card>

                  <Card 
                    className={`cursor-pointer transition-colors ${
                      projectData.projectType === 'realtor_multiple' 
                        ? 'border-primary bg-primary/5' 
                        : 'hover:border-primary/50'
                    }`}
                    onClick={() => handleInputChange('projectType', 'realtor_multiple')}
                  >
                    <CardContent className="flex flex-col items-center text-center p-6">
                      <User className="h-8 w-8 mb-2" />
                      <h3 className="font-semibold">Corretor/Múltiplos</h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        Site para corretor com vários empreendimentos
                      </p>
                    </CardContent>
                  </Card>
                </div>
              </CardContent>
            </Card>

            {/* Basic Information */}
            <Card>
              <CardHeader>
                <CardTitle>Informações Básicas</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="title">Título do Projeto *</Label>
                  <Input
                    id="title"
                    value={projectData.title}
                    onChange={(e) => handleInputChange('title', e.target.value)}
                    placeholder="Ex: Residencial Vila Nova"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="description">Descrição</Label>
                  <Textarea
                    id="description"
                    value={projectData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    placeholder="Descreva o projeto, diferenciais, localização..."
                    rows={4}
                  />
                </div>

                <div>
                  <Label htmlFor="location">Localização</Label>
                  <Input
                    id="location"
                    value={projectData.location}
                    onChange={(e) => handleInputChange('location', e.target.value)}
                    placeholder="Ex: Vila Madalena, São Paulo - SP"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Property Details */}
            {projectData.projectType === 'single_property' && (
              <Card>
                <CardHeader>
                  <CardTitle>Detalhes do Imóvel</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="propertyType">Tipo de Imóvel</Label>
                      <Select 
                        value={projectData.propertyType} 
                        onValueChange={(value) => handleInputChange('propertyType', value)}
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
                      <Label htmlFor="price">Preço (R$)</Label>
                      <Input
                        id="price"
                        type="number"
                        value={projectData.price}
                        onChange={(e) => handleInputChange('price', e.target.value)}
                        placeholder="500000"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="bedrooms">Quartos</Label>
                      <Input
                        id="bedrooms"
                        type="number"
                        value={projectData.bedrooms}
                        onChange={(e) => handleInputChange('bedrooms', e.target.value)}
                        placeholder="3"
                      />
                    </div>

                    <div>
                      <Label htmlFor="bathrooms">Banheiros</Label>
                      <Input
                        id="bathrooms"
                        type="number"
                        value={projectData.bathrooms}
                        onChange={(e) => handleInputChange('bathrooms', e.target.value)}
                        placeholder="2"
                      />
                    </div>

                    <div>
                      <Label htmlFor="area">Área (m²)</Label>
                      <Input
                        id="area"
                        type="number"
                        value={projectData.area}
                        onChange={(e) => handleInputChange('area', e.target.value)}
                        placeholder="120"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Photos Upload */}
            <Card>
              <CardHeader>
                <CardTitle>Fotos do Projeto</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="photos">Adicionar Fotos</Label>
                  <div className="mt-2">
                    <input
                      id="photos"
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
                      onClick={() => document.getElementById('photos')?.click()}
                      className="w-full"
                      disabled={uploading}
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      {uploading ? 'Enviando...' : 'Selecionar Fotos'}
                    </Button>
                  </div>
                </div>

                {projectData.photos.length > 0 && (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {projectData.photos.map((photo, index) => (
                      <div key={index} className="relative">
                        <img
                          src={photo}
                          alt={`Foto ${index + 1}`}
                          className="w-full h-24 object-cover rounded-lg"
                        />
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          onClick={() => removePhoto(index)}
                          className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0"
                        >
                          ×
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <div className="flex space-x-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate('/admin/my-projects')}
                disabled={loading}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? 'Criando...' : 'Criar Projeto'}
              </Button>
            </div>
          </form>
        </div>

        {/* Summary Sidebar */}
        <div className="lg:col-span-1">
          <Card className="sticky top-4">
            <CardHeader>
              <CardTitle>Resumo do Projeto</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-sm font-medium">Tipo:</Label>
                <Badge variant="outline" className="ml-2">
                  {projectData.projectType === 'single_property' 
                    ? 'Empreendimento Único' 
                    : 'Corretor/Múltiplos'}
                </Badge>
              </div>

              {projectData.title && (
                <div>
                  <Label className="text-sm font-medium">Título:</Label>
                  <p className="text-sm">{projectData.title}</p>
                </div>
              )}

              {projectData.location && (
                <div>
                  <Label className="text-sm font-medium">Localização:</Label>
                  <p className="text-sm">{projectData.location}</p>
                </div>
              )}

              {projectData.price && (
                <div>
                  <Label className="text-sm font-medium">Preço:</Label>
                  <p className="text-sm">
                    R$ {Number(projectData.price).toLocaleString('pt-BR')}
                  </p>
                </div>
              )}

              <div>
                <Label className="text-sm font-medium">Fotos:</Label>
                <p className="text-sm">{projectData.photos.length} adicionada(s)</p>
              </div>

              <Separator />

              <div className="text-xs text-muted-foreground">
                <p>• O projeto será criado com status "Pendente"</p>
                <p>• Nossa equipe será notificada automaticamente</p>
                <p>• Você pode editar as informações posteriormente</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default NewProjectPage;