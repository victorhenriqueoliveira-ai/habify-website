import { Button } from '@/components/ui/button';
import { Calendar, Download, RefreshCw } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface DashboardFiltersProps {
  selectedPeriod: string;
  onPeriodChange: (period: string) => void;
  selectedGateway?: string;
  onGatewayChange?: (gateway: string) => void;
  selectedStatus?: string;
  onStatusChange?: (status: string) => void;
  onExport?: () => void;
  onRefresh?: () => void;
  activeFiltersCount?: number;
}

/**
 * Faixa de filtros dos dashboards.
 *
 * Os selects têm largura mínima mas podem encolher (`flex-1 basis-*`), e
 * os botões quebram pra linha de baixo — no celular a faixa vira duas
 * linhas em vez de empurrar a tela pro lado.
 */
export const DashboardFilters = ({
  selectedPeriod,
  onPeriodChange,
  selectedGateway,
  onGatewayChange,
  selectedStatus,
  onStatusChange,
  onExport,
  onRefresh,
  activeFiltersCount = 0,
}: DashboardFiltersProps) => {
  return (
    <div className="admin-card-elevated flex flex-wrap items-center gap-2 p-3">
      <div className="flex min-w-[9.5rem] flex-1 items-center gap-2 sm:max-w-[13rem]">
        <Calendar className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
        <Select value={selectedPeriod} onValueChange={onPeriodChange}>
          <SelectTrigger className="h-9" aria-label="Período">
            <SelectValue placeholder="Período" />
          </SelectTrigger>
          <SelectContent className="shadow-admin-popover">
            <SelectItem value="today">Hoje</SelectItem>
            <SelectItem value="yesterday">Ontem</SelectItem>
            <SelectItem value="7days">Últimos 7 dias</SelectItem>
            <SelectItem value="30days">Últimos 30 dias</SelectItem>
            <SelectItem value="90days">Últimos 90 dias</SelectItem>
            <SelectItem value="12months">Últimos 12 meses</SelectItem>
            <SelectItem value="year">Último ano</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {onGatewayChange && (
        <Select value={selectedGateway} onValueChange={onGatewayChange}>
          <SelectTrigger className="h-9 min-w-[9.5rem] flex-1 sm:max-w-[11rem]" aria-label="Gateway">
            <SelectValue placeholder="Gateway" />
          </SelectTrigger>
          <SelectContent className="shadow-admin-popover">
            <SelectItem value="all">Todos os gateways</SelectItem>
            <SelectItem value="ABACATEPAY">AbacatePay</SelectItem>
            <SelectItem value="HUBLA">Hubla</SelectItem>
          </SelectContent>
        </Select>
      )}

      {onStatusChange && (
        <Select value={selectedStatus} onValueChange={onStatusChange}>
          <SelectTrigger className="h-9 min-w-[9.5rem] flex-1 sm:max-w-[11rem]" aria-label="Status">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent className="shadow-admin-popover">
            <SelectItem value="all">Todos os status</SelectItem>
            <SelectItem value="paid">Pago</SelectItem>
            <SelectItem value="pending">Pendente</SelectItem>
            <SelectItem value="failed">Falha</SelectItem>
            <SelectItem value="cancelled">Cancelado</SelectItem>
          </SelectContent>
        </Select>
      )}

      {activeFiltersCount > 0 && (
        <span className="rounded-full border border-primary/25 bg-primary/10 px-2 py-0.5 font-mono text-[10.5px] font-medium tabular-nums text-primary">
          {activeFiltersCount} filtro{activeFiltersCount > 1 ? 's' : ''}
        </span>
      )}

      <div className="ml-auto flex items-center gap-2">
        {onRefresh && (
          <Button variant="outline" size="sm" className="h-9" onClick={onRefresh}>
            <RefreshCw className="mr-2 h-4 w-4" aria-hidden="true" />
            Atualizar
          </Button>
        )}
        {onExport && (
          <Button variant="outline" size="sm" className="h-9" onClick={onExport}>
            <Download className="mr-2 h-4 w-4" aria-hidden="true" />
            Exportar
          </Button>
        )}
      </div>
    </div>
  );
};
