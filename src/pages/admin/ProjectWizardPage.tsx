import { useMemo, useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { ArrowLeft, ArrowRight, Check, CheckCircle, Loader2, Wand2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { PageHeader, LoadingState } from '@/components/admin/ui';
import { cn } from '@/lib/utils';
import { ErrorSummary } from '@/components/wizard/ErrorSummary';
import {
  validateLogoStep,
  validatePlanStep,
  validatePropertiesStep,
  validateProjectDataStep,
  propertyLabel,
  type FieldErrors,
} from '@/lib/wizardValidation';
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
import type { WizardData } from '@/types/wizard';
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
  /** Só mostra erro depois da primeira tentativa de avançar — marcar campo
   *  vazio antes de a pessoa chegar nele é hostil. */
  const [showErrors, setShowErrors] = useState(false);
  
  // Get project type from navigation state
  const projectType =
    (state as { projectType?: WizardData['projectType'] } | null)?.projectType || 'single_property';

  // Sem isso, trocar de etapa com a página rolada pra baixo (ex: depois de
  // preencher um formulário longo) deixa o usuário "perdido" no meio da
  // etapa seguinte em vez de começar vendo o topo dela.
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    // Sem isto o resumo de erros da etapa anterior continua na tela.
    setErrors({});
    setShowErrors(false);
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

  const updateWizardData = <K extends keyof WizardData>(field: K, value: WizardData[K]) => {
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

  /** Rótulos do resumo de erros: sem isto a lista mostraria "addressCep". */
  const errorLabels = useMemo(() => {
    const labels: Record<string, string> = {};
    portfolioProperties.forEach((property, index) => {
      const label = propertyLabel(property, index);
      ['title', 'full-location', 'price', 'area', 'photos'].forEach((field) => {
        labels[`${field}-${index}`] = label;
      });
    });
    return labels;
  }, [portfolioProperties]);

  /** Todos os problemas da etapa atual, de uma vez. */
  const collectStepErrors = (): FieldErrors => {
    if (currentStep === 0) return validatePlanStep(selectedPlanId);
    if (currentStep === 1) return validateLogoStep(wizardData);
    if (currentStep === 2) return validatePropertiesStep(portfolioProperties);
    if (currentStep === 3) return validateProjectDataStep(wizardData);
    return {};
  };

  const validateStep = () => {
    const stepErrors = collectStepErrors();
    const isValid = Object.keys(stepErrors).length === 0;

    // Só liga a exibição quando há o que exibir. Ligar sempre fazia a
    // etapa seguinte já abrir marcada de vermelho: o efeito de revalidar
    // roda no mesmo commit que o de trocar de etapa e ainda enxergava o
    // showErrors ligado aqui.
    setShowErrors(!isValid);
    setErrors(stepErrors);

    // Sem toast de propósito: o resumo no topo da etapa e a marcação nos
    // campos já dizem o que falta, e ficam na tela até ser resolvido.
    return isValid;
  };

  // Depois da primeira tentativa, revalida a cada alteração: o erro some
  // assim que o campo é corrigido, em vez de só no próximo clique em
  // "Próximo" — que era quando a pessoa descobria se tinha acertado.
  useEffect(() => {
    if (!showErrors) return;
    setErrors(collectStepErrors());
    // collectStepErrors é recriada a cada render; as dependências reais
    // são o estado que ela lê, todas listadas aqui.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showErrors, currentStep, selectedPlanId, wizardData, portfolioProperties]);

  const lastStep = steps.length - 1;

  const handleNext = () => {
    if (!validateStep()) return;

    if (currentStep < lastStep) {
      setCurrentStep(currentStep + 1);
    } else {
      handleSubmit();
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
              // O tipo gerado do Supabase ainda não tem as colunas de
              // domínio; o cast é pro client, não pro dado.
            } as never)
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
              const updateData: Record<string, unknown> = {
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

  // currentStep é 0-indexado e vai até steps.length - 1: dividir por 5
  // fixo deixava a última etapa marcando 80% e a barra nunca fechava.
  const progress = ((currentStep + 1) / steps.length) * 100;

  if (plansLoading) {
    return <LoadingState label="Carregando planos..." size="lg" fullScreen />;
  }

  return (
    /* Sem min-h-screen nem container próprio: o AdminLayout já centraliza
     *  e dá o padding — os dois somados criavam moldura dupla. */
    <div className="mx-auto max-w-4xl space-y-6">
        <PageHeader
          icon={Wand2}
          eyebrow="Projetos"
          title="Criar novo projeto"
          description="Siga os passos para configurar seu site"
          actions={
            <Button variant="ghost" onClick={() => navigate('/admin/my-projects')}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Cancelar
            </Button>
          }
        />

        {/* Progress */}
        <div className="admin-card-elevated p-4 sm:p-5">
          <div className="flex items-baseline justify-between gap-3">
            <p className="font-mono text-[10px] uppercase tracking-[0.09em] text-muted-foreground">
              Passo {currentStep + 1} de {steps.length}
            </p>
            <p className="font-mono text-[10px] tabular-nums text-muted-foreground">
              {Math.round(progress)}%
            </p>
          </div>

          <h2 className="mt-1 font-display text-[18px] font-bold tracking-[-0.025em]">
            {steps[currentStep]?.title}
          </h2>
          <p className="text-[13px] text-muted-foreground">{steps[currentStep]?.description}</p>

          <Progress value={progress} className="mt-3.5 h-1.5" />

          {/* No mobile os cinco rótulos não cabem: mostra só os números, e o
            *  nome da etapa ativa já está no título acima. */}
          <ol className="mt-4 flex items-center gap-1.5">
            {steps.map((step, index) => {
              const done = index < currentStep;
              const active = index === currentStep;

              return (
                <li key={step.id} className="flex flex-1 items-center gap-1.5">
                  <span
                    aria-current={active ? 'step' : undefined}
                    className={cn(
                      'grid h-6 w-6 shrink-0 place-items-center rounded-full font-mono text-[11px] font-medium transition-colors',
                      done && 'bg-primary text-primary-foreground',
                      active && 'bg-primary text-primary-foreground ring-4 ring-primary/15',
                      !done && !active && 'border border-border bg-muted text-muted-foreground',
                    )}
                  >
                    {/* index + 1: antes imprimia step.id cru, 0-indexado, e o
                      *  primeiro círculo do wizard mostrava "0". */}
                    {done ? <Check className="h-3 w-3" aria-hidden="true" /> : index + 1}
                  </span>
                  <span className="sr-only">{step.title}</span>
                  {index < steps.length - 1 && (
                    <span
                      aria-hidden="true"
                      className={cn('h-px flex-1 transition-colors', done ? 'bg-primary' : 'bg-border')}
                    />
                  )}
                </li>
              );
            })}
          </ol>
        </div>

        {/* Step Content */}
        <div className="space-y-4">
          <ErrorSummary errors={errors} labels={errorLabels} />

          {currentStep === 0 && (
            <div className="admin-card-elevated p-6">
              <div className="space-y-4">
                {/* Antes era <div onClick>: dava pra ver, não pra escolher
                  *  pelo teclado. Agora é um grupo de rádio de verdade. */}
                <div className="space-y-2.5" role="radiogroup" aria-label="Planos disponíveis">
                  {availablePlans.map((plan) => {
                    const selected = selectedPlanId === plan.plan_id;

                    return (
                      <button
                        key={plan.plan_id}
                        type="button"
                        role="radio"
                        aria-checked={selected}
                        onClick={() => setSelectedPlanId(plan.plan_id)}
                        className={cn(
                          'flex w-full items-center justify-between gap-3 rounded-lg border p-4 text-left transition-colors',
                          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                          selected
                            ? 'border-primary bg-primary/[0.06]'
                            : 'border-border hover:bg-muted',
                        )}
                      >
                        <span className="min-w-0">
                          <span className="block text-[15px] font-semibold">{plan.plan_name}</span>
                          {plan.plan_description && (
                            <span className="mt-0.5 block text-[13px] text-muted-foreground">
                              {plan.plan_description}
                            </span>
                          )}
                          <span className="mt-1.5 inline-block rounded-full border border-border px-2 py-0.5 font-mono text-[10.5px] tabular-nums text-muted-foreground">
                            {plan.count} {plan.count === 1 ? 'disponível' : 'disponíveis'}
                          </span>
                        </span>

                        {selected && (
                          <CheckCircle className="h-5 w-5 shrink-0 text-primary" aria-hidden="true" />
                        )}
                      </button>
                    );
                  })}
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
  );
};

export default ProjectWizardPage;
