import { useNavigate } from 'react-router-dom';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Eye, CreditCard, TrendingUp, Clock, XCircle, Receipt } from 'lucide-react';
import { usePayments } from '@/hooks/usePayments';
import { PaymentsFilter, type PaymentsFilterValues } from '@/components/admin/PaymentsFilter';
import { PaymentsTableSkeleton } from '@/components/ui/skeleton-loaders';
import { ErrorMessages } from '@/lib/errorMessages';
import {
  AdminNotice,
  EmptyState,
  PageHeader,
  SectionHeader,
  StatCard,
  StatCardGrid,
  StatusPill,
  type StatusTone,
} from '@/components/admin/ui';

const statusTones: Record<string, StatusTone> = {
  paid: 'success',
  pending: 'warning',
  failed: 'destructive',
  refunded: 'neutral',
};

const statusLabels: Record<string, string> = {
  paid: 'Pago',
  pending: 'Pendente',
  failed: 'Falhou',
  refunded: 'Estornado',
};

const headCell = 'font-mono text-[10px] uppercase tracking-[0.09em]';

export const PaymentsPage = () => {
  const navigate = useNavigate();
  const { orders, loading, error, fetchOrders, getTotalRevenue, getOrdersByStatus } = usePayments();

  const handleFilter = (filters: PaymentsFilterValues) => {
    fetchOrders(filters.dateRange, filters.status);
  };

  const handleExport = () => {
    // Simple CSV export
    const csvContent = orders
      .map((order) =>
        [order.id, order.createdAt, order.amount, order.status, order.paymentId || order.gateway || ''].join(','),
      )
      .join('\n');

    const blob = new Blob([`ID,Data,Valor,Status,AbacatePay ID\n${csvContent}`], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `pagamentos-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  if (loading) {
    return <PaymentsTableSkeleton />;
  }

  if (error) {
    return (
      <AdminNotice
        tone="destructive"
        title={ErrorMessages.NETWORK_ERROR}
        description={error}
        action={
          <Button size="sm" onClick={() => fetchOrders()}>
            Tentar novamente
          </Button>
        }
      />
    );
  }

  const totalRevenue = getTotalRevenue();
  const paidOrders = getOrdersByStatus('paid');
  const pendingOrders = getOrdersByStatus('pending');
  const failedOrders = getOrdersByStatus('failed');

  return (
    <div className="space-y-6">
      <PageHeader
        icon={Receipt}
        eyebrow="Financeiro"
        title="Pagamentos"
        description="Gerencie e monitore todos os pagamentos do sistema"
      />

      <StatCardGrid>
        <StatCard
          label="Receita total"
          value={`R$ ${totalRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
          icon={CreditCard}
        />
        <StatCard label="Aprovados" value={paidOrders.length} icon={TrendingUp} tone="success" />
        <StatCard label="Pendentes" value={pendingOrders.length} icon={Clock} tone="warning" />
        <StatCard label="Falharam" value={failedOrders.length} icon={XCircle} tone="destructive" />
      </StatCardGrid>

      <PaymentsFilter onFilter={handleFilter} onExport={handleExport} />

      <div className="admin-card-elevated">
        <div className="border-b border-border p-4 sm:p-5">
          <SectionHeader title="Histórico de pagamentos" count={orders.length} />
        </div>

        {orders.length === 0 ? (
          <EmptyState
            icon={Receipt}
            title="Nenhum pagamento encontrado"
            description="Ajuste o período ou o status no filtro acima para ver outros pedidos."
          />
        ) : (
          <div className="overflow-x-auto">
            <Table className="min-w-[840px]">
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className={headCell}>ID</TableHead>
                  <TableHead className={headCell}>Cliente</TableHead>
                  <TableHead className={headCell}>Data</TableHead>
                  <TableHead className={`${headCell} text-right`}>Valor</TableHead>
                  <TableHead className={headCell}>Status</TableHead>
                  <TableHead className={headCell}>Gateway / ID</TableHead>
                  <TableHead className="w-12" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell className="font-mono text-[11.5px] text-muted-foreground">
                      {order.id.slice(0, 8)}
                    </TableCell>
                    <TableCell className="max-w-[220px]">
                      <div className="truncate text-[13.5px] font-semibold">{order.customerName}</div>
                      <div className="truncate font-mono text-[11px] text-muted-foreground">
                        {order.customerEmail}
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-[11.5px] tabular-nums text-muted-foreground">
                      {new Date(order.createdAt).toLocaleDateString('pt-BR')}
                    </TableCell>
                    <TableCell className="text-right text-[13.5px] font-semibold tabular-nums">
                      R$ {order.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </TableCell>
                    <TableCell>
                      <StatusPill
                        label={statusLabels[order.status] ?? order.status}
                        tone={statusTones[order.status] ?? 'neutral'}
                      />
                    </TableCell>
                    <TableCell>
                      <div className="font-mono text-[11.5px] text-muted-foreground">
                        {order.paymentId || '—'}
                      </div>
                      {order.gateway && (
                        <div className="font-mono text-[10px] uppercase tracking-[0.08em] text-muted-foreground">
                          {order.gateway}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0"
                        aria-label={`Ver detalhes do pagamento ${order.id.slice(0, 8)}`}
                        onClick={() => navigate(`/admin/payments/${order.id}`)}
                      >
                        <Eye className="h-4 w-4" aria-hidden="true" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </div>
  );
};
