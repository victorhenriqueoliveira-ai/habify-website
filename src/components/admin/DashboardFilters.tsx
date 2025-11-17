import { Button } from '@/components/ui/button';
import { Calendar, Filter, Download, RefreshCw } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';

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
    <div className="flex flex-wrap items-center gap-3">
      {/* Period Filter */}
      <div className="flex items-center gap-2">
        <Calendar className="h-4 w-4 text-muted-foreground" />
        <Select value={selectedPeriod} onValueChange={onPeriodChange}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Período" />
          </SelectTrigger>
          <SelectContent>
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

      {/* Gateway Filter */}
      {onGatewayChange && (
        <Select value={selectedGateway} onValueChange={onGatewayChange}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Gateway" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos Gateways</SelectItem>
            <SelectItem value="ABACATEPAY">AbacatePay</SelectItem>
            <SelectItem value="HUBLA">Hubla</SelectItem>
          </SelectContent>
        </Select>
      )}

      {/* Status Filter */}
      {onStatusChange && (
        <Select value={selectedStatus} onValueChange={onStatusChange}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos Status</SelectItem>
            <SelectItem value="paid">Pago</SelectItem>
            <SelectItem value="pending">Pendente</SelectItem>
            <SelectItem value="failed">Falha</SelectItem>
            <SelectItem value="cancelled">Cancelado</SelectItem>
          </SelectContent>
        </Select>
      )}

      {/* Active Filters Badge */}
      {activeFiltersCount > 0 && (
        <Badge variant="secondary" className="gap-1">
          <Filter className="h-3 w-3" />
          {activeFiltersCount} filtro{activeFiltersCount > 1 ? 's' : ''}
        </Badge>
      )}

      <div className="flex-1" />

      {/* Action Buttons */}
      <div className="flex items-center gap-2">
        {onRefresh && (
          <Button variant="outline" size="sm" onClick={onRefresh}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Atualizar
          </Button>
        )}
        {onExport && (
          <Button variant="outline" size="sm" onClick={onExport}>
            <Download className="h-4 w-4 mr-2" />
            Exportar
          </Button>
        )}
      </div>
    </div>
  );
};
