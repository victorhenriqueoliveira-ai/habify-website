import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Users, Plus, Trash2, Upload, X } from 'lucide-react';
import { useProjects } from '@/hooks/useProjects';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface PropertyData {
  id: string;
  title: string;
  location: string;
  price: string;
  bedrooms: string;
  bathrooms: string;
  area: string;
  photos: string[];
}

const CreateCorretorPage = () => {
  const navigate = useNavigate();
  const { createProject } = useProjects();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  
  // Form state
  const [corretorName, setCorretorName] = useState('');
  const [corretorBio, setCorretorBio] = useState('');
  const [corretorPhone, setCorretorPhone] = useState('');
  const [corretorEmail, setCorretorEmail] = useState('');
  const [creci, setCreci] = useState('');
  
  // Properties state (up to 5)
  const [properties, setProperties] = useState<PropertyData[]>([
    { id: '1', title: '', location: '', price: '', bedrooms: '', bathrooms: '', area: '', photos: [] }
  ]);
  const [uploading, setUploading] = useState(false);

  const addProperty = () => {
    if (properties.length < 5) {
      const newProperty: PropertyData = {
        id: Date.now().toString(),
        title: '',
        location: '',
        price: '',
        bedrooms: '',
        bathrooms: '',
        area: '',
        photos: []
      };
      setProperties([...properties, newProperty]);
    }
  };

  const removeProperty = (id: string) => {
    if (properties.length > 1) {
      setProperties(properties.filter(p => p.id !== id));
    }
  };

  const updateProperty = (id: string, field: keyof PropertyData, value: string | string[]) => {
    setProperties(properties.map(p => 
      p.id === id ? { ...p, [field]: value } : p
    ));
  };

  const formatCurrency = (value: string) => {
    const numericValue = value.replace(/[^\d]/g, '');
    if (!numericValue) return '';
    
    const number = parseInt(numericValue);
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(number);
  };

  const handlePropertyPriceChange = (id: string, value: string) => {
    updateProperty(id, 'price', formatCurrency(value));
  };

  const handlePhotoUpload = async (propertyId: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const property = properties.find(p => p.id === propertyId);
    if (!property) return;

    // Validations
    const maxFileSize = 5 * 1024 * 1024; // 5MB
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    const maxFiles = 5;
    
    // Check file limit
    if (property.photos.length + files.length > maxFiles) {
      toast.error(`Máximo de ${maxFiles} fotos por imóvel`);
      return;
    }

    // Validate each file
    const validFiles: File[] = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      
      // Check type
      if (!allowedTypes.includes(file.type)) {
        toast.error(`Arquivo "${file.name}" não é um formato válido. Use JPG, PNG ou WEBP.`);
        continue;
      }
      
      // Check size
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
      
      updateProperty(propertyId, 'photos', [...property.photos, ...uploadedUrls]);

      toast.success(`${uploadedUrls.length} foto(s) enviada(s) com sucesso!`);
    } catch (error) {
      toast.error('Erro ao enviar fotos');
    } finally {
      setUploading(false);
    }
  };

  const removePhoto = (propertyId: string, photoIndex: number) => {
    const property = properties.find(p => p.id === propertyId);
    if (!property) return;
    
    const newPhotos = property.photos.filter((_, i) => i !== photoIndex);
    updateProperty(propertyId, 'photos', newPhotos);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!corretorName.trim()) {
      toast.error('O nome do corretor é obrigatório');
      return;
    }

    // Validate at least one property has title and location
    const validProperties = properties.filter(p => p.title.trim() && p.location.trim());
    if (validProperties.length === 0) {
      toast.error('Pelo menos um imóvel deve ter título e localização');
      return;
    }

    setLoading(true);
    
    try {
      const result = await createProject({
        userId: user?.userId || user?.id || '',
        title: `Site do Corretor ${corretorName}`,
        description: corretorBio,
        location: 'Multi-localização',
        propertyType: 'apartment',
        price: 0,
        status: 'pending',
        projectType: 'realtor_multiple',
        features: {
          corretorData: {
            name: corretorName,
            bio: corretorBio,
            phone: corretorPhone,
            email: corretorEmail,
            creci: creci,
            properties: validProperties
          }
        }
      });
      
      if (result.success) {
        toast.success('Site do corretor criado com sucesso!');
        navigate('/admin/my-projects');
      } else {
        toast.error('Erro ao criar site do corretor');
      }
    } catch (error) {
      toast.error('Erro interno do servidor');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-secondary/10 rounded-lg">
            <Users className="h-6 w-6 text-secondary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Criar Site para Corretor</h1>
            <p className="text-muted-foreground">
              Configure seu perfil profissional e adicione até 5 imóveis
            </p>
          </div>
        </div>
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => navigate('/admin/new-project')}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar
        </Button>
      </div>

      <div className="max-w-4xl mx-auto space-y-6">
        {/* Corretor Information */}
        <Card>
          <CardHeader>
            <CardTitle>Informações do Corretor</CardTitle>
            <CardDescription>
              Dados do seu perfil profissional
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="corretorName">Nome Completo *</Label>
                  <Input
                    id="corretorName"
                    value={corretorName}
                    onChange={(e) => setCorretorName(e.target.value)}
                    placeholder="Seu nome completo"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="creci">CRECI</Label>
                  <Input
                    id="creci"
                    value={creci}
                    onChange={(e) => setCreci(e.target.value)}
                    placeholder="Ex: 12345-J"
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="corretorPhone">Telefone</Label>
                  <Input
                    id="corretorPhone"
                    value={corretorPhone}
                    onChange={(e) => setCorretorPhone(e.target.value)}
                    placeholder="(11) 99999-9999"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="corretorEmail">E-mail</Label>
                  <Input
                    id="corretorEmail"
                    type="email"
                    value={corretorEmail}
                    onChange={(e) => setCorretorEmail(e.target.value)}
                    placeholder="seuemail@exemplo.com"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="corretorBio">Biografia Profissional</Label>
                <Textarea
                  id="corretorBio"
                  value={corretorBio}
                  onChange={(e) => setCorretorBio(e.target.value)}
                  placeholder="Conte um pouco sobre sua experiência no mercado imobiliário..."
                  rows={4}
                />
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Properties Section */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>Imóveis do Portfólio</CardTitle>
                <CardDescription>
                  Adicione até 5 imóveis para seu portfólio ({properties.length}/5)
                </CardDescription>
              </div>
              {properties.length < 5 && (
                <Button onClick={addProperty} variant="outline" size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Adicionar Imóvel
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {properties.map((property, index) => (
              <div key={property.id} className="border rounded-lg p-4 space-y-4">
                <div className="flex justify-between items-center">
                  <h4 className="font-medium">Imóvel {index + 1}</h4>
                  {properties.length > 1 && (
                    <Button 
                      onClick={() => removeProperty(property.id)}
                      variant="ghost" 
                      size="sm"
                      className="text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Título do Imóvel</Label>
                    <Input
                      value={property.title}
                      onChange={(e) => updateProperty(property.id, 'title', e.target.value)}
                      placeholder="Ex: Apartamento 3 quartos"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Localização</Label>
                    <Input
                      value={property.location}
                      onChange={(e) => updateProperty(property.id, 'location', e.target.value)}
                      placeholder="Ex: Vila Madalena, São Paulo"
                    />
                  </div>
                </div>

                <div className="grid md:grid-cols-4 gap-4">
                  <div className="space-y-2">
                    <Label>Preço</Label>
                    <Input
                      value={property.price}
                      onChange={(e) => handlePropertyPriceChange(property.id, e.target.value)}
                      placeholder="R$ 500.000"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Quartos</Label>
                    <Input
                      value={property.bedrooms}
                      onChange={(e) => updateProperty(property.id, 'bedrooms', e.target.value)}
                      placeholder="3"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Banheiros</Label>
                    <Input
                      value={property.bathrooms}
                      onChange={(e) => updateProperty(property.id, 'bathrooms', e.target.value)}
                      placeholder="2"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Área (m²)</Label>
                    <Input
                      value={property.area}
                      onChange={(e) => updateProperty(property.id, 'area', e.target.value)}
                      placeholder="85"
                    />
                  </div>
                </div>

                {/* Photos Upload for this property */}
                <div className="space-y-2">
                  <Label>Fotos do Imóvel</Label>
                  <p className="text-xs text-muted-foreground">
                    Máximo 5 fotos por imóvel • JPG, PNG ou WEBP • Até 5MB cada
                  </p>
                  <div className="mt-2">
                    <input
                      id={`photos-${property.id}`}
                      type="file"
                      accept="image/jpeg,image/jpg,image/png,image/webp"
                      multiple
                      onChange={(e) => handlePhotoUpload(property.id, e)}
                      className="hidden"
                      disabled={uploading || property.photos.length >= 5}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => document.getElementById(`photos-${property.id}`)?.click()}
                      className="w-full"
                      disabled={uploading || property.photos.length >= 5}
                      size="sm"
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      {uploading ? 'Enviando...' : `Adicionar Fotos (${property.photos.length}/5)`}
                    </Button>
                  </div>

                  {property.photos.length > 0 && (
                    <div className="grid grid-cols-3 gap-2 mt-2">
                      {property.photos.map((photo, photoIndex) => (
                        <div key={photoIndex} className="relative">
                          <img
                            src={photo}
                            alt={`Foto ${photoIndex + 1}`}
                            className="w-full h-16 object-cover rounded"
                          />
                          <Button
                            type="button"
                            variant="destructive"
                            size="sm"
                            onClick={() => removePhoto(property.id, photoIndex)}
                            className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0"
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Submit Buttons */}
        <div className="flex space-x-4">
          <Button 
            type="button"
            variant="outline" 
            onClick={() => navigate('/admin/new-project')}
            className="flex-1"
          >
            Cancelar
          </Button>
          <Button 
            onClick={handleSubmit}
            disabled={loading || !corretorName.trim()}
            className="flex-1"
          >
            {loading ? 'Criando...' : 'Criar Site do Corretor'}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default CreateCorretorPage;