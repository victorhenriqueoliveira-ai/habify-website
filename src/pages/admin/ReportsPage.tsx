import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  BarChart3, 
  TrendingUp, 
  DollarSign, 
  Users, 
  Building2,
  Download,
  Calendar,
  Filter,
} from 'lucide-react';
import { useDashboardStats } from '@/hooks/useDashboardStats';
import { useProjects } from '@/hooks/useProjects';
import { useUsers } from '@/hooks/useUsers';
import { useSystemMetrics } from '@/hooks/useSystemMetrics';

const StatCard = ({ 
  title, 
  value, 
  trend, 
  icon: Icon,
  description 
}: {
  title: string;
  value: string | number;
  trend?: number;
  icon: React.ElementType;
  description: string;
}) => (
  <Card>
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <CardTitle className="text-sm font-medium">{title}</CardTitle>
      <Icon className="h-4 w-4 text-muted-foreground" />
    </CardHeader>
    <CardContent>
      <div className="text-2xl font-bold">{value}</div>
      <div className="flex items-center text-xs text-muted-foreground">
        {trend && (
          <span className={`inline-flex items-center mr-2 ${trend > 0 ? 'text-green-600' : 'text-red-600'}`}>
            <TrendingUp className="w-3 h-3 mr-1" />
            {trend > 0 ? '+' : ''}{trend}%
          </span>
        )}
        {description}
      </div>
    </CardContent>
  </Card>
);

