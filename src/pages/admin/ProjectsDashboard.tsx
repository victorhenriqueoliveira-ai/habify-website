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
  ComposedChart,
  Area,
} from 'recharts';
import {
  FolderKanban,
  CheckCircle2,
  Clock,
  AlertCircle,
  TrendingUp,
  Zap,
  BarChart3,
} from 'lucide-react';

const COLORS = ['hsl(var(--success))', 'hsl(var(--info))', 'hsl(var(--warning))', 'hsl(var(--destructive))'];

const MetricCard = ({ 
  title, 
  value, 
  subtitle, 
  icon: Icon,
  color = 'text-primary',
}: {
  title: string;
  value: string | number;
  subtitle: string;
  icon: React.ElementType;
  color?: string;
}) => {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className={`h-4 w-4 ${color}`} />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
      </CardContent>
    </Card>
  );
};

export const ProjectsDashboard = () => {
  const [selectedPeriod, setSelectedPeriod] = useState('30days');

  const { 
    projectMetrics, 
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
        <h1 className="flex items-center gap-2 text-3xl font-bold tracking-tight mb-2">
          <BarChart3 className="h-7 w-7 text-primary" />
          Dashboard de Projetos
        </h1>
        <p className="text-muted-foreground">
          Análise de performance, conclusão e tipos de projetos
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
          title="Total de Projetos"
          value={projectMetrics?.totalProjects || 0}
          subtitle="criados no período"
          icon={FolderKanban}
        />
        <MetricCard
          title="Projetos Concluídos"
          value={projectMetrics?.completedProjects || 0}
          subtitle={`${(projectMetrics?.successRate || 0).toFixed(1)}% de taxa de sucesso`}
          icon={CheckCircle2}
          color="text-success"
        />
        <MetricCard
          title="Em Andamento"
          value={projectMetrics?.inProgressProjects || 0}
          subtitle="atualmente em desenvolvimento"
          icon={Clock}
          color="text-info"
        />
        <MetricCard
          title="Tempo Médio"
          value={`${Math.round(projectMetrics?.averageCompletionTime || 0)} dias`}
          subtitle="para conclusão"
          icon={Zap}
          color="text-warning"
        />
      </div>

      {/* Charts */}
      <Tabs defaultValue="timeline" className="space-y-4">
        <TabsList>
          <TabsTrigger value="timeline">Linha do Tempo</TabsTrigger>
          <TabsTrigger value="types">Por Tipo</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
        </TabsList>

        {/* Timeline Chart */}
        <TabsContent value="timeline" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Evolução de Projetos</CardTitle>
              <CardDescription>Projetos criados e concluídos ao longo do tempo</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={350}>
                <ComposedChart data={projectMetrics?.projectTimeline || []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Area 
                    type="monotone" 
                    dataKey="created" 
                    fill="hsl(var(--info))" 
                    stroke="hsl(var(--info))"
                    fillOpacity={0.3}
                    name="Criados"
                  />
                  <Bar dataKey="completed" fill="hsl(var(--success))" name="Concluídos" />
                  <Line 
                    type="monotone" 
                    dataKey="completed" 
                    stroke="hsl(var(--success))" 
                    strokeWidth={2}
                    name="Tendência"
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Types Chart */}
        <TabsContent value="types" className="space-y-4">
          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Distribuição por Tipo</CardTitle>
                <CardDescription>Projetos organizados por categoria</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={projectMetrics?.projectsByType || []}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ type, count }) => `${type}: ${count}`}
                      outerRadius={80}
                      fill="hsl(var(--muted))"
                      dataKey="count"
                    >
                      {(projectMetrics?.projectsByType || []).map((_, index) => (
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
                <CardTitle>Tipos - Detalhamento</CardTitle>
                <CardDescription>Porcentagem de cada tipo de projeto</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {(projectMetrics?.projectsByType || []).map((item, index) => (
                    <div key={item.type} className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div 
                          className="w-4 h-4 rounded" 
                          style={{ backgroundColor: COLORS[index % COLORS.length] }}
                        />
                        <span className="text-sm font-medium">{item.type}</span>
                      </div>
                      <div className="flex items-center space-x-4">
                        <Badge variant="secondary">{item.count} projetos</Badge>
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

        {/* Performance Chart */}
        <TabsContent value="performance" className="space-y-4">
          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Taxa de Conclusão</CardTitle>
                <CardDescription>Percentual de projetos finalizados</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-center h-64">
                  <div className="text-center">
                    <div className="text-6xl font-bold text-success mb-2">
                      {(projectMetrics?.successRate || 0).toFixed(1)}%
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Taxa de Sucesso
                    </p>
                    <div className="mt-6 grid grid-cols-3 gap-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-success">
                          {projectMetrics?.completedProjects || 0}
                        </div>
                        <p className="text-xs text-muted-foreground">Concluídos</p>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-info">
                          {projectMetrics?.inProgressProjects || 0}
                        </div>
                        <p className="text-xs text-muted-foreground">Em Progresso</p>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-warning">
                          {projectMetrics?.pendingProjects || 0}
                        </div>
                        <p className="text-xs text-muted-foreground">Pendentes</p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Velocidade de Entrega</CardTitle>
                <CardDescription>Tempo médio para concluir projetos</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-center h-64">
                  <div className="text-center">
                    <Zap className="h-16 w-16 text-warning mx-auto mb-4" />
                    <div className="text-5xl font-bold text-warning mb-2">
                      {Math.round(projectMetrics?.averageCompletionTime || 0)}
                    </div>
                    <p className="text-sm text-muted-foreground mb-4">
                      dias em média
                    </p>
                    <div className="inline-flex items-center gap-2 px-3 py-1 bg-warning/10 text-warning rounded-full text-xs font-medium">
                      <TrendingUp className="h-3 w-3" />
                      Performance excelente
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Status Detalhado</CardTitle>
              <CardDescription>Distribuição de status dos projetos</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={[
                  { status: 'Concluídos', count: projectMetrics?.completedProjects || 0, fill: 'hsl(var(--success))' },
                  { status: 'Em Andamento', count: projectMetrics?.inProgressProjects || 0, fill: 'hsl(var(--info))' },
                  { status: 'Pendentes', count: projectMetrics?.pendingProjects || 0, fill: 'hsl(var(--warning))' },
                ]}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="status" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" fill="hsl(var(--muted))">
                    {[
                      { status: 'Concluídos', count: projectMetrics?.completedProjects || 0, fill: 'hsl(var(--success))' },
                      { status: 'Em Andamento', count: projectMetrics?.inProgressProjects || 0, fill: 'hsl(var(--info))' },
                      { status: 'Pendentes', count: projectMetrics?.pendingProjects || 0, fill: 'hsl(var(--warning))' },
                    ].map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
