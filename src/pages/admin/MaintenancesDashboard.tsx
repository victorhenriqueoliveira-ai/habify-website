import { useMemo } from 'react';
import { useMaintenancesStats } from '@/hooks/useMaintenancesStats';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { DollarSign, TrendingUp, Clock, CheckCircle2, XCircle, Wrench } from 'lucide-react';
import {
  ChartCard,
  PageHeader,
  SkeletonRows,
  StatCard,
  StatCardGrid,
  axisProps,
  chartColors,
  tooltipProps,
} from '@/components/admin/ui';

export default function MaintenancesDashboard() {
  const { data: stats, isLoading } = useMaintenancesStats();

  // Lidos do DOM, então não vale recalcular a cada render.
  const colors = useMemo(() => chartColors(), []);
  const axis = useMemo(() => axisProps(colors), [colors]);
  const tooltip = useMemo(() => tooltipProps(colors), [colors]);

  const header = (
    <PageHeader
      icon={Wrench}
      eyebrow="Analytics"
      title="Dashboard de manutenções"
      description="Análise de receita e performance dos planos de manutenção"
    />
  );

  if (isLoading) {
    return (
      <div className="space-y-6">
        {header}
        <SkeletonRows rows={4} />
      </div>
    );
  }

  if (!stats) return null;

  const statusData = [
    { name: 'Ativas', value: stats.activeMaintenances, color: colors.success },
    { name: 'Expiradas', value: stats.expiredMaintenances, color: colors.destructive },
    { name: 'Pendentes', value: stats.pendingMaintenances, color: colors.warning },
  ];

  const totalMaintenances =
    stats.activeMaintenances + stats.expiredMaintenances + stats.pendingMaintenances;
  const averageTicket = stats.totalRevenue / (totalMaintenances || 1);

  return (
    <div className="space-y-6">
      {header}

      <StatCardGrid>
        <StatCard
          label="Receita total"
          value={`R$ ${stats.totalRevenue.toFixed(2)}`}
          icon={DollarSign}
          tone="success"
        />
        <StatCard
          label="Manutenções ativas"
          value={stats.activeMaintenances}
          icon={CheckCircle2}
          tone="info"
        />
        <StatCard
          label="Taxa de renovação"
          value={`${stats.renewalRate.toFixed(1)}%`}
          icon={TrendingUp}
        />
        <StatCard
          label="Expiradas"
          value={stats.expiredMaintenances}
          icon={XCircle}
          tone="destructive"
        />
      </StatCardGrid>

      <div className="grid gap-4 lg:grid-cols-2">
        <ChartCard title="Receita mensal" description="Últimos 6 meses">
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={stats.monthlyRevenue} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={colors.grid} vertical={false} />
              <XAxis dataKey="month" {...axis} />
              <YAxis {...axis} />
              <Tooltip {...tooltip} formatter={(value: number) => `R$ ${value.toFixed(2)}`} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Line
                type="monotone"
                dataKey="revenue"
                stroke={colors.success}
                strokeWidth={2}
                dot={false}
                name="Receita"
              />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Manutenções contratadas" description="Últimos 6 meses">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={stats.monthlyRevenue} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={colors.grid} vertical={false} />
              <XAxis dataKey="month" {...axis} />
              <YAxis {...axis} />
              <Tooltip {...tooltip} cursor={{ fill: colors.grid, fillOpacity: 0.4 }} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Bar dataKey="count" fill={colors.info} name="Quantidade" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Distribuição por status" description="Situação atual de cada manutenção">
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={statusData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                outerRadius={88}
                dataKey="value"
                stroke={colors.surface}
                strokeWidth={2}
              >
                {statusData.map((entry) => (
                  <Cell key={entry.name} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip {...tooltip} />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Métricas de performance" description="Resumo dos números que não viram gráfico">
          <ul className="space-y-2 p-1">
            <li className="flex items-center justify-between gap-3 rounded-lg border border-border px-4 py-3">
              <span className="flex items-center gap-2 text-[13.5px] font-medium">
                <Clock className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                Manutenções pendentes
              </span>
              <span className="font-display text-[17px] font-bold tabular-nums">
                {stats.pendingMaintenances}
              </span>
            </li>

            <li className="flex items-center justify-between gap-3 rounded-lg border border-border px-4 py-3">
              <span className="flex items-center gap-2 text-[13.5px] font-medium">
                <CheckCircle2 className="h-4 w-4 text-success" aria-hidden="true" />
                Taxa de renovação
              </span>
              <span className="font-display text-[17px] font-bold tabular-nums">
                {stats.renewalRate.toFixed(1)}%
              </span>
            </li>

            <li className="flex items-center justify-between gap-3 rounded-lg border border-border px-4 py-3">
              <span className="flex items-center gap-2 text-[13.5px] font-medium">
                <DollarSign className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                Ticket médio
              </span>
              <span className="font-display text-[17px] font-bold tabular-nums">
                R$ {averageTicket.toFixed(2)}
              </span>
            </li>
          </ul>
        </ChartCard>
      </div>
    </div>
  );
}
