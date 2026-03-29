import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Loader2, ArrowLeft, User, CreditCard, Calendar, DollarSign } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface OrderDetails {
  id: string;
  status: string;
  amount: number;
  payment_method: string | null;
  gateway: string | null;
  created_at: string;
  paid_at: string | null;
  payment_data: any;
  user_id: string | null;
  plan_id: string | null;
  profiles: {
    name: string;
    email: string | null;
  } | null;
  plans: {
    name: string;
    type: string;
  } | null;
}

export default function PaymentDetailPage() {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();
  const [order, setOrder] = useState<OrderDetails | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrder = async () => {
      if (!orderId) return;

      try {
        const { data, error } = await supabase
          .from('orders')
          .select(`
            *,
            profiles:user_id (name, email),
            plans:plan_id (name, type)
          `)
          .eq('id', orderId)
          .single();

        if (error) throw error;

        setOrder(data);
      } catch (error) {
        console.error('Error fetching order:', error);
        toast.error('Erro ao carregar detalhes do pagamento');
        navigate('/admin/payments');
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [orderId, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!order) {
    return null;
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
      case 'completed':
        return 'bg-green-500';
      case 'pending':
        return 'bg-yellow-500';
      case 'failed':
      case 'cancelled':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  return (
    <div className="min-h-screen bg-background py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <Button
          variant="ghost"
          onClick={() => navigate('/admin/payments')}
          className="mb-6"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar para Pagamentos
        </Button>

        <div className="grid gap-6">
          {/* Cabeçalho */}
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle>Detalhes do Pagamento</CardTitle>
                  <CardDescription>ID: {order.id}</CardDescription>
                </div>
                <Badge className={getStatusColor(order.status)}>
                  {order.status === 'paid' ? 'Pago' : order.status === 'pending' ? 'Pendente' : order.status === 'failed' ? 'Falhou' : order.status === 'cancelled' ? 'Cancelado' : 'Desconhecido'}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="flex items-start gap-3">
                  <DollarSign className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm text-muted-foreground">Valor</p>
                    <p className="font-semibold text-lg">
                      R$ {Number(order.amount).toFixed(2)}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <CreditCard className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm text-muted-foreground">Método de Pagamento</p>
                    <p className="font-medium">
                      {order.payment_method || 'Não especificado'}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Gateway: {order.gateway || 'N/A'}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm text-muted-foreground">Data de Criação</p>
                    <p className="font-medium">
                      {format(new Date(order.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                    </p>
                  </div>
                </div>

                {order.paid_at && (
                  <div className="flex items-start gap-3">
                    <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-sm text-muted-foreground">Data de Pagamento</p>
                      <p className="font-medium">
                        {format(new Date(order.paid_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Informações do Cliente */}
          {(() => {
            const clientName = order.profiles?.name || order.payment_data?.customerData?.name;
            const clientEmail = order.profiles?.email || order.payment_data?.customerData?.email;
            const clientPhone = order.payment_data?.customerData?.phone;
            if (!clientName && !clientEmail) return null;
            return (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5" />
                    Informações do Cliente
                    {!order.profiles && (
                      <Badge variant="outline" className="text-xs">via checkout</Badge>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {clientName && (
                    <div>
                      <p className="text-sm text-muted-foreground">Nome</p>
                      <p className="font-medium">{clientName}</p>
                    </div>
                  )}
                  {clientEmail && (
                    <div>
                      <p className="text-sm text-muted-foreground">Email</p>
                      <p className="font-medium">{clientEmail}</p>
                    </div>
                  )}
                  {clientPhone && (
                    <div>
                      <p className="text-sm text-muted-foreground">Telefone</p>
                      <p className="font-medium">{clientPhone}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })()}

          {/* Informações do Plano */}
          {order.plans && (
            <Card>
              <CardHeader>
                <CardTitle>Plano Adquirido</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div>
                  <p className="text-sm text-muted-foreground">Nome do Plano</p>
                  <p className="font-medium">{order.plans.name}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Tipo</p>
                  <p className="font-medium">{order.plans.type}</p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Dados Técnicos do Pagamento */}
          {order.payment_data && Object.keys(order.payment_data).length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Dados Técnicos</CardTitle>
                <CardDescription>Campos sensíveis (senha, CPF) são ocultados automaticamente</CardDescription>
              </CardHeader>
              <CardContent>
                <pre className="bg-muted p-4 rounded-lg overflow-auto text-xs">
                  {JSON.stringify(
                    Object.fromEntries(
                      Object.entries(order.payment_data).filter(
                        ([key]) => !['password', 'cpf', 'webhook_data'].includes(key)
                      ).map(([key, value]) => {
                        if (key === 'customerData' && typeof value === 'object' && value !== null) {
                          const { password, cpf, ...safeCustomerData } = value as Record<string, unknown>;
                          return [key, safeCustomerData];
                        }
                        return [key, value];
                      })
                    ),
                    null, 2
                  )}
                </pre>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
