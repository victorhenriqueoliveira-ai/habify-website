import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { 
  CreditCard, 
  Search, 
  Download, 
  DollarSign, 
  TrendingUp,
  Calendar,
  User,
  Eye,
  CheckCircle,
  XCircle,
  Clock,
  RefreshCw,
} from 'lucide-react';
import { usePayments } from '@/hooks/usePayments';
import { usePlans } from '@/hooks/usePlans';
import { useUsers } from '@/hooks/useUsers';
import { toast } from '@/hooks/use-toast';

type TransactionStatus = 'pending' | 'completed' | 'failed' | 'cancelled';

const statusConfig = {
  pending: {
    color: 'secondary',
    icon: Clock,
    label: 'Pendente'
  },
  completed: {
    color: 'default',
    icon: CheckCircle,
    label: 'Concluído'
  },
  failed: {
    color: 'destructive',
    icon: XCircle,
    label: 'Falhou'
  },
  cancelled: {
    color: 'outline',
    icon: XCircle,
    label: 'Cancelado'
  }
} as const;

export const PaymentsPage = () => {
  const { transactions, loading, fetchTransactions } = usePayments();
  const { plans } = usePlans();
  const { users } = useUsers();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<TransactionStatus | 'all'>('all');
  const [selectedTransaction, setSelectedTransaction] = useState<any>(null);
  const [selectedPeriod, setSelectedPeriod] = useState('month');

  // Filter transactions
  const filteredTransactions = transactions.filter((transaction) => {
    const user = users.find(u => u.userId === transaction.userId);
    const plan = plans.find(p => p.id === transaction.planId);
    
    const matchesSearch = 
      transaction.abacatePayId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      plan?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transaction.paymentMethod?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = selectedStatus === 'all' || transaction.status === selectedStatus;
    
    return matchesSearch && matchesStatus;
  });

  // Calculate statistics
  const stats = {
    total: transactions.length,
    completed: transactions.filter(t => t.status === 'paid').length,
    pending: transactions.filter(t => t.status === 'pending').length,
    failed: transactions.filter(t => t.status === 'failed').length,
    totalRevenue: transactions
      .filter(t => t.status === 'paid')
      .reduce((sum, t) => sum + t.amount, 0),
    avgTicket: transactions.length > 0 
      ? transactions.reduce((sum, t) => sum + t.amount, 0) / transactions.length 
      : 0
  };

  const getUserName = (userId: string) => {
    const user = users.find(u => u.userId === userId);
    return user?.name || 'Usuário não encontrado';
  };

  const getUserEmail = (userId: string) => {
    const user = users.find(u => u.userId === userId);
    return user?.email || 'Email não encontrado';
  };

  const getPlanName = (planId: string) => {
    const plan = plans.find(p => p.id === planId);
    return plan?.name || 'Plano não encontrado';
  };

  const handleExportPayments = () => {
    const csvContent = [
      'Data,ID Transação,Cliente,Email,Plano,Valor,Status,Método,ID AbacatePay',
      ...filteredTransactions.map(transaction => {
        const user = users.find(u => u.userId === transaction.userId);
        const plan = plans.find(p => p.id === transaction.planId);
        return [
          new Date(transaction.createdAt).toLocaleDateString('pt-BR'),
          transaction.id,
          user?.name || '',
          user?.email || '',
          plan?.name || '',
          `R$ ${transaction.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
          statusConfig[transaction.status as TransactionStatus]?.label || transaction.status,
          transaction.paymentMethod || '',
          transaction.abacatePayId || ''
        ].join(',');
      })
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `pagamentos-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    
    toast({
      title: "Relatório exportado",
      description: `${filteredTransactions.length} pagamentos exportados com sucesso.`,
    });
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Pagamentos</h1>
          <p className="text-muted-foreground">
            Acompanhe todas as transações e pagamentos do sistema
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button onClick={fetchTransactions} variant="outline">
            <RefreshCw className="mr-2 h-4 w-4" />
            Atualizar
          </Button>
          <Button onClick={handleExportPayments} variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Exportar
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center text-sm font-medium">
              <DollarSign className="mr-2 h-4 w-4" />
              Receita Total
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(stats.totalRevenue)}
            </div>
            <p className="text-xs text-muted-foreground">
              {stats.completed} pagamentos concluídos
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center text-sm font-medium">
              <TrendingUp className="mr-2 h-4 w-4" />
              Ticket Médio
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(stats.avgTicket)}
            </div>
            <p className="text-xs text-muted-foreground">
              Valor médio por transação
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center text-sm font-medium">
              <CheckCircle className="mr-2 h-4 w-4" />
              Taxa de Sucesso
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0}%
            </div>
            <p className="text-xs text-muted-foreground">
              {stats.completed}/{stats.total} transações
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center text-sm font-medium">
              <Clock className="mr-2 h-4 w-4" />
              Pendentes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {stats.pending}
            </div>
            <p className="text-xs text-muted-foreground">
              Aguardando confirmação
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Buscar por cliente, plano, ID..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={selectedStatus} onValueChange={(value: TransactionStatus | 'all') => setSelectedStatus(value)}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="completed">Concluído</SelectItem>
                <SelectItem value="pending">Pendente</SelectItem>
                <SelectItem value="failed">Falhou</SelectItem>
                <SelectItem value="cancelled">Cancelado</SelectItem>
              </SelectContent>
            </Select>
            <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Período" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="week">7 dias</SelectItem>
                <SelectItem value="month">30 dias</SelectItem>
                <SelectItem value="quarter">90 dias</SelectItem>
                <SelectItem value="year">1 ano</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Payments Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <CreditCard className="mr-2 h-5 w-5" />
            Transações ({filteredTransactions.length})
          </CardTitle>
          <CardDescription>
            Histórico completo de pagamentos e transações
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Plano</TableHead>
                <TableHead>Valor</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Método</TableHead>
                <TableHead className="w-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTransactions.map((transaction) => {
                const config = statusConfig[transaction.status as TransactionStatus];
                const Icon = config?.icon || Clock;
                
                return (
                  <TableRow key={transaction.id} className="cursor-pointer hover:bg-muted/50">
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-medium">
                          {formatDate(transaction.createdAt)}
                        </span>
                        {transaction.paidAt && (
                          <span className="text-xs text-muted-foreground">
                            Pago: {formatDate(transaction.paidAt)}
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-medium">
                          {getUserName(transaction.userId)}
                        </span>
                        <span className="text-sm text-muted-foreground">
                          {getUserEmail(transaction.userId)}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">
                        {getPlanName(transaction.planId)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="font-bold text-green-600">
                        {formatCurrency(transaction.amount)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={config?.color as any} className="flex items-center w-fit">
                        <Icon className="mr-1 h-3 w-3" />
                        {config?.label || transaction.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="capitalize">
                          {transaction.paymentMethod || 'N/A'}
                        </span>
                        {transaction.abacatePayId && (
                          <span className="text-xs text-muted-foreground font-mono">
                            {transaction.abacatePayId}
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedTransaction(transaction)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
          
          {filteredTransactions.length === 0 && (
            <div className="text-center py-8">
              <CreditCard className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-2 text-sm font-semibold">Nenhuma transação encontrada</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Não há transações que correspondam aos filtros aplicados.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Transaction Details Modal */}
      <Dialog open={!!selectedTransaction} onOpenChange={() => setSelectedTransaction(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Detalhes da Transação</DialogTitle>
            <DialogDescription>
              Informações completas sobre o pagamento
            </DialogDescription>
          </DialogHeader>
          
          {selectedTransaction && (
            <div className="space-y-6">
              {/* Transaction Info */}
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-3">
                  <div>
                    <h4 className="font-semibold mb-2">Informações da Transação</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">ID:</span>
                        <span className="font-mono">{selectedTransaction.id}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">AbacatePay ID:</span>
                        <span className="font-mono">{selectedTransaction.abacatePayId || 'N/A'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Status:</span>
                        <Badge variant={statusConfig[selectedTransaction.status as TransactionStatus]?.color as any}>
                          {statusConfig[selectedTransaction.status as TransactionStatus]?.label || selectedTransaction.status}
                        </Badge>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Valor:</span>
                        <span className="font-bold text-green-600">
                          {formatCurrency(selectedTransaction.amount)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Método:</span>
                        <span className="capitalize">{selectedTransaction.paymentMethod || 'N/A'}</span>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <div>
                    <h4 className="font-semibold mb-2">Cliente & Plano</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Nome:</span>
                        <span>{getUserName(selectedTransaction.userId)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Email:</span>
                        <span>{getUserEmail(selectedTransaction.userId)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Plano:</span>
                        <span>{getPlanName(selectedTransaction.planId)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Dates */}
              <div>
                <h4 className="font-semibold mb-2">Datas</h4>
                <div className="grid gap-2 md:grid-cols-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Criada em:</span>
                    <span>{formatDate(selectedTransaction.createdAt)}</span>
                  </div>
                  {selectedTransaction.paidAt && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Paga em:</span>
                      <span>{formatDate(selectedTransaction.paidAt)}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Atualizada em:</span>
                    <span>{formatDate(selectedTransaction.updatedAt)}</span>
                  </div>
                </div>
              </div>

              {/* Payment Data */}
              {selectedTransaction.paymentData && Object.keys(selectedTransaction.paymentData).length > 0 && (
                <div>
                  <h4 className="font-semibold mb-2">Dados do Pagamento</h4>
                  <div className="bg-muted p-3 rounded-md">
                    <pre className="text-xs overflow-auto">
                      {JSON.stringify(selectedTransaction.paymentData, null, 2)}
                    </pre>
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};