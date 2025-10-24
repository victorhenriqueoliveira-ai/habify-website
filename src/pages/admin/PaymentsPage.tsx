import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Eye, Download, DollarSign, TrendingUp, Users, Clock } from 'lucide-react';
import { usePayments } from '@/hooks/usePayments';
import { PaymentsFilter } from '@/components/admin/PaymentsFilter';

const getStatusColor = (status: string) => {
  switch (status) {
    case 'paid': return 'bg-green-500 text-white';
    case 'pending': return 'bg-yellow-500 text-black';
    case 'failed': return 'bg-red-500 text-white';
    case 'refunded': return 'bg-gray-500 text-white';
    default: return 'bg-gray-300 text-black';
  }
};

const getStatusText = (status: string) => {
  switch (status) {
    case 'paid': return 'Pago';
    case 'pending': return 'Pendente';
    case 'failed': return 'Falhou';
    case 'refunded': return 'Estornado';
    default: return status;
  }
};

export const PaymentsPage = () => {
  const navigate = useNavigate();
  const { orders, loading, error, fetchOrders, getTotalRevenue, getOrdersByStatus } = usePayments();

  const handleFilter = (filters: any) => {
    fetchOrders(filters.dateRange, filters.status);
  };

  const handleExport = () => {
    // Simple CSV export
    const csvContent = orders.map(order => [
      order.id,
      order.createdAt,
      order.amount,
      order.status,
      order.paymentId || order.gateway || '',
    ].join(',')).join('\n');
    
    const blob = new Blob([`ID,Data,Valor,Status,AbacatePay ID\n${csvContent}`], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `pagamentos-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center text-red-500 py-8">
        <p>Erro ao carregar pagamentos: {error}</p>
        <Button onClick={() => fetchOrders()} className="mt-4">Tentar Novamente</Button>
      </div>
    );
  }

  const totalRevenue = getTotalRevenue();
  const paidOrders = getOrdersByStatus('paid');
  const pendingOrders = getOrdersByStatus('pending');
  const failedOrders = getOrdersByStatus('failed');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Pagamentos</h1>
        <p className="text-muted-foreground">
          Gerencie e monitore todos os pagamentos do sistema
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Receita Total</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              R$ {totalRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pagamentos Aprovados</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{paidOrders.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pendentes</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingOrders.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Falharam</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{failedOrders.length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <PaymentsFilter onFilter={handleFilter} onExport={handleExport} />

      {/* Orders Table */}
      <Card>
        <CardHeader>
          <CardTitle>Histórico de Pagamentos</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">ID</th>
                  <th className="text-left p-2">Data</th>
                  <th className="text-left p-2">Valor</th>
                  <th className="text-left p-2">Status</th>
                  <th className="text-left p-2">AbacatePay ID</th>
                  <th className="text-left p-2">Ações</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <tr key={order.id} className="border-b hover:bg-muted/50">
                    <td className="p-2 font-mono text-xs">
                      {order.id.slice(0, 8)}...
                    </td>
                    <td className="p-2">
                      {new Date(order.createdAt).toLocaleDateString('pt-BR')}
                    </td>
                    <td className="p-2 font-semibold">
                      R$ {order.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="p-2">
                      <Badge className={getStatusColor(order.status)}>
                        {getStatusText(order.status)}
                      </Badge>
                    </td>
                    <td className="p-2 font-mono text-xs">
                      {order.paymentId || 'N/A'}
                      {order.gateway && (
                        <span className="ml-2 text-xs text-muted-foreground">
                          ({order.gateway})
                        </span>
                      )}
                    </td>
                    <td className="p-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => navigate(`/admin/payments/${order.id}`)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {orders.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                Nenhum pagamento encontrado
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};