import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { ArrowLeft, ArrowRight, Check, Loader2 } from 'lucide-react';
import { LayoutColorStep } from '@/components/wizard/LayoutColorStep';
import { LogoStep } from '@/components/wizard/LogoStep';
import { ProjectDataForm } from '@/components/wizard/ProjectDataForm';
import { useProjects } from '@/hooks/useProjects';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import type { WizardData, LayoutType, ColorPalette } from '@/types/wizard';

const steps = [
  { id: 1, title: 'Layout e Cores', description: 'Escolha o visual do seu site' },
  { id: 2, title: 'Logotipo', description: 'Upload ou criação de logo' },
  { id: 3, title: 'Dados do Projeto', description: 'Informações completas' },
];

const ProjectWizardPage = () => {
  const navigate = useNavigate();
  const { createProject } = useProjects();
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [wizardData, setWizardData] = useState<Partial<WizardData>>({
    hasLogo: false,
  });

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
      if (currentStep < 3) {
        setCurrentStep(currentStep + 1);
      } else {
        handleSubmit();
      }
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async () => {
    if (!user?.id && !user?.userId) {
      toast.error('Você precisa estar logado para criar um projeto');
      return;
    }

    setLoading(true);

    try {
      const userId = user.userId || user.id;
      
      const result = await createProject({
        userId,
        title: wizardData.companyName || 'Novo Projeto',
        description: `Projeto ${wizardData.profileType === 'corretor' ? 'de Corretor' : 'de Imobiliária'} - ${wizardData.ownerName}`,
        status: 'pending',
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
        },
      });

      if (result.success) {
        toast.success('Projeto criado com sucesso!');
        navigate('/admin/my-projects');
      } else {
        toast.error('Erro ao criar projeto');
      }
    } catch (error) {
      console.error('Error creating project:', error);
      toast.error('Erro ao criar projeto');
    } finally {
      setLoading(false);
    }
  };

  const progress = (currentStep / 3) * 100;

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
          <CardContent className="p-6">
            <div className="space-y-4">
              <div className="flex justify-between text-sm font-medium">
                <span>Passo {currentStep} de 3</span>
                <span>{Math.round(progress)}%</span>
              </div>
              <Progress value={progress} className="h-2" />
              <div className="flex justify-between">
                {steps.map((step) => (
                  <div
                    key={step.id}
                    className={`flex-1 text-center ${
                      step.id === currentStep ? 'text-primary' : 'text-muted-foreground'
                    }`}
                  >
                    <div className="flex items-center justify-center mb-2">
                      <div
                        className={`h-8 w-8 rounded-full flex items-center justify-center ${
                          step.id < currentStep
                            ? 'bg-primary text-primary-foreground'
                            : step.id === currentStep
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted'
                        }`}
                      >
                        {step.id < currentStep ? (
                          <Check className="h-4 w-4" />
                        ) : (
                          step.id
                        )}
                      </div>
                    </div>
                    <p className="text-xs font-medium">{step.title}</p>
                    <p className="text-xs text-muted-foreground hidden md:block">
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
            <ProjectDataForm
              data={wizardData}
              onChange={updateWizardData}
              errors={errors}
            />
          )}
        </div>

        {/* Navigation */}
        <Card>
          <CardContent className="p-6">
            <div className="flex justify-between">
              <Button
                variant="outline"
                onClick={handleBack}
                disabled={currentStep === 1 || loading}
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
                ) : currentStep === 3 ? (
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