export const ReportsPage = () => {
  const [selectedPeriod, setSelectedPeriod] = useState('month');
  const { stats, loading: statsLoading } = useDashboardStats();
  const { projects, loading: projectsLoading } = useProjects();
  const { users, loading: usersLoading } = useUsers();
  const { metrics, loading: metricsLoading } = useSystemMetrics();
  
  const loading = statsLoading || projectsLoading || usersLoading || metricsLoading;
  
  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }
  
  // Calculate metrics using real data from database functions
  const totalRevenue = metrics?.totalRevenue || 0;
  const completedProjects = metrics?.completedProjects || 0;
  const totalProjects = metrics?.totalProjects || 0;
  const activeUsers = metrics?.activeUsers || 0;
  const totalUsers = metrics?.totalUsers || 0;
  
  const averageProjectValue = completedProjects > 0 ? totalRevenue / completedProjects : 0;
  const conversionRate = metrics?.conversionRate || 0;
  
  // Calculate growth trends based on real data
  const monthlyGrowth = stats.monthlyGrowth || 0;
  const projectGrowthTrend = totalProjects > 0 ? ((stats.inProgressProjects / totalProjects) * 100) - 33 : 0;
  const userGrowthTrend = totalUsers > 0 ? ((activeUsers / totalUsers) * 100) - 80 : 0;

  const projectsByStatus = [
    { status: 'Concluídos', count: completedProjects, color: 'bg-green-500' },
    { status: 'Em Andamento', count: stats.inProgressProjects, color: 'bg-blue-500' },
    { status: 'Pendentes', count: stats.pendingProjects, color: 'bg-yellow-500' },
    { status: 'Rejeitados', count: projects.filter(p => p.status === 'rejected').length, color: 'bg-red-500' },
  ];

  const usersByRole = [
    { role: 'Corretores', count: users.filter(u => u.role === 'user').length, color: 'bg-primary' },
    { role: 'Admins', count: users.filter(u => u.role === 'admin').length, color: 'bg-secondary' },
    { role: 'Devs', count: users.filter(u => u.role === 'dev').length, color: 'bg-destructive' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Relatórios</h1>
          <p className="text-muted-foreground">
            Acompanhe o desempenho do negócio e métricas importantes
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Período" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="week">Última Semana</SelectItem>
              <SelectItem value="month">Último Mês</SelectItem>
              <SelectItem value="quarter">Último Trimestre</SelectItem>
              <SelectItem value="year">Último Ano</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Exportar
          </Button>
        </div>
      </div>

      {/* Main Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Receita Total"
          value={totalRevenue > 0 ? `R$ ${totalRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : 'R$ 0,00'}
          trend={monthlyGrowth}
          icon={DollarSign}
          description="receita acumulada"
        />
        <StatCard
          title="Projetos Ativos"
          value={stats.inProgressProjects}
          trend={projectGrowthTrend}
          icon={Building2}
          description="em desenvolvimento"
        />
        <StatCard
          title="Taxa de Conversão"
          value={`${conversionRate.toFixed(1)}%`}
          trend={conversionRate - 50}
          icon={TrendingUp}
          description="projetos concluídos"
        />
        <StatCard
          title="Usuários Ativos"
          value={activeUsers}
          trend={userGrowthTrend}
          icon={Users}
          description="usuários cadastrados"
        />
      </div>

      {/* Charts Section */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Projects by Status */}
        <Card>
          <CardHeader>
            <CardTitle>Projetos por Status</CardTitle>
            <CardDescription>Distribuição dos projetos no sistema</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {projectsByStatus.map((item) => (
                <div key={item.status} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                     <div className={`w-4 h-4 rounded ${item.color}`} />
                     <span className="text-sm font-medium">{item.status}</span>
                   </div>
                   <div className="flex items-center space-x-2">
                     <span className="text-sm text-muted-foreground">{item.count}</span>
                     <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
                       <div 
                         className={`h-full ${item.color}`}
                         style={{ 
                           width: `${totalProjects > 0 ? (item.count / totalProjects) * 100 : 0}%` 
                         }}
                       />
                     </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 pt-4 border-t">
               <div className="flex justify-between text-sm">
                 <span className="text-muted-foreground">Total de Projetos</span>
                 <span className="font-medium">{totalProjects}</span>
               </div>
            </div>
          </CardContent>
        </Card>

        {/* Users by Role */}
        <Card>
          <CardHeader>
            <CardTitle>Usuários por Perfil</CardTitle>
            <CardDescription>Distribuição dos usuários no sistema</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {usersByRole.map((item) => (
                <div key={item.role} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className={`w-4 h-4 rounded ${item.color}`} />
                    <span className="text-sm font-medium">{item.role}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                     <span className="text-sm text-muted-foreground">{item.count}</span>
                     <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
                       <div 
                         className={`h-full ${item.color}`}
                         style={{ 
                           width: `${totalUsers > 0 ? (item.count / totalUsers) * 100 : 0}%` 
                         }}
                       />
                     </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 pt-4 border-t">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Total de Usuários</span>
                  <span className="font-medium">{totalUsers}</span>
                </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Financial Overview */}
      <Card>
        <CardHeader>
          <CardTitle>Resumo Financeiro</CardTitle>
          <CardDescription>Métricas financeiras do negócio</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="text-center p-6 border rounded-lg">
              <div className="text-3xl font-bold text-primary">
                R$ {totalRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                Receita Total Gerada
              </p>
            </div>
            <div className="text-center p-6 border rounded-lg">
              <div className="text-3xl font-bold text-green-600">
                R$ {averageProjectValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                Ticket Médio por Projeto
              </p>
            </div>
            <div className="text-center p-6 border rounded-lg">
              <div className="text-3xl font-bold text-blue-600">
                R$ {stats.monthlyRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                Receita Mensal Atual
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Atividade Recente</CardTitle>
          <CardDescription>Últimas ações no sistema</CardDescription>
        </CardHeader>
        <CardContent>
           <div className="space-y-4">
             {projects.slice(0, 5).map((project) => (
              <div key={project.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-primary rounded-full" />
                  <div>
                    <p className="text-sm font-medium">{project.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(project.updatedAt).toLocaleDateString('pt-BR')} - {project.location}
                    </p>
                  </div>
                </div>
                <Badge variant={
                  project.status === 'completed' ? 'default' :
                  project.status === 'in_progress' ? 'secondary' :
                  'outline'
                }>
                  {project.status === 'completed' ? 'Concluído' :
                   project.status === 'in_progress' ? 'Em Andamento' :
                   'Pendente'}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};