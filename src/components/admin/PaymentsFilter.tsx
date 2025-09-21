import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar, Filter, Download } from 'lucide-react';

interface PaymentsFilterProps {
  onFilter: (filters: { dateRange?: { start: string; end: string }; status?: string }) => void;
  onExport?: () => void;
}

export const PaymentsFilter = ({ onFilter, onExport }: PaymentsFilterProps) => {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [status, setStatus] = useState('all');

  const handleFilter = () => {
    const filters: any = {};
    
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
    <Card className="mb-6">
      <CardContent className="pt-6">
        <div className="flex flex-col md:flex-row gap-4 items-end">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-1">
            <div>
              <Label htmlFor="start-date">Data Início</Label>
              <Input
                id="start-date"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            
            <div>
              <Label htmlFor="end-date">Data Fim</Label>
              <Input
                id="end-date"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
          </div>

          <div className="min-w-[150px]">
            <Label htmlFor="status-filter">Status</Label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="paid">Pagos</SelectItem>
                <SelectItem value="pending">Pendentes</SelectItem>
                <SelectItem value="failed">Falharam</SelectItem>
                <SelectItem value="refunded">Estornados</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex gap-2">
            <Button onClick={handleFilter} className="flex items-center gap-2">
              <Filter className="h-4 w-4" />
              Filtrar
            </Button>
            
            <Button variant="outline" onClick={clearFilters}>
              Limpar
            </Button>

            {onExport && (
              <Button variant="outline" onClick={onExport} className="flex items-center gap-2">
                <Download className="h-4 w-4" />
                Exportar
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};