import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { ArrowLeft, ArrowRight, Check, CheckCircle, Loader2, Wand2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { PageHeader, LoadingState } from '@/components/admin/ui';
import { LogoStep } from '@/components/wizard/LogoStep';
import { PortfolioPropertiesStep } from '@/components/wizard/PortfolioPropertiesStep';
import { ProjectDataForm } from '@/components/wizard/ProjectDataForm';
import { DomainStep } from '@/components/wizard/DomainStep';
import { useProjects } from '@/hooks/useProjects';
import { useAuth } from '@/contexts/AuthContext';
import { useUserPlans } from '@/hooks/useUserPlans';
import { supabase } from '@/integrations/supabase/client';
import { uploadMultipleFiles } from '@/utils/uploadToStorage';
import { toast } from 'sonner';
import type { WizardData, ColorPalette, PaletteData } from '@/types/wizard';
import type { PropertyData } from '@/hooks/useMultipleProjects';

// "Layout e Cores" foi removida: o site gerado usa um design fixo por
// modo (ver habify-site-template) e não lê mais layoutChoice/colorPalette
// pra renderização — deixar a etapa no wizard só confundia o cliente,
// que achava que a cor escolhida ia aparecer no site.
const steps = [
  { id: 0, title: 'Selecionar Plano', description: 'Escolha o plano a usar' },
  { id: 1, title: 'Logotipo', description: 'Upload ou criação de logo' },
  { id: 2, title: 'Imóveis', description: 'Portfólio de imóveis' },
  { id: 3, title: 'Dados do Projeto', description: 'Informações completas' },
  { id: 4, title: 'Domínio', description: 'Escolha seu domínio' },
];

const ProjectWizardPage = () => {
  const navigate = useNavigate();
  const { state } = useLocation();
  const { createProject, fetchProjects } = useProjects();
  const { user } = useAuth();
  const { availablePlans, loading: plansLoading, usePlanForProject } = useUserPlans();
  const [currentStep, setCurrentStep] = useState(0);
  const [selectedPlanId, setSelectedPlanId] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  // Get project type from navigation state
  const projectType = (state as any)?.projectType || 'single_property';

  // Sem isso, trocar de etapa com a página rolada pra baixo (ex: depois de
  // preencher um formulário longo) deixa o usuário "perdido" no meio da
  // etapa seguinte em vez de começar vendo o topo dela.
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [currentStep]);

  // Redirect if no plans available
  useEffect(() => {
    if (!plansLoading && availablePlans.length === 0) {
      toast.error('Você não tem planos disponíveis');
      navigate('/admin/new-project-purchase');
    }
  }, [plansLoading, availablePlans, navigate]);

  const [wizardData, setWizardData] = useState<Partial<WizardData>>({
    hasLogo: false,
  });
  
  const [portfolioProperties, setPortfolioProperties] = useState<PropertyData[]>([{
    title: '',
    location: '',
    price: '',
    propertyType: 'apartment',
    purpose: 'sale',
    bedrooms: '',
    bathrooms: '',
    area: '',
    parkingSpaces: '',
    constructionYear: '',
    floorNumber: '',
    condominiumFee: '',
    iptu: '',
    description: '',
    badge: '',
    amenities: [],
    differentials: [],
    nearbyPlaces: [],
    photos: [],
    floorPlans: [],
  }]);

  const updateWizardData = (field: keyof WizardData, value: any) => {
    setWizardData((prev) => ({ ...prev, [field]: value }));
    // Clear error for this field
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const validateStep = () => {
    const newErrors: Record<string, string> = {};

    if (currentStep === 0) {
      if (!selectedPlanId) {
        toast.error('Selecione um plano para continuar');
        return false;
      }
    }

    if (currentStep === 1) {
      if (wizardData.hasLogo && !wizardData.logoUrl) {
        toast.error('Faça upload do logotipo ou escolha "Não, desejo criar"');
        return false;
      }
    }

    if (currentStep === 2) {
      // Validate portfolio properties
      if (portfolioProperties.length === 0) {
        toast.error('Adicione pelo menos um imóvel');
        return false;
      }

      for (let i = 0; i < portfolioProperties.length; i++) {
        const prop = portfolioProperties[i];
        if (!prop.title?.trim()) {
          toast.error(`Imóvel ${i + 1}: Título é obrigatório`);
          return false;
        }
        if (!prop.location?.trim()) {
          toast.error(`Imóvel ${i + 1}: Localização é obrigatória`);
          return false;
        }
        // Preço é opcional (vira "Sob consulta" no site) — só valida se foi preenchido.
        if (prop.price && parseFloat(prop.price.replace(/\D/g, '')) <= 0) {
          toast.error(`Imóvel ${i + 1}: Preço inválido`);
          return false;
        }
        if (!prop.area || parseFloat(prop.area) <= 0) {
          toast.error(`Imóvel ${i + 1}: Área inválida`);
          return false;
        }
        if (prop.photos.length === 0) {
          toast.error(`Imóvel ${i + 1}: Adicione pelo menos 1 foto`);
          return false;
        }
      }
    }

    if (currentStep === 3) {
      // Required fields validation
      if (!wizardData.profileType) newErrors.profileType = 'Campo obrigatório';
      if (!wizardData.ownerName?.trim()) newErrors.ownerName = 'Campo obrigatório';
      if (!wizardData.companyName?.trim()) newErrors.companyName = 'Campo obrigatório';
      if (!wizardData.creciNumber?.trim()) newErrors.creciNumber = 'Campo obrigatório';
      if (!wizardData.creciType) newErrors.creciType = 'Campo obrigatório';
      if (!wizardData.addressCep?.trim()) newErrors.addressCep = 'Campo obrigatório';
      if (!wizardData.addressStreet?.trim()) newErrors.addressStreet = 'Campo obrigatório';
      if (!wizardData.addressNumber?.trim()) newErrors.addressNumber = 'Campo obrigatório';
      if (!wizardData.addressState?.trim()) newErrors.addressState = 'Campo obrigatório';
      if (!wizardData.addressCity?.trim()) newErrors.addressCity = 'Campo obrigatório';
      if (!wizardData.addressNeighborhood?.trim()) newErrors.addressNeighborhood = 'Campo obrigatório';
      if (!wizardData.contactMobile?.trim()) newErrors.contactMobile = 'Campo obrigatório';
      if (!wizardData.contactEmail?.trim()) {
        newErrors.contactEmail = 'Campo obrigatório';
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(wizardData.contactEmail)) {
        newErrors.contactEmail = 'E-mail inválido';
      }
      if (!wizardData.contactEmailConfirm?.trim()) {
        newErrors.contactEmailConfirm = 'Campo obrigatório';
      } else if (wizardData.contactEmail !== wizardData.contactEmailConfirm) {
        newErrors.contactEmailConfirm = 'Os e-mails não conferem';
      }

      if (Object.keys(newErrors).length > 0) {
        setErrors(newErrors);
        toast.error('Preencha todos os campos obrigatórios');
        return false;
      }
    }

    return true;
  };

  const handleNext = () => {
    if (validateStep()) {
      if (currentStep < 4) {
        setCurrentStep(currentStep + 1);
      } else {
        handleSubmit();
      }
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async () => {
    if (!user?.id && !user?.userId) {
      toast.error('Você precisa estar logado para criar um projeto');
      return;
    }

    if (!selectedPlanId) {
      toast.error('Selecione um plano antes de finalizar');
      return;
    }

    setLoading(true);
    
    const loadingToast = toast.loading('Criando projeto e fazendo upload das imagens...');

    try {
      const userId = user.userId || user.id;
      
      // Build palette data structure
      const colorOptions = [
        { id: 'blue', primary: '#0B82FF', secondary: '#D8EEFF', accent: '#0056D6' },
        { id: 'orange', primary: '#FF6B35', secondary: '#FFE5DC', accent: '#CC4417' },
        { id: 'green', primary: '#10B981', secondary: '#D1FAE5', accent: '#047857' },
        { id: 'purple', primary: '#8B5CF6', secondary: '#EDE9FE', accent: '#6D28D9' },
        { id: 'neutral', primary: '#4B5563', secondary: '#F3F4F6', accent: '#1F2937' },
      ];
      
      const selectedPalette = colorOptions.find(c => c.id === wizardData.colorPalette);
      const paletteData: PaletteData | undefined = selectedPalette ? {
        id: selectedPalette.id as ColorPalette,
        colors: {
          primary: selectedPalette.primary,
          secondary: selectedPalette.secondary,
          accent: selectedPalette.accent,
        }
      } : undefined;

      // Build full address
      const fullAddress = [
        wizardData.addressStreet,
        wizardData.addressNumber,
        wizardData.addressComplement,
        wizardData.addressNeighborhood,
        wizardData.addressCity,
        wizardData.addressState,
        wizardData.addressCep
      ].filter(Boolean).join(', ');

      // console.log('Creating project with data:', {
      //   layoutChoice: wizardData.layoutChoice,
      //   colorPalette: wizardData.colorPalette,
      //   logoUrl: wizardData.logoUrl,
      //   hasLogo: wizardData.hasLogo,
      //   paletteData,
      //   propertiesCount: portfolioProperties.length,
      //   fullAddress,
      // });
      
      // Build photos array (logo + property photos)
      const projectPhotos: string[] = [];
      if (wizardData.logoUrl) {
        projectPhotos.push(wizardData.logoUrl);
      }
      
      const result = await createProject({
        userId,
        title: wizardData.companyName || 'Novo Projeto',
        description: `Projeto ${wizardData.profileType === 'corretor' ? 'de Corretor' : 'de Imobiliária'} - ${wizardData.ownerName}`,
        status: 'pending',
        location: fullAddress,
        photos: projectPhotos,
        projectType: projectType, // Use the correct project type from navigation state
        layoutChoice: wizardData.layoutChoice,
        colorPalette: wizardData.colorPalette,
        logoUrl: wizardData.logoUrl,
        wizardData: {
          profileType: wizardData.profileType,
          ownerName: wizardData.ownerName,
          companyName: wizardData.companyName,
          creciNumber: wizardData.creciNumber,
          creciType: wizardData.creciType,
          addressCep: wizardData.addressCep,
          addressStreet: wizardData.addressStreet,
          addressNumber: wizardData.addressNumber,
          addressComplement: wizardData.addressComplement,
          addressState: wizardData.addressState,
          addressCity: wizardData.addressCity,
          addressNeighborhood: wizardData.addressNeighborhood,
          contactPhone: wizardData.contactPhone,
          contactMobile: wizardData.contactMobile,
          contactEmail: wizardData.contactEmail,
          palette: paletteData,
          hasLogo: wizardData.hasLogo,
          desiredDomain: wizardData.desiredDomain,
          googleAnalyticsId: wizardData.googleAnalyticsId,
          heroMediaType: wizardData.heroVideoUrl ? wizardData.heroMediaType || 'video' : undefined,
          heroVideoUrl: wizardData.heroVideoUrl,
          statsPropertiesSold: wizardData.statsPropertiesSold,
          statsYearsExperience: wizardData.statsYearsExperience,
          statsHappyClients: wizardData.statsHappyClients,
        },
      });

      if (result.success && result.data) {
        const projectId = result.data.id;

        // Save desired_domain if chosen
        if (wizardData.desiredDomain) {
          await supabase
            .from('projects')
            .update({
              desired_domain: wizardData.desiredDomain,
              domain_status: 'pending',
            } as any)
            .eq('id', projectId);
        }
        
        // Save portfolio properties to database
        if (portfolioProperties.length > 0) {
          toast.loading(`Fazendo upload das fotos de ${portfolioProperties.length} imóveis...`, { id: loadingToast });
          
          // Upload photos for each property
          const propertiesWithUrls = await Promise.all(
            portfolioProperties.map(async (prop) => {
              const photoUrls: string[] = [];

              // Upload photos if they are File objects
              for (const photo of prop.photos) {
                if (photo instanceof File) {
                  // console.log(`Uploading photo for property: ${prop.title}`);
                  const fileUrls = await uploadMultipleFiles([photo], 'project-photos', `properties/${projectId}`);
                  if (fileUrls.length > 0) {
                    photoUrls.push(...fileUrls);
                  }
                } else if (typeof photo === 'string') {
                  // Keep existing string URLs
                  photoUrls.push(photo);
                }
              }

              // console.log(`Uploaded ${photoUrls.length} photos for property: ${prop.title}`);

              // Upload das plantas — separadas das fotos gerais, cada uma com o nome digitado no wizard.
              const floorPlans: { name: string; imageUrl: string; price?: number; badge?: string; highlighted?: boolean }[] = [];
              for (const plan of prop.floorPlans || []) {
                const fileUrls = await uploadMultipleFiles([plan.file], 'project-photos', `properties/${projectId}/floor-plans`);
                if (fileUrls.length > 0) {
                  floorPlans.push({
                    name: plan.name?.trim() || 'Planta',
                    imageUrl: fileUrls[0],
                    // plan.price vem de um <Input type="number"> simples (sem máscara de
                    // moeda) — diferente do campo "Valor" do imóvel, não precisa (nem pode)
                    // dividir por 100 aqui.
                    price: plan.price ? parseFloat(plan.price) || undefined : undefined,
                    badge: plan.badge?.trim() || undefined,
                    highlighted: plan.highlighted || undefined,
                  });
                }
              }

              return {
                project_id: projectId,
                title: prop.title,
                location: prop.location,
                // Sem preço preenchido = "Sob consulta" no site (0 no banco).
                price: prop.price ? parseFloat(prop.price.replace(/\D/g, '')) / 100 : 0,
                property_type: prop.propertyType,
                purpose: prop.purpose,
                bedrooms: prop.bedrooms ? parseInt(prop.bedrooms) : null,
                bathrooms: prop.bathrooms ? parseInt(prop.bathrooms) : null,
                area: parseFloat(prop.area),
                parking_spaces: prop.parkingSpaces ? parseInt(prop.parkingSpaces) : null,
                construction_year: prop.constructionYear ? parseInt(prop.constructionYear) : null,
                floor_number: prop.floorNumber ? parseInt(prop.floorNumber) : null,
                // condominiumFee/iptu vêm de <Input type="number"> simples (sem máscara de
                // moeda como o campo "Valor") — o valor digitado já é o valor em reais.
                condominium_fee: prop.condominiumFee ? parseFloat(prop.condominiumFee) || null : null,
                iptu: prop.iptu ? parseFloat(prop.iptu) || null : null,
                description: prop.description || null,
                badge: prop.badge?.trim() || null,
                amenities: prop.amenities || [],
                differentials: prop.differentials || [],
                nearby_places: prop.nearbyPlaces || [],
                photos: photoUrls,
                floor_plans: floorPlans,
              };
            })
          );

          // console.log('Inserting properties into database:', propertiesWithUrls.length);
          const { error: propertiesError } = await supabase
            .from('portfolio_properties')
            .insert(propertiesWithUrls);

          if (propertiesError) {
            console.error('Error saving portfolio properties:', propertiesError);
            toast.error('Projeto criado, mas houve erro ao salvar os imóveis', { id: loadingToast });
          } else {
            // console.log('Properties saved successfully');
            try {
              // Aggregate all property photos (they should already be public URLs returned by uploadMultipleFiles)
              const propertyPhotoUrls: string[] = propertiesWithUrls
                .flatMap((p) => (Array.isArray(p.photos) ? p.photos : []))
                .filter(Boolean);

              // Combine logo (if any) with property photos and remove duplicates
              const combinedPhotos = Array.from(new Set([...(projectPhotos || []), ...propertyPhotoUrls]));

              // Prepare update payload for project - also populate some top-level fields from the first property
              const updateData: any = {
                photos: combinedPhotos,
              };

              const firstProp = propertiesWithUrls[0];
              if (firstProp) {
                // If the wizard provided a full address use it (already saved at creation); otherwise use first property's location
                if (!fullAddress || fullAddress.trim() === '') {
                  updateData.location = firstProp.location || null;
                }

                if (firstProp.price !== undefined && firstProp.price !== null) updateData.price = firstProp.price;
                if (firstProp.bedrooms !== undefined) updateData.bedrooms = firstProp.bedrooms;
                if (firstProp.bathrooms !== undefined) updateData.bathrooms = firstProp.bathrooms;
                if (firstProp.area !== undefined) updateData.area = firstProp.area;
                if (firstProp.property_type) updateData.property_type = firstProp.property_type;
              }

              const { error: updateError } = await supabase
                .from('projects')
                .update(updateData)
                .eq('id', projectId);

              if (updateError) {
                console.error('Error updating project with aggregated photos/fields:', updateError);
                toast.error('Projeto criado, mas houve erro ao atualizar informações agregadas', { id: loadingToast });
              } else {
                try {
                  // Refresh local projects list so ProjectDetailPage and other views show the aggregated photos/fields immediately
                  await fetchProjects();
                } catch (err) {
                  // Non-fatal: already created project, but log for debugging
                  console.error('Error refetching projects after update:', err);
                }
              }
            } catch (err) {
              console.error('Error while aggregating property photos into project:', err);
            }
          }
        }

        // Plan is already consumed inside createProject() for regular users
        // No need to call usePlanForProject again here

        // AI Site Builder — dispara só agora, depois que os imóveis
        // (portfolio_properties) já foram gravados acima. Disparar antes
        // disso é uma corrida real: a function lê portfolio_properties e
        // gera o site com properties: [] se ainda não existir nenhuma linha.
        // Caminho padrão pra todo corretor — não depende mais de feature flag.
        supabase.functions
          .invoke('ai-site-builder', {
            body: { project_id: projectId, requesting_user_id: userId },
          })
          .catch((err) => console.warn('[ai-site-builder] invoke failed:', err));

        // Send project confirmation email
        try {
          const selectedPlan = availablePlans.find(p => p.plan_id === selectedPlanId);
          await supabase.functions.invoke('send-project-confirmation', {
            body: {
              userName: wizardData.ownerName,
              userEmail: wizardData.contactEmail,
              projectTitle: wizardData.companyName || 'Novo Projeto',
              projectDescription: `Projeto ${wizardData.profileType === 'corretor' ? 'de Corretor' : 'de Imobiliária'}`,
              projectLocation: fullAddress,
              planName: selectedPlan?.plan_name || 'Plano',
              projectId: projectId,
              aiSiteBuilderEnabled,
            },
          });
        } catch (emailError) {
          console.error('Error sending project confirmation email:', emailError);
          // Don't fail the project creation if email fails
        }

        toast.success('Projeto criado com sucesso!', { id: loadingToast });
        navigate('/admin/my-projects');
      } else {
        console.error('Failed to create project:', result.error);
        toast.error('Erro ao criar projeto', { id: loadingToast });
      }
    } catch (error) {
      console.error('Error creating project:', error);
      toast.error('Erro ao criar projeto', { id: loadingToast });
    } finally {
      setLoading(false);
    }
  };

  const progress = (currentStep / 5) * 100;

  if (plansLoading) {
    return <LoadingState label="Carregando planos..." size="lg" fullScreen />;
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto p-6 space-y-8">
        <PageHeader
          icon={Wand2}
          title="Criar Novo Projeto"
          description="Siga os passos para configurar seu site"
          actions={
            <Button variant="ghost" onClick={() => navigate('/admin/my-projects')}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Cancelar
            </Button>
          }
        />

        {/* Progress */}
        <div className="admin-card-elevated p-4 sm:p-6">
          <div className="space-y-5">
            <div className="flex justify-between text-sm font-medium text-muted-foreground">
              <span>
                Passo {currentStep + 1} de 5 — <span className="text-foreground">{steps[currentStep]?.title}</span>
              </span>
              <span>{Math.round(progress)}%</span>
            </div>
            <Progress value={progress} className="h-1.5" />
            <div className="flex justify-between gap-1 sm:gap-2">
              {steps.map((step) => (
                <div
                  key={step.id}
                  className={`flex-1 text-center ${
                    step.id === currentStep ? 'text-primary' : 'text-muted-foreground'
                  }`}
                >
                  <div className="mb-1 flex items-center justify-center sm:mb-2">
                    <div
                      className={`flex h-6 w-6 items-center justify-center rounded-full text-xs transition-colors sm:h-8 sm:w-8 sm:text-sm ${
                        step.id < currentStep
                          ? 'bg-primary text-primary-foreground'
                          : step.id === currentStep
                          ? 'bg-primary text-primary-foreground shadow-admin-card'
                          : 'bg-muted'
                      }`}
                    >
                      {step.id < currentStep ? <Check className="h-3 w-3 sm:h-4 sm:w-4" /> : step.id}
                    </div>
                  </div>
                  <p className="text-[10px] font-medium leading-tight sm:text-xs">{step.title}</p>
                  <p className="mt-1 hidden text-[10px] text-muted-foreground lg:block sm:text-xs">
                    {step.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Step Content */}
        <div>
          {currentStep === 0 && (
            <div className="admin-card-elevated p-6">
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-semibold">Selecione um Plano</h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Escolha qual plano você deseja usar para criar este projeto
                  </p>
                </div>

                <div className="space-y-3">
                  {availablePlans.map((plan) => (
                    <div
                      key={plan.plan_id}
                      onClick={() => setSelectedPlanId(plan.plan_id)}
                      className={`cursor-pointer rounded-lg border-2 p-4 transition-all ${
                        selectedPlanId === plan.plan_id
                          ? 'border-primary bg-primary/5'
                          : 'border-border hover:border-primary/50'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-lg font-semibold">{plan.plan_name}</h3>
                          <p className="mt-1 text-sm text-muted-foreground">{plan.plan_description}</p>
                          <Badge variant="secondary" className="mt-2">
                            {plan.count} {plan.count === 1 ? 'disponível' : 'disponíveis'}
                          </Badge>
                        </div>
                        {selectedPlanId === plan.plan_id && <CheckCircle className="h-8 w-8 text-primary" />}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {currentStep === 1 && (
            <LogoStep
              hasLogo={wizardData.hasLogo || false}
              logoUrl={wizardData.logoUrl}
              onHasLogoChange={(hasLogo) => updateWizardData('hasLogo', hasLogo)}
              onLogoUrlChange={(url) => updateWizardData('logoUrl', url)}
            />
          )}

          {currentStep === 2 && (
            <PortfolioPropertiesStep
              projectType={projectType === 'realtor_multiple' ? 'corretor' : 'imobiliaria'}
              properties={portfolioProperties}
              onPropertiesChange={setPortfolioProperties}
              errors={errors}
            />
          )}

          {currentStep === 3 && (
            <ProjectDataForm
              data={wizardData}
              onChange={updateWizardData}
              errors={errors}
            />
          )}

          {currentStep === 4 && (
            <DomainStep
              desiredDomain={wizardData.desiredDomain}
              onDomainChange={(domain) => updateWizardData('desiredDomain', domain)}
            />
          )}
        </div>

        {/* Navigation */}
        <div className="admin-card-elevated p-6">
          <div className="flex justify-between">
            <Button
              variant="outline"
              onClick={() => {
                if (currentStep === 0) {
                  navigate('/admin/new-project');
                } else {
                  setCurrentStep(currentStep - 1);
                }
              }}
              disabled={loading}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar
            </Button>

            <Button onClick={handleNext} disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Criando...
                </>
              ) : currentStep === 4 ? (
                <>
                  <Check className="mr-2 h-4 w-4" />
                  Finalizar
                </>
              ) : (
                <>
                  Próximo
                  <ArrowRight className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProjectWizardPage;
