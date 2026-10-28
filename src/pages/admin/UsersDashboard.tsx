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
import { Users, UserPlus, UserCheck, UserX, Activity } from 'lucide-react';

export const UsersDashboard = () => {
  const [selectedPeriod, setSelectedPeriod] = useState('30days');

  const { userMetrics, loading, updateDateRange, refetch } = useAnalyticsDashboard();

  // Lidos do DOM, então não vale recalcular a cada render.
  const colors = useMemo(() => chartColors(), []);
  const palette = useMemo(() => chartPalette(), []);
  const axis = useMemo(() => axisProps(colors), [colors]);
  const tooltip = useMemo(() => tooltipProps(colors), [colors]);

  const handlePeriodChange = (period: string) => {
    setSelectedPeriod(period);
    updateDateRange(period);
  };

  if (loading) {
    return <LoadingState label="Carregando usuários..." size="lg" fullScreen />;
  }

  const userGrowth = userMetrics?.userGrowth || [];
  const usersByRole = userMetrics?.usersByRole || [];

  return (
    <div className="space-y-6">
      <PageHeader
        icon={Users}
        eyebrow="Analytics"
        title="Dashboard de usuários"
        description="Análise de cadastros, atividade e engajamento de usuários"
      />

      <DashboardFilters
        selectedPeriod={selectedPeriod}
        onPeriodChange={handlePeriodChange}
        onRefresh={refetch}
      />

      <StatCardGrid>
        <StatCard label="Total de usuários" value={userMetrics?.totalUsers || 0} icon={Users} />
        <StatCard label="Novos usuários" value={userMetrics?.newUsers || 0} icon={UserPlus} tone="info" />
        <StatCard
          label="Usuários ativos"
          value={userMetrics?.activeUsers || 0}
          icon={UserCheck}
          tone="success"
          description={
            userMetrics?.retentionRate !== undefined
              ? `${userMetrics.retentionRate.toFixed(1)}% de retenção`
              : undefined
          }
        />
        <StatCard label="Usuários inativos" value={userMetrics?.inactiveUsers || 0} icon={UserX} />
      </StatCardGrid>

      <Tabs defaultValue="growth" className="space-y-4">
        {/* A lista de abas rola sozinha no celular, pra não empurrar a página. */}
        <div className="-mx-1 overflow-x-auto px-1">
          <TabsList className="w-max">
            <TabsTrigger value="growth">Crescimento</TabsTrigger>
            <TabsTrigger value="roles">Por perfil</TabsTrigger>
            <TabsTrigger value="engagement">Engajamento</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="growth">
          <ChartCard
            title="Crescimento de usuários"
            description="Evolução do número de usuários ao longo do tempo"
          >
            {userGrowth.length === 0 ? (
              <EmptyState
                title="Sem cadastros no período"
                description="Escolha outro intervalo no filtro acima."
              />
            ) : (
              <ResponsiveContainer width="100%" height={340}>
                <AreaChart data={userGrowth} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={colors.info} stopOpacity={0.28} />
                      <stop offset="95%" stopColor={colors.info} stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorNew" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={colors.success} stopOpacity={0.28} />
                      <stop offset="95%" stopColor={colors.success} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke={colors.grid} vertical={false} />
                  <XAxis dataKey="date" {...axis} />
                  <YAxis {...axis} />
                  <Tooltip {...tooltip} />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Area
                    type="monotone"
                    dataKey="total"
                    stroke={colors.info}
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorTotal)"
                    name="Total acumulado"
                  />
                  <Area
                    type="monotone"
                    dataKey="new"
                    stroke={colors.success}
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorNew)"
                    name="Novos usuários"
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </ChartCard>
        </TabsContent>

        <TabsContent value="roles">
          <div className="grid gap-4 lg:grid-cols-2">
            <ChartCard title="Distribuição por perfil" description="Usuários organizados por função">
              {usersByRole.length === 0 ? (
                <EmptyState title="Sem usuários" description="Nenhum cadastro no período filtrado." />
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={usersByRole}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ role, count }) => `${role}: ${count}`}
                      outerRadius={88}
                      dataKey="count"
                      stroke={colors.surface}
                      strokeWidth={2}
                    >
                      {usersByRole.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={palette[index % palette.length]} />
                      ))}
                    </Pie>
                    <Tooltip {...tooltip} />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </ChartCard>

            <ChartCard title="Perfis em detalhe" description="Porcentagem de cada perfil no sistema">
              {usersByRole.length === 0 ? (
                <EmptyState title="Sem usuários" description="Nenhum cadastro no período filtrado." />
              ) : (
                <DistributionList
                  className="p-1"
                  unit="usuários"
                  items={usersByRole.map((item) => ({
                    label: item.role,
                    count: item.count,
                    percentage: item.percentage,
                  }))}
                />
              )}
            </ChartCard>
          </div>
        </TabsContent>

        <TabsContent value="engagement">
          <div className="grid gap-4 lg:grid-cols-2">
            <ChartCard title="Taxa de retenção" description="Percentual de usuários ativos">
              <div className="flex flex-col items-center justify-center gap-6 py-10 text-center">
                <div>
                  <div className="font-display text-[56px] font-bold leading-none tracking-[-0.04em] tabular-nums text-foreground">
                    {(userMetrics?.retentionRate || 0).toFixed(1)}%
                  </div>
                  <p className="mt-2 font-mono text-[10px] uppercase tracking-[0.09em] text-muted-foreground">
                    Retenção atual
                  </p>
                </div>

                <div className="flex items-stretch divide-x divide-border rounded-lg border border-border">
                  <div className="px-6 py-3">
                    <div className="font-display text-[22px] font-bold tabular-nums text-success">
                      {userMetrics?.activeUsers || 0}
                    </div>
                    <p className="mt-0.5 font-mono text-[10px] uppercase tracking-[0.09em] text-muted-foreground">
                      Ativos
                    </p>
                  </div>
                  <div className="px-6 py-3">
                    <div className="font-display text-[22px] font-bold tabular-nums text-muted-foreground">
                      {userMetrics?.inactiveUsers || 0}
                    </div>
                    <p className="mt-0.5 font-mono text-[10px] uppercase tracking-[0.09em] text-muted-foreground">
                      Inativos
                    </p>
                  </div>
                </div>
              </div>
            </ChartCard>

            <ChartCard title="Projetos por usuário" description="Média de engajamento dos usuários">
              <div className="flex flex-col items-center justify-center gap-3 py-10 text-center">
                <span className="grid h-12 w-12 place-items-center rounded-xl border border-border bg-muted text-muted-foreground">
                  <Activity className="h-5 w-5" aria-hidden="true" />
                </span>
                <div className="font-display text-[44px] font-bold leading-none tracking-[-0.04em] tabular-nums text-foreground">
                  {(userMetrics?.averageProjectsPerUser || 0).toFixed(1)}
                </div>
                <p className="font-mono text-[10px] uppercase tracking-[0.09em] text-muted-foreground">
                  Projetos por usuário
                </p>
                <p className="max-w-[32ch] text-[12.5px] leading-relaxed text-muted-foreground">
                  Indica o nível de engajamento e utilização da plataforma.
                </p>
              </div>
            </ChartCard>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};
