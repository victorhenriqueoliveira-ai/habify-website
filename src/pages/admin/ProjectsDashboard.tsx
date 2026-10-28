import { useMemo, useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DashboardFilters } from '@/components/admin/DashboardFilters';
import {
  ChartCard,
  DistributionList,
  EmptyState,
  LoadingState,
  PageHeader,
  StatCard,
  StatCardGrid,
  axisProps,
  chartColors,
  chartPalette,
  tooltipProps,
} from '@/components/admin/ui';
import { useAnalyticsDashboard } from '@/hooks/useAnalyticsDashboard';
import {
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
import { FolderKanban, CheckCircle2, Clock, Zap, BarChart3 } from 'lucide-react';

export const ProjectsDashboard = () => {
  const [selectedPeriod, setSelectedPeriod] = useState('30days');

  const { projectMetrics, loading, updateDateRange, refetch } = useAnalyticsDashboard();

  // Lidos do DOM, então não vale recalcular a cada render.
  const colors = useMemo(() => chartColors(), []);
  const palette = useMemo(() => chartPalette(), []);
  const axis = useMemo(() => axisProps(colors), [colors]);
  const tooltip = useMemo(() => tooltipProps(colors), [colors]);

  const handlePeriodChange = (period: string) => {
    setSelectedPeriod(period);
    updateDateRange(period);
  };

  const statusBreakdown = useMemo(
    () => [
      { status: 'Concluídos', count: projectMetrics?.completedProjects || 0, fill: colors.success },
      { status: 'Em andamento', count: projectMetrics?.inProgressProjects || 0, fill: colors.info },
      { status: 'Pendentes', count: projectMetrics?.pendingProjects || 0, fill: colors.warning },
    ],
    [projectMetrics, colors],
  );

  if (loading) {
    return <LoadingState label="Carregando projetos..." size="lg" fullScreen />;
  }

  const timeline = projectMetrics?.projectTimeline || [];
  const projectsByType = projectMetrics?.projectsByType || [];
  const avgDays = Math.round(projectMetrics?.averageCompletionTime || 0);

  return (
    <div className="space-y-6">
      <PageHeader
        icon={BarChart3}
        eyebrow="Analytics"
        title="Dashboard de projetos"
        description="Análise de performance, conclusão e tipos de projetos"
      />

      <DashboardFilters
        selectedPeriod={selectedPeriod}
        onPeriodChange={handlePeriodChange}
        onRefresh={refetch}
      />

      <StatCardGrid>
        <StatCard
          label="Total de projetos"
          value={projectMetrics?.totalProjects || 0}
          description="criados no período"
          icon={FolderKanban}
        />
        <StatCard
          label="Projetos concluídos"
          value={projectMetrics?.completedProjects || 0}
          description={`${(projectMetrics?.successRate || 0).toFixed(1)}% de taxa de sucesso`}
          icon={CheckCircle2}
          tone="success"
        />
        <StatCard
          label="Em andamento"
          value={projectMetrics?.inProgressProjects || 0}
          description="atualmente em desenvolvimento"
          icon={Clock}
          tone="info"
        />
        <StatCard
          label="Tempo médio"
          value={`${avgDays} dias`}
          description="para conclusão"
          icon={Zap}
          tone="warning"
        />
      </StatCardGrid>

      <Tabs defaultValue="timeline" className="space-y-4">
        {/* A lista de abas rola sozinha no celular, pra não empurrar a página. */}
        <div className="-mx-1 overflow-x-auto px-1">
          <TabsList className="w-max">
            <TabsTrigger value="timeline">Linha do tempo</TabsTrigger>
            <TabsTrigger value="types">Por tipo</TabsTrigger>
            <TabsTrigger value="performance">Performance</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="timeline">
          <ChartCard
            title="Evolução de projetos"
            description="Projetos criados e concluídos ao longo do tempo"
          >
            {timeline.length === 0 ? (
              <EmptyState
                title="Sem projetos no período"
                description="Escolha outro intervalo no filtro acima."
              />
            ) : (
              <ResponsiveContainer width="100%" height={340}>
                <ComposedChart data={timeline} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={colors.grid} vertical={false} />
                  <XAxis dataKey="date" {...axis} />
                  <YAxis {...axis} />
                  <Tooltip {...tooltip} cursor={{ fill: colors.grid, fillOpacity: 0.4 }} />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Area
                    type="monotone"
                    dataKey="created"
                    fill={colors.info}
                    stroke={colors.info}
                    strokeWidth={2}
                    fillOpacity={0.18}
                    name="Criados"
                  />
                  <Bar dataKey="completed" fill={colors.success} name="Concluídos" radius={[4, 4, 0, 0]} />
                  <Line
                    type="monotone"
                    dataKey="completed"
                    stroke={colors.success}
                    strokeWidth={2}
                    dot={false}
                    name="Tendência"
                  />
                </ComposedChart>
              </ResponsiveContainer>
            )}
          </ChartCard>
        </TabsContent>

        <TabsContent value="types">
          <div className="grid gap-4 lg:grid-cols-2">
            <ChartCard title="Distribuição por tipo" description="Projetos organizados por categoria">
              {projectsByType.length === 0 ? (
                <EmptyState title="Sem projetos" description="Nenhum projeto no período filtrado." />
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={projectsByType}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ type, count }) => `${type}: ${count}`}
                      outerRadius={88}
                      dataKey="count"
                      stroke={colors.surface}
                      strokeWidth={2}
                    >
                      {projectsByType.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={palette[index % palette.length]} />
                      ))}
                    </Pie>
                    <Tooltip {...tooltip} />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </ChartCard>

            <ChartCard title="Tipos em detalhe" description="Porcentagem de cada tipo de projeto">
              {projectsByType.length === 0 ? (
                <EmptyState title="Sem projetos" description="Nenhum projeto no período filtrado." />
              ) : (
                <DistributionList
                  className="p-1"
                  unit="projetos"
                  items={projectsByType.map((item) => ({
                    label: item.type,
                    count: item.count,
                    percentage: item.percentage,
                  }))}
                />
              )}
            </ChartCard>
          </div>
        </TabsContent>

        <TabsContent value="performance" className="space-y-4">
          <div className="grid gap-4 lg:grid-cols-2">
            <ChartCard title="Taxa de conclusão" description="Percentual de projetos finalizados">
              <div className="flex flex-col items-center justify-center gap-6 py-10 text-center">
                <div>
                  <div className="font-display text-[56px] font-bold leading-none tracking-[-0.04em] tabular-nums text-success">
                    {(projectMetrics?.successRate || 0).toFixed(1)}%
                  </div>
                  <p className="mt-2 font-mono text-[10px] uppercase tracking-[0.09em] text-muted-foreground">
                    Taxa de sucesso
                  </p>
                </div>

                <div className="flex items-stretch divide-x divide-border rounded-lg border border-border">
                  <div className="px-5 py-3">
                    <div className="font-display text-[22px] font-bold tabular-nums text-success">
                      {projectMetrics?.completedProjects || 0}
                    </div>
                    <p className="mt-0.5 font-mono text-[10px] uppercase tracking-[0.09em] text-muted-foreground">
                      Concluídos
                    </p>
                  </div>
                  <div className="px-5 py-3">
                    <div className="font-display text-[22px] font-bold tabular-nums text-info">
                      {projectMetrics?.inProgressProjects || 0}
                    </div>
                    <p className="mt-0.5 font-mono text-[10px] uppercase tracking-[0.09em] text-muted-foreground">
                      Em progresso
                    </p>
                  </div>
                  <div className="px-5 py-3">
                    <div className="font-display text-[22px] font-bold tabular-nums text-warning">
                      {projectMetrics?.pendingProjects || 0}
                    </div>
                    <p className="mt-0.5 font-mono text-[10px] uppercase tracking-[0.09em] text-muted-foreground">
                      Pendentes
                    </p>
                  </div>
                </div>
              </div>
            </ChartCard>

            <ChartCard title="Velocidade de entrega" description="Tempo médio para concluir projetos">
              <div className="flex flex-col items-center justify-center gap-3 py-10 text-center">
                <span className="grid h-12 w-12 place-items-center rounded-xl border border-border bg-muted text-muted-foreground">
                  <Zap className="h-5 w-5" aria-hidden="true" />
                </span>
                <div className="font-display text-[44px] font-bold leading-none tracking-[-0.04em] tabular-nums text-foreground">
                  {avgDays}
                </div>
                <p className="font-mono text-[10px] uppercase tracking-[0.09em] text-muted-foreground">
                  dias em média
                </p>
                {/* Antes isto dizia "Performance excelente" fixo, qualquer que
                 *  fosse o número — um selo que nunca mudava não informa nada.
                 *  A promessa de venda é "no ar hoje", então a régua é 1 dia. */}
                <p className="max-w-[34ch] text-[12.5px] leading-relaxed text-muted-foreground">
                  {avgDays <= 1
                    ? 'Dentro da promessa de entrega no mesmo dia.'
                    : `Acima da promessa de entrega no mesmo dia — ${avgDays} dias em média até a conclusão.`}
                </p>
              </div>
            </ChartCard>
          </div>

          <ChartCard title="Status detalhado" description="Distribuição de status dos projetos">
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={statusBreakdown} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={colors.grid} vertical={false} />
                <XAxis dataKey="status" {...axis} />
                <YAxis {...axis} />
                <Tooltip {...tooltip} cursor={{ fill: colors.grid, fillOpacity: 0.4 }} />
                <Bar dataKey="count" name="Projetos" radius={[4, 4, 0, 0]}>
                  {statusBreakdown.map((entry) => (
                    <Cell key={entry.status} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        </TabsContent>
      </Tabs>
    </div>
  );
};
