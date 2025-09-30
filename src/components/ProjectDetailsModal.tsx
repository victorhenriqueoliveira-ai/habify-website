import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ExternalLink, MapPin, Home, Bed, Bath, Square, Calendar, User, MessageSquare, Palette, Layout, Image, Building2, Mail, Phone, MapPinned } from 'lucide-react';
import { Project, ProjectStatus } from '@/types/admin';
import { useAuth } from '@/contexts/AuthContext';
import { useProjects } from '@/hooks/useProjects';
import { useUsers } from '@/hooks/useUsers';
import { usePortfolioProperties } from '@/hooks/usePortfolioProperties';
import { ProjectChat } from './ProjectChat';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface ProjectDetailsModalProps {
  project: Project | null;
  open: boolean;
  onClose: () => void;
}

const statusColors = {
  pending: 'secondary',
  in_progress: 'default',
  completed: 'default',
  approved: 'default',
  rejected: 'destructive',
} as const;

const statusLabels = {
  pending: 'Pendente',
  in_progress: 'Em Andamento',
  completed: 'Concluído',
  approved: 'Aprovado',
  rejected: 'Rejeitado',
};

const propertyTypeLabels = {
  house: 'Casa',
  apartment: 'Apartamento',
  land: 'Terreno',
  commercial: 'Comercial',
};

