import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ArrowLeft, Save } from 'lucide-react';
import { useUsers } from '@/hooks/useUsers';
import { usePlans } from '@/hooks/usePlans';
import { toast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';

export const NewUserPage = () => {
  const navigate = useNavigate();
  const { createUserWithPlan } = useUsers();
  const { plans, loading: plansLoading } = usePlans();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    password: '',
    plan_id: '',
    gateway: '' as 'abacatepay' | 'hubla' | '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.full_name || !formData.email || !formData.password || !formData.plan_id || !formData.gateway) {
      toast({
        title: 'Erro de validação',
        description: 'Preencha todos os campos obrigatórios.',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      const result = await createUserWithPlan({
        email: formData.email,
        password: formData.password,
        full_name: formData.full_name,
        plan_id: formData.plan_id,
        gateway: formData.gateway as 'abacatepay' | 'hubla',
      });

      const selectedPlan = plans.find(p => p.id === formData.plan_id);

      toast({
        title: 'Usuário criado com sucesso',
        description: `${formData.full_name} foi criado com o plano ${selectedPlan?.name} e ${result.data?.credits || 0} crédito(s).`,
      });

      navigate('/admin/users');
    } catch (error: any) {
      console.error('User creation error:', error);
      toast({
        title: 'Erro ao criar usuário',
        description: error?.message || 'Ocorreu um erro ao criar o usuário. Tente novamente.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate('/admin/users')}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Novo Usuário</h1>
          <p className="text-muted-foreground">
            Adicione um novo usuário ao sistema
          </p>
        </div>
      </div>

      {/* Form */}
      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>Informações do Usuário</CardTitle>
          <CardDescription>
            Preencha os dados do novo usuário
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="full_name">Nome Completo *</Label>
                <Input
                  id="full_name"
                  value={formData.full_name}
                  onChange={(e) => handleChange('full_name', e.target.value)}
                  placeholder="João Silva"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleChange('email', e.target.value)}
                  placeholder="joao@example.com"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Senha *</Label>
                <Input
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => handleChange('password', e.target.value)}
                  placeholder="Senha segura"
                  required
                  minLength={6}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="plan_id">Plano *</Label>
                <Select 
                  value={formData.plan_id} 
                  onValueChange={(value) => handleChange('plan_id', value)}
                  disabled={plansLoading}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o plano" />
                  </SelectTrigger>
                  <SelectContent>
                    {plans.map((plan) => (
                      <SelectItem key={plan.id} value={plan.id}>
                        {plan.name} - {plan.credits_granted || 1} crédito(s)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Créditos serão concedidos automaticamente
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="gateway">Método de Pagamento *</Label>
                <Select value={formData.gateway} onValueChange={(value) => handleChange('gateway', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o método" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="abacatepay">PIX (AbacatePay)</SelectItem>
                    <SelectItem value="hubla">Cartão (Hubla)</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Define qual valor será registrado no sistema
                </p>
              </div>
            </div>

            <div className="flex justify-end space-x-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate('/admin/users')}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? (
                  <>
                    <div className="mr-2 h-4 w-4 animate-spin rounded-full border-b-2 border-white"></div>
                    Criando...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Criar Usuário
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};