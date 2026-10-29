import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { Project } from '@/types/admin';
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
import { GrantMaintenanceCard } from '@/components/admin/GrantMaintenanceCard';
import { toast } from 'sonner';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import {
  PageHeader,
  LoadingState,
  SectionHeader,
  StatusPill,
  DetailField,
  DetailGrid,
  type StatusTone,
} from '@/components/admin/ui';

// O Badge do shadcn só tem 4 variantes, então "Pendente", "Em revisão" e
// "Concluído" saíam com a mesma aparência. StatusPill separa por cor
// semântica, igual ao resto do painel.
const statusTones: Record<string, StatusTone> = {
  pending: 'warning',
  in_progress: 'info',
  in_review: 'primary',
  completed: 'success',
  approved: 'success',
  rejected: 'destructive',
};

const statusLabels: Record<string, string> = {
  pending: 'Pendente',
  in_progress: 'Em andamento',
  in_review: 'Em revisão',
  completed: 'Concluído',
  approved: 'Aprovado',
  rejected: 'Rejeitado',
};

// Cobre os seis tipos que o wizard oferece. Faltavam warehouse e
// penthouse, então "Galpão Industrial" e "Cobertura" cairiam no valor cru.
const propertyTypeLabels: Record<string, string> = {
  house: 'Casa',
  apartment: 'Apartamento',
  land: 'Terreno',
  commercial: 'Sala comercial',
  warehouse: 'Galpão industrial',
  penthouse: 'Cobertura',
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
    return <LoadingState label="Carregando projeto..." size="lg" fullScreen />;
  }

  if (!project) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="admin-card-elevated p-6 text-center">
          <p className="text-muted-foreground">Projeto não encontrado</p>
          <Button onClick={() => navigate(-1)} className="mt-4">
            Voltar
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start gap-2">
        <Button variant="ghost" size="icon" className="mt-0.5 shrink-0" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <PageHeader
          icon={Building}
          /* O tipo ocupava um card inteiro só pra mostrar um valor; como
             ele identifica a seção, cabe no eyebrow. */
          eyebrow={project.projectType ? projectTypeLabels[project.projectType] : 'Projeto'}
          title={project.title}
          description={project.location}
          className="flex-1"
          actions={
            <>
              <StatusPill
                label={statusLabels[project.status] ?? project.status}
                tone={statusTones[project.status] ?? 'neutral'}
              />
              {hasRole(['admin', 'dev']) && (
                <Button onClick={() => navigate(`/admin/projects/${id}/edit`)}>
                  <Edit className="mr-2 h-4 w-4" />
                  Editar
                </Button>
              )}
            </>
          }
        />
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
          {/* Photos - Main Project Photos */}
          {visiblePhotos && visiblePhotos.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <SectionHeader icon={Image} title="Fotos" count={visiblePhotos.length} />
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
              <CardHeader className="pb-3">
                <SectionHeader icon={Building} title="Imóveis do site" />
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
                      <div className="grid grid-cols-2 gap-3 pt-2 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4">
                        {/* Antes era `{property.propertyType}` com `capitalize`,
                          *  o que mostrava "Apartment" pro cliente — o valor
                          *  cru do banco, em inglês. */}
                        <DetailField
                          label="Tipo"
                          value={propertyTypeLabels[property.propertyType] ?? property.propertyType}
                        />
                        <DetailField
                          label="Finalidade"
                          value={property.purpose === 'sale' ? 'Venda' : 'Aluguel'}
                        />
                        <DetailField label="Área" value={`${property.area}m²`} />
                        <DetailField
                          label="Valor"
                          value={`R$ ${property.price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
                        />
                        
                        {property.bedrooms && (
                          <DetailField label="Quartos" value={property.bedrooms} />
                        )}
                        {property.bathrooms && (
                          <DetailField label="Banheiros" value={property.bathrooms} />
                        )}
                        {property.parkingSpaces && (
                          <DetailField label="Vagas" value={property.parkingSpaces} />
                        )}
                        {property.constructionYear && (
                          <DetailField label="Ano de Construção" value={property.constructionYear} />
                        )}
                        {property.floorNumber && (
                          <DetailField label="Andar" value={`${property.floorNumber}º`} />
                        )}
                        {property.condominiumFee && (
                          <DetailField
                            label="Condomínio"
                            value={`R$ ${property.condominiumFee.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
                          />
                        )}
                        {property.iptu && (
                            <DetailField
                              label="IPTU"
                              value={`R$ ${property.iptu.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
                            />
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
              <CardHeader className="pb-3">
                <SectionHeader icon={User} title="Dados do responsável" />
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Profile Info */}
                {project.wizardData.profileType && (
                  <DetailGrid>
                    <DetailField
                      label="Tipo de perfil"
                      value={project.wizardData.profileType === 'corretor' ? 'Corretor' : 'Imobiliária'}
                    />
                    <DetailField label="Responsável" value={project.wizardData.ownerName} />
                    <DetailField label="Empresa" value={project.wizardData.companyName} />
                    <DetailField
                      label="CRECI"
                      value={`${project.wizardData.creciNumber} (${project.wizardData.creciType})`}
                    />
                  </DetailGrid>
                )}

                <Separator />

                {/* O endereço vive no card "Endereço completo" mais abaixo,
                  *  que lê do mesmo wizardData — este bloco repetia os mesmos
                  *  cinco valores na mesma página. */}

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
            <section className="admin-card-elevated p-4 sm:p-5">
              <SectionHeader title="Informações básicas" />

              <DetailGrid className="mt-4">
                {hasRole(['admin', 'dev']) && (
                  <DetailField icon={User} label="Cliente" value={getUserName(project.userId)} />
                )}
                <DetailField
                  icon={Home}
                  label="Tipo"
                  value={propertyTypeLabels[project.propertyType]}
                />
                <DetailField icon={MapPin} label="Localização" value={project.location} wide />
              </DetailGrid>

              <DetailGrid columns={3} className="mt-4 border-t border-border pt-4">
                <DetailField icon={Bed} label="Quartos" value={project.bedrooms} />
                <DetailField icon={Bath} label="Banheiros" value={project.bathrooms} />
                <DetailField icon={Ruler} label="Área" value={`${project.area}m²`} />
              </DetailGrid>
            </section>

            {/* Financial & Timeline */}
            <section className="admin-card-elevated p-4 sm:p-5">
              <SectionHeader title="Valor e datas" />

              <p className="mt-4 font-display text-[26px] font-bold leading-none tracking-[-0.03em] tabular-nums">
                R$ {project.price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>

              <DetailGrid className="mt-4 border-t border-border pt-4">
                <DetailField
                  icon={Calendar}
                  label="Criado em"
                  value={format(new Date(project.createdAt), "dd 'de' MMMM 'de' yyyy", {
                    locale: ptBR,
                  })}
                />
                {project.completedAt && (
                  <DetailField
                    icon={Calendar}
                    label="Concluído em"
                    value={format(new Date(project.completedAt), "dd 'de' MMMM 'de' yyyy", {
                      locale: ptBR,
                    })}
                  />
                )}
              </DetailGrid>
            </section>
          </div>

          {/* Status da geração automática do site (self-hide se o projeto nunca passou pelo pipeline) */}
          {id && <AIGenerationStatus projectId={id} canRegenerate />}

          {/* Conectar domínio próprio (aparece só depois do site publicado) */}
          {id && <DomainConnect projectId={id} />}

          {/* Plan Information */}
          {id && <ProjectPlanInfo projectId={id} />}

          {/* Conceder manutenção sem cobrança (só dev/admin) */}
          {id && isAdmin && <GrantMaintenanceCard projectId={id} />}

          {/* Domain Section */}
          {(project.wizardData?.desiredDomain || project.desired_domain) && (
            <Card>
              <CardHeader className="pb-3">
                <SectionHeader icon={Globe} title="Domínio" />
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
                          await updateProject(project.id, {
                            domain_status: value as Project['domain_status'],
                          });
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

          {/* items-start: sem isso o card do logo, que é baixo, estica até a
            *  altura do card de endereço ao lado e sobra um vazio enorme. */}
          <div className="grid items-start gap-4 sm:gap-6 md:grid-cols-2">
            {/* Logo. Antes este card era "Personalização Visual" e mostrava
              *  também layoutChoice e colorPalette — campos que a etapa
              *  "Layout e Cores" gravava e que o template do site não lê mais.
              *  Projetos antigos ainda têm o valor salvo, então o cliente lia
              *  "Paleta de Cores: blue" descrevendo algo sem efeito no site
              *  dele. O logo é real e continua. */}
            {project.logoUrl && (
              <section className="admin-card-elevated p-4 sm:p-5">
                <SectionHeader icon={Image} title="Logo do projeto" />
                <div className="mt-4 flex items-center justify-center rounded-lg border border-border bg-muted/40 p-5">
                  <img
                    src={project.logoUrl}
                    alt={`Logo de ${project.title}`}
                    loading="lazy"
                    className="max-h-24 object-contain"
                  />
                </div>
              </section>
            )}

            {/* Wizard Data - Complete Address Information */}
              {project.wizardData && (Object.keys(project.wizardData).length > 0 || address.street || address.cep) && (
              <Card>
                <CardHeader className="pb-3">
                <SectionHeader icon={MapPin} title="Endereço completo" />
              </CardHeader>
                <CardContent>
                  {/* Mesmos DetailField do resto da tela. Antes cada campo
                    *  era uma caixinha com borda e fundo próprios, o que dava
                    *  a sete valores de leitura o peso visual de sete cards. */}
                  <DetailGrid>
                    <DetailField label="CEP" value={address.cep} />
                    <DetailField label="Endereço" value={address.street} />
                    <DetailField label="Número" value={address.number} />
                    {address.complement && (
                      <DetailField label="Complemento" value={address.complement} />
                    )}
                    <DetailField label="Bairro" value={address.neighborhood} />
                    <DetailField label="Cidade" value={address.city} />
                    <DetailField label="Estado" value={address.state} />
                  </DetailGrid>

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
                <SectionHeader title="Recursos e características" />
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
              <SectionHeader title="Descrição" />
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
                <SectionHeader title="Site publicado" />
              </CardHeader>
              <CardContent>
                <Button asChild>
                  <a 
                    href={project.landingPageUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                  >
                    <ExternalLink className="mr-2 h-4 w-4" aria-hidden="true" />
                    Ver site
                  </a>
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Ferramenta de debug — por último de propósito: antes era a
            *  primeira coisa que um admin via ao abrir o projeto. */}
          {hasRole(['admin', 'dev']) && (
            <section className="admin-card-elevated p-4 sm:p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="font-mono text-[10px] uppercase tracking-[0.09em] text-muted-foreground">
                  Ferramenta de debug
                </p>
                <Button variant="outline" size="sm" onClick={() => setShowRawJson(!showRawJson)}>
                  {showRawJson ? 'Ocultar JSON' : 'Mostrar JSON'}
                </Button>
              </div>

              {showRawJson && (
                <div className="mt-4 space-y-4">
                  <div>
                    <p className="mb-1 font-mono text-[10px] uppercase tracking-[0.09em] text-muted-foreground">
                      Project object
                    </p>
                    <pre className="max-h-64 overflow-auto rounded-lg border border-border bg-muted p-3 font-mono text-[11.5px]">
                      {JSON.stringify(project, null, 2)}
                    </pre>
                  </div>
                  <div>
                    <p className="mb-1 font-mono text-[10px] uppercase tracking-[0.09em] text-muted-foreground">
                      Portfolio properties
                    </p>
                    <pre className="max-h-64 overflow-auto rounded-lg border border-border bg-muted p-3 font-mono text-[11.5px]">
                      {JSON.stringify(portfolioProperties, null, 2)}
                    </pre>
                  </div>
                </div>
              )}
            </section>
          )}
        </TabsContent>

        <TabsContent value="chat">
          <ProjectChat projectId={project.id} projectTitle={project.title} />
        </TabsContent>
      </Tabs>
    </div>
  );
};
