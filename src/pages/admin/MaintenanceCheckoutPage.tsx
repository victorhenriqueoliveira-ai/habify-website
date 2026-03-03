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
import { Loader2, ArrowLeft, QrCode, CheckCircle } from 'lucide-react';

export default function MaintenanceCheckoutPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { createPayment, loading: paymentLoading } = usePayment();
  const { projects } = useProjects();
  
  const [paymentMethod] = useState<'PIX'>('PIX'); // Apenas PIX para manutenções
  
  const project = projects.find(p => p.id === projectId);

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
        .eq('user_id', (user as any).userId)
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
        userId: (user as any).userId,
        projectId: project.id,
      } as any);

      if (response.success && response.paymentUrl) {
        console.log('🔥 Redirecionando para pagamento de manutenção', {
          orderId: response.orderId,
          paymentId: response.paymentId,
          gateway: response.gateway,
          projectId: project.id,
          amount: 54.90,
          timestamp: new Date().toISOString()
        });

        // Salvar IDs e dados da manutenção
        if (response.orderId) {
          localStorage.setItem('orderId', response.orderId);
        }
        if (response.paymentId) {
          localStorage.setItem('paymentId', response.paymentId);
        }
        localStorage.setItem('gateway', response.gateway || 'ABACATEPAY');
        
        // Salvar dados da manutenção para processar após confirmação
        localStorage.setItem('maintenanceData', JSON.stringify({
          projectId: project.id,
          projectTitle: project.title,
          amount: 54.90,
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

  if (!project) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Carregando projeto...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-12 px-4">
      <div className="max-w-4xl mx-auto">
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
                    <CheckCircle className="h-4 w-4 mr-2 mt-0.5 text-green-600" />
                    <span>Atualizações de conteúdo</span>
                  </li>
                  <li className="text-sm flex items-start">
                    <CheckCircle className="h-4 w-4 mr-2 mt-0.5 text-green-600" />
                    <span>Correções de bugs</span>
                  </li>
                  <li className="text-sm flex items-start">
                    <CheckCircle className="h-4 w-4 mr-2 mt-0.5 text-green-600" />
                    <span>Suporte técnico</span>
                  </li>
                  <li className="text-sm flex items-start">
                    <CheckCircle className="h-4 w-4 mr-2 mt-0.5 text-green-600" />
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
                    <span className="text-2xl font-bold text-primary">
                    R$ 54,90
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
                Confirme seus dados para pagamento via PIX
              </CardDescription>
            </CardHeader>
            <form onSubmit={handleSubmit}>
              <CardContent className="space-y-4">
                {/* Payment Method - PIX only */}
                <div className="space-y-4">
                  <h3 className="font-semibold flex items-center space-x-2">
                    <QrCode className="h-4 w-4" />
                    <span>Método de Pagamento</span>
                  </h3>

                  <RadioGroup value={paymentMethod} disabled>
                    <div className="flex items-center space-x-2 border rounded-lg p-4 bg-muted/50">
                      <RadioGroupItem value="PIX" id="pix" checked />
                      <Label htmlFor="pix" className="flex items-center flex-1">
                        <QrCode className="h-5 w-5 mr-3" />
                        <div>
                          <div className="font-medium">PIX</div>
                          <div className="text-sm text-muted-foreground">
                            Pagamento instantâneo - R$ 54,90
                          </div>
                        </div>
                      </Label>
                    </div>
                  </RadioGroup>
                </div>

                <Separator />

                <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                  <div className="text-sm text-blue-700 dark:text-blue-300">
                    <p className="font-medium mb-1">Dados do usuário</p>
                    <div className="space-y-1">
                      <p><span className="font-medium">Nome:</span> {(user as any).raw_user_meta_data?.name || user?.email}</p>
                      <p><span className="font-medium">Email:</span> {user?.email}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
                  <div className="text-sm text-amber-700 dark:text-amber-300">
                    <p className="font-medium mb-1">⏱️ Atenção</p>
                    <p>A manutenção será ativada imediatamente após a confirmação do pagamento PIX.</p>
                  </div>
                </div>
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
                      <QrCode className="mr-2 h-4 w-4" />
                      Prosseguir para Pagamento PIX
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
