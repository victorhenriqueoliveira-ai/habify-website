import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useMaintenances } from '@/hooks/useMaintenances';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
import { Wrench, Clock, CheckCircle, XCircle, Search, Filter } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const MaintenancesPage = () => {
  const { user } = useAuth();
  const { maintenances, loading, updateMaintenanceStatus, deleteMaintenance } = useMaintenances();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedMaintenance, setSelectedMaintenance] = useState<any>(null);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editStatus, setEditStatus] = useState<string>('');
  const [adminNotes, setAdminNotes] = useState('');

  const getStatusBadge = (status: string) => {
    const variants: Record<string, any> = {
      pending: { variant: 'secondary', icon: Clock, label: 'Pendente' },
      in_progress: { variant: 'default', icon: Wrench, label: 'Em Andamento' },
      completed: { variant: 'default', icon: CheckCircle, label: 'Concluída' },
      cancelled: { variant: 'destructive', icon: XCircle, label: 'Cancelada' },
    };

    const config = variants[status] || variants.pending;
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className="gap-1">
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    );
  };

  const handleEditMaintenance = (maintenance: any) => {
    setSelectedMaintenance(maintenance);
    setEditStatus(maintenance.status);
    setAdminNotes(maintenance.admin_notes || '');
    setShowEditDialog(true);
  };

  const handleSaveStatus = async () => {
    if (!selectedMaintenance) return;

    const success = await updateMaintenanceStatus(
      selectedMaintenance.id,
      editStatus as any,
      adminNotes
    );

    if (success) {
      setShowEditDialog(false);
      setSelectedMaintenance(null);
    }
  };

  const filteredMaintenances = maintenances.filter(maintenance => {
    const matchesSearch = 
      maintenance.project?.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      maintenance.profile?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      maintenance.profile?.email.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'all' || maintenance.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const stats = {
    total: maintenances.length,
    pending: maintenances.filter(m => m.status === 'pending').length,
    in_progress: maintenances.filter(m => m.status === 'in_progress').length,
    completed: maintenances.filter(m => m.status === 'completed').length,
    revenue: maintenances
      .filter(m => m.status === 'completed')
      .reduce((sum, m) => sum + Number(m.amount), 0),
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground">Carregando manutenções...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Manutenções</h1>
          <p className="text-muted-foreground">
            Gerencie todas as manutenções contratadas pelos clientes
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <Card className="p-4">
            <div className="text-sm text-muted-foreground">Total</div>
            <div className="text-2xl font-bold">{stats.total}</div>
          </Card>
          <Card className="p-4">
            <div className="text-sm text-muted-foreground">Pendentes</div>
            <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
          </Card>
          <Card className="p-4">
            <div className="text-sm text-muted-foreground">Em Andamento</div>
            <div className="text-2xl font-bold text-blue-600">{stats.in_progress}</div>
          </Card>
          <Card className="p-4">
            <div className="text-sm text-muted-foreground">Concluídas</div>
            <div className="text-2xl font-bold text-green-600">{stats.completed}</div>
          </Card>
          <Card className="p-4">
            <div className="text-sm text-muted-foreground">Receita Total</div>
            <div className="text-2xl font-bold">
              R$ {stats.revenue.toFixed(2)}
            </div>
          </Card>
        </div>

        {/* Filters */}
        <Card className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por projeto, cliente ou email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="w-full md:w-48">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="pending">Pendentes</SelectItem>
                  <SelectItem value="in_progress">Em Andamento</SelectItem>
                  <SelectItem value="completed">Concluídas</SelectItem>
                  <SelectItem value="cancelled">Canceladas</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </Card>

        {/* Table */}
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Cliente</TableHead>
                <TableHead>Projeto</TableHead>
                <TableHead>Valor</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Contratação</TableHead>
                <TableHead>Expira em</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredMaintenances.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground">
                    Nenhuma manutenção encontrada
                  </TableCell>
                </TableRow>
              ) : (
                filteredMaintenances.map((maintenance) => (
                  <TableRow key={maintenance.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{maintenance.profile?.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {maintenance.profile?.email}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{maintenance.project?.title}</TableCell>
                    <TableCell>R$ {Number(maintenance.amount).toFixed(2)}</TableCell>
                    <TableCell>{getStatusBadge(maintenance.status)}</TableCell>
                    <TableCell>
                      {format(new Date(maintenance.contracted_at), 'dd/MM/yyyy', { locale: ptBR })}
                    </TableCell>
                    <TableCell>
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
                ))
              )}
            </TableBody>
          </Table>
        </Card>

        {/* Edit Dialog */}
        <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Editar Manutenção</DialogTitle>
              <DialogDescription>
                Atualize o status e adicione observações sobre a manutenção
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Status</label>
                <Select value={editStatus} onValueChange={setEditStatus}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pendente</SelectItem>
                    <SelectItem value="in_progress">Em Andamento</SelectItem>
                    <SelectItem value="completed">Concluída</SelectItem>
                    <SelectItem value="cancelled">Cancelada</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium">Observações do Admin</label>
                <Textarea
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  placeholder="Adicione observações sobre o andamento da manutenção..."
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
