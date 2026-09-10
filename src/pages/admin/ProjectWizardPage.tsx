import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { ArrowLeft, ArrowRight, Check, Loader2, CheckCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { LayoutColorStep } from '@/components/wizard/LayoutColorStep';
import { LogoStep } from '@/components/wizard/LogoStep';
import { PortfolioPropertiesStep } from '@/components/wizard/PortfolioPropertiesStep';
import { ProjectDataForm } from '@/components/wizard/ProjectDataForm';
import { DomainStep } from '@/components/wizard/DomainStep';
import { useProjects } from '@/hooks/useProjects';
import { useAuth } from '@/contexts/AuthContext';
import { useUserPlans } from '@/hooks/useUserPlans';
import { checkFeatureFlag } from '@/hooks/useFeatureFlag';
import { supabase } from '@/integrations/supabase/client';
import { uploadMultipleFiles } from '@/utils/uploadToStorage';
import { toast } from 'sonner';
import type { WizardData, LayoutType, ColorPalette, PaletteData } from '@/types/wizard';
import type { PropertyData } from '@/hooks/useMultipleProjects';

const steps = [
  { id: 0, title: 'Selecionar Plano', description: 'Escolha o plano a usar' },
  { id: 1, title: 'Layout e Cores', description: 'Escolha o visual do seu site' },
  { id: 2, title: 'Logotipo', description: 'Upload ou criação de logo' },
  { id: 3, title: 'Imóveis', description: 'Portfólio de imóveis' },
  { id: 4, title: 'Dados do Projeto', description: 'Informações completas' },
  { id: 5, title: 'Domínio', description: 'Escolha seu domínio' },
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
    amenities: [],
    photos: [],
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
      if (!wizardData.layoutChoice) {
        toast.error('Selecione um layout');
        return false;
      }
      if (!wizardData.colorPalette) {
        toast.error('Selecione uma paleta de cores');
        return false;
      }
    }

    if (currentStep === 2) {
      if (wizardData.hasLogo && !wizardData.logoUrl) {
        toast.error('Faça upload do logotipo ou escolha "Não, desejo criar"');
        return false;
      }
    }

    if (currentStep === 3) {
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
        if (!prop.price || parseFloat(prop.price) <= 0) {
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

    if (currentStep === 4) {
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
      if (currentStep < 5) {
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
              
              return {
                project_id: projectId,
                title: prop.title,
                location: prop.location,
                price: parseFloat(prop.price.replace(/\D/g, '')) / 100, // Remove formatação e divide por 100
                property_type: prop.propertyType,
                purpose: prop.purpose,
                bedrooms: prop.bedrooms ? parseInt(prop.bedrooms) : null,
                bathrooms: prop.bathrooms ? parseInt(prop.bathrooms) : null,
                area: parseFloat(prop.area),
                parking_spaces: prop.parkingSpaces ? parseInt(prop.parkingSpaces) : null,
                construction_year: prop.constructionYear ? parseInt(prop.constructionYear) : null,
                floor_number: prop.floorNumber ? parseInt(prop.floorNumber) : null,
                condominium_fee: prop.condominiumFee ? parseFloat(prop.condominiumFee.replace(/\D/g, '')) / 100 : null,
                iptu: prop.iptu ? parseFloat(prop.iptu.replace(/\D/g, '')) / 100 : null,
                description: prop.description || null,
                amenities: prop.amenities || [],
                photos: photoUrls,
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

        // [BETA] AI Site Builder — dispara só agora, depois que os imóveis
        // (portfolio_properties) já foram gravados acima. Disparar antes
        // disso é uma corrida real: a function lê portfolio_properties e
        // gera o site com properties: [] se ainda não existir nenhuma linha.
        const aiSiteBuilderEnabled = await checkFeatureFlag(userId, 'ai_site_builder');
        if (aiSiteBuilderEnabled) {
          supabase.functions
            .invoke('ai-site-builder', {
              body: { project_id: projectId, requesting_user_id: userId },
            })
            .catch((err) => console.warn('[ai-site-builder] invoke failed:', err));
        }

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

  const progress = (currentStep / 6) * 100;

  if (plansLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Carregando planos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto p-6 space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Criar Novo Projeto</h1>
            <p className="text-muted-foreground mt-1">
              Siga os passos para configurar seu site
            </p>
          </div>
          <Button
            variant="ghost"
            onClick={() => navigate('/admin/my-projects')}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Cancelar
          </Button>
        </div>

        {/* Progress */}
        <Card>
          <CardContent className="p-4 sm:p-6">
            <div className="space-y-4">
              <div className="flex justify-between text-sm font-medium">
                <span>Passo {currentStep + 1} de 6</span>
                <span>{Math.round(progress)}%</span>
              </div>
              <Progress value={progress} className="h-2" />
              <div className="flex justify-between gap-1 sm:gap-2">
                {steps.map((step) => (
                  <div
                    key={step.id}
                    className={`flex-1 text-center ${
                      step.id === currentStep ? 'text-primary' : 'text-muted-foreground'
                    }`}
                  >
                    <div className="flex items-center justify-center mb-1 sm:mb-2">
                      <div
                        className={`h-6 w-6 sm:h-8 sm:w-8 rounded-full flex items-center justify-center text-xs sm:text-sm ${
                          step.id < currentStep
                            ? 'bg-primary text-primary-foreground'
                            : step.id === currentStep
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted'
                        }`}
                      >
                        {step.id < currentStep ? (
                          <Check className="h-3 w-3 sm:h-4 sm:w-4" />
                        ) : (
                          step.id
                        )}
                      </div>
                    </div>
                    <p className="text-[10px] sm:text-xs font-medium leading-tight">{step.title}</p>
                    <p className="text-[10px] sm:text-xs text-muted-foreground hidden lg:block mt-1">
                      {step.description}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Step Content */}
        <div>
          {currentStep === 0 && (
            <Card>
              <CardContent className="p-6">
                <div className="space-y-6">
                  <div>
                    <h2 className="text-2xl font-bold mb-2">Selecione um Plano</h2>
                    <p className="text-muted-foreground">
                      Escolha qual plano você deseja usar para criar este projeto
                    </p>
                  </div>
                  
                  <div className="space-y-4">
                    {availablePlans.map((plan) => (
                      <div
                        key={plan.plan_id}
                        onClick={() => setSelectedPlanId(plan.plan_id)}
                        className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                          selectedPlanId === plan.plan_id
                            ? 'border-primary bg-primary/5'
                            : 'border-border hover:border-primary/50'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="font-semibold text-lg">{plan.plan_name}</h3>
                            <p className="text-sm text-muted-foreground mt-1">{plan.plan_description}</p>
                            <Badge variant="secondary" className="mt-2">
                              {plan.count} {plan.count === 1 ? 'disponível' : 'disponíveis'}
                            </Badge>
                          </div>
                          {selectedPlanId === plan.plan_id && (
                            <CheckCircle className="h-8 w-8 text-primary" />
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {currentStep === 1 && (
            <LayoutColorStep
              selectedLayout={wizardData.layoutChoice}
              selectedColor={wizardData.colorPalette}
              onLayoutChange={(layout: LayoutType) => updateWizardData('layoutChoice', layout)}
              onColorChange={(color: ColorPalette) => updateWizardData('colorPalette', color)}
            />
          )}

          {currentStep === 2 && (
            <LogoStep
              hasLogo={wizardData.hasLogo || false}
              logoUrl={wizardData.logoUrl}
              onHasLogoChange={(hasLogo) => updateWizardData('hasLogo', hasLogo)}
              onLogoUrlChange={(url) => updateWizardData('logoUrl', url)}
            />
          )}

          {currentStep === 3 && (
            <PortfolioPropertiesStep
              projectType={projectType === 'realtor_multiple' ? 'corretor' : 'imobiliaria'}
              properties={portfolioProperties}
              onPropertiesChange={setPortfolioProperties}
              errors={errors}
            />
          )}

          {currentStep === 4 && (
            <ProjectDataForm
              data={wizardData}
              onChange={updateWizardData}
              errors={errors}
            />
          )}

          {currentStep === 5 && (
            <DomainStep
              desiredDomain={wizardData.desiredDomain}
              onDomainChange={(domain) => updateWizardData('desiredDomain', domain)}
            />
          )}
        </div>

        {/* Navigation */}
        <Card>
          <CardContent className="p-6">
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
                ) : currentStep === 5 ? (
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
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ProjectWizardPage;
