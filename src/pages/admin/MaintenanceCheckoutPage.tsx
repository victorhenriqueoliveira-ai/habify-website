import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { usePayment } from '@/hooks/usePayment';
import { useProjects } from '@/hooks/useProjects';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, ArrowLeft, QrCode, CheckCircle, CreditCard, User, Clock } from 'lucide-react';
import { AdminNotice, LoadingState } from '@/components/admin/ui';
import { BUSINESS } from '@/config/business';

export default function MaintenanceCheckoutPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { createPayment, loading: paymentLoading } = usePayment();
  const { projects } = useProjects();
  
  const [paymentMethod, setPaymentMethod] = useState<'PIX' | 'CARD'>('PIX');
  
  const project = projects.find(p => p.id === projectId);
  const userDisplayName = user?.name || user?.email || 'Sem nome';
  const monthly = BUSINESS.pricing.maintenanceMonthly.toFixed(2).replace('.', ',');

  useEffect(() => {
    if (!user) {
      toast.error('Você precisa estar logado para contratar manutenção');
      navigate('/admin/auth');
    }
  }, [user, navigate]);

  useEffect(() => {
    if (projects.length > 0 && !project) {
      toast.error('Projeto não encontrado');
      navigate('/admin/my-maintenances');
    }
  }, [project, projects, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!project || !user) return;

    try {
      // Buscar dados completos do profile incluindo CPF
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('cpf, phone, name')
        .eq('user_id', user.userId)
        .single();

      if (profileError) {
        console.error('Erro ao buscar dados do perfil:', profileError);
        toast.error('Erro ao buscar dados do perfil. Tente novamente.');
        return;
      }

      // Validar CPF
      const cpf = profileData?.cpf?.replace(/\D/g, '') || '';
      if (!cpf || cpf.length !== 11) {
        toast.error('CPF não encontrado ou inválido no seu perfil. Por favor, atualize seus dados cadastrais antes de contratar a manutenção.');
        return;
      }

      // Validar telefone
      const phone = profileData?.phone?.replace(/\D/g, '') || '';
      if (!phone || phone.length < 10) {
        toast.error('Telefone não encontrado ou inválido no seu perfil. Por favor, atualize seus dados cadastrais antes de contratar a manutenção.');
        return;
      }

      // Limpar localStorage de tentativas anteriores
      localStorage.removeItem('orderId');
      localStorage.removeItem('paymentId');
      localStorage.removeItem('gateway');
      localStorage.removeItem('maintenanceData');
      
      // Criar pagamento com identificador especial de manutenção
      const response = await createPayment('maintenance-monthly', {
        name: profileData?.name || user.email || '',
        email: user.email || '',
        phone: phone,
        cpf: cpf,
        password: '',
        paymentMethod,
        isLoggedInPurchase: true,
        userId: user.userId,
        projectId: project.id,
        // O payload de manutenção carrega projectId e isLoggedInPurchase,
        // que não estão no tipo público do hook — cast pro tipo do próprio
        // parâmetro em vez de `any`, sem mudar o que é enviado.
      } as Parameters<typeof createPayment>[1]);

      if (response.success && response.paymentUrl) {
        // Salvar apenas IDs técnicos antes de redirecionar
        if (response.orderId) {
          localStorage.setItem('orderId', response.orderId);
        }
        if (response.paymentId) {
          localStorage.setItem('paymentId', response.paymentId);
        }
        localStorage.setItem('gateway', response.gateway || 'ABACATEPAY');

        window.location.href = response.paymentUrl;
      } else {
        toast.error(response.error || 'Erro ao processar pagamento');
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erro ao processar pagamento');
    }
  };

  if (!project) {
    return <LoadingState label="Carregando projeto..." size="lg" fullScreen />;
  }

  return (
    /* Sem container próprio: o AdminLayout já centraliza e dá o padding. */
    <div>
      <div className="mx-auto max-w-4xl">
        <Button
          variant="ghost"
          onClick={() => navigate('/admin/my-maintenances')}
          className="mb-6"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar
        </Button>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Resumo da Manutenção */}
          <Card>
            <CardHeader>
              <CardTitle>Resumo da Manutenção</CardTitle>
              <CardDescription>Revise os detalhes da manutenção mensal</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-semibold text-lg">Manutenção Mensal</h3>
                <p className="text-sm text-muted-foreground mt-1">Projeto: {project.title}</p>
              </div>
              
              <Separator />
              
              <div>
                <h4 className="font-medium mb-2">Serviços inclusos:</h4>
                <ul className="space-y-1">
                  <li className="text-sm flex items-start">
                    <CheckCircle className="h-4 w-4 mr-2 mt-0.5 text-success" />
                    <span>Atualizações de conteúdo</span>
                  </li>
                  <li className="text-sm flex items-start">
                    <CheckCircle className="h-4 w-4 mr-2 mt-0.5 text-success" />
                    <span>Correções de bugs</span>
                  </li>
                  <li className="text-sm flex items-start">
                    <CheckCircle className="h-4 w-4 mr-2 mt-0.5 text-success" />
                    <span>Suporte técnico</span>
                  </li>
                  <li className="text-sm flex items-start">
                    <CheckCircle className="h-4 w-4 mr-2 mt-0.5 text-success" />
                    <span>Backup regular</span>
                  </li>
                </ul>
              </div>

              <Separator />

              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Duração:</span>
                  <span className="font-medium">30 dias</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-lg">Total:</span>
                    <span className="font-display text-[26px] font-bold tabular-nums tracking-[-0.03em]">
                    R$ {monthly}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Formulário de Checkout */}
          <Card>
            <CardHeader>
              <CardTitle>Pagamento</CardTitle>
              <CardDescription>
                Confirme seus dados para pagamento
              </CardDescription>
            </CardHeader>
            <form onSubmit={handleSubmit}>
              <CardContent className="space-y-4">
                {/* Payment Method */}
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
                            Pagamento instantâneo - R$ 54,90
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
                            R$ 54,90 - você escolhe as parcelas na página de pagamento
                          </div>
                        </div>
                      </Label>
                    </div>
                  </RadioGroup>
                </div>

                <Separator />

                <AdminNotice
                  tone="info"
                  icon={User}
                  title="Dados do usuário"
                  description={
                    <>
                      {userDisplayName}
                      <br />
                      <span className="font-mono text-[11px]">{user?.email}</span>
                    </>
                  }
                />

                <AdminNotice
                  tone="warning"
                  icon={Clock}
                  title="Ativação"
                  description={`A manutenção é ativada assim que o pagamento${
                    paymentMethod === 'PIX' ? ' PIX' : ' no cartão'
                  } for confirmado.`}
                />
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
                  ) : paymentMethod === 'PIX' ? (
                    <>
                      <QrCode className="mr-2 h-4 w-4" />
                      Prosseguir para Pagamento PIX
                    </>
                  ) : (
                    <>
                      <CreditCard className="mr-2 h-4 w-4" />
                      Prosseguir para Pagamento no Cartão
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
