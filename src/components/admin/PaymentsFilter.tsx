import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Filter, Download } from 'lucide-react';

export interface PaymentsFilterValues {
  dateRange?: { start: string; end: string };
  status?: string;
}

interface PaymentsFilterProps {
  onFilter: (filters: PaymentsFilterValues) => void;
  onExport?: () => void;
}

const fieldLabel = 'font-mono text-[10px] uppercase tracking-[0.09em] text-muted-foreground';

export const PaymentsFilter = ({ onFilter, onExport }: PaymentsFilterProps) => {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [status, setStatus] = useState('all');

  const handleFilter = () => {
    const filters: PaymentsFilterValues = {};

    if (startDate && endDate) {
      filters.dateRange = { start: startDate, end: endDate };
    }

    if (status !== 'all') {
      filters.status = status;
    }

    onFilter(filters);
  };

  const clearFilters = () => {
    setStartDate('');
    setEndDate('');
    setStatus('all');
    onFilter({});
  };

  return (
    <div className="admin-card-elevated flex flex-wrap items-end gap-3 p-4">
      <div className="min-w-[9rem] flex-1 space-y-1.5">
        <Label htmlFor="start-date" className={fieldLabel}>
          Data início
        </Label>
        <Input
          id="start-date"
          type="date"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
          className="h-9"
        />
      </div>

      <div className="min-w-[9rem] flex-1 space-y-1.5">
        <Label htmlFor="end-date" className={fieldLabel}>
          Data fim
        </Label>
        <Input
          id="end-date"
          type="date"
          value={endDate}
          onChange={(e) => setEndDate(e.target.value)}
          className="h-9"
        />
      </div>

      <div className="min-w-[9rem] flex-1 space-y-1.5">
        <Label htmlFor="status-filter" className={fieldLabel}>
          Status
        </Label>
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger id="status-filter" className="h-9">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="shadow-admin-popover">
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="paid">Pagos</SelectItem>
            <SelectItem value="pending">Pendentes</SelectItem>
            <SelectItem value="failed">Falharam</SelectItem>
            <SelectItem value="refunded">Estornados</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button onClick={handleFilter} className="h-9">
          <Filter className="mr-2 h-4 w-4" aria-hidden="true" />
          Filtrar
        </Button>

        <Button variant="outline" onClick={clearFilters} className="h-9">
          Limpar
        </Button>

        {onExport && (
          <Button variant="outline" onClick={onExport} className="h-9">
            <Download className="mr-2 h-4 w-4" aria-hidden="true" />
            Exportar
          </Button>
        )}
      </div>
    </div>
  );
};
