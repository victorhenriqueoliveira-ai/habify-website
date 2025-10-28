import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { usePlans } from '@/hooks/usePlans';
import { usePayment } from '@/hooks/usePayment';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, ArrowLeft, CreditCard, QrCode, Info, CheckCircle } from 'lucide-react';
import { formatCPF, formatPhone } from '@/lib/validations';

export default function CheckoutPage() {
  const { planId } = useParams<{ planId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { plans, loading: plansLoading } = usePlans();
  const { createPayment, loading: paymentLoading } = usePayment();
  
  const [paymentMethod, setPaymentMethod] = useState<'PIX' | 'CARD'>('PIX');
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    password: '',
    phone: '',
    cpf: '',
  });

  const plan = plans.find(p => p.id === planId);

  useEffect(() => {
    if (!plansLoading && !plan) {
      toast.error('Plano não encontrado');
      navigate('/');
    }
  }, [plan, plansLoading, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!plan) return;

    // Validação de nome completo
    const nameParts = formData.name.trim().split(/\s+/);
    if (nameParts.length < 2) {
      toast.error('Digite nome e sobrenome');
      return;
    }

    // Validação de email
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      toast.error('Email inválido');
      return;
    }

    // Validação de CPF
    const cpfDigits = formData.cpf.replace(/\D/g, '');
    if (!cpfDigits || cpfDigits.length !== 11) {
      toast.error('CPF inválido. Digite 11 dígitos');
      return;
    }

    // Validação de telefone
    const phoneDigits = formData.phone.replace(/\D/g, '');
    if (!phoneDigits || phoneDigits.length < 10 || phoneDigits.length > 11) {
      toast.error('Telefone inválido. Digite 10 ou 11 dígitos');
      return;
    }

    // Validação de senha
    if (!user && (!formData.password || formData.password.length < 6)) {
      toast.error('Senha deve ter no mínimo 6 caracteres');
      return;
    }

    // Verificar unicidade de email, CPF e telefone
    if (!user) {
      try {
        const { data: uniqueCheck } = await supabase.functions.invoke('check-unique-fields', {
          body: {
            email: formData.email,
            cpf: cpfDigits,
            phone: phoneDigits,
          },
        });

        if (!uniqueCheck?.success) {
          uniqueCheck?.errors?.forEach((error: string) => toast.error(error));
          return;
        }
      } catch (error) {
        toast.error('Erro ao validar dados. Tente novamente.');
        return;
      }
    }

    try {
      const response = await createPayment(plan.id, {
        ...formData,
        paymentMethod,
        isLoggedInPurchase: !!user,
      });

      if (response.success && response.paymentUrl) {
        // 🔥 CRÍTICO: Salvar IDs antes de redirecionar
        if (response.orderId) {
          localStorage.setItem('orderId', response.orderId);
        }
        if (response.paymentId) {
          localStorage.setItem('paymentId', response.paymentId);
        }
        localStorage.setItem('gateway', response.gateway || 'UNKNOWN');
        
        // Salvar dados do cliente para conferência posterior
        localStorage.setItem('checkoutData', JSON.stringify({
          email: formData.email,
          name: formData.name,
          planId: plan.id,
          planName: plan.name,
          amount: paymentMethod === 'PIX' ? (plan.pix_price || plan.price) : (plan.stripe_price || plan.price),
          timestamp: Date.now()
        }));

        window.location.href = response.paymentUrl;
      } else {
        toast.error(response.error || 'Erro ao processar pagamento');
      }
    } catch (error: any) {
      toast.error(error.message || 'Erro ao processar pagamento');
    }
  };

  if (plansLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-background to-muted/30 p-4">
        <Card className="w-full max-w-2xl">
          <CardHeader>
            <Skeleton className="h-8 w-3/4" />
            <Skeleton className="h-4 w-1/2 mt-2" />
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <Skeleton className="h-6 w-48" />
              <div className="space-y-3">
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
              </div>
            </div>
            <div className="space-y-4">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-10 w-full" />
            </div>
            <div className="space-y-4">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-10 w-full" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!plan) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <Button
          variant="ghost"
          onClick={() => navigate(-1)}
          className="mb-6"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar
        </Button>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Resumo do Plano */}
          <Card>
            <CardHeader>
              <CardTitle>Resumo do Pedido</CardTitle>
              <CardDescription>Revise os detalhes do plano selecionado</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-semibold text-lg">{plan.name}</h3>
                <p className="text-sm text-muted-foreground mt-1">{plan.description}</p>
              </div>
              
              <Separator />
              
              <div>
                <h4 className="font-medium mb-2">Recursos inclusos:</h4>
                <ul className="space-y-1">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="text-sm flex items-start">
                      <span className="mr-2">✓</span>
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <Separator />

              <div className="flex justify-between items-center">
                <span className="font-semibold">Total:</span>
                <span className="text-primary">
                  {paymentMethod === 'PIX' ? (
                    <div className="text-right">
                      <div className="text-2xl font-bold">
                        R$ {(plan.pix_price || plan.price).toFixed(2)}
                      </div>
                    </div>
                  ) : (
                    <div className="text-right">
                      <div className="text-lg font-bold">
                        R$ {((plan.stripe_price || plan.price) / 12).toFixed(2)}/mês
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Total: R$ {(plan.stripe_price || plan.price).toFixed(2)}
                      </div>
                    </div>
                  )}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Formulário de Checkout */}
          <Card>
            <CardHeader>
              <CardTitle>Dados para Pagamento</CardTitle>
              <CardDescription>
                {user ? 'Confirme seus dados' : 'Crie sua conta e efetue o pagamento'}
              </CardDescription>
            </CardHeader>
            <form onSubmit={handleSubmit}>
              <CardContent className="space-y-4">
                {/* Payment Method Selection */}
                <div className="space-y-4">
                  <h3 className="font-semibold flex items-center space-x-2">
                    <CreditCard className="h-4 w-4" />
                    <span>Método de Pagamento</span>
                  </h3>

                  <RadioGroup value={paymentMethod} onValueChange={(value) => setPaymentMethod(value as 'PIX' | 'CARD')}>
                    <div className="flex items-center space-x-2 border rounded-lg p-4 cursor-pointer hover:bg-muted/50">
                      <RadioGroupItem value="PIX" id="pix" />
                      <Label htmlFor="pix" className="flex items-center cursor-pointer flex-1">
                        <QrCode className="h-5 w-5 mr-3" />
                        <div>
                          <div className="font-medium">PIX</div>
                          <div className="text-sm text-muted-foreground">
                            Pagamento instantâneo - R$ {(plan.pix_price || plan.price).toFixed(2)}
                          </div>
                        </div>
                      </Label>
                    </div>
                    
                    <div className="flex items-center space-x-2 border rounded-lg p-4 cursor-pointer hover:bg-muted/50">
                      <RadioGroupItem value="CARD" id="card" />
                      <Label htmlFor="card" className="flex items-center cursor-pointer flex-1">
                        <CreditCard className="h-5 w-5 mr-3" />
                        <div>
                          <div className="font-medium">Cartão de Crédito</div>
                          <div className="text-sm text-muted-foreground">
                            Parcelamento em até 12x - R$ {((plan.stripe_price || plan.price) / 12).toFixed(2)}/mês
                          </div>
                        </div>
                      </Label>
                    </div>
                  </RadioGroup>

                  {paymentMethod === 'CARD' && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <div className="flex items-start space-x-2">
                        <Info className="h-4 w-4 text-blue-600 mt-0.5" />
                        <div className="text-sm text-blue-700">
                          <p className="font-medium mb-1">Parcelamento via Hubla</p>
                          <p>Você escolherá o número de parcelas no checkout da Hubla. Cupons de desconto disponíveis!</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <Separator />

                <div className="space-y-2">
                  <Label htmlFor="name">Nome Completo *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                    placeholder="João da Silva"
                  />
                  <p className="text-xs text-muted-foreground">
                    Nome e sobrenome são obrigatórios
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                    disabled={!!user}
                    placeholder="seu@email.com"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="cpf">CPF *</Label>
                  <Input
                    id="cpf"
                    value={formData.cpf}
                    onChange={(e) => setFormData({ ...formData, cpf: formatCPF(e.target.value) })}
                    required
                    placeholder="000.000.000-00"
                    maxLength={14}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Telefone *</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: formatPhone(e.target.value) })}
                    required
                    placeholder="(00) 00000-0000"
                    maxLength={15}
                  />
                </div>

                {!user && (
                  <div className="space-y-2">
                    <Label htmlFor="password">Senha *</Label>
                    <Input
                      id="password"
                      type="password"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      required
                      minLength={6}
                      placeholder="Mínimo 6 caracteres"
                    />
                    <p className="text-xs text-muted-foreground">
                      Mínimo 6 caracteres
                    </p>
                  </div>
                )}
              </CardContent>
              <CardFooter>
                <Button
                  type="submit"
                  className="w-full"
                  disabled={paymentLoading}
                >
                  {paymentLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Processando...
                    </>
                  ) : (
                    <>
                      <CreditCard className="mr-2 h-4 w-4" />
                      Prosseguir para Pagamento
                    </>
                  )}
                </Button>
              </CardFooter>
            </form>
          </Card>
        </div>
      </div>
    </div>
  );
}