export const ProjectDetailsModal = ({ project, open, onClose }: ProjectDetailsModalProps) => {
  const { hasRole } = useAuth();
  const { updateProject } = useProjects();
  const { users } = useUsers();
  const { properties: portfolioProperties } = usePortfolioProperties(project?.id);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  
  console.log('ProjectDetailsModal - project:', project);
  console.log('ProjectDetailsModal - open:', open);
  
  if (!project) {
    console.log('ProjectDetailsModal - No project provided, returning null');
    return null;
  }

  // Check if this is a realtor project with multiple properties
  const isRealtorProject = project.projectType === 'realtor_multiple';
  const corretorData = isRealtorProject ? project.features?.corretorData : null;
  const wizardData = project.wizardData || {};

  const projectOwner = users.find(u => u.userId === project.userId);

  const layoutLabels = {
    classic: 'Clássico',
    modern: 'Moderno',
    minimalist: 'Minimalista',
    vibrant: 'Vibrante',
  };

  const colorLabels = {
    blue: 'Azul Profissional',
    orange: 'Laranja Energia',
    green: 'Verde Confiança',
    purple: 'Roxo Sofisticado',
    neutral: 'Neutro Elegante',
  };

  const propertyTypeLabels = {
    apartment: 'Apartamento',
    house: 'Casa',
    commercial: 'Comercial',
    land: 'Terreno',
    penthouse: 'Cobertura',
  };

  const purposeLabels = {
    sale: 'Venda',
    rent: 'Aluguel',
  };

  const handleStatusChange = async (newStatus: ProjectStatus) => {
    setUpdatingStatus(true);
    try {
      const result = await updateProject(project.id, { status: newStatus });
      
      if (result.success) {
        toast.success(`Status alterado para: ${statusLabels[newStatus]}`);
      } else {
        toast.error('Erro ao atualizar status');
      }
    } catch (error) {
      toast.error('Erro interno');
    } finally {
      setUpdatingStatus(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(open) => {
      console.log('Dialog onOpenChange:', open);
      !open && onClose();
    }}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-xl font-bold">{project.title}</DialogTitle>
            <div className="flex items-center space-x-2">
              <Badge variant={statusColors[project.status]}>
                {statusLabels[project.status]}
              </Badge>
              {hasRole(['admin', 'dev']) && (
                <Select
                  value={project.status}
                  onValueChange={handleStatusChange}
                  disabled={updatingStatus}
                >
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pendente</SelectItem>
                    <SelectItem value="in_progress">Em Andamento</SelectItem>
                    <SelectItem value="completed">Concluído</SelectItem>
                    <SelectItem value="approved">Aprovado</SelectItem>
                    <SelectItem value="rejected">Rejeitado</SelectItem>
                  </SelectContent>
                </Select>
              )}
            </div>
          </div>
        </DialogHeader>

        <Tabs defaultValue="details" className="flex-1 flex flex-col overflow-hidden">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="details">Informações</TabsTrigger>
            <TabsTrigger value="wizard">Dados do Wizard</TabsTrigger>
            <TabsTrigger value="photos">Fotos</TabsTrigger>
            <TabsTrigger value="chat">
              <MessageSquare className="w-4 h-4 mr-2" />
              Chat
            </TabsTrigger>
          </TabsList>

          <TabsContent value="details" className="flex-1 overflow-auto space-y-4">
            {/* Visual Design Section */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Palette className="w-5 h-5 mr-2" />
                  Design Visual
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Layout */}
                  {project.layoutChoice && (
                    <div>
                      <div className="flex items-center mb-2">
                        <Layout className="w-4 h-4 mr-2 text-muted-foreground" />
                        <h4 className="font-medium">Layout</h4>
                      </div>
                      <Badge variant="outline" className="text-base">
                        {layoutLabels[project.layoutChoice as keyof typeof layoutLabels] || project.layoutChoice}
                      </Badge>
                    </div>
                  )}

                  {/* Color Palette */}
                  {wizardData.palette && (
                    <div>
                      <div className="flex items-center mb-2">
                        <Palette className="w-4 h-4 mr-2 text-muted-foreground" />
                        <h4 className="font-medium">Paleta de Cores</h4>
                      </div>
                      <div className="space-y-2">
                        <p className="text-sm font-medium">
                          {colorLabels[wizardData.palette.id as keyof typeof colorLabels] || wizardData.palette.id}
                        </p>
                        <div className="flex gap-2">
                          <div
                            className="w-8 h-8 rounded border"
                            style={{ backgroundColor: wizardData.palette.colors.primary }}
                            title="Primary"
                          />
                          <div
                            className="w-8 h-8 rounded border"
                            style={{ backgroundColor: wizardData.palette.colors.secondary }}
                            title="Secondary"
                          />
                          <div
                            className="w-8 h-8 rounded border"
                            style={{ backgroundColor: wizardData.palette.colors.accent }}
                            title="Accent"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Logo */}
                  {project.logoUrl && (
                    <div>
                      <div className="flex items-center mb-2">
                        <Image className="w-4 h-4 mr-2 text-muted-foreground" />
                        <h4 className="font-medium">Logotipo</h4>
                      </div>
                      <img
                        src={project.logoUrl}
                        alt="Logo"
                        className="h-16 object-contain bg-muted rounded p-2"
                      />
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Portfolio Properties */}
            {portfolioProperties.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Building2 className="w-5 h-5 mr-2" />
                    Imóveis do Portfólio ({portfolioProperties.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {portfolioProperties.map((property, index) => (
                      <Card key={property.id} className="border">
                        <CardContent className="pt-4">
                          <div className="space-y-3">
                            <div className="flex justify-between items-start">
                              <h4 className="font-semibold text-lg">{property.title}</h4>
                              <Badge variant="secondary">#{index + 1}</Badge>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div className="space-y-2">
                                <div className="flex items-center text-sm">
                                  <MapPin className="w-4 h-4 mr-2 text-muted-foreground" />
                                  {property.location}
                                </div>
                                <div className="text-sm">
                                  <span className="font-medium">Tipo: </span>
                                  {propertyTypeLabels[property.propertyType as keyof typeof propertyTypeLabels] || property.propertyType}
                                </div>
                                <div className="text-sm">
                                  <span className="font-medium">Finalidade: </span>
                                  {purposeLabels[property.purpose as keyof typeof purposeLabels] || property.purpose}
                                </div>
                                <div className="text-lg font-bold text-green-600">
                                  R$ {property.price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                </div>
                              </div>

                              <div className="space-y-2">
                                <div className="grid grid-cols-2 gap-2">
                                  {property.bedrooms && (
                                    <div className="flex items-center text-sm">
                                      <Bed className="w-4 h-4 mr-1" />
                                      {property.bedrooms} quartos
                                    </div>
                                  )}
                                  {property.bathrooms && (
                                    <div className="flex items-center text-sm">
                                      <Bath className="w-4 h-4 mr-1" />
                                      {property.bathrooms} banheiros
                                    </div>
                                  )}
                                  <div className="flex items-center text-sm">
                                    <Square className="w-4 h-4 mr-1" />
                                    {property.area} m²
                                  </div>
                                  {property.parkingSpaces && (
                                    <div className="text-sm">
                                      🚗 {property.parkingSpaces} vagas
                                    </div>
                                  )}
                                </div>
                                
                                {/* Additional Info */}
                                <div className="pt-2 space-y-1 text-sm text-muted-foreground">
                                  {property.constructionYear && (
                                    <div>📅 Ano: {property.constructionYear}</div>
                                  )}
                                  {property.floorNumber && (
                                    <div>🏢 Andar: {property.floorNumber}</div>
                                  )}
                                  {property.condominiumFee && (
                                    <div>🏘️ Condomínio: R$ {property.condominiumFee.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
                                  )}
                                  {property.iptu && (
                                    <div>📄 IPTU: R$ {property.iptu.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
                                  )}
                                </div>
                              </div>
                            </div>

                            {property.description && (
                              <p className="text-sm text-muted-foreground">{property.description}</p>
                            )}

                            {property.amenities && property.amenities.length > 0 && (
                              <div className="flex flex-wrap gap-1">
                                {property.amenities.map((amenity, i) => (
                                  <Badge key={i} variant="outline" className="text-xs">
                                    {amenity}
                                  </Badge>
                                ))}
                              </div>
                            )}

                            {property.photos.length > 0 && (
                              <div className="flex gap-2 overflow-x-auto">
                                {property.photos.slice(0, 5).map((photo, photoIndex) => (
                                  <img
                                    key={photoIndex}
                                    src={photo}
                                    alt={`Foto ${photoIndex + 1}`}
                                    className="w-24 h-24 object-cover rounded flex-shrink-0"
                                  />
                                ))}
                                {property.photos.length > 5 && (
                                  <div className="w-24 h-24 bg-muted rounded flex items-center justify-center text-sm">
                                    +{property.photos.length - 5}
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Client Info */}
              {hasRole(['admin', 'dev']) && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <User className="w-5 h-5 mr-2" />
                      Cliente
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <p className="font-medium">{projectOwner?.name || 'Nome não disponível'}</p>
                      <p className="text-sm text-muted-foreground">{projectOwner?.email || 'Email não disponível'}</p>
                      <p className="text-sm text-muted-foreground">{projectOwner?.phone || 'Telefone não informado'}</p>
                      {projectOwner?.company && (
                        <p className="text-sm text-muted-foreground">{projectOwner.company}</p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Property/Corretor Details */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Home className="w-5 h-5 mr-2" />
                    {isRealtorProject ? 'Corretor' : 'Propriedade'}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {isRealtorProject ? (
                    <div className="space-y-3">
                      <div className="flex items-center text-sm">
                        <MapPin className="w-4 h-4 mr-2 text-muted-foreground" />
                        {project.location}
                      </div>
                      {corretorData && (
                        <>
                          <div className="font-medium text-lg">{corretorData.name}</div>
                          {corretorData.creci && (
                            <div className="text-sm text-muted-foreground">CRECI: {corretorData.creci}</div>
                          )}
                          {corretorData.phone && (
                            <div className="text-sm text-muted-foreground">Telefone: {corretorData.phone}</div>
                          )}
                          {corretorData.email && (
                            <div className="text-sm text-muted-foreground">Email: {corretorData.email}</div>
                          )}
                          {corretorData.bio && (
                            <div className="text-sm text-muted-foreground mt-2 p-3 bg-muted rounded-lg">
                              {corretorData.bio}
                            </div>
                          )}
                          <div className="mt-4 p-3 bg-primary/5 rounded-lg">
                            <div className="font-medium text-primary">
                              📋 {corretorData.properties?.length || 0} Imóveis no Portfólio
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="flex items-center text-sm">
                        <MapPin className="w-4 h-4 mr-2 text-muted-foreground" />
                        {project.location}
                      </div>
                      
                      <div className="flex items-center text-sm">
                        <Home className="w-4 h-4 mr-2 text-muted-foreground" />
                        {propertyTypeLabels[project.propertyType]}
                      </div>

                      <div className="grid grid-cols-3 gap-4 mt-4">
                        {project.bedrooms && (
                          <div className="text-center">
                            <div className="flex items-center justify-center">
                              <Bed className="w-4 h-4 mr-1 text-muted-foreground" />
                              <span className="font-medium">{project.bedrooms}</span>
                            </div>
                            <p className="text-xs text-muted-foreground">Quartos</p>
                          </div>
                        )}
                        
                        {project.bathrooms && (
                          <div className="text-center">
                            <div className="flex items-center justify-center">
                              <Bath className="w-4 h-4 mr-1 text-muted-foreground" />
                              <span className="font-medium">{project.bathrooms}</span>
                            </div>
                            <p className="text-xs text-muted-foreground">Banheiros</p>
                          </div>
                        )}
                        
                        {project.area && (
                          <div className="text-center">
                            <div className="flex items-center justify-center">
                              <Square className="w-4 h-4 mr-1 text-muted-foreground" />
                              <span className="font-medium">{project.area}</span>
                            </div>
                            <p className="text-xs text-muted-foreground">m²</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Realtor Properties Section */}
              {isRealtorProject && corretorData?.properties && corretorData.properties.length > 0 && (
                <Card className="md:col-span-2">
                  <CardHeader>
                    <CardTitle>Imóveis do Portfólio</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-4">
                      {corretorData.properties.map((property: any, index: number) => (
                        <div key={index} className="border rounded-lg p-4 space-y-3">
                          <div className="flex justify-between items-start">
                            <h4 className="font-medium text-lg">{property.title || `Imóvel ${index + 1}`}</h4>
                            <Badge variant="outline">#{index + 1}</Badge>
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                              {property.location && (
                                <div className="flex items-center text-sm">
                                  <MapPin className="w-4 h-4 mr-2 text-muted-foreground" />
                                  {property.location}
                                </div>
                              )}
                              {property.price && (
                                <div className="text-sm font-medium text-green-600">
                                  {property.price}
                                </div>
                              )}
                            </div>
                            
                            <div className="flex gap-4">
                              {property.bedrooms && (
                                <div className="text-center">
                                  <div className="flex items-center justify-center">
                                    <Bed className="w-4 h-4 mr-1 text-muted-foreground" />
                                    <span className="font-medium">{property.bedrooms}</span>
                                  </div>
                                  <p className="text-xs text-muted-foreground">Quartos</p>
                                </div>
                              )}
                              
                              {property.bathrooms && (
                                <div className="text-center">
                                  <div className="flex items-center justify-center">
                                    <Bath className="w-4 h-4 mr-1 text-muted-foreground" />
                                    <span className="font-medium">{property.bathrooms}</span>
                                  </div>
                                  <p className="text-xs text-muted-foreground">Banheiros</p>
                                </div>
                              )}
                              
                              {property.area && (
                                <div className="text-center">
                                  <div className="flex items-center justify-center">
                                    <Square className="w-4 h-4 mr-1 text-muted-foreground" />
                                    <span className="font-medium">{property.area}</span>
                                  </div>
                                  <p className="text-xs text-muted-foreground">m²</p>
                                </div>
                              )}
                            </div>
                          </div>
                          
                          {property.photos && property.photos.length > 0 && (
                            <div className="flex gap-2 overflow-x-auto">
                              {property.photos.slice(0, 4).map((photo: string, photoIndex: number) => (
                                <img
                                  key={photoIndex}
                                  src={photo}
                                  alt={`Foto ${photoIndex + 1} do ${property.title || 'imóvel'}`}
                                  className="w-16 h-16 object-cover rounded flex-shrink-0"
                                />
                              ))}
                              {property.photos.length > 4 && (
                                <div className="w-16 h-16 bg-muted rounded flex items-center justify-center text-xs text-muted-foreground">
                                  +{property.photos.length - 4}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Project Info */}
              <Card className="md:col-span-2">
                <CardHeader>
                  <CardTitle>Informações do Projeto</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h4 className="font-medium mb-2">Descrição</h4>
                      <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                        {project.description || 'Sem descrição'}
                      </p>
                    </div>
                    
                    <div className="space-y-4">
                      {project.price > 0 && (
                        <div>
                          <h4 className="font-medium mb-1">Valor</h4>
                          <p className="text-lg font-bold text-green-600">
                            R$ {project.price.toLocaleString('pt-BR')}
                          </p>
                        </div>
                      )}
                      
                      <div>
                        <h4 className="font-medium mb-1">Criado em</h4>
                        <div className="flex items-center text-sm text-muted-foreground">
                          <Calendar className="w-4 h-4 mr-2" />
                          {format(new Date(project.createdAt), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                        </div>
                      </div>

                      {project.landingPageUrl && (
                        <div>
                          <h4 className="font-medium mb-1">Landing Page</h4>
                          <Button variant="outline" size="sm" asChild>
                            <a 
                              href={project.landingPageUrl} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="inline-flex items-center"
                            >
                              Ver Site
                              <ExternalLink className="w-4 h-4 ml-2" />
                            </a>
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="wizard" className="flex-1 overflow-auto space-y-4">
            {/* Wizard Data */}
            {Object.keys(wizardData).length > 0 && (
              <div className="space-y-4">
                {/* Profile Type */}
                {wizardData.profileType && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Perfil</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <Badge variant="outline" className="text-base">
                        {wizardData.profileType === 'corretor' ? 'Corretor' : 'Imobiliária'}
                      </Badge>
                    </CardContent>
                  </Card>
                )}

                {/* Company & Owner Info */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Building2 className="w-5 h-5 mr-2" />
                      Informações da Empresa
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {wizardData.profileType && (
                        <div className="md:col-span-2">
                          <h4 className="font-medium text-sm text-muted-foreground mb-1">Tipo de Perfil</h4>
                          <Badge variant="outline">
                            {wizardData.profileType === 'corretor' ? 'Corretor' : 'Imobiliária'}
                          </Badge>
                        </div>
                      )}
                      {wizardData.ownerName && (
                        <div>
                          <h4 className="font-medium text-sm text-muted-foreground mb-1">Responsável</h4>
                          <p className="font-medium">{wizardData.ownerName}</p>
                        </div>
                      )}
                      {wizardData.companyName && (
                        <div>
                          <h4 className="font-medium text-sm text-muted-foreground mb-1">Nome da Empresa</h4>
                          <p className="font-medium">{wizardData.companyName}</p>
                        </div>
                      )}
                      {wizardData.creciNumber && (
                        <div>
                          <h4 className="font-medium text-sm text-muted-foreground mb-1">CRECI</h4>
                          <p className="font-medium">
                            {wizardData.creciNumber}
                            <Badge variant="secondary" className="ml-2">
                              {wizardData.creciType === 'individual' ? 'Individual' : 'Jurídico'}
                            </Badge>
                          </p>
                        </div>
                      )}
                      {wizardData.hasLogo !== undefined && (
                        <div className="md:col-span-2">
                          <h4 className="font-medium text-sm text-muted-foreground mb-1">Logotipo</h4>
                          <Badge variant={wizardData.hasLogo ? 'default' : 'secondary'}>
                            {wizardData.hasLogo ? 'Possui logotipo próprio' : 'Logotipo será criado'}
                          </Badge>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Address */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <MapPinned className="w-5 h-5 mr-2" />
                      Endereço Comercial
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {wizardData.addressCep && (
                        <div className="flex items-start">
                          <span className="font-medium text-sm text-muted-foreground min-w-[100px]">CEP:</span>
                          <span className="font-medium">{wizardData.addressCep}</span>
                        </div>
                      )}
                      {wizardData.addressStreet && (
                        <div className="flex items-start">
                          <span className="font-medium text-sm text-muted-foreground min-w-[100px]">Logradouro:</span>
                          <span className="font-medium">
                            {wizardData.addressStreet}
                            {wizardData.addressNumber && `, ${wizardData.addressNumber}`}
                            {wizardData.addressComplement && ` - ${wizardData.addressComplement}`}
                          </span>
                        </div>
                      )}
                      {wizardData.addressNeighborhood && (
                        <div className="flex items-start">
                          <span className="font-medium text-sm text-muted-foreground min-w-[100px]">Bairro:</span>
                          <span className="font-medium">{wizardData.addressNeighborhood}</span>
                        </div>
                      )}
                      {wizardData.addressCity && wizardData.addressState && (
                        <div className="flex items-start">
                          <span className="font-medium text-sm text-muted-foreground min-w-[100px]">Cidade/UF:</span>
                          <span className="font-medium">{wizardData.addressCity} - {wizardData.addressState}</span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Contact */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Phone className="w-5 h-5 mr-2" />
                      Informações de Contato
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {wizardData.contactMobile && (
                        <div className="flex items-start">
                          <Phone className="w-4 h-4 mr-3 mt-0.5 text-muted-foreground flex-shrink-0" />
                          <div>
                            <p className="text-sm text-muted-foreground">Celular</p>
                            <p className="font-medium">{wizardData.contactMobile}</p>
                          </div>
                        </div>
                      )}
                      {wizardData.contactPhone && (
                        <div className="flex items-start">
                          <Phone className="w-4 h-4 mr-3 mt-0.5 text-muted-foreground flex-shrink-0" />
                          <div>
                            <p className="text-sm text-muted-foreground">Telefone Fixo</p>
                            <p className="font-medium">{wizardData.contactPhone}</p>
                          </div>
                        </div>
                      )}
                      {wizardData.contactEmail && (
                        <div className="flex items-start">
                          <Mail className="w-4 h-4 mr-3 mt-0.5 text-muted-foreground flex-shrink-0" />
                          <div>
                            <p className="text-sm text-muted-foreground">E-mail</p>
                            <p className="font-medium break-all">{wizardData.contactEmail}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {Object.keys(wizardData).length === 0 && (
              <Card>
                <CardContent className="text-center py-8">
                  <p className="text-muted-foreground">Nenhum dado do wizard disponível</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="photos" className="flex-1 overflow-auto">
            <Card>
              <CardHeader>
                <CardTitle>
                  Fotos do Projeto
                </CardTitle>
              </CardHeader>
              <CardContent>
                {(() => {
                  // Collect all photos from project and portfolio properties
                  const projectPhotos = Array.isArray(project.photos) 
                    ? project.photos.filter(photo => photo && typeof photo === 'string' && photo.trim() !== '')
                    : [];
                  
                  const portfolioPhotos: Array<{ photo: string; propertyTitle: string; propertyIndex: number }> = [];
                  portfolioProperties.forEach((property, index) => {
                    if (property.photos && Array.isArray(property.photos)) {
                      property.photos.forEach(photo => {
                        if (photo && typeof photo === 'string' && photo.trim() !== '') {
                          portfolioPhotos.push({
                            photo,
                            propertyTitle: property.title,
                            propertyIndex: index + 1
                          });
                        }
                      });
                    }
                  });

                  const totalPhotos = projectPhotos.length + portfolioPhotos.length;

                  console.log('Photos collected:', { 
                    projectPhotos: projectPhotos.length, 
                    portfolioPhotos: portfolioPhotos.length,
                    total: totalPhotos 
                  });
                  
                  if (totalPhotos === 0) {
                    return (
                      <div className="text-center py-8 text-muted-foreground space-y-2">
                        <p>Nenhuma foto enviada ainda</p>
                        <p className="text-xs">As fotos serão exibidas aqui após o upload</p>
                      </div>
                    );
                  }

                  return (
                    <div className="space-y-6">
                      {/* Project Photos */}
                      {projectPhotos.length > 0 && (
                        <div>
                          <h3 className="text-lg font-semibold mb-4">Fotos do Imóvel Principal ({projectPhotos.length})</h3>
                          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                            {projectPhotos.map((photo, index) => (
                              <div key={`project-${photo}-${index}`} className="aspect-square overflow-hidden rounded-lg border bg-muted hover:shadow-lg transition-shadow">
                                <img
                                  src={photo}
                                  alt={`Foto ${index + 1} do projeto ${project.title}`}
                                  className="w-full h-full object-cover hover:scale-105 transition-transform cursor-pointer"
                                  onClick={() => window.open(photo, '_blank')}
                                  onError={(e) => {
                                    console.error('Error loading photo:', photo);
                                    const target = e.target as HTMLImageElement;
                                    target.onerror = null;
                                    target.src = '/placeholder.svg';
                                  }}
                                />
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Portfolio Properties Photos */}
                      {portfolioPhotos.length > 0 && (
                        <div>
                          <h3 className="text-lg font-semibold mb-4">Fotos dos Imóveis do Portfólio ({portfolioPhotos.length})</h3>
                          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                            {portfolioPhotos.map((item, index) => (
                              <div key={`portfolio-${item.photo}-${index}`} className="relative aspect-square overflow-hidden rounded-lg border bg-muted hover:shadow-lg transition-shadow group">
                                <img
                                  src={item.photo}
                                  alt={`Foto do imóvel ${item.propertyTitle}`}
                                  className="w-full h-full object-cover hover:scale-105 transition-transform cursor-pointer"
                                  onClick={() => window.open(item.photo, '_blank')}
                                  onError={(e) => {
                                    console.error('Error loading photo:', item.photo);
                                    const target = e.target as HTMLImageElement;
                                    target.onerror = null;
                                    target.src = '/placeholder.svg';
                                  }}
                                />
                                <div className="absolute bottom-0 left-0 right-0 bg-black/70 text-white text-xs p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                  <p className="truncate">{item.propertyTitle}</p>
                                  <p className="text-muted">Imóvel #{item.propertyIndex}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })()}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="chat" className="flex-1 overflow-hidden">
            <div className="h-full">
              <ProjectChat projectId={project.id} projectTitle={project.title} />
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};