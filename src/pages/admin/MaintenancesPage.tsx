import { useState } from 'react';
import { useMaintenances, type Maintenance } from '@/hooks/useMaintenances';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Wrench, Clock, CheckCircle, XCircle, Filter, DollarSign } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
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

type MaintenanceStatus = Maintenance['status'];

const statusConfig: Record<MaintenanceStatus, { tone: StatusTone; label: string }> = {
  pending: { tone: 'warning', label: 'Pendente' },
  in_progress: { tone: 'info', label: 'Em andamento' },
  completed: { tone: 'success', label: 'Concluída' },
  cancelled: { tone: 'destructive', label: 'Cancelada' },
};

const headCell = 'font-mono text-[10px] uppercase tracking-[0.09em]';
const fieldLabel = 'font-mono text-[10px] uppercase tracking-[0.09em] text-muted-foreground';

const MaintenancesPage = () => {
  const { maintenances, loading, updateMaintenanceStatus } = useMaintenances();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedMaintenance, setSelectedMaintenance] = useState<Maintenance | null>(null);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editStatus, setEditStatus] = useState<MaintenanceStatus>('pending');
  const [adminNotes, setAdminNotes] = useState('');

  const handleEditMaintenance = (maintenance: Maintenance) => {
    setSelectedMaintenance(maintenance);
    setEditStatus(maintenance.status);
    setAdminNotes(maintenance.admin_notes || '');
    setShowEditDialog(true);
  };

  const handleSaveStatus = async () => {
    if (!selectedMaintenance) return;

    const success = await updateMaintenanceStatus(selectedMaintenance.id, editStatus, adminNotes);

    if (success) {
      setShowEditDialog(false);
      setSelectedMaintenance(null);
    }
  };

  const filteredMaintenances = maintenances.filter((maintenance) => {
    const term = searchTerm.toLowerCase();
    const matchesSearch =
      maintenance.project?.title.toLowerCase().includes(term) ||
      maintenance.profile?.name.toLowerCase().includes(term) ||
      maintenance.profile?.email.toLowerCase().includes(term);

    const matchesStatus = statusFilter === 'all' || maintenance.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const stats = {
    total: maintenances.length,
    pending: maintenances.filter((m) => m.status === 'pending').length,
    in_progress: maintenances.filter((m) => m.status === 'in_progress').length,
    completed: maintenances.filter((m) => m.status === 'completed').length,
    revenue: maintenances
      .filter((m) => m.status === 'completed')
      .reduce((sum, m) => sum + Number(m.amount), 0),
  };

  if (loading) {
    return <LoadingState label="Carregando manutenções..." size="lg" fullScreen />;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        icon={Wrench}
        eyebrow="Manutenções"
        title="Manutenções"
        description="Gerencie todas as manutenções contratadas pelos clientes"
      />

      <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-5">
        <StatCard label="Total" value={stats.total} />
        <StatCard label="Pendentes" value={stats.pending} icon={Clock} tone="warning" />
        <StatCard label="Em andamento" value={stats.in_progress} icon={Wrench} tone="info" />
        <StatCard label="Concluídas" value={stats.completed} icon={CheckCircle} tone="success" />
        <StatCard
          label="Receita"
          value={`R$ ${stats.revenue.toFixed(2)}`}
          icon={DollarSign}
          description="de manutenções concluídas"
        />
      </div>

      <div className="admin-card-elevated">
        <div className="space-y-4 border-b border-border p-4 sm:p-5">
          <SectionHeader title="Contratações" count={filteredMaintenances.length} />
          <FilterBar
            value={searchTerm}
            onChange={setSearchTerm}
            placeholder="Buscar por projeto, cliente ou e-mail..."
          >
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="h-9 min-w-[10rem] flex-1 sm:max-w-[12rem]" aria-label="Filtrar por status">
                <Filter className="mr-2 h-4 w-4 shrink-0" aria-hidden="true" />
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent className="shadow-admin-popover">
                <SelectItem value="all">Todos os status</SelectItem>
                <SelectItem value="pending">Pendentes</SelectItem>
                <SelectItem value="in_progress">Em andamento</SelectItem>
                <SelectItem value="completed">Concluídas</SelectItem>
                <SelectItem value="cancelled">Canceladas</SelectItem>
              </SelectContent>
            </Select>
          </FilterBar>
        </div>

        {filteredMaintenances.length === 0 ? (
          <EmptyState
            icon={Wrench}
            title="Nenhuma manutenção encontrada"
            description="Nenhuma contratação corresponde à busca ou ao status filtrado."
          />
        ) : (
          /* Sem este contêiner a tabela empurrava a página inteira no celular. */
          <div className="overflow-x-auto">
            <Table className="min-w-[860px]">
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className={headCell}>Cliente</TableHead>
                  <TableHead className={headCell}>Projeto</TableHead>
                  <TableHead className={`${headCell} text-right`}>Valor</TableHead>
                  <TableHead className={headCell}>Status</TableHead>
                  <TableHead className={headCell}>Contratação</TableHead>
                  <TableHead className={headCell}>Expira em</TableHead>
                  <TableHead className="w-24" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredMaintenances.map((maintenance) => {
                  const config = statusConfig[maintenance.status] ?? statusConfig.pending;
                  return (
                    <TableRow key={maintenance.id}>
                      <TableCell className="max-w-[220px]">
                        <div className="truncate text-[13.5px] font-semibold">
                          {maintenance.profile?.name}
                        </div>
                        <div className="truncate font-mono text-[11px] text-muted-foreground">
                          {maintenance.profile?.email}
                        </div>
                      </TableCell>
                      <TableCell className="text-[13px]">{maintenance.project?.title}</TableCell>
                      <TableCell className="text-right text-[13.5px] font-semibold tabular-nums">
                        R$ {Number(maintenance.amount).toFixed(2)}
                      </TableCell>
                      <TableCell>
                        <StatusPill label={config.label} tone={config.tone} />
                      </TableCell>
                      <TableCell className="font-mono text-[11.5px] tabular-nums text-muted-foreground">
                        {format(new Date(maintenance.contracted_at), 'dd/MM/yyyy', { locale: ptBR })}
                      </TableCell>
                      <TableCell className="font-mono text-[11.5px] tabular-nums text-muted-foreground">
                        {format(new Date(maintenance.expires_at), 'dd/MM/yyyy', { locale: ptBR })}
                      </TableCell>
                      <TableCell>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEditMaintenance(maintenance)}
                        >
                          Editar
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-display text-[19px] font-bold tracking-[-0.025em]">
              Editar manutenção
            </DialogTitle>
            <DialogDescription>
              {selectedMaintenance?.project?.title
                ? `${selectedMaintenance.project.title} — atualize o status e registre o que foi feito.`
                : 'Atualize o status e registre o que foi feito.'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="maintenance-status" className={fieldLabel}>
                Status
              </Label>
              <Select
                value={editStatus}
                onValueChange={(value: MaintenanceStatus) => setEditStatus(value)}
              >
                <SelectTrigger id="maintenance-status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="shadow-admin-popover">
                  <SelectItem value="pending">Pendente</SelectItem>
                  <SelectItem value="in_progress">Em andamento</SelectItem>
                  <SelectItem value="completed">Concluída</SelectItem>
                  <SelectItem value="cancelled">Cancelada</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="maintenance-notes" className={fieldLabel}>
                Observações do admin
              </Label>
              <Textarea
                id="maintenance-notes"
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                placeholder="O que foi feito, o que ficou pendente, o que o cliente precisa saber..."
                rows={4}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSaveStatus}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default MaintenancesPage;
