import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Users, 
  Building2, 
  CheckCircle, 
  Clock, 
  AlertCircle,
  TrendingUp,
  DollarSign,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { mockDashboardStats, mockProjects, mockUsers } from '@/data/mockData';

const StatCard = ({ 
  title, 
  value, 
  description, 
  icon: Icon, 
  trend 
}: {
  title: string;
  value: string | number;
  description: string;
  icon: React.ElementType;
  trend?: number;
}) => (
  <Card>
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <CardTitle className="text-sm font-medium">{title}</CardTitle>
      <Icon className="h-4 w-4 text-muted-foreground" />
    </CardHeader>
    <CardContent>
      <div className="text-2xl font-bold">{value}</div>
      <p className="text-xs text-muted-foreground">
        {trend && (
          <span className={`inline-flex items-center ${trend > 0 ? 'text-green-600' : 'text-red-600'}`}>
            <TrendingUp className="w-3 h-3 mr-1" />
            {trend > 0 ? '+' : ''}{trend}%
          </span>
        )}
        {description}
      </p>
    </CardContent>
  </Card>
);

export const DashboardPage = () => {
  const { user, hasRole } = useAuth();
  const stats = mockDashboardStats;
  
  // Filter data based on user role
  const userProjects = mockProjects.filter(p => p.userId === user?.id);
  const recentProjects = hasRole(['admin', 'dev']) 
    ? mockProjects.slice(0, 5) 
    : userProjects.slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          {hasRole(['admin', 'dev']) ? 'Dashboard Administrativo' : 'Meu Painel'}
        </h1>
        <p className="text-muted-foreground">
          {hasRole(['admin', 'dev']) 
            ? 'Visão geral de todos os projetos e usuários' 
            : 'Acompanhe seus projetos e estatísticas'}
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {hasRole(['admin', 'dev']) ? (
          <>
            <StatCard
              title="Total de Projetos"
              value={stats.totalProjects}
              description="projetos criados"
              icon={Building2}
              trend={12}
            />
            <StatCard
              title="Usuários Ativos"
              value={stats.activeUsers}
              description={`de ${stats.totalUsers} usuários`}
              icon={Users}
            />
            <StatCard
              title="Receita Mensal"
              value={`R$ ${(stats.monthlyRevenue / 1000).toFixed(0)}k`}
              description="este mês"
              icon={DollarSign}
              trend={stats.monthlyGrowth}
            />
            <StatCard
              title="Projetos Concluídos"
              value={stats.completedProjects}
              description="finalizados com sucesso"
              icon={CheckCircle}
            />
          </>
        ) : (
          <>
            <StatCard
              title="Meus Projetos"
              value={userProjects.length}
              description="projetos criados"
              icon={Building2}
            />
            <StatCard
              title="Concluídos"
              value={userProjects.filter(p => p.status === 'completed').length}
              description="projetos finalizados"
              icon={CheckCircle}
            />
            <StatCard
              title="Em Andamento"
              value={userProjects.filter(p => p.status === 'in_progress').length}
              description="sendo desenvolvidos"
              icon={Clock}
            />
            <StatCard
              title="Pendentes"
              value={userProjects.filter(p => p.status === 'pending').length}
              description="aguardando análise"
              icon={AlertCircle}
            />
          </>
        )}
      </div>

      {/* Recent Projects */}
      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>
              {hasRole(['admin', 'dev']) ? 'Projetos Recentes' : 'Meus Projetos'}
            </CardTitle>
            <CardDescription>
              {hasRole(['admin', 'dev']) 
                ? 'Últimos projetos criados no sistema'
                : 'Status dos seus projetos'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentProjects.length > 0 ? (
                recentProjects.map((project) => (
                  <div key={project.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex-1">
                      <h3 className="font-semibold">{project.title}</h3>
                      <p className="text-sm text-muted-foreground">{project.location}</p>
                      <p className="text-sm font-medium text-primary">
                        R$ {project.price.toLocaleString('pt-BR')}
                      </p>
                    </div>
                    <Badge 
                      variant={
                        project.status === 'completed' ? 'default' :
                        project.status === 'in_progress' ? 'secondary' :
                        project.status === 'pending' ? 'outline' :
                        'destructive'
                      }
                    >
                      {project.status === 'completed' ? 'Concluído' :
                       project.status === 'in_progress' ? 'Em Andamento' :
                       project.status === 'pending' ? 'Pendente' :
                       'Rejeitado'}
                    </Badge>
                  </div>
                ))
              ) : (
                <div className="text-center py-8">
                  <Building2 className="mx-auto h-12 w-12 text-muted-foreground" />
                  <h3 className="mt-2 text-sm font-semibold">Nenhum projeto</h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Comece criando seu primeiro projeto.
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Status Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Status dos Projetos</CardTitle>
            <CardDescription>Distribuição por status</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {hasRole(['admin', 'dev']) ? (
              <>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Concluídos</span>
                    <span>{stats.completedProjects}</span>
                  </div>
                  <Progress value={(stats.completedProjects / stats.totalProjects) * 100} />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Em Andamento</span>
                    <span>{stats.inProgressProjects}</span>
                  </div>
                  <Progress 
                    value={(stats.inProgressProjects / stats.totalProjects) * 100} 
                    className="bg-blue-200"
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Pendentes</span>
                    <span>{stats.pendingProjects}</span>
                  </div>
                  <Progress 
                    value={(stats.pendingProjects / stats.totalProjects) * 100}
                    className="bg-yellow-200" 
                  />
                </div>
              </>
            ) : (
              <>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Concluídos</span>
                    <span>{userProjects.filter(p => p.status === 'completed').length}</span>
                  </div>
                  <Progress 
                    value={userProjects.length > 0 ? (userProjects.filter(p => p.status === 'completed').length / userProjects.length) * 100 : 0} 
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Em Andamento</span>
                    <span>{userProjects.filter(p => p.status === 'in_progress').length}</span>
                  </div>
                  <Progress 
                    value={userProjects.length > 0 ? (userProjects.filter(p => p.status === 'in_progress').length / userProjects.length) * 100 : 0}
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Pendentes</span>
                    <span>{userProjects.filter(p => p.status === 'pending').length}</span>
                  </div>
                  <Progress 
                    value={userProjects.length > 0 ? (userProjects.filter(p => p.status === 'pending').length / userProjects.length) * 100 : 0}
                  />
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};