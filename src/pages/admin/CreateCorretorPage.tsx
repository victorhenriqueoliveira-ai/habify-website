import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Users, Plus, Trash2 } from 'lucide-react';
import { useProjects } from '@/hooks/useProjects';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface PropertyData {
  id: string;
  title: string;
  location: string;
  price: string;
  bedrooms: string;
  bathrooms: string;
  area: string;
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
    { id: '1', title: '', location: '', price: '', bedrooms: '', bathrooms: '', area: '' }
  ]);

  const addProperty = () => {
    if (properties.length < 5) {
      const newProperty: PropertyData = {
        id: Date.now().toString(),
        title: '',
        location: '',
        price: '',
        bedrooms: '',
        bathrooms: '',
        area: ''
      };
      setProperties([...properties, newProperty]);
    }
  };

  const removeProperty = (id: string) => {
    if (properties.length > 1) {
      setProperties(properties.filter(p => p.id !== id));
    }
  };

  const updateProperty = (id: string, field: keyof PropertyData, value: string) => {
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