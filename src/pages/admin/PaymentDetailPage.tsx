import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { ArrowLeft, User, CreditCard, Calendar, DollarSign, Receipt } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  LoadingState,
  PageHeader,
  SectionHeader,
  StatusPill,
  type StatusTone,
} from '@/components/admin/ui';

interface OrderDetails {
  id: string;
  status: string;
  amount: number;
  payment_method: string | null;
  gateway: string | null;
  created_at: string;
  paid_at: string | null;
  payment_data: Record<string, unknown> | null;
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

const statusConfig: Record<string, { tone: StatusTone; label: string }> = {
  paid: { tone: 'success', label: 'Pago' },
  completed: { tone: 'success', label: 'Concluído' },
  pending: { tone: 'warning', label: 'Pendente' },
  failed: { tone: 'destructive', label: 'Falhou' },
  cancelled: { tone: 'destructive', label: 'Cancelado' },
};

const detailLabel = 'font-mono text-[10px] uppercase tracking-[0.09em] text-muted-foreground';

/** Campo em bloco: rótulo em mono, valor logo abaixo. */
function Detail({
  icon: Icon,
  label,
  value,
  hint,
}: {
  icon?: typeof User;
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div className="flex items-start gap-3">
      {Icon && <Icon className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />}
      <div className="min-w-0">
        <p className={detailLabel}>{label}</p>
        <p className="mt-0.5 break-words text-[14px] font-semibold">{value}</p>
        {hint && <p className="font-mono text-[11px] text-muted-foreground">{hint}</p>}
      </div>
    </div>
  );
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
          .select(
            `
            *,
            profiles:user_id (name, email),
            plans:plan_id (name, type)
          `,
          )
          .eq('id', orderId)
          .single();

        if (error) throw error;

        setOrder(data as unknown as OrderDetails);
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
    return <LoadingState label="Carregando pagamento..." size="lg" fullScreen />;
  }

  if (!order) {
    return null;
  }

  const status = statusConfig[order.status] ?? { tone: 'neutral' as StatusTone, label: order.status };

  const customerData = (order.payment_data?.customerData ?? null) as Record<string, string> | null;
  const clientName = order.profiles?.name || customerData?.name;
  const clientEmail = order.profiles?.email || customerData?.email;
  const clientPhone = customerData?.phone;

  const safePaymentData =
    order.payment_data && Object.keys(order.payment_data).length > 0
      ? Object.fromEntries(
          Object.entries(order.payment_data)
            .filter(([key]) => !['password', 'cpf', 'webhook_data'].includes(key))
            .map(([key, value]) => {
              if (key === 'customerData' && typeof value === 'object' && value !== null) {
                const { password, cpf, ...safeCustomerData } = value as Record<string, unknown>;
                return [key, safeCustomerData];
              }
              return [key, value];
            }),
        )
      : null;

  return (
    /* Sem container próprio: o AdminLayout já centraliza e dá o padding —
     *  antes esta página somava `min-h-screen py-12 px-4` por cima dele. */
    <div className="space-y-6">
      <Button variant="ghost" onClick={() => navigate('/admin/payments')} className="-ml-2">
        <ArrowLeft className="mr-2 h-4 w-4" aria-hidden="true" />
        Voltar para pagamentos
      </Button>

      <PageHeader
        icon={Receipt}
        eyebrow="Financeiro"
        title="Detalhes do pagamento"
        description={order.id}
        actions={<StatusPill label={status.label} tone={status.tone} />}
      />

      <div className="admin-card-elevated grid gap-5 p-4 sm:grid-cols-2 sm:p-5">
        <Detail icon={DollarSign} label="Valor" value={`R$ ${Number(order.amount).toFixed(2)}`} />
        <Detail
          icon={CreditCard}
          label="Método de pagamento"
          value={order.payment_method || 'Não especificado'}
          hint={order.gateway ? `Gateway: ${order.gateway}` : undefined}
        />
        <Detail
          icon={Calendar}
          label="Criado em"
          value={format(new Date(order.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
        />
        {order.paid_at && (
          <Detail
            icon={Calendar}
            label="Pago em"
            value={format(new Date(order.paid_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
          />
        )}
      </div>

      {(clientName || clientEmail) && (
        <section className="admin-card-elevated p-4 sm:p-5">
          <SectionHeader
            icon={User}
            title="Cliente"
            description={!order.profiles ? 'Dados vindos do checkout — sem conta vinculada.' : undefined}
          />
          <div className="mt-4 grid gap-5 sm:grid-cols-3">
            {clientName && <Detail label="Nome" value={clientName} />}
            {clientEmail && <Detail label="E-mail" value={clientEmail} />}
            {clientPhone && <Detail label="Telefone" value={clientPhone} />}
          </div>
        </section>
      )}

      {order.plans && (
        <section className="admin-card-elevated p-4 sm:p-5">
          <SectionHeader title="Plano adquirido" />
          <div className="mt-4 grid gap-5 sm:grid-cols-2">
            <Detail label="Nome do plano" value={order.plans.name} />
            <Detail label="Tipo" value={order.plans.type} />
          </div>
        </section>
      )}

      {safePaymentData && (
        <section className="admin-card-elevated p-4 sm:p-5">
          <SectionHeader
            title="Dados técnicos"
            description="Campos sensíveis (senha, CPF) são ocultados automaticamente."
          />
          <pre className="mt-4 overflow-x-auto rounded-lg border border-border bg-muted p-4 font-mono text-[11.5px] leading-relaxed">
            {JSON.stringify(safePaymentData, null, 2)}
          </pre>
        </section>
      )}
    </div>
  );
}
