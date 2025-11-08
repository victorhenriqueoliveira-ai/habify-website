import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useMaintenances } from '@/hooks/useMaintenances';
import { useProjects } from '@/hooks/useProjects';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Wrench, Clock, CheckCircle, XCircle, Plus, CreditCard } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';

const UserMaintenancesPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { maintenances, loading, getActiveMaintenances } = useMaintenances(user?.id);
  const { projects } = useProjects();

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

  const handlePurchaseMaintenance = (project: any) => {
    navigate(`/admin/maintenance-checkout/${project.id}`);
  };

  const activeMaintenances = getActiveMaintenances();
  const completedProjects = projects.filter(p => p.status === 'completed');

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
          <h1 className="text-3xl font-bold">Minhas Manutenções</h1>
          <p className="text-muted-foreground">
            Contrate e acompanhe as manutenções dos seus projetos
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="p-4">
            <div className="text-sm text-muted-foreground">Manutenções Ativas</div>
            <div className="text-2xl font-bold">{activeMaintenances.length}</div>
          </Card>
          <Card className="p-4">
            <div className="text-sm text-muted-foreground">Total de Manutenções</div>
            <div className="text-2xl font-bold">{maintenances.length}</div>
          </Card>
          <Card className="p-4">
            <div className="text-sm text-muted-foreground">Projetos Disponíveis</div>
            <div className="text-2xl font-bold">{completedProjects.length}</div>
          </Card>
        </div>

        {/* Available Projects */}
        {completedProjects.length > 0 && (
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Contratar Manutenção</h2>
            <p className="text-muted-foreground mb-4">
              Contrate manutenção mensal para seus projetos concluídos por apenas R$ 79,90/mês
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {completedProjects.map((project) => {
                const hasActiveMaintenance = activeMaintenances.some(
                  m => m.project_id === project.id
                );

                return (
                  <Card key={project.id} className="p-4">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h3 className="font-semibold">{project.title}</h3>
                        <p className="text-sm text-muted-foreground">
                          {project.description}
                        </p>
                      </div>
                      {hasActiveMaintenance && (
                        <Badge variant="default">Ativa</Badge>
                      )}
                    </div>
                    <div className="mt-4">
                      <Button
                        onClick={() => handlePurchaseMaintenance(project)}
                        disabled={hasActiveMaintenance}
                        className="w-full"
                      >
                        <CreditCard className="h-4 w-4 mr-2" />
                        {hasActiveMaintenance ? 'Manutenção Ativa' : 'Contratar por R$ 79,90'}
                      </Button>
                    </div>
                  </Card>
                );
              })}
            </div>
          </Card>
        )}

        {/* Maintenances History */}
        <Card>
          <div className="p-6">
            <h2 className="text-xl font-semibold mb-4">Histórico de Manutenções</h2>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Projeto</TableHead>
                <TableHead>Valor</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Contratação</TableHead>
                <TableHead>Expira em</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {maintenances.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground">
                    Você ainda não possui manutenções contratadas
                  </TableCell>
                </TableRow>
              ) : (
                maintenances.map((maintenance) => (
                  <TableRow key={maintenance.id}>
                    <TableCell className="font-medium">
                      {maintenance.project?.title}
                    </TableCell>
                    <TableCell>R$ {Number(maintenance.amount).toFixed(2)}</TableCell>
                    <TableCell>{getStatusBadge(maintenance.status)}</TableCell>
                    <TableCell>
                      {format(new Date(maintenance.contracted_at), 'dd/MM/yyyy', { locale: ptBR })}
                    </TableCell>
                    <TableCell>
                      {format(new Date(maintenance.expires_at), 'dd/MM/yyyy', { locale: ptBR })}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </Card>

      </div>
  );
};

export default UserMaintenancesPage;
