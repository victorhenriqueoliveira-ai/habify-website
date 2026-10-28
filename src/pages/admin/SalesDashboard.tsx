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
  BarChart,
  Bar,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Area,
  AreaChart,
} from 'recharts';
import { DollarSign, ShoppingCart, TrendingUp, CreditCard, BarChart3 } from 'lucide-react';

function formatMetricValue(value: string | number, prefix = '', suffix = ''): string {
  const formatted =
    typeof value === 'number' ? value.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) : value;
  return `${prefix}${formatted}${suffix}`;
}

const formatBRL = (value: number | string) => `R$ ${Number(value).toFixed(2)}`;

export const SalesDashboard = () => {
  const [selectedPeriod, setSelectedPeriod] = useState('30days');
  const [selectedGateway, setSelectedGateway] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');

  const { salesMetrics, loading, updateDateRange, updateFilters, refetch } = useAnalyticsDashboard({
    gateway: selectedGateway === 'all' ? undefined : selectedGateway,
    status: selectedStatus === 'all' ? undefined : selectedStatus,
  });

  // Lidos do DOM, então não vale recalcular a cada render.
  const colors = useMemo(() => chartColors(), []);
  const palette = useMemo(() => chartPalette(), []);
  const axis = useMemo(() => axisProps(colors), [colors]);
  const tooltip = useMemo(() => tooltipProps(colors), [colors]);

  const handlePeriodChange = (period: string) => {
    setSelectedPeriod(period);
    updateDateRange(period);
  };

  const handleGatewayChange = (gateway: string) => {
    setSelectedGateway(gateway);
    updateFilters({ gateway: gateway === 'all' ? undefined : gateway });
  };

  const handleStatusChange = (status: string) => {
    setSelectedStatus(status);
    updateFilters({ status: status === 'all' ? undefined : status });
  };

  const activeFiltersCount = [selectedGateway !== 'all', selectedStatus !== 'all'].filter(Boolean).length;

  if (loading) {
    return <LoadingState label="Carregando vendas..." size="lg" fullScreen />;
  }

  const revenueByDay = salesMetrics?.revenueByDay || [];
  const revenueByGateway = salesMetrics?.revenueByGateway || [];
  const ordersByStatus = salesMetrics?.ordersByStatus || [];
  const topPlans = salesMetrics?.topPlans || [];

  return (
    <div className="space-y-6">
      <PageHeader
        icon={BarChart3}
        eyebrow="Analytics"
        title="Dashboard de vendas"
        description="Análise completa de receita, conversões e performance de vendas"
      />

      <DashboardFilters
        selectedPeriod={selectedPeriod}
        onPeriodChange={handlePeriodChange}
        selectedGateway={selectedGateway}
        onGatewayChange={handleGatewayChange}
        selectedStatus={selectedStatus}
        onStatusChange={handleStatusChange}
        onRefresh={refetch}
        activeFiltersCount={activeFiltersCount}
      />

      <StatCardGrid>
        <StatCard
          label="Receita total"
          value={formatMetricValue(salesMetrics?.totalRevenue || 0, 'R$ ')}
          icon={DollarSign}
          tone="success"
        />
        <StatCard label="Total de pedidos" value={salesMetrics?.totalOrders || 0} icon={ShoppingCart} />
        <StatCard
          label="Ticket médio"
          value={formatMetricValue(salesMetrics?.averageOrderValue || 0, 'R$ ')}
          icon={CreditCard}
        />
        <StatCard
          label="Taxa de conversão"
          value={formatMetricValue((salesMetrics?.conversionRate || 0).toFixed(1), '', '%')}
          icon={TrendingUp}
          tone="info"
        />
      </StatCardGrid>

      <Tabs defaultValue="revenue" className="space-y-4">
        {/* A lista de abas rola sozinha no celular — quatro rótulos não
         *  cabem em 390px e sem isso empurrariam a página inteira. */}
        <div className="-mx-1 overflow-x-auto px-1">
          <TabsList className="w-max">
            <TabsTrigger value="revenue">Receita por período</TabsTrigger>
            <TabsTrigger value="gateways">Por gateway</TabsTrigger>
            <TabsTrigger value="status">Por status</TabsTrigger>
            <TabsTrigger value="plans">Top planos</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="revenue">
          <ChartCard title="Evolução de receita" description="Receita e volume de pedidos ao longo do tempo">
            {revenueByDay.length === 0 ? (
              <EmptyState title="Sem vendas no período" description="Escolha outro intervalo no filtro acima." />
            ) : (
              <ResponsiveContainer width="100%" height={340}>
                <AreaChart data={revenueByDay} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={colors.areaFrom} />
                      <stop offset="95%" stopColor={colors.areaTo} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke={colors.grid} vertical={false} />
                  <XAxis dataKey="date" {...axis} />
                  <YAxis yAxisId="left" {...axis} />
                  <YAxis yAxisId="right" orientation="right" {...axis} />
                  <Tooltip
                    {...tooltip}
                    formatter={(value: number | string, name: string) => [
                      name === 'revenue' ? formatBRL(value) : value,
                      name === 'revenue' ? 'Receita' : 'Pedidos',
                    ]}
                  />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Area
                    yAxisId="left"
                    type="monotone"
                    dataKey="revenue"
                    name="Receita"
                    stroke={colors.success}
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorRevenue)"
                  />
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="orders"
                    name="Pedidos"
                    stroke={colors.info}
                    strokeWidth={2}
                    dot={false}
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </ChartCard>
        </TabsContent>

        <TabsContent value="gateways">
          <div className="grid gap-4 lg:grid-cols-2">
            <ChartCard
              title="Receita por gateway"
              description="Distribuição de receita por método de pagamento"
            >
              {revenueByGateway.length === 0 ? (
                <EmptyState title="Sem dados de gateway" description="Nenhum pedido no período filtrado." />
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={revenueByGateway}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ gateway, revenue }) => `${gateway}: R$ ${revenue.toFixed(0)}`}
                      outerRadius={88}
                      dataKey="revenue"
                      stroke={colors.surface}
                      strokeWidth={2}
                    >
                      {revenueByGateway.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={palette[index % palette.length]} />
                      ))}
                    </Pie>
                    <Tooltip {...tooltip} formatter={(value: number | string) => formatBRL(value)} />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </ChartCard>

            <ChartCard title="Performance dos gateways" description="Volume de transações por gateway">
              {revenueByGateway.length === 0 ? (
                <EmptyState title="Sem transações" description="Nenhum pedido no período filtrado." />
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={revenueByGateway} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={colors.grid} vertical={false} />
                    <XAxis dataKey="gateway" {...axis} />
                    <YAxis {...axis} />
                    <Tooltip {...tooltip} cursor={{ fill: colors.grid, fillOpacity: 0.4 }} />
                    <Bar dataKey="count" fill={colors.info} name="Transações" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </ChartCard>
          </div>
        </TabsContent>

        <TabsContent value="status">
          <ChartCard title="Distribuição por status" description="Status dos pedidos no sistema">
            {ordersByStatus.length === 0 ? (
              <EmptyState title="Sem pedidos" description="Nenhum pedido no período filtrado." />
            ) : (
              <DistributionList
                className="p-1"
                unit="pedidos"
                items={ordersByStatus.map((item) => ({
                  label: item.status,
                  count: item.count,
                  percentage: item.percentage,
                }))}
              />
            )}
          </ChartCard>
        </TabsContent>

        <TabsContent value="plans">
          <ChartCard title="Top 5 planos mais vendidos" description="Receita gerada por cada plano">
            {topPlans.length === 0 ? (
              <EmptyState title="Sem planos vendidos" description="Nenhuma venda no período filtrado." />
            ) : (
              <ResponsiveContainer width="100%" height={340}>
                <BarChart data={topPlans} layout="vertical" margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={colors.grid} horizontal={false} />
                  <XAxis type="number" {...axis} />
                  <YAxis dataKey="name" type="category" width={140} {...axis} />
                  <Tooltip
                    {...tooltip}
                    cursor={{ fill: colors.grid, fillOpacity: 0.4 }}
                    formatter={(value: number | string) => formatBRL(value)}
                  />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Bar dataKey="revenue" fill={colors.success} name="Receita" radius={[0, 4, 4, 0]} />
                  <Bar dataKey="sales" fill={colors.info} name="Vendas" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </ChartCard>
        </TabsContent>
      </Tabs>
    </div>
  );
};
