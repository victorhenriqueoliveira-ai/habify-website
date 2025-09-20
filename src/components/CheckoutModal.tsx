import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Loader2, CreditCard, Shield, CheckCircle } from 'lucide-react';
import { usePayment } from '@/hooks/usePayment';
import { toast } from 'sonner';
import type { Plan } from '@/hooks/usePlans';

interface CheckoutModalProps {
  plan: Plan | null;
  isOpen: boolean;
  onClose: () => void;
}

export const CheckoutModal = ({ plan, isOpen, onClose }: CheckoutModalProps) => {
  const { createPayment, loading } = usePayment();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    cpf: '',
    password: '',
    confirmPassword: '',
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const formatCPF = (value: string) => {
    const numericValue = value.replace(/\D/g, '');
    return numericValue.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
  };

  const formatPhone = (value: string) => {
    const numericValue = value.replace(/\D/g, '');
    if (numericValue.length === 11) {
      return numericValue.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
    }
    return numericValue.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
  };

  const validateForm = () => {
    if (!formData.name.trim()) {
      toast.error('Nome é obrigatório');
      return false;
    }
    
    if (!formData.email.trim() || !formData.email.includes('@')) {
      toast.error('Email válido é obrigatório');
      return false;
    }

    if (!formData.password || formData.password.length < 6) {
      toast.error('Senha deve ter pelo menos 6 caracteres');
      return false;
    }

    if (formData.password !== formData.confirmPassword) {
      toast.error('Senhas não coincidem');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!plan || !validateForm()) return;

    try {
      const response = await createPayment(plan.id, {
        name: formData.name.trim(),
        email: formData.email.trim(),
        phone: formData.phone.replace(/\D/g, ''),
        cpf: formData.cpf.replace(/\D/g, ''),
        password: formData.password,
      });

      if (response.success && response.paymentUrl) {
        // Store order data for post-payment verification
        localStorage.setItem('habify_order', JSON.stringify({
          customerEmail: formData.email,
          customerName: formData.name,
          customerPassword: formData.password
        }));
        
        const orderData = {
          orderId: response.orderId,
          abacatePayId: response.abacatePayId,
          planId: plan.id,
          customerEmail: formData.email,
          customerName: formData.name,
          customerPassword: formData.password,
        };
        
        localStorage.setItem('abacatePayId', response.abacatePayId);
        localStorage.setItem('habify_order', JSON.stringify(orderData));

        // Open payment in new tab
        window.open(response.paymentUrl, '_blank');
        
        onClose();
        toast.success('Redirecionando para pagamento. Após pagar, sua conta será criada automaticamente!');
      }
    } catch (error) {
      toast.error('Erro ao processar pagamento');
    }
  };

  if (!plan) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-center">
            Finalizar Compra
          </DialogTitle>
          <p className="text-muted-foreground text-center">
            Complete os dados abaixo para finalizar sua compra
          </p>
        </DialogHeader>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Plan Summary */}
          <Card className="border-2 border-primary/20">
            <CardHeader>
              <CardTitle className="text-lg flex items-center space-x-2">
                <CheckCircle className="h-5 w-5 text-primary" />
                <span>Resumo do Pedido</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-semibold text-lg">{plan.name}</h3>
                <p className="text-sm text-muted-foreground">{plan.description}</p>
              </div>

              <div className="space-y-2">
                {plan.features.slice(0, 4).map((feature, index) => (
                  <div key={index} className="flex items-start space-x-2">
                    <CheckCircle className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                    <span className="text-sm">{feature}</span>
                  </div>
                ))}
                {plan.features.length > 4 && (
                  <p className="text-xs text-muted-foreground">
                    +{plan.features.length - 4} outros recursos
                  </p>
                )}
              </div>

              <Separator />

              <div className="flex justify-between items-center text-lg font-bold">
                <span>Total:</span>
                <span className="text-primary">
                  R$ {plan.price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </span>
              </div>

              {plan.type === 'website_maintenance_6m' && (
                <p className="text-xs text-muted-foreground text-center">
                  Manutenção por apenas R$ 166,16/mês
                </p>
              )}
            </CardContent>
          </Card>

          {/* Checkout Form */}
          <div className="space-y-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-4">
                <h3 className="font-semibold flex items-center space-x-2">
                  <CreditCard className="h-4 w-4" />
                  <span>Dados do Cliente</span>
                </h3>

                <div>
                  <Label htmlFor="name">Nome Completo *</Label>
                  <Input
                    id="name"
                    type="text"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    placeholder="Seu nome completo"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    placeholder="seu@email.com"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="phone">Telefone (opcional)</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => handleInputChange('phone', formatPhone(e.target.value))}
                    placeholder="(11) 99999-9999"
                    maxLength={15}
                  />
                </div>

                <div>
                  <Label htmlFor="cpf">CPF (opcional)</Label>
                  <Input
                    id="cpf"
                    type="text"
                    value={formData.cpf}
                    onChange={(e) => handleInputChange('cpf', formatCPF(e.target.value))}
                    placeholder="000.000.000-00"
                    maxLength={14}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="password">Senha *</Label>
                    <Input
                      id="password"
                      type="password"
                      value={formData.password}
                      onChange={(e) => handleInputChange('password', e.target.value)}
                      placeholder="Mínimo 6 caracteres"
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="confirmPassword">Confirmar Senha *</Label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      value={formData.confirmPassword}
                      onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                      placeholder="Repita a senha"
                      required
                    />
                  </div>
                </div>
              </div>

              <Separator />

              <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                <Shield className="h-4 w-4" />
                <span>Pagamento 100% seguro via AbacatePay</span>
              </div>

              <Button 
                type="submit" 
                className="w-full" 
                size="lg"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processando...
                  </>
                ) : (
                  'Pagar Agora'
                )}
              </Button>
            </form>

            <div className="text-xs text-muted-foreground text-center space-y-1">
              <p>• Aceita PIX, Cartão de Crédito e Boleto</p>
              <p>• Garantia de 30 dias</p>
              <p>• Suporte direto via WhatsApp</p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};