import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  ArrowLeft, 
  Edit, 
  ExternalLink, 
  MapPin, 
  Home, 
  Bed, 
  Bath, 
  Ruler,
  DollarSign,
  Calendar,
  User,
  MessageSquare,
  Building,
  Palette,
  Layout,
  Image,
  Mail,
  Phone,
  Globe,
} from 'lucide-react';
import { useProjects } from '@/hooks/useProjects';
import { useUsers } from '@/hooks/useUsers';
import { useAuth } from '@/contexts/AuthContext';
import { usePortfolioProperties } from '@/hooks/usePortfolioProperties';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ProjectChat } from '@/components/ProjectChat';
import { ProjectPlanInfo } from '@/components/ProjectPlanInfo';
import { AIGenerationStatus } from '@/components/admin/AIGenerationStatus';
import { DomainConnect } from '@/components/admin/DomainConnect';
import { toast } from 'sonner';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';

const statusColors = {
  pending: 'secondary',
  in_progress: 'default',
  in_review: 'outline',
  completed: 'default',
  approved: 'default',
  rejected: 'destructive',
} as const;

const statusLabels = {
  pending: 'Pendente',
  in_progress: 'Em Andamento',
  in_review: 'Em Revisão',
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

const projectTypeLabels = {
  single_property: 'Propriedade Única',
  realtor_multiple: 'Portfólio de Imóveis',
};

export const ProjectDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { projects, loading, updateProject } = useProjects();
  const { users } = useUsers();
  const { hasRole } = useAuth();
  const { properties: portfolioProperties, loading: loadingProperties } = usePortfolioProperties(id);
  const [activeTab, setActiveTab] = useState('details');
  const isAdmin = hasRole(['admin', 'dev']);

  const project = projects.find(p => p.id === id);
  const [showRawJson, setShowRawJson] = useState(false);
  // normalize wizard address keys (support both variants: addressStreet / addressStreet and short keys like street/cep)
  const wizard = project?.wizardData || {};
  const address = {
    cep: wizard.addressCep || wizard.cep || wizard.address_cep || '',
    street: wizard.addressStreet || wizard.street || wizard.address_street || '',
    number: wizard.addressNumber || wizard.number || wizard.address_number || '',
    complement: wizard.addressComplement || wizard.complement || wizard.address_complement || '',
    neighborhood: wizard.addressNeighborhood || wizard.neighborhood || wizard.address_neighborhood || '',
    city: wizard.addressCity || wizard.city || wizard.address_city || '',
    state: wizard.addressState || wizard.state || wizard.address_state || '',
  };
  // Prefer project.photos but fallback to portfolio properties photos when project has none
  const visiblePhotos = (project?.photos && project.photos.length > 0)
    ? project.photos
    : (portfolioProperties ? portfolioProperties.flatMap(p => p.photos || []) : []);

  const getUserName = (userId: string) => {
    const user = users.find(u => u.userId === userId);
    return user?.name || 'Cliente não encontrado';
  };

  if (loading) {
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(-1)}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{project.title}</h1>
            <p className="text-muted-foreground">{project.location}</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Badge variant={statusColors[project.status]}>
            {statusLabels[project.status]}
          </Badge>
          {hasRole(['admin', 'dev']) && (
            <Button onClick={() => navigate(`/admin/projects/${id}/edit`)}>
              <Edit className="mr-2 h-4 w-4" />
              Editar
            </Button>
          )}
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="details">Detalhes</TabsTrigger>
          <TabsTrigger value="chat">
            <MessageSquare className="mr-2 h-4 w-4" />
            Chat
          </TabsTrigger>
        </TabsList>

        <TabsContent value="details" className="flex flex-col gap-6">
            {/* Debug: mostrar JSON bruto para admins/devs */}
            {hasRole(['admin', 'dev']) && (
              <Card>
                <CardContent className="flex items-center justify-between">
                  <div className="text-sm text-muted-foreground mt-6">Ferramenta de debug</div>
                  <div>
                    <Button variant="outline" size="sm" onClick={() => setShowRawJson(!showRawJson)} className='mt-6'>
                      {showRawJson ? 'Ocultar JSON' : 'Mostrar JSON'}
                    </Button>
                  </div>
                </CardContent>
                {showRawJson && (
                  <CardContent>
                    <div className="grid grid-cols-1 gap-4">
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Project object</p>
                        <pre className="text-xs bg-muted p-3 rounded overflow-auto max-h-64">{JSON.stringify(project, null, 2)}</pre>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Portfolio properties</p>
                        <pre className="text-xs bg-muted p-3 rounded overflow-auto max-h-64">{JSON.stringify(portfolioProperties, null, 2)}</pre>
                      </div>
                    </div>
                  </CardContent>
                )}
              </Card>
            )}
          {/* Project Type Badge */}
          {project.projectType && (
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Building className="h-5 w-5 text-primary" />
                    <div>
                      <p className="text-sm text-muted-foreground">Tipo de Projeto</p>
                      <p className="text-lg font-semibold">{projectTypeLabels[project.projectType]}</p>
                    </div>
                  </div>
                  {project.projectType === 'realtor_multiple' && (
                    <Badge variant="secondary">
                      {portfolioProperties.length} {portfolioProperties.length === 1 ? 'imóvel' : 'imóveis'}
                    </Badge>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Photos - Main Project Photos */}
          {visiblePhotos && visiblePhotos.length > 0 && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Image className="h-5 w-5" />
                    Fotos
                  </CardTitle>
                  <Badge variant="outline">{visiblePhotos.length} fotos</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
                  {visiblePhotos.map((photo, index) => (
                    <div 
                      key={index} 
                      className="relative aspect-square rounded-lg overflow-hidden bg-muted border border-border hover:border-primary transition-colors group"
                    >
                      <img 
                        src={photo} 
                        alt={`Foto ${index + 1} - ${project.title}`}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        onError={(e) => {
                          console.error('Error loading image:', photo);
                          e.currentTarget.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="200" height="200"%3E%3Crect fill="%23ddd" width="200" height="200"/%3E%3Ctext fill="%23999" x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle"%3EImagem não disponível%3C/text%3E%3C/svg%3E';
                        }}
                      />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-end p-2">
                        <span className="text-white text-xs font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                          Foto {index + 1}
                        </span>
                      </div>
                      {/* Dev Mode: Show full URL */}
                      {hasRole(['dev']) && (
                        <div className="absolute top-0 right-0 p-1">
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(photo);
                              toast.success('URL copiada!');
                            }}
                            className="bg-black/50 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            Copiar URL
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                
                {/* Dev Mode: Show all photo URLs */}
                {hasRole(['dev']) && (
                  <div className="mt-4 pt-4 border-t">
                    <p className="text-xs font-medium text-muted-foreground mb-2">Dev Info: URLs das Fotos</p>
                    <div className="space-y-1">
                      {visiblePhotos.map((photo, index) => (
                          <div key={index} className="text-xs bg-muted p-2 rounded font-mono break-all">
                            <span className="text-muted-foreground">{index + 1}:</span> {photo}
                          </div>
                        ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Portfolio Properties */}
          {project.projectType === 'realtor_multiple' && portfolioProperties.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building className="h-5 w-5" />
                  Imóveis do Portfólio
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {portfolioProperties.map((property, index) => (
                    <div key={property.id} className="border rounded-lg p-4 space-y-4">
                      <div className="flex items-start justify-between">
                        <div>
                          <h4 className="font-semibold text-lg">{property.title}</h4>
                          <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                            <MapPin className="h-3 w-3" />
                            {property.location}
                          </p>
                        </div>
                        <Badge variant="outline">Imóvel {index + 1}</Badge>
                      </div>
                      
                      {/* Property Photos */}
                      {property.photos && property.photos.length > 0 && (
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
                          {property.photos.slice(0, 4).map((photo, photoIndex) => (
                            <div key={photoIndex} className="aspect-square rounded overflow-hidden bg-muted border">
                              <img 
                                src={photo} 
                                alt={`${property.title} - Foto ${photoIndex + 1}`}
                                className="w-full h-full object-cover"
                              />
                            </div>
                          ))}
                          {property.photos.length > 4 && (
                            <div className="aspect-square rounded overflow-hidden bg-muted border flex items-center justify-center">
                              <span className="text-sm text-muted-foreground">
                                +{property.photos.length - 4} fotos
                              </span>
                            </div>
                          )}
                        </div>
                      )}
                      
                      {/* Property Details */}
                      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 pt-2">
                        <div>
                          <p className="text-xs text-muted-foreground">Tipo</p>
                          <p className="font-medium capitalize">{property.propertyType}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Finalidade</p>
                          <p className="font-medium capitalize">{property.purpose === 'sale' ? 'Venda' : 'Aluguel'}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Área</p>
                          <p className="font-medium">{property.area}m²</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Valor</p>
                          <p className="font-medium">
                            R$ {property.price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </p>
                        </div>
                        
                        {property.bedrooms && (
                          <div>
                            <p className="text-xs text-muted-foreground">Quartos</p>
                            <p className="font-medium">{property.bedrooms}</p>
                          </div>
                        )}
                        {property.bathrooms && (
                          <div>
                            <p className="text-xs text-muted-foreground">Banheiros</p>
                            <p className="font-medium">{property.bathrooms}</p>
                          </div>
                        )}
                        {property.parkingSpaces && (
                          <div>
                            <p className="text-xs text-muted-foreground">Vagas</p>
                            <p className="font-medium">{property.parkingSpaces}</p>
                          </div>
                        )}
                        {property.constructionYear && (
                          <div>
                            <p className="text-xs text-muted-foreground">Ano de Construção</p>
                            <p className="font-medium">{property.constructionYear}</p>
                          </div>
                        )}
                        {property.floorNumber && (
                          <div>
                            <p className="text-xs text-muted-foreground">Andar</p>
                            <p className="font-medium">{property.floorNumber}º</p>
                          </div>
                        )}
                        {property.condominiumFee && (
                          <div>
                            <p className="text-xs text-muted-foreground">Condomínio</p>
                            <p className="font-medium">
                              R$ {property.condominiumFee.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </p>
                          </div>
                        )}
                        {property.iptu && (
                          <div>
                            <p className="text-xs text-muted-foreground">IPTU</p>
                            <p className="font-medium">
                              R$ {property.iptu.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </p>
                          </div>
                        )}
                      </div>
                      
                      {property.description && (
                        <div className="pt-2 border-t">
                          <p className="text-sm text-muted-foreground">{property.description}</p>
                        </div>
                      )}
                      
                      {property.amenities && property.amenities.length > 0 && (
                        <div className="pt-2">
                          <p className="text-xs text-muted-foreground mb-2">Comodidades</p>
                          <div className="flex flex-wrap gap-1">
                            {property.amenities.map((amenity, i) => (
                              <Badge key={i} variant="secondary" className="text-xs">
                                {amenity}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Wizard Data - Complete Information */}
          {project.wizardData && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Dados Completos do Projeto
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Profile Info */}
                {project.wizardData.profileType && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Tipo de Perfil</p>
                      <Badge variant="outline">
                        {project.wizardData.profileType === 'corretor' ? 'Corretor' : 'Imobiliária'}
                      </Badge>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Responsável</p>
                      <p className="font-medium">{project.wizardData.ownerName}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Nome da Empresa</p>
                      <p className="font-medium">{project.wizardData.companyName}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">CRECI</p>
                      <p className="font-medium">
                        {project.wizardData.creciNumber} ({project.wizardData.creciType})
                      </p>
                    </div>
                  </div>
                )}

                <Separator />

                {/* Address */}
                {project.wizardData.addressStreet && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-2">Endereço Completo</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                      <div>
                        <span className="text-muted-foreground">Rua: </span>
                        <span className="font-medium">{project.wizardData.addressStreet}, {project.wizardData.addressNumber}</span>
                      </div>
                      {project.wizardData.addressComplement && (
                        <div>
                          <span className="text-muted-foreground">Complemento: </span>
                          <span className="font-medium">{project.wizardData.addressComplement}</span>
                        </div>
                      )}
                      <div>
                        <span className="text-muted-foreground">Bairro: </span>
                        <span className="font-medium">{project.wizardData.addressNeighborhood}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Cidade/UF: </span>
                        <span className="font-medium">{project.wizardData.addressCity}/{project.wizardData.addressState}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">CEP: </span>
                        <span className="font-medium">{project.wizardData.addressCep}</span>
                      </div>
                    </div>
                  </div>
                )}

                <Separator />

                {/* Contact Info */}
                {project.wizardData.contactEmail && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-2">Informações de Contato</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="text-xs text-muted-foreground">Email</p>
                          <p className="text-sm font-medium">{project.wizardData.contactEmail}</p>
                        </div>
                      </div>
                      {project.wizardData.contactMobile && (
                        <div className="flex items-center gap-2">
                          <Phone className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <p className="text-xs text-muted-foreground">Celular</p>
                            <p className="text-sm font-medium">{project.wizardData.contactMobile}</p>
                          </div>
                        </div>
                      )}
                      {project.wizardData.contactPhone && (
                        <div className="flex items-center gap-2">
                          <Phone className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <p className="text-xs text-muted-foreground">Telefone</p>
                            <p className="text-sm font-medium">{project.wizardData.contactPhone}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Project Info */}
          <div className="grid gap-4 sm:gap-6 md:grid-cols-2">
            {/* Basic Information */}
            <Card>
              <CardHeader>
                <CardTitle>Informações Básicas</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {hasRole(['admin', 'dev']) && (
                  <div className="flex items-center space-x-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Cliente</p>
                      <p className="font-medium">{getUserName(project.userId)}</p>
                    </div>
                  </div>
                )}
                
                <Separator />
                
                <div className="flex items-center space-x-2">
                  <Home className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Tipo</p>
                    <p className="font-medium">{propertyTypeLabels[project.propertyType]}</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Localização</p>
                    <p className="font-medium">{project.location}</p>
                  </div>
                </div>
                
                <Separator />
                
                <div className="grid grid-cols-3 gap-4">
                  <div className="flex items-center space-x-2">
                    <Bed className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">Quartos</p>
                      <p className="font-medium">{project.bedrooms}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Bath className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">Banheiros</p>
                      <p className="font-medium">{project.bathrooms}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Ruler className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">Área</p>
                      <p className="font-medium">{project.area}m²</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Financial & Timeline */}
            <Card>
              <CardHeader>
                <CardTitle>Financeiro e Cronograma</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-2">
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Valor</p>
                    <p className="text-2xl font-bold">
                      R$ {project.price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                </div>
                
                <Separator />
                
                <div className="flex items-center space-x-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Criado em</p>
                    <p className="font-medium">
                      {format(new Date(project.createdAt), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                    </p>
                  </div>
                </div>
                
                {project.completedAt && (
                  <div className="flex items-center space-x-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Concluído em</p>
                      <p className="font-medium">
                        {format(new Date(project.completedAt), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Status da geração automática do site (self-hide se o projeto nunca passou pelo pipeline) */}
          {id && <AIGenerationStatus projectId={id} canRegenerate />}

          {/* Conectar domínio próprio (aparece só depois do site publicado) */}
          {id && <DomainConnect projectId={id} />}

          {/* Plan Information */}
          {id && <ProjectPlanInfo projectId={id} />}

          {/* Domain Section */}
          {(project.wizardData?.desiredDomain || project.desired_domain) && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="h-5 w-5" />
                  Domínio
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Domínio escolhido</p>
                    <p className="text-lg font-semibold">
                      {(project.desired_domain || project.wizardData?.desiredDomain)}.com.br
                    </p>
                  </div>
                  <Badge variant={
                    project.domain_status === 'active' ? 'default' :
                    project.domain_status === 'registered' ? 'default' :
                    project.domain_status === 'paid' ? 'secondary' :
                    'outline'
                  }>
                    {project.domain_status === 'active' ? '✅ Ativo' :
                     project.domain_status === 'registered' ? '📋 Registrado' :
                     project.domain_status === 'paid' ? '💰 Pago' :
                     '⏳ Pendente pagamento'}
                  </Badge>
                </div>

                {/* Admin domain status control */}
                {isAdmin && (
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Atualizar status do domínio</Label>
                    <Select
                      value={project.domain_status || 'pending'}
                      onValueChange={async (value) => {
                        try {
                          await updateProject(project.id, { domain_status: value as any });
                          toast.success(`Status do domínio atualizado para "${value}"`);
                        } catch {
                          toast.error('Erro ao atualizar status do domínio');
                        }
                      }}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">⏳ Pendente pagamento</SelectItem>
                        <SelectItem value="paid">💰 Pago</SelectItem>
                        <SelectItem value="registered">📋 Registrado</SelectItem>
                        <SelectItem value="active">✅ Ativo</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {(!project.domain_status || project.domain_status === 'pending') && !isAdmin && (
                  <div className="p-4 rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800">
                    <p className="text-sm text-amber-800 dark:text-amber-200 mb-3">
                      O registro do domínio custa <strong>R$ 40,00</strong>. Após o pagamento, nossa equipe fará o registro para você.
                    </p>
                    <Button
                      onClick={() => navigate(`/checkout?type=domain&projectId=${project.id}&domain=${project.desired_domain || project.wizardData?.desiredDomain}`)}
                      size="sm"
                    >
                      <DollarSign className="h-4 w-4 mr-1" />
                      Pagar Domínio - R$ 40,00
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Wizard & Customization Data */}
          <div className="grid gap-4 sm:gap-6 md:grid-cols-2">
            {/* Customization */}
            {(project.layoutChoice || project.colorPalette || project.logoUrl) && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Palette className="h-5 w-5" />
                    Personalização Visual
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {project.layoutChoice && (
                    <div className="flex items-start gap-3">
                      <Layout className="h-5 w-5 text-muted-foreground mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Layout Escolhido</p>
                        <p className="font-semibold capitalize">{project.layoutChoice}</p>
                      </div>
                    </div>
                  )}
                  
                  {project.colorPalette && (
                    <>
                      <Separator />
                      <div className="flex items-start gap-3">
                        <Palette className="h-5 w-5 text-muted-foreground mt-0.5" />
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Paleta de Cores</p>
                          <p className="font-semibold capitalize">{project.colorPalette}</p>
                        </div>
                      </div>
                    </>
                  )}
                  
                  {project.logoUrl && (
                    <>
                      <Separator />
                      <div>
                        <p className="text-sm font-medium text-muted-foreground mb-2">Logo do Projeto</p>
                        <div className="border rounded-lg p-4 bg-muted/30 flex items-center justify-center">
                          <img 
                            src={project.logoUrl} 
                            alt="Logo" 
                            className="max-h-24 object-contain"
                          />
                        </div>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Wizard Data - Complete Address Information */}
              {project.wizardData && (Object.keys(project.wizardData).length > 0 || address.street || address.cep) && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="h-5 w-5" />
                    Endereço Completo
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-3 md:grid-cols-2">
                      {address.cep && (
                        <div className="p-3 rounded-lg bg-muted/50 border">
                          <p className="text-xs font-medium text-muted-foreground mb-1">CEP</p>
                          <p className="text-sm font-medium">{address.cep}</p>
                        </div>
                      )}
                      {address.street && (
                        <div className="p-3 rounded-lg bg-muted/50 border">
                          <p className="text-xs font-medium text-muted-foreground mb-1">Endereço</p>
                          <p className="text-sm font-medium">{address.street}</p>
                        </div>
                      )}
                      {address.number && (
                        <div className="p-3 rounded-lg bg-muted/50 border">
                          <p className="text-xs font-medium text-muted-foreground mb-1">Número</p>
                          <p className="text-sm font-medium">{address.number}</p>
                        </div>
                      )}
                      {address.complement && (
                        <div className="p-3 rounded-lg bg-muted/50 border">
                          <p className="text-xs font-medium text-muted-foreground mb-1">Complemento</p>
                          <p className="text-sm font-medium">{address.complement}</p>
                        </div>
                      )}
                      {address.neighborhood && (
                        <div className="p-3 rounded-lg bg-muted/50 border">
                          <p className="text-xs font-medium text-muted-foreground mb-1">Bairro</p>
                          <p className="text-sm font-medium">{address.neighborhood}</p>
                        </div>
                      )}
                      {address.city && (
                        <div className="p-3 rounded-lg bg-muted/50 border">
                          <p className="text-xs font-medium text-muted-foreground mb-1">Cidade</p>
                          <p className="text-sm font-medium">{address.city}</p>
                        </div>
                      )}
                      {address.state && (
                        <div className="p-3 rounded-lg bg-muted/50 border">
                          <p className="text-xs font-medium text-muted-foreground mb-1">Estado</p>
                          <p className="text-sm font-medium">{address.state}</p>
                        </div>
                      )}
                  </div>
                  
                  {/* Dev Mode: Show all wizard data */}
                  {hasRole(['dev']) && (
                    <div className="mt-4 pt-4 border-t">
                      <p className="text-xs font-medium text-muted-foreground mb-2">Dev Info: Dados Completos do Wizard</p>
                      <pre className="text-xs bg-muted p-3 rounded overflow-auto max-h-64">
                        {JSON.stringify(project.wizardData, null, 2)}
                      </pre>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>

          {/* Features */}
          {project.features && Object.keys(project.features).length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Recursos e Características</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                  {Object.entries(project.features).map(([key, value]) => {
                    const label = key
                      .replace(/([A-Z])/g, ' $1')
                      .replace(/^./, str => str.toUpperCase())
                      .trim();
                    
                    let displayValue: string;
                    let isActive = false;
                    
                    if (typeof value === 'boolean') {
                      displayValue = value ? 'Ativado' : 'Desativado';
                      isActive = value;
                    } else if (typeof value === 'object' && value !== null) {
                      displayValue = JSON.stringify(value, null, 2);
                    } else {
                      displayValue = String(value);
                    }
                    
                    return (
                      <div 
                        key={key} 
                        className={`p-4 rounded-lg border ${isActive ? 'bg-primary/5 border-primary/20' : 'bg-muted/50'}`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <p className="text-sm font-semibold">
                            {label}
                          </p>
                          {typeof value === 'boolean' && (
                            <div className={`h-2 w-2 rounded-full ${isActive ? 'bg-primary' : 'bg-muted-foreground'}`} />
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                          {displayValue}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Description */}
          <Card>
            <CardHeader>
              <CardTitle>Descrição</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground whitespace-pre-wrap">
                {project.description || 'Sem descrição'}
              </p>
            </CardContent>
          </Card>

          {/* Landing Page */}
          {project.landingPageUrl && (
            <Card>
              <CardHeader>
                <CardTitle>Landing Page</CardTitle>
              </CardHeader>
              <CardContent>
                <Button asChild>
                  <a 
                    href={project.landingPageUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                  >
                    <ExternalLink className="mr-2 h-4 w-4" />
                    Visualizar Site
                  </a>
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="chat">
          <ProjectChat projectId={project.id} projectTitle={project.title} />
        </TabsContent>
      </Tabs>
    </div>
  );
};
