import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { useUserPlans } from '@/hooks/useUserPlans';
import { useViaCep } from '@/hooks/useViaCep';
import { useProjects } from '@/hooks/useProjects';
import { useAuth } from '@/contexts/AuthContext';
import { ArrowLeft, ArrowRight, CheckCircle, MapPin, Loader2 } from 'lucide-react';

type Step = 'select-plan' | 'basic-info' | 'location' | 'details' | 'review';

export const ProjectWizardWithPlans = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { availablePlans, loading: plansLoading, usePlanForProject } = useUserPlans();
  const { searchCep, formatCep, loading: cepLoading } = useViaCep();
  const { createProject, loading: createLoading } = useProjects();
  
  const [currentStep, setCurrentStep] = useState<Step>('select-plan');
  const [selectedPlanId, setSelectedPlanId] = useState<string>('');
  
  // Form data
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    cep: '',
    street: '',
    number: '',
    complement: '',
    neighborhood: '',
    city: '',
    state: '',
    propertyType: 'house' as 'house' | 'apartment' | 'land' | 'commercial',
    bedrooms: '',
    bathrooms: '',
    area: '',
    price: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Redirect if no plans available
  useEffect(() => {
    if (!plansLoading && availablePlans.length === 0) {
      toast.error('Você não tem planos disponíveis');
      navigate('/admin/new-project-purchase');
    }
  }, [plansLoading, availablePlans, navigate]);

  const handleCepSearch = async () => {
    if (!formData.cep) {
      toast.error('Digite um CEP');
      return;
    }

    const address = await searchCep(formData.cep);
    if (address) {
      setFormData(prev => ({
        ...prev,
        street: address.logradouro || prev.street,
        neighborhood: address.bairro || prev.neighborhood,
        city: address.localidade || prev.city,
        state: address.uf || prev.state,
      }));
      toast.success('Endereço encontrado!');
    }
  };

  const validateStep = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (currentStep === 'select-plan' && !selectedPlanId) {
      toast.error('Selecione um plano');
      return false;
    }

    if (currentStep === 'basic-info') {
      if (!formData.title.trim()) {
        newErrors.title = 'O título é obrigatório';
      }
    }

    if (currentStep === 'location') {
      if (!formData.cep || formData.cep.replace(/\D/g, '').length !== 8) {
        newErrors.cep = 'CEP inválido';
      }
      if (!formData.street.trim()) {
        newErrors.street = 'O endereço é obrigatório';
      }
      if (!formData.number.trim()) {
        newErrors.number = 'O número é obrigatório';
      }
      if (!formData.city.trim()) {
        newErrors.city = 'A cidade é obrigatória';
      }
      if (!formData.state.trim()) {
        newErrors.state = 'O estado é obrigatório';
      }
    }

    setErrors(newErrors);

    if (Object.keys(newErrors).length > 0) {
      toast.error('Preencha todos os campos obrigatórios');
      return false;
    }

    return true;
  };

  const handleNext = () => {
    if (!validateStep()) return;

    const steps: Step[] = ['select-plan', 'basic-info', 'location', 'details', 'review'];
    const currentIndex = steps.indexOf(currentStep);
    if (currentIndex < steps.length - 1) {
      setCurrentStep(steps[currentIndex + 1]);
    }
  };

  const handleBack = () => {
    const steps: Step[] = ['select-plan', 'basic-info', 'location', 'details', 'review'];
    const currentIndex = steps.indexOf(currentStep);
    if (currentIndex > 0) {
      setCurrentStep(steps[currentIndex - 1]);
    }
  };

  const handleSubmit = async () => {
    if (!validateStep()) return;

    try {
      const selectedPlan = availablePlans.find(p => p.plan_id === selectedPlanId);
      if (!selectedPlan) {
        toast.error('Plano não encontrado');
        return;
      }

      // Create project
      const location = `${formData.street}, ${formData.number}${formData.complement ? ', ' + formData.complement : ''} - ${formData.neighborhood}, ${formData.city} - ${formData.state}`;
      
      const result = await createProject({
        userId: user?.userId || user?.id || '',
        title: formData.title,
        description: formData.description,
        location,
        propertyType: formData.propertyType,
        bedrooms: parseInt(formData.bedrooms) || 0,
        bathrooms: parseInt(formData.bathrooms) || 0,
        area: parseFloat(formData.area) || 0,
        price: parseFloat(formData.price.replace(/\D/g, '')) / 100 || 0,
        status: 'pending',
        selectedPlanId: selectedPlanId,
      });

      if (result.success && result.data?.id) {
        // Use the plan
        await usePlanForProject(selectedPlanId, result.data.id);
        
        toast.success('Projeto criado com sucesso!');
        navigate(`/admin/projects/${result.data.id}`);
      } else {
        toast.error(result.error || 'Erro ao criar projeto');
      }
    } catch (error) {
      console.error('Error creating project:', error);
      toast.error('Erro ao criar projeto');
    }
  };

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
    <div className="min-h-screen bg-background py-12 px-4">
      <div className="max-w-3xl mx-auto">
        <Button variant="ghost" onClick={() => navigate('/admin/projects')} className="mb-6">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar
        </Button>

        {/* Progress Indicator */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            {(['select-plan', 'basic-info', 'location', 'details', 'review'] as Step[]).map((step, index) => (
              <div key={step} className="flex items-center flex-1">
                <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${
                  step === currentStep ? 'border-primary bg-primary text-primary-foreground' :
                  index < (['select-plan', 'basic-info', 'location', 'details', 'review'] as Step[]).indexOf(currentStep) ? 'border-primary bg-primary text-primary-foreground' :
                  'border-muted bg-background'
                }`}>
                  {index + 1}
                </div>
                {index < 4 && <div className="flex-1 h-0.5 bg-muted mx-2" />}
              </div>
            ))}
          </div>
          <div className="text-center">
            <p className="text-sm text-muted-foreground">
              {currentStep === 'select-plan' && 'Selecione o plano'}
              {currentStep === 'basic-info' && 'Informações básicas'}
              {currentStep === 'location' && 'Localização'}
              {currentStep === 'details' && 'Detalhes do imóvel'}
              {currentStep === 'review' && 'Revisão'}
            </p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>
              {currentStep === 'select-plan' && 'Escolha seu Plano'}
              {currentStep === 'basic-info' && 'Informações Básicas'}
              {currentStep === 'location' && 'Endereço do Imóvel'}
              {currentStep === 'details' && 'Detalhes do Imóvel'}
              {currentStep === 'review' && 'Revisão Final'}
            </CardTitle>
            <CardDescription>
              {currentStep === 'select-plan' && 'Selecione qual plano você deseja usar para este projeto'}
              {currentStep === 'basic-info' && 'Preencha as informações principais do projeto'}
              {currentStep === 'location' && 'Informe o endereço completo do imóvel'}
              {currentStep === 'details' && 'Adicione informações adicionais sobre o imóvel'}
              {currentStep === 'review' && 'Revise todas as informações antes de criar o projeto'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Step: Select Plan */}
            {currentStep === 'select-plan' && (
              <div className="space-y-4">
                {availablePlans.map((plan) => (
                  <div
                    key={plan.plan_id}
                    className={`p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                      selectedPlanId === plan.plan_id
                        ? 'border-primary bg-primary/5'
                        : 'border-muted hover:border-primary/50'
                    }`}
                    onClick={() => setSelectedPlanId(plan.plan_id)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <h3 className="font-semibold text-lg">{plan.plan_name}</h3>
                          <Badge variant="secondary">{plan.count} disponível(is)</Badge>
                        </div>
                        {plan.plan_description && (
                          <p className="text-sm text-muted-foreground mt-1">
                            {plan.plan_description}
                          </p>
                        )}
                        {plan.expires_at && (
                          <p className="text-xs text-muted-foreground mt-2">
                            Expira em: {new Date(plan.expires_at).toLocaleDateString('pt-BR')}
                          </p>
                        )}
                      </div>
                      {selectedPlanId === plan.plan_id && (
                        <CheckCircle className="h-6 w-6 text-primary flex-shrink-0" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Step: Basic Info */}
            {currentStep === 'basic-info' && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Título do Projeto *</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="Ex: Apartamento Jardim Paulista"
                  />
                  {errors.title && <p className="text-sm text-destructive">{errors.title}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Descrição</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Descreva o imóvel, seus diferenciais, etc."
                    rows={4}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="propertyType">Tipo de Imóvel *</Label>
                  <Select
                    value={formData.propertyType}
                    onValueChange={(value: any) => setFormData(prev => ({ ...prev, propertyType: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="house">Casa</SelectItem>
                      <SelectItem value="apartment">Apartamento</SelectItem>
                      <SelectItem value="land">Terreno</SelectItem>
                      <SelectItem value="commercial">Comercial</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}

            {/* Step: Location */}
            {currentStep === 'location' && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="cep">CEP *</Label>
                  <div className="flex gap-2">
                    <Input
                      id="cep"
                      value={formData.cep}
                      onChange={(e) => setFormData(prev => ({ ...prev, cep: formatCep(e.target.value) }))}
                      placeholder="00000-000"
                      maxLength={9}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleCepSearch}
                      disabled={cepLoading}
                    >
                      {cepLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <MapPin className="h-4 w-4" />}
                    </Button>
                  </div>
                  {errors.cep && <p className="text-sm text-destructive">{errors.cep}</p>}
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="col-span-2 space-y-2">
                    <Label htmlFor="street">Endereço *</Label>
                    <Input
                      id="street"
                      value={formData.street}
                      onChange={(e) => setFormData(prev => ({ ...prev, street: e.target.value }))}
                      placeholder="Rua, Avenida..."
                    />
                    {errors.street && <p className="text-sm text-destructive">{errors.street}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="number">Número *</Label>
                    <Input
                      id="number"
                      value={formData.number}
                      onChange={(e) => setFormData(prev => ({ ...prev, number: e.target.value }))}
                      placeholder="123"
                    />
                    {errors.number && <p className="text-sm text-destructive">{errors.number}</p>}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="complement">Complemento</Label>
                  <Input
                    id="complement"
                    value={formData.complement}
                    onChange={(e) => setFormData(prev => ({ ...prev, complement: e.target.value }))}
                    placeholder="Apto, Bloco, etc."
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="neighborhood">Bairro</Label>
                  <Input
                    id="neighborhood"
                    value={formData.neighborhood}
                    onChange={(e) => setFormData(prev => ({ ...prev, neighborhood: e.target.value }))}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="city">Cidade *</Label>
                    <Input
                      id="city"
                      value={formData.city}
                      onChange={(e) => setFormData(prev => ({ ...prev, city: e.target.value }))}
                    />
                    {errors.city && <p className="text-sm text-destructive">{errors.city}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="state">Estado *</Label>
                    <Input
                      id="state"
                      value={formData.state}
                      onChange={(e) => setFormData(prev => ({ ...prev, state: e.target.value }))}
                      maxLength={2}
                      placeholder="SP"
                    />
                    {errors.state && <p className="text-sm text-destructive">{errors.state}</p>}
                  </div>
                </div>
              </div>
            )}

            {/* Step: Details */}
            {currentStep === 'details' && (
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="bedrooms">Quartos</Label>
                    <Input
                      id="bedrooms"
                      type="number"
                      value={formData.bedrooms}
                      onChange={(e) => setFormData(prev => ({ ...prev, bedrooms: e.target.value }))}
                      placeholder="3"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="bathrooms">Banheiros</Label>
                    <Input
                      id="bathrooms"
                      type="number"
                      value={formData.bathrooms}
                      onChange={(e) => setFormData(prev => ({ ...prev, bathrooms: e.target.value }))}
                      placeholder="2"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="area">Área (m²)</Label>
                    <Input
                      id="area"
                      type="number"
                      value={formData.area}
                      onChange={(e) => setFormData(prev => ({ ...prev, area: e.target.value }))}
                      placeholder="120"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="price">Preço (R$)</Label>
                  <Input
                    id="price"
                    value={formData.price}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, '');
                      setFormData(prev => ({ ...prev, price: value }));
                    }}
                    placeholder="R$ 500.000,00"
                  />
                </div>
              </div>
            )}

            {/* Step: Review */}
            {currentStep === 'review' && (
              <div className="space-y-4">
                <div className="p-4 bg-muted rounded-lg space-y-3">
                  <h4 className="font-semibold">Plano Selecionado</h4>
                  <p>{availablePlans.find(p => p.plan_id === selectedPlanId)?.plan_name}</p>
                </div>

                <div className="p-4 bg-muted rounded-lg space-y-3">
                  <h4 className="font-semibold">Informações do Projeto</h4>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div><span className="text-muted-foreground">Título:</span> {formData.title}</div>
                    <div><span className="text-muted-foreground">Tipo:</span> {formData.propertyType}</div>
                    <div className="col-span-2"><span className="text-muted-foreground">Endereço:</span> {formData.street}, {formData.number}</div>
                    <div><span className="text-muted-foreground">Cidade:</span> {formData.city}/{formData.state}</div>
                  </div>
                </div>
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="flex justify-between pt-4 border-t">
              {currentStep !== 'select-plan' && (
                <Button variant="outline" onClick={handleBack}>
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Voltar
                </Button>
              )}
              <div className="ml-auto">
                {currentStep !== 'review' ? (
                  <Button onClick={handleNext}>
                    Próximo
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                ) : (
                  <Button onClick={handleSubmit} disabled={createLoading}>
                    {createLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Criando...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="mr-2 h-4 w-4" />
                        Criar Projeto
                      </>
                    )}
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
