import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Loader2, Plus, Trash2 } from 'lucide-react';
import { useProjects } from '@/hooks/useProjects';
import { useUsers } from '@/hooks/useUsers';
import { usePortfolioProperties } from '@/hooks/usePortfolioProperties';
import { ProjectStatus } from '@/types/admin';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

const statusOptions = [
  { value: 'pending', label: 'Pendente' },
  { value: 'in_progress', label: 'Em Andamento' },
  { value: 'in_review', label: 'Em Revisão' },
  { value: 'completed', label: 'Concluído' },
  { value: 'approved', label: 'Aprovado' },
  { value: 'rejected', label: 'Rejeitado' },
];

const propertyTypeOptions = [
  { value: 'house', label: 'Casa' },
  { value: 'apartment', label: 'Apartamento' },
  { value: 'land', label: 'Terreno' },
  { value: 'commercial', label: 'Comercial' },
];

export const ProjectEditPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { projects, updateProject, loading: projectsLoading } = useProjects();
  const { users } = useUsers();
  const { properties: portfolioProperties, fetchProperties } = usePortfolioProperties(id);
  const [loading, setLoading] = useState(false);

  const project = projects.find(p => p.id === id);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    location: '',
    propertyType: 'house',
    bedrooms: '',
    bathrooms: '',
    area: '',
    price: '',
    status: 'pending' as ProjectStatus,
    userId: '',
    landingPageUrl: '',
  });

  const [editingProperties, setEditingProperties] = useState<any[]>([]);

  useEffect(() => {
    if (project) {
      setFormData({
        title: project.title,
        description: project.description,
        location: project.location,
        propertyType: project.propertyType,
        bedrooms: project.bedrooms?.toString() || '',
        bathrooms: project.bathrooms?.toString() || '',
        area: project.area?.toString() || '',
        price: project.price?.toString() || '',
        status: project.status,
        userId: project.userId,
        landingPageUrl: project.landingPageUrl || '',
      });
    }
  }, [project]);

  useEffect(() => {
    if (portfolioProperties.length > 0) {
      setEditingProperties(portfolioProperties.map(p => ({
        id: p.id,
        title: p.title,
        location: p.location,
        price: p.price.toString(),
        propertyType: p.propertyType,
        purpose: p.purpose,
        bedrooms: p.bedrooms?.toString() || '',
        bathrooms: p.bathrooms?.toString() || '',
        area: p.area.toString(),
        parkingSpaces: p.parkingSpaces?.toString() || '',
        constructionYear: p.constructionYear?.toString() || '',
        floorNumber: p.floorNumber?.toString() || '',
        condominiumFee: p.condominiumFee?.toString() || '',
        iptu: p.iptu?.toString() || '',
        description: p.description || '',
        amenities: p.amenities || [],
      })));
    }
  }, [portfolioProperties]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!project) return;

    setLoading(true);
    try {
      // Update main project
      await updateProject(project.id, {
        title: formData.title,
        description: formData.description,
        location: formData.location,
        propertyType: formData.propertyType as any,
        bedrooms: formData.bedrooms ? parseInt(formData.bedrooms) : undefined,
        bathrooms: formData.bathrooms ? parseInt(formData.bathrooms) : undefined,
        area: formData.area ? parseFloat(formData.area) : undefined,
        price: formData.price ? parseFloat(formData.price) : undefined,
        status: formData.status,
        userId: formData.userId,
        landingPageUrl: formData.landingPageUrl || undefined,
      });

      // Update portfolio properties if they exist
      if (editingProperties.length > 0) {
        for (const prop of editingProperties) {
          if (prop.id) {
            const { error } = await supabase
              .from('portfolio_properties')
              .update({
                title: prop.title,
                location: prop.location,
                price: parseFloat(prop.price),
                property_type: prop.propertyType,
                purpose: prop.purpose,
                bedrooms: prop.bedrooms ? parseInt(prop.bedrooms) : null,
                bathrooms: prop.bathrooms ? parseInt(prop.bathrooms) : null,
                area: parseFloat(prop.area),
                parking_spaces: prop.parkingSpaces ? parseInt(prop.parkingSpaces) : null,
                construction_year: prop.constructionYear ? parseInt(prop.constructionYear) : null,
                floor_number: prop.floorNumber ? parseInt(prop.floorNumber) : null,
                condominium_fee: prop.condominiumFee ? parseFloat(prop.condominiumFee) : null,
                iptu: prop.iptu ? parseFloat(prop.iptu) : null,
                description: prop.description || null,
                amenities: prop.amenities || [],
              })
              .eq('id', prop.id);

            if (error) throw error;
          }
        }
      }

      toast.success('Projeto atualizado com sucesso!');
      navigate(`/admin/projects/${id}`);
    } catch (error) {
      console.error('Error updating project:', error);
      toast.error('Erro ao atualizar projeto');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const updateProperty = (index: number, field: string, value: any) => {
    setEditingProperties(prev => 
      prev.map((prop, i) => i === index ? { ...prop, [field]: value } : prop)
    );
  };

  if (projectsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card>
          <CardContent className="pt-6">
            <p className="text-muted-foreground">Projeto não encontrado</p>
            <Button onClick={() => navigate(-1)} className="mt-4">
              Voltar
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate(-1)}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Editar Projeto</h1>
          <p className="text-muted-foreground">{project.title}</p>
        </div>
      </div>

      {/* Form */}
      <Card>
        <CardHeader>
          <CardTitle>Informações do Projeto</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="title">Nome do Projeto</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => handleChange('title', e.target.value)}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="userId">Cliente</Label>
                <Select value={formData.userId} onValueChange={(value) => handleChange('userId', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecionar cliente" />
                  </SelectTrigger>
                  <SelectContent>
                    {users.map(user => (
                      <SelectItem key={user.userId} value={user.userId}>
                        {user.name} - {user.email}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Descrição</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => handleChange('description', e.target.value)}
                rows={4}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="location">Localização</Label>
                <Input
                  id="location"
                  value={formData.location}
                  onChange={(e) => handleChange('location', e.target.value)}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="propertyType">Tipo do Imóvel</Label>
                <Select value={formData.propertyType} onValueChange={(value) => handleChange('propertyType', value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {propertyTypeOptions.map(option => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="bedrooms">Quartos</Label>
                <Input
                  id="bedrooms"
                  type="number"
                  value={formData.bedrooms}
                  onChange={(e) => handleChange('bedrooms', e.target.value)}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="bathrooms">Banheiros</Label>
                <Input
                  id="bathrooms"
                  type="number"
                  value={formData.bathrooms}
                  onChange={(e) => handleChange('bathrooms', e.target.value)}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="area">Área (m²)</Label>
                <Input
                  id="area"
                  type="number"
                  value={formData.area}
                  onChange={(e) => handleChange('area', e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="price">Preço (R$)</Label>
                <Input
                  id="price"
                  type="number"
                  step="0.01"
                  value={formData.price}
                  onChange={(e) => handleChange('price', e.target.value)}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select value={formData.status} onValueChange={(value) => handleChange('status', value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {statusOptions.map(option => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="landingPageUrl">URL da Landing Page</Label>
              <Input
                id="landingPageUrl"
                type="url"
                value={formData.landingPageUrl}
                onChange={(e) => handleChange('landingPageUrl', e.target.value)}
                placeholder="https://exemplo.com/landing-page"
              />
            </div>

            <div className="flex justify-end space-x-2 pt-4">
              <Button type="button" variant="outline" onClick={() => navigate(-1)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Salvar Alterações
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Portfolio Properties */}
      {project?.projectType === 'realtor_multiple' && editingProperties.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Imóveis do Portfólio</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {editingProperties.map((property, index) => (
                <div key={index} className="border rounded-lg p-4 space-y-4">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-semibold">Imóvel {index + 1}</h4>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                      <Label>Título</Label>
                      <Input
                        value={property.title}
                        onChange={(e) => updateProperty(index, 'title', e.target.value)}
                      />
                    </div>

                    <div>
                      <Label>Localização</Label>
                      <Input
                        value={property.location}
                        onChange={(e) => updateProperty(index, 'location', e.target.value)}
                      />
                    </div>

                    <div>
                      <Label>Preço (R$)</Label>
                      <Input
                        type="number"
                        value={property.price}
                        onChange={(e) => updateProperty(index, 'price', e.target.value)}
                      />
                    </div>

                    <div>
                      <Label>Tipo</Label>
                      <Select 
                        value={property.propertyType}
                        onValueChange={(value) => updateProperty(index, 'propertyType', value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="apartment">Apartamento</SelectItem>
                          <SelectItem value="house">Casa</SelectItem>
                          <SelectItem value="commercial">Comercial</SelectItem>
                          <SelectItem value="land">Terreno</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label>Finalidade</Label>
                      <Select 
                        value={property.purpose}
                        onValueChange={(value) => updateProperty(index, 'purpose', value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="sale">Venda</SelectItem>
                          <SelectItem value="rent">Aluguel</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label>Área (m²)</Label>
                      <Input
                        type="number"
                        value={property.area}
                        onChange={(e) => updateProperty(index, 'area', e.target.value)}
                      />
                    </div>

                    <div>
                      <Label>Quartos</Label>
                      <Input
                        type="number"
                        value={property.bedrooms}
                        onChange={(e) => updateProperty(index, 'bedrooms', e.target.value)}
                      />
                    </div>

                    <div>
                      <Label>Banheiros</Label>
                      <Input
                        type="number"
                        value={property.bathrooms}
                        onChange={(e) => updateProperty(index, 'bathrooms', e.target.value)}
                      />
                    </div>

                    <div>
                      <Label>Vagas</Label>
                      <Input
                        type="number"
                        value={property.parkingSpaces}
                        onChange={(e) => updateProperty(index, 'parkingSpaces', e.target.value)}
                      />
                    </div>

                    <div>
                      <Label>Ano de Construção</Label>
                      <Input
                        type="number"
                        value={property.constructionYear}
                        onChange={(e) => updateProperty(index, 'constructionYear', e.target.value)}
                      />
                    </div>

                    <div>
                      <Label>Andar</Label>
                      <Input
                        type="number"
                        value={property.floorNumber}
                        onChange={(e) => updateProperty(index, 'floorNumber', e.target.value)}
                      />
                    </div>

                    <div>
                      <Label>Condomínio (R$)</Label>
                      <Input
                        type="number"
                        value={property.condominiumFee}
                        onChange={(e) => updateProperty(index, 'condominiumFee', e.target.value)}
                      />
                    </div>

                    <div>
                      <Label>IPTU (R$)</Label>
                      <Input
                        type="number"
                        value={property.iptu}
                        onChange={(e) => updateProperty(index, 'iptu', e.target.value)}
                      />
                    </div>

                    <div className="md:col-span-2">
                      <Label>Descrição</Label>
                      <Textarea
                        value={property.description}
                        onChange={(e) => updateProperty(index, 'description', e.target.value)}
                        rows={3}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
