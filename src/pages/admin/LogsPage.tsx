import { useState } from 'react';
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
import {
  FileText,
  Download,
  AlertCircle,
  Info,
  AlertTriangle,
  CheckCircle,
  RefreshCw,
} from 'lucide-react';
import { useSystemLogs } from '@/hooks/useSystemLogs';
import { useAuditLogger } from '@/hooks/useAuditLogger';
import { toast } from 'sonner';
import {
  EmptyState,
  FilterBar,
  LoadingState,
  PageHeader,
  SectionHeader,
  StatCard,
  StatusPill,
  type StatusTone,
} from '@/components/admin/ui';

type LogLevel = 'info' | 'warning' | 'error' | 'success';

const logLevelConfig: Record<LogLevel, { tone: StatusTone; label: string }> = {
  info: { tone: 'info', label: 'Info' },
  warning: { tone: 'warning', label: 'Warning' },
  error: { tone: 'destructive', label: 'Error' },
  success: { tone: 'success', label: 'Success' },
};

const headCell = 'font-mono text-[10px] uppercase tracking-[0.09em]';

export const LogsPage = () => {
  const { logs, loading, fetchLogs } = useSystemLogs();
  const { logSystemAction } = useAuditLogger();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLevel, setSelectedLevel] = useState<LogLevel | 'all'>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const categories = Array.from(new Set(logs.map((log) => log.category)));

  // Filter logs
  const filteredLogs = logs.filter((log) => {
    const term = searchTerm.toLowerCase();
    const matchesSearch =
      log.message.toLowerCase().includes(term) ||
      log.user?.toLowerCase().includes(term) ||
      log.category.toLowerCase().includes(term) ||
      log.details?.toLowerCase().includes(term);

    const matchesLevel = selectedLevel === 'all' || log.level === selectedLevel;
    const matchesCategory = selectedCategory === 'all' || log.category === selectedCategory;

    return matchesSearch && matchesLevel && matchesCategory;
  });

  const logStats = {
    total: logs.length,
    info: logs.filter((l) => l.level === 'info').length,
    warning: logs.filter((l) => l.level === 'warning').length,
    error: logs.filter((l) => l.level === 'error').length,
    success: logs.filter((l) => l.level === 'success').length,
  };

  const handleExportLogs = async () => {
    try {
      const csvContent = [
        'Timestamp,Level,Category,Message,User,IP,Details',
        ...logs.map(
          (log) =>
            `${log.timestamp},${log.level},${log.category},"${log.message.replace(/"/g, '""')}",${log.user || ''},${log.ip || ''},"${(log.details || '').replace(/"/g, '""')}"`,
        ),
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `habify-logs-${new Date().toISOString().split('T')[0]}.csv`;
      a.click();

      // Log the export action
      await logSystemAction('EXPORT_DATA', { type: 'system_logs', count: logs.length });

      toast.success('Logs exportados', { description: `${logs.length} logs exportados com sucesso.` });
    } catch {
      toast.error('Erro ao exportar', { description: 'Falha ao exportar os logs do sistema.' });
    }
  };

  const handleRefreshLogs = async () => {
    try {
      await fetchLogs();
      await logSystemAction('VIEW_LOGS', { action: 'refresh' });
      toast.success('Logs atualizados', { description: 'Os logs foram atualizados com sucesso.' });
    } catch {
      toast.error('Erro ao atualizar', { description: 'Falha ao atualizar os logs do sistema.' });
    }
  };

  const formatTimestamp = (timestamp: string) => new Date(timestamp).toLocaleString('pt-BR');

  if (loading) {
    return <LoadingState label="Carregando logs..." size="lg" fullScreen />;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        icon={FileText}
        eyebrow="Sistema"
        title="Logs do sistema"
        description="Monitore atividades e eventos do sistema em tempo real"
        actions={
          <>
            <Button onClick={handleRefreshLogs} variant="outline">
              <RefreshCw className="mr-2 h-4 w-4" aria-hidden="true" />
              Atualizar
            </Button>
            <Button onClick={handleExportLogs} variant="outline">
              <Download className="mr-2 h-4 w-4" aria-hidden="true" />
              Exportar
            </Button>
          </>
        }
      />

      <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-5">
        <StatCard label="Total" value={logStats.total} />
        <StatCard label="Info" value={logStats.info} icon={Info} tone="info" />
        <StatCard label="Success" value={logStats.success} icon={CheckCircle} tone="success" />
        <StatCard label="Warning" value={logStats.warning} icon={AlertTriangle} tone="warning" />
        <StatCard label="Error" value={logStats.error} icon={AlertCircle} tone="destructive" />
      </div>

      <div className="admin-card-elevated">
        <div className="space-y-4 border-b border-border p-4 sm:p-5">
          <SectionHeader
            title="Registros"
            count={filteredLogs.length}
            description="Atividade do sistema em tempo real"
          />
          <FilterBar
            value={searchTerm}
            onChange={setSearchTerm}
            placeholder="Buscar por mensagem, usuário ou categoria..."
          >
            <Select
              value={selectedLevel}
              onValueChange={(value: LogLevel | 'all') => setSelectedLevel(value)}
            >
              <SelectTrigger className="h-9 w-[140px]" aria-label="Filtrar por nível">
                <SelectValue placeholder="Nível" />
              </SelectTrigger>
              <SelectContent className="shadow-admin-popover">
                <SelectItem value="all">Todos os níveis</SelectItem>
                <SelectItem value="info">Info</SelectItem>
                <SelectItem value="success">Success</SelectItem>
                <SelectItem value="warning">Warning</SelectItem>
                <SelectItem value="error">Error</SelectItem>
              </SelectContent>
            </Select>
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="h-9 w-[150px]" aria-label="Filtrar por categoria">
                <SelectValue placeholder="Categoria" />
              </SelectTrigger>
              <SelectContent className="shadow-admin-popover">
                <SelectItem value="all">Todas as categorias</SelectItem>
                {categories.map((category) => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FilterBar>
        </div>

        {filteredLogs.length === 0 ? (
          <EmptyState
            icon={FileText}
            title="Nenhum log encontrado"
            description="Não há logs que correspondam aos filtros aplicados."
          />
        ) : (
          <div className="overflow-x-auto">
            <Table className="min-w-[900px]">
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className={headCell}>Timestamp</TableHead>
                  <TableHead className={headCell}>Nível</TableHead>
                  <TableHead className={headCell}>Categoria</TableHead>
                  <TableHead className={headCell}>Mensagem</TableHead>
                  <TableHead className={headCell}>Usuário</TableHead>
                  <TableHead className={headCell}>IP</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLogs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell className="whitespace-nowrap font-mono text-[11.5px] tabular-nums text-muted-foreground">
                      {formatTimestamp(log.timestamp)}
                    </TableCell>
                    <TableCell>
                      <StatusPill
                        label={logLevelConfig[log.level].label}
                        tone={logLevelConfig[log.level].tone}
                      />
                    </TableCell>
                    <TableCell>
                      <span className="rounded border border-border bg-muted px-1.5 py-0.5 font-mono text-[10.5px] text-muted-foreground">
                        {log.category}
                      </span>
                    </TableCell>
                    <TableCell className="max-w-[340px]">
                      <p className="text-[13.5px] font-medium">{log.message}</p>
                      {log.details && (
                        <p className="mt-0.5 line-clamp-2 text-[12.5px] text-muted-foreground">
                          {log.details}
                        </p>
                      )}
                    </TableCell>
                    <TableCell className="font-mono text-[11.5px] text-muted-foreground">
                      {log.user || '—'}
                    </TableCell>
                    <TableCell className="font-mono text-[11.5px] tabular-nums text-muted-foreground">
                      {log.ip || '—'}
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
