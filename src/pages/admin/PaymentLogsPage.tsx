import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
import { supabase } from '@/integrations/supabase/client';
import { AlertCircle, CheckCircle, Search, RefreshCw } from 'lucide-react';
import { format } from 'date-fns';

interface PaymentLog {
  id: string;
  gateway: string;
  status_code: number | null;
  error_message: string | null;
  request_body: any;
  response_body: any;
  created_at: string;
  order_id: string | null;
}

export const PaymentLogsPage = () => {
  const [logs, setLogs] = useState<PaymentLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState({
    gateway: 'all',
    status: 'all',
    search: '',
  });

  const fetchLogs = async () => {
    try {
      setLoading(true);
      let query = supabase
        .from('payment_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (filter.gateway !== 'all') {
        query = query.eq('gateway', filter.gateway);
      }

      if (filter.status === 'error') {
        query = query.not('error_message', 'is', null);
      } else if (filter.status === 'success') {
        query = query.is('error_message', null);
      }

      if (filter.search) {
        query = query.or(`error_message.ilike.%${filter.search}%,order_id.ilike.%${filter.search}%`);
      }

      const { data, error } = await query;

      if (error) throw error;
      setLogs(data || []);
    } catch (error) {
      console.error('Error fetching payment logs:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [filter]);

  const getStatusBadge = (log: PaymentLog) => {
    if (log.error_message) {
      return <Badge variant="destructive" className="gap-1"><AlertCircle className="h-3 w-3" />Erro</Badge>;
    }
    if (log.status_code && log.status_code >= 200 && log.status_code < 300) {
      return <Badge variant="default" className="gap-1 bg-green-500"><CheckCircle className="h-3 w-3" />Sucesso</Badge>;
    }
    return <Badge variant="secondary">Pendente</Badge>;
  };

  const getGatewayBadge = (gateway: string) => {
    const colors: Record<string, string> = {
      'ABACATEPAY': 'bg-purple-500',
      'HUBLA': 'bg-blue-500',
      'UNKNOWN': 'bg-gray-500',
    };
    return <Badge className={colors[gateway] || 'bg-gray-500'}>{gateway}</Badge>;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Logs de Pagamento</h1>
        <p className="text-muted-foreground">
          Monitore todas as transações e erros do sistema de pagamento
        </p>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
          <CardDescription>Filtre os logs por gateway, status ou pesquise por termo</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <Select value={filter.gateway} onValueChange={(value) => setFilter(prev => ({ ...prev, gateway: value }))}>
              <SelectTrigger>
                <SelectValue placeholder="Gateway" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Gateways</SelectItem>
                <SelectItem value="ABACATEPAY">AbacatePay</SelectItem>
                <SelectItem value="HUBLA">Hubla</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filter.status} onValueChange={(value) => setFilter(prev => ({ ...prev, status: value }))}>
              <SelectTrigger>
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Status</SelectItem>
                <SelectItem value="success">Sucesso</SelectItem>
                <SelectItem value="error">Erro</SelectItem>
              </SelectContent>
            </Select>

            <div className="relative col-span-2">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Pesquisar por mensagem ou ID..."
                value={filter.search}
                onChange={(e) => setFilter(prev => ({ ...prev, search: e.target.value }))}
                className="pl-9"
              />
            </div>
          </div>

          <div className="mt-4 flex justify-end">
            <Button onClick={fetchLogs} variant="outline" size="sm" className="gap-2">
              <RefreshCw className="h-4 w-4" />
              Atualizar
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Logs Table */}
      <Card>
        <CardHeader>
          <CardTitle>Registros ({logs.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center p-8">
              <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary"></div>
            </div>
          ) : logs.length === 0 ? (
            <div className="text-center p-8 text-muted-foreground">
              Nenhum log encontrado
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data/Hora</TableHead>
                    <TableHead>Gateway</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Código</TableHead>
                    <TableHead>Mensagem</TableHead>
                    <TableHead>Order ID</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {logs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell className="whitespace-nowrap">
                        {format(new Date(log.created_at), 'dd/MM/yyyy HH:mm:ss')}
                      </TableCell>
                      <TableCell>
                        {getGatewayBadge(log.gateway)}
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(log)}
                      </TableCell>
                      <TableCell>
                        {log.status_code || '-'}
                      </TableCell>
                      <TableCell className="max-w-md">
                        {log.error_message ? (
                          <span className="text-destructive text-sm font-mono">
                            {log.error_message}
                          </span>
                        ) : (
                          <span className="text-sm text-muted-foreground">
                            Processado com sucesso
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="font-mono text-xs">
                        {log.order_id ? log.order_id.slice(0, 8) + '...' : '-'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
