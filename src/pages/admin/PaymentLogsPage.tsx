import { useCallback, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
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
import { RefreshCw, Receipt } from 'lucide-react';
import { format } from 'date-fns';
import {
  EmptyState,
  FilterBar,
  LoadingState,
  PageHeader,
  SectionHeader,
  StatusPill,
} from '@/components/admin/ui';

interface PaymentLog {
  id: string;
  gateway: string;
  status_code: number | null;
  error_message: string | null;
  request_body: unknown;
  response_body: unknown;
  created_at: string;
  order_id: string | null;
}

const headCell = 'font-mono text-[10px] uppercase tracking-[0.09em]';

const statusOf = (log: PaymentLog) => {
  if (log.error_message) return <StatusPill label="Erro" tone="destructive" />;
  if (log.status_code && log.status_code >= 200 && log.status_code < 300) {
    return <StatusPill label="Sucesso" tone="success" />;
  }
  return <StatusPill label="Pendente" tone="warning" />;
};

export const PaymentLogsPage = () => {
  const [logs, setLogs] = useState<PaymentLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [gateway, setGateway] = useState('all');
  const [status, setStatus] = useState('all');
  const [search, setSearch] = useState('');

  const fetchLogs = useCallback(async () => {
    try {
      setLoading(true);
      let query = supabase
        .from('payment_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (gateway !== 'all') {
        query = query.eq('gateway', gateway);
      }

      if (status === 'error') {
        query = query.not('error_message', 'is', null);
      } else if (status === 'success') {
        query = query.is('error_message', null);
      }

      if (search) {
        query = query.or(`error_message.ilike.%${search}%,order_id.ilike.%${search}%`);
      }

      const { data, error } = await query;

      if (error) throw error;
      setLogs((data as PaymentLog[]) || []);
    } catch (error) {
      console.error('Error fetching payment logs:', error);
    } finally {
      setLoading(false);
    }
  }, [gateway, status, search]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  return (
    <div className="space-y-6">
      <PageHeader
        icon={Receipt}
        eyebrow="Financeiro"
        title="Logs de pagamento"
        description="Monitore todas as transações e erros do sistema de pagamento"
        actions={
          <Button onClick={fetchLogs} variant="outline">
            <RefreshCw className="mr-2 h-4 w-4" aria-hidden="true" />
            Atualizar
          </Button>
        }
      />

      <div className="admin-card-elevated">
        <div className="space-y-4 border-b border-border p-4 sm:p-5">
          <SectionHeader
            title="Registros"
            count={logs.length}
            description="Os 100 eventos mais recentes, do mais novo para o mais antigo."
          />
          <FilterBar
            value={search}
            onChange={setSearch}
            placeholder="Buscar por mensagem de erro ou order ID..."
          >
            <Select value={gateway} onValueChange={setGateway}>
              <SelectTrigger className="h-9 min-w-[9.5rem] flex-1 sm:max-w-[11rem]" aria-label="Gateway">
                <SelectValue placeholder="Gateway" />
              </SelectTrigger>
              <SelectContent className="shadow-admin-popover">
                <SelectItem value="all">Todos os gateways</SelectItem>
                <SelectItem value="ABACATEPAY">AbacatePay</SelectItem>
                <SelectItem value="HUBLA">Hubla</SelectItem>
              </SelectContent>
            </Select>

            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger className="h-9 min-w-[9.5rem] flex-1 sm:max-w-[11rem]" aria-label="Status">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent className="shadow-admin-popover">
                <SelectItem value="all">Todos os status</SelectItem>
                <SelectItem value="success">Sucesso</SelectItem>
                <SelectItem value="error">Erro</SelectItem>
              </SelectContent>
            </Select>
          </FilterBar>
        </div>

        {loading ? (
          <div className="p-8">
            <LoadingState label="Carregando logs..." />
          </div>
        ) : logs.length === 0 ? (
          <EmptyState
            icon={Receipt}
            title="Nenhum log encontrado"
            description="Nenhum evento corresponde aos filtros aplicados."
          />
        ) : (
          <div className="overflow-x-auto">
            <Table className="min-w-[900px]">
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className={headCell}>Data / hora</TableHead>
                  <TableHead className={headCell}>Gateway</TableHead>
                  <TableHead className={headCell}>Status</TableHead>
                  <TableHead className={headCell}>Código</TableHead>
                  <TableHead className={headCell}>Mensagem</TableHead>
                  <TableHead className={headCell}>Order ID</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell className="whitespace-nowrap font-mono text-[11.5px] tabular-nums text-muted-foreground">
                      {format(new Date(log.created_at), 'dd/MM/yyyy HH:mm:ss')}
                    </TableCell>
                    <TableCell>
                      <span className="rounded border border-border bg-muted px-1.5 py-0.5 font-mono text-[10.5px] text-muted-foreground">
                        {log.gateway}
                      </span>
                    </TableCell>
                    <TableCell>{statusOf(log)}</TableCell>
                    <TableCell className="font-mono text-[11.5px] tabular-nums text-muted-foreground">
                      {log.status_code ?? '—'}
                    </TableCell>
                    <TableCell className="max-w-[360px]">
                      {log.error_message ? (
                        <span className="block break-words font-mono text-[11.5px] text-destructive">
                          {log.error_message}
                        </span>
                      ) : (
                        <span className="text-[12.5px] text-muted-foreground">
                          Processado com sucesso
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="font-mono text-[11px] text-muted-foreground">
                      {log.order_id ? log.order_id.slice(0, 8) : '—'}
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
