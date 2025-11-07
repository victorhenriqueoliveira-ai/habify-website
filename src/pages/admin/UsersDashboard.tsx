import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { DashboardFilters } from '@/components/admin/DashboardFilters';
import { useAnalyticsDashboard } from '@/hooks/useAnalyticsDashboard';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area,
} from 'recharts';
import {
  Users,
  UserPlus,
  UserCheck,
  UserX,
  TrendingUp,
  Activity,
} from 'lucide-react';

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6'];

const MetricCard = ({ 
  title, 
  value, 
  change, 
  icon: Icon,
  trend = 'neutral',
}: {
  title: string;
  value: string | number;
  change?: number;
  icon: React.ElementType;
  trend?: 'up' | 'down' | 'neutral';
}) => {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {change !== undefined && (
          <div className={`flex items-center text-xs mt-1 ${
            trend === 'up' ? 'text-green-600' : trend === 'down' ? 'text-red-600' : 'text-muted-foreground'
          }`}>
            <TrendingUp className="h-3 w-3 mr-1" />
            {change.toFixed(1)}% de retenção
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export const UsersDashboard = () => {
  const [selectedPeriod, setSelectedPeriod] = useState('30days');

  const { 
    userMetrics, 
    loading, 
    updateDateRange,
    refetch 
  } = useAnalyticsDashboard();

  const handlePeriodChange = (period: string) => {
    setSelectedPeriod(period);
    updateDateRange(period);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight mb-2">👥 Dashboard de Usuários</h1>
        <p className="text-muted-foreground">
          Análise de cadastros, atividade e engajamento de usuários
        </p>
      </div>

      {/* Filters */}
      <DashboardFilters
        selectedPeriod={selectedPeriod}
        onPeriodChange={handlePeriodChange}
        onRefresh={refetch}
      />

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Total de Usuários"
          value={userMetrics?.totalUsers || 0}
          icon={Users}
        />
        <MetricCard
          title="Novos Usuários"
          value={userMetrics?.newUsers || 0}
          icon={UserPlus}
        />
        <MetricCard
          title="Usuários Ativos"
          value={userMetrics?.activeUsers || 0}
          change={userMetrics?.retentionRate}
          icon={UserCheck}
          trend="up"
        />
        <MetricCard
          title="Usuários Inativos"
          value={userMetrics?.inactiveUsers || 0}
          icon={UserX}
        />
      </div>

      {/* Charts */}
      <Tabs defaultValue="growth" className="space-y-4">
        <TabsList>
          <TabsTrigger value="growth">Crescimento</TabsTrigger>
          <TabsTrigger value="roles">Por Perfil</TabsTrigger>
          <TabsTrigger value="engagement">Engajamento</TabsTrigger>
        </TabsList>

        {/* Growth Chart */}
        <TabsContent value="growth" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Crescimento de Usuários</CardTitle>
              <CardDescription>Evolução do número de usuários ao longo do tempo</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={350}>
                <AreaChart data={userMetrics?.userGrowth || []}>
                  <defs>
                    <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorNew" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Area 
                    type="monotone" 
                    dataKey="total" 
                    stroke="#3b82f6" 
                    fillOpacity={1} 
                    fill="url(#colorTotal)"
                    name="Total Acumulado"
                  />
                  <Area 
                    type="monotone" 
                    dataKey="new" 
                    stroke="#10b981" 
                    fillOpacity={1} 
                    fill="url(#colorNew)"
                    name="Novos Usuários"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Roles Chart */}
        <TabsContent value="roles" className="space-y-4">
          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Distribuição por Perfil</CardTitle>
                <CardDescription>Usuários organizados por função</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={userMetrics?.usersByRole || []}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ role, count }) => `${role}: ${count}`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="count"
                    >
                      {(userMetrics?.usersByRole || []).map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Perfis - Detalhamento</CardTitle>
                <CardDescription>Porcentagem de cada perfil no sistema</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {(userMetrics?.usersByRole || []).map((item, index) => (
                    <div key={item.role} className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div 
                          className="w-4 h-4 rounded" 
                          style={{ backgroundColor: COLORS[index % COLORS.length] }}
                        />
                        <span className="text-sm font-medium">{item.role}</span>
                      </div>
                      <div className="flex items-center space-x-4">
                        <Badge variant="secondary">{item.count} usuários</Badge>
                        <div className="w-32 h-2 bg-muted rounded-full overflow-hidden">
                          <div 
                            className="h-full"
                            style={{ 
                              width: `${item.percentage}%`,
                              backgroundColor: COLORS[index % COLORS.length]
                            }}
                          />
                        </div>
                        <span className="text-sm text-muted-foreground w-12 text-right">
                          {item.percentage.toFixed(1)}%
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Engagement Chart */}
        <TabsContent value="engagement" className="space-y-4">
          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Taxa de Retenção</CardTitle>
                <CardDescription>Percentual de usuários ativos</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-center h-64">
                  <div className="text-center">
                    <div className="text-6xl font-bold text-primary mb-2">
                      {(userMetrics?.retentionRate || 0).toFixed(1)}%
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Taxa de Retenção Atual
                    </p>
                    <div className="mt-6 flex items-center justify-center gap-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-green-600">
                          {userMetrics?.activeUsers || 0}
                        </div>
                        <p className="text-xs text-muted-foreground">Ativos</p>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-red-600">
                          {userMetrics?.inactiveUsers || 0}
                        </div>
                        <p className="text-xs text-muted-foreground">Inativos</p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Projetos por Usuário</CardTitle>
                <CardDescription>Média de engajamento dos usuários</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-center h-64">
                  <div className="text-center">
                    <Activity className="h-16 w-16 text-primary mx-auto mb-4" />
                    <div className="text-5xl font-bold text-primary mb-2">
                      {(userMetrics?.averageProjectsPerUser || 0).toFixed(1)}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Projetos por usuário
                    </p>
                    <p className="text-xs text-muted-foreground mt-2">
                      Indica o nível de engajamento e utilização da plataforma
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};
