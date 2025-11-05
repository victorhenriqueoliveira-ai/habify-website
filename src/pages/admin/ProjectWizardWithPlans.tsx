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
import { ArrowLeft, ArrowRight, CheckCircle, MapPin, Loader2, Upload, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { uploadFileToStorage } from '@/utils/uploadToStorage';

type Step = 'select-plan' | 'basic-info' | 'location' | 'details' | 'photos' | 'review';

export const ProjectWizardWithPlans = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { availablePlans, loading: plansLoading, usePlanForProject } = useUserPlans();
  const { searchCep, formatCep, loading: cepLoading } = useViaCep();
  const { createProject, loading: createLoading } = useProjects();
  
  const [currentStep, setCurrentStep] = useState<Step>('select-plan');
  const [selectedPlanId, setSelectedPlanId] = useState<string>('');
  const [uploading, setUploading] = useState(false);
  const [uploadedPhotos, setUploadedPhotos] = useState<string[]>([]);
  
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

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    try {
      const uploadPromises = Array.from(files).map(file => 
        uploadFileToStorage(file, 'project-photos')
      );
      
      const results = await Promise.all(uploadPromises);
      const urls = results.filter(url => url !== null) as string[];
      
      setUploadedPhotos(prev => [...prev, ...urls]);
      toast.success(`${urls.length} foto(s) enviada(s) com sucesso!`);
    } catch (error) {
      console.error('Error uploading photos:', error);
      toast.error('Erro ao enviar fotos');
    } finally {
      setUploading(false);
    }
  };

  const removePhoto = (index: number) => {
    setUploadedPhotos(prev => prev.filter((_, i) => i !== index));
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
      if (!formData.description.trim()) {
        newErrors.description = 'A descrição é obrigatória';
      }
      if (!formData.propertyType) {
        newErrors.propertyType = 'Selecione o tipo de propriedade';
      }
    }

    if (currentStep === 'location') {
      if (!formData.cep || formData.cep.replace(/\D/g, '').length !== 8) {
        newErrors.cep = 'CEP inválido (8 dígitos)';
      }
      if (!formData.street.trim()) {
        newErrors.street = 'O endereço é obrigatório';
      }
      if (!formData.number.trim()) {
        newErrors.number = 'O número é obrigatório';
      }
      if (!formData.neighborhood.trim()) {
        newErrors.neighborhood = 'O bairro é obrigatório';
      }
      if (!formData.city.trim()) {
        newErrors.city = 'A cidade é obrigatória';
      }
      if (!formData.state.trim()) {
        newErrors.state = 'O estado é obrigatório';
      }
    }

    if (currentStep === 'details') {
      if (!formData.area || parseFloat(formData.area) <= 0) {
        newErrors.area = 'A área deve ser maior que 0';
      }
      if (!formData.price) {
        newErrors.price = 'O preço é obrigatório';
      }
      if (formData.propertyType !== 'land') {
        if (!formData.bedrooms || parseInt(formData.bedrooms) < 0) {
          newErrors.bedrooms = 'Número de quartos inválido';
        }
        if (!formData.bathrooms || parseInt(formData.bathrooms) < 0) {
          newErrors.bathrooms = 'Número de banheiros inválido';
        }
      }
    }

    setErrors(newErrors);

    if (Object.keys(newErrors).length > 0) {
      toast.error('Preencha todos os campos obrigatórios corretamente');
      return false;
    }

    return true;
  };

  const handleNext = () => {
    if (!validateStep()) return;

    const steps: Step[] = ['select-plan', 'basic-info', 'location', 'details', 'photos', 'review'];
    const currentIndex = steps.indexOf(currentStep);
    if (currentIndex < steps.length - 1) {
      setCurrentStep(steps[currentIndex + 1]);
    }
  };

  const handleBack = () => {
    const steps: Step[] = ['select-plan', 'basic-info', 'location', 'details', 'photos', 'review'];
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

      // Create full location string
      const location = `${formData.street}, ${formData.number}${formData.complement ? ', ' + formData.complement : ''} - ${formData.neighborhood}, ${formData.city} - ${formData.state}, CEP: ${formData.cep}`;
      
      const projectData = {
        userId: user?.userId || user?.id || '',
        title: formData.title,
        description: formData.description,
        location,
        propertyType: formData.propertyType,
        bedrooms: parseInt(formData.bedrooms) || 0,
        bathrooms: parseInt(formData.bathrooms) || 0,
        area: parseFloat(formData.area) || 0,
        price: parseFloat(formData.price.replace(/\D/g, '')) / 100 || 0,
        status: 'pending' as const,
        selectedPlanId: selectedPlanId,
        photos: uploadedPhotos,
        wizardData: {
          cep: formData.cep,
          street: formData.street,
          number: formData.number,
          complement: formData.complement,
          neighborhood: formData.neighborhood,
          city: formData.city,
          state: formData.state,
        },
      };

      const result = await createProject(projectData);

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

  const steps: Step[] = ['select-plan', 'basic-info', 'location', 'details', 'photos', 'review'];
  const currentStepIndex = steps.indexOf(currentStep);
  const progress = ((currentStepIndex + 1) / steps.length) * 100;

  return (
    <div className="min-h-screen bg-background py-12 px-4">
      <div className="max-w-3xl mx-auto">
        <Button variant="ghost" onClick={() => navigate('/admin/my-projects')} className="mb-6">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar
        </Button>

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div 
              className="h-full bg-primary transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="flex justify-between mt-2 text-sm text-muted-foreground">
            <span>Passo {currentStepIndex + 1} de {steps.length}</span>
            <span>{Math.round(progress)}% completo</span>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>
              {currentStep === 'select-plan' && 'Selecione um Plano'}
              {currentStep === 'basic-info' && 'Informações Básicas'}
              {currentStep === 'location' && 'Localização'}
              {currentStep === 'details' && 'Detalhes do Imóvel'}
              {currentStep === 'photos' && 'Fotos do Projeto'}
              {currentStep === 'review' && 'Revisar e Confirmar'}
            </CardTitle>
            <CardDescription>
              {currentStep === 'select-plan' && 'Escolha o plano que deseja usar para este projeto'}
              {currentStep === 'basic-info' && 'Preencha as informações básicas do projeto'}
              {currentStep === 'location' && 'Informe a localização completa do imóvel'}
              {currentStep === 'details' && 'Adicione os detalhes técnicos do imóvel'}
              {currentStep === 'photos' && 'Adicione fotos do projeto'}
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
                    onClick={() => setSelectedPlanId(plan.plan_id)}
                    className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                      selectedPlanId === plan.plan_id
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:border-primary/50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold">{plan.plan_name}</h3>
                        <p className="text-sm text-muted-foreground">{plan.plan_description}</p>
                        <Badge variant="secondary" className="mt-2">
                          {plan.count} {plan.count === 1 ? 'disponível' : 'disponíveis'}
                        </Badge>
                      </div>
                      {selectedPlanId === plan.plan_id && (
                        <CheckCircle className="h-6 w-6 text-primary" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Step: Basic Info */}
            {currentStep === 'basic-info' && (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="title">Título do Projeto *</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="Ex: Casa em Condomínio Fechado"
                    className={errors.title ? 'border-destructive' : ''}
                  />
                  {errors.title && <p className="text-sm text-destructive mt-1">{errors.title}</p>}
                </div>

                <div>
                  <Label htmlFor="description">Descrição *</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Descreva o projeto detalhadamente..."
                    rows={4}
                    className={errors.description ? 'border-destructive' : ''}
                  />
                  {errors.description && <p className="text-sm text-destructive mt-1">{errors.description}</p>}
                </div>

                <div>
                  <Label htmlFor="propertyType">Tipo de Propriedade *</Label>
                  <Select
                    value={formData.propertyType}
                    onValueChange={(value: any) => setFormData(prev => ({ ...prev, propertyType: value }))}
                  >
                    <SelectTrigger className={errors.propertyType ? 'border-destructive' : ''}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="house">Casa</SelectItem>
                      <SelectItem value="apartment">Apartamento</SelectItem>
                      <SelectItem value="land">Terreno</SelectItem>
                      <SelectItem value="commercial">Comercial</SelectItem>
                    </SelectContent>
                  </Select>
                  {errors.propertyType && <p className="text-sm text-destructive mt-1">{errors.propertyType}</p>}
                </div>
              </div>
            )}

            {/* Step: Location */}
            {currentStep === 'location' && (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="cep">CEP *</Label>
                  <div className="flex gap-2">
                    <Input
                      id="cep"
                      value={formatCep(formData.cep)}
                      onChange={(e) => setFormData(prev => ({ ...prev, cep: e.target.value }))}
                      placeholder="00000-000"
                      maxLength={9}
                      className={errors.cep ? 'border-destructive' : ''}
                    />
                    <Button 
                      type="button" 
                      onClick={handleCepSearch}
                      disabled={cepLoading}
                    >
                      {cepLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <MapPin className="h-4 w-4" />}
                    </Button>
                  </div>
                  {errors.cep && <p className="text-sm text-destructive mt-1">{errors.cep}</p>}
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="col-span-2">
                    <Label htmlFor="street">Endereço *</Label>
                    <Input
                      id="street"
                      value={formData.street}
                      onChange={(e) => setFormData(prev => ({ ...prev, street: e.target.value }))}
                      placeholder="Rua, Avenida..."
                      className={errors.street ? 'border-destructive' : ''}
                    />
                    {errors.street && <p className="text-sm text-destructive mt-1">{errors.street}</p>}
                  </div>
                  <div>
                    <Label htmlFor="number">Número *</Label>
                    <Input
                      id="number"
                      value={formData.number}
                      onChange={(e) => setFormData(prev => ({ ...prev, number: e.target.value }))}
                      placeholder="123"
                      className={errors.number ? 'border-destructive' : ''}
                    />
                    {errors.number && <p className="text-sm text-destructive mt-1">{errors.number}</p>}
                  </div>
                </div>

                <div>
                  <Label htmlFor="complement">Complemento</Label>
                  <Input
                    id="complement"
                    value={formData.complement}
                    onChange={(e) => setFormData(prev => ({ ...prev, complement: e.target.value }))}
                    placeholder="Apto, Bloco, etc"
                  />
                </div>

                <div>
                  <Label htmlFor="neighborhood">Bairro *</Label>
                  <Input
                    id="neighborhood"
                    value={formData.neighborhood}
                    onChange={(e) => setFormData(prev => ({ ...prev, neighborhood: e.target.value }))}
                    className={errors.neighborhood ? 'border-destructive' : ''}
                  />
                  {errors.neighborhood && <p className="text-sm text-destructive mt-1">{errors.neighborhood}</p>}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="city">Cidade *</Label>
                    <Input
                      id="city"
                      value={formData.city}
                      onChange={(e) => setFormData(prev => ({ ...prev, city: e.target.value }))}
                      className={errors.city ? 'border-destructive' : ''}
                    />
                    {errors.city && <p className="text-sm text-destructive mt-1">{errors.city}</p>}
                  </div>
                  <div>
                    <Label htmlFor="state">Estado *</Label>
                    <Input
                      id="state"
                      value={formData.state}
                      onChange={(e) => setFormData(prev => ({ ...prev, state: e.target.value }))}
                      maxLength={2}
                      placeholder="UF"
                      className={errors.state ? 'border-destructive' : ''}
                    />
                    {errors.state && <p className="text-sm text-destructive mt-1">{errors.state}</p>}
                  </div>
                </div>
              </div>
            )}

            {/* Step: Details */}
            {currentStep === 'details' && (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="area">Área (m²) *</Label>
                  <Input
                    id="area"
                    type="number"
                    value={formData.area}
                    onChange={(e) => setFormData(prev => ({ ...prev, area: e.target.value }))}
                    placeholder="150"
                    min="0"
                    step="0.01"
                    className={errors.area ? 'border-destructive' : ''}
                  />
                  {errors.area && <p className="text-sm text-destructive mt-1">{errors.area}</p>}
                </div>

                <div>
                  <Label htmlFor="price">Preço (R$) *</Label>
                  <Input
                    id="price"
                    value={formData.price}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, '');
                      const formatted = new Intl.NumberFormat('pt-BR', {
                        style: 'currency',
                        currency: 'BRL'
                      }).format(parseFloat(value) / 100 || 0);
                      setFormData(prev => ({ ...prev, price: formatted }));
                    }}
                    placeholder="R$ 0,00"
                    className={errors.price ? 'border-destructive' : ''}
                  />
                  {errors.price && <p className="text-sm text-destructive mt-1">{errors.price}</p>}
                </div>

                {formData.propertyType !== 'land' && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="bedrooms">Quartos *</Label>
                      <Input
                        id="bedrooms"
                        type="number"
                        value={formData.bedrooms}
                        onChange={(e) => setFormData(prev => ({ ...prev, bedrooms: e.target.value }))}
                        placeholder="3"
                        min="0"
                        className={errors.bedrooms ? 'border-destructive' : ''}
                      />
                      {errors.bedrooms && <p className="text-sm text-destructive mt-1">{errors.bedrooms}</p>}
                    </div>
                    <div>
                      <Label htmlFor="bathrooms">Banheiros *</Label>
                      <Input
                        id="bathrooms"
                        type="number"
                        value={formData.bathrooms}
                        onChange={(e) => setFormData(prev => ({ ...prev, bathrooms: e.target.value }))}
                        placeholder="2"
                        min="0"
                        className={errors.bathrooms ? 'border-destructive' : ''}
                      />
                      {errors.bathrooms && <p className="text-sm text-destructive mt-1">{errors.bathrooms}</p>}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Step: Photos */}
            {currentStep === 'photos' && (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="photos">Fotos do Projeto</Label>
                  <div className="mt-2">
                    <label htmlFor="photos" className="cursor-pointer">
                      <div className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-primary transition-colors">
                        <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                        <p className="text-sm text-muted-foreground">
                          Clique para selecionar fotos ou arraste e solte
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          PNG, JPG, WEBP até 10MB
                        </p>
                      </div>
                    </label>
                    <input
                      id="photos"
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={handlePhotoUpload}
                      className="hidden"
                      disabled={uploading}
                    />
                  </div>
                </div>

                {uploadedPhotos.length > 0 && (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    {uploadedPhotos.map((url, index) => (
                      <div key={index} className="relative group">
                        <img
                          src={url}
                          alt={`Foto ${index + 1}`}
                          className="w-full h-32 object-cover rounded-lg"
                        />
                        <button
                          type="button"
                          onClick={() => removePhoto(index)}
                          className="absolute top-2 right-2 p-1 bg-destructive text-destructive-foreground rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {uploading && (
                  <div className="flex items-center justify-center p-4">
                    <Loader2 className="h-6 w-6 animate-spin mr-2" />
                    <span>Enviando fotos...</span>
                  </div>
                )}
              </div>
            )}

            {/* Step: Review */}
            {currentStep === 'review' && (
              <div className="space-y-6">
                <div className="space-y-4">
                  <div>
                    <h3 className="font-semibold mb-2">Plano Selecionado</h3>
                    <Card>
                      <CardContent className="pt-4">
                        <p className="font-medium">
                          {availablePlans.find(p => p.plan_id === selectedPlanId)?.plan_name}
                        </p>
                      </CardContent>
                    </Card>
                  </div>

                  <div>
                    <h3 className="font-semibold mb-2">Informações Básicas</h3>
                    <Card>
                      <CardContent className="pt-4 space-y-2">
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <span className="text-muted-foreground">Título:</span>
                          <span className="font-medium">{formData.title}</span>
                          <span className="text-muted-foreground">Tipo:</span>
                          <span className="font-medium capitalize">
                            {formData.propertyType === 'house' && 'Casa'}
                            {formData.propertyType === 'apartment' && 'Apartamento'}
                            {formData.propertyType === 'land' && 'Terreno'}
                            {formData.propertyType === 'commercial' && 'Comercial'}
                          </span>
                        </div>
                        <div className="text-sm">
                          <span className="text-muted-foreground">Descrição:</span>
                          <p className="mt-1">{formData.description}</p>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  <div>
                    <h3 className="font-semibold mb-2">Localização</h3>
                    <Card>
                      <CardContent className="pt-4 text-sm">
                        <p className="font-medium">
                          {formData.street}, {formData.number}
                          {formData.complement && `, ${formData.complement}`}
                        </p>
                        <p className="text-muted-foreground">
                          {formData.neighborhood}, {formData.city} - {formData.state}
                        </p>
                        <p className="text-muted-foreground">CEP: {formatCep(formData.cep)}</p>
                      </CardContent>
                    </Card>
                  </div>

                  <div>
                    <h3 className="font-semibold mb-2">Detalhes</h3>
                    <Card>
                      <CardContent className="pt-4">
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <span className="text-muted-foreground">Área:</span>
                          <span className="font-medium">{formData.area}m²</span>
                          <span className="text-muted-foreground">Preço:</span>
                          <span className="font-medium">{formData.price}</span>
                          {formData.propertyType !== 'land' && (
                            <>
                              <span className="text-muted-foreground">Quartos:</span>
                              <span className="font-medium">{formData.bedrooms}</span>
                              <span className="text-muted-foreground">Banheiros:</span>
                              <span className="font-medium">{formData.bathrooms}</span>
                            </>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {uploadedPhotos.length > 0 && (
                    <div>
                      <h3 className="font-semibold mb-2">Fotos ({uploadedPhotos.length})</h3>
                      <div className="grid grid-cols-3 gap-2">
                        {uploadedPhotos.map((url, index) => (
                          <img
                            key={index}
                            src={url}
                            alt={`Foto ${index + 1}`}
                            className="w-full h-24 object-cover rounded-lg"
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="flex justify-between pt-6 border-t">
              <Button
                variant="outline"
                onClick={handleBack}
                disabled={currentStep === 'select-plan'}
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Voltar
              </Button>

              {currentStep === 'review' ? (
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
              ) : (
                <Button onClick={handleNext}>
                  Próximo
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};