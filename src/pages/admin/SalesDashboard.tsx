import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { DashboardFilters } from '@/components/admin/DashboardFilters';
import { useAnalyticsDashboard } from '@/hooks/useAnalyticsDashboard';
import {
  BarChart,
  Bar,
  LineChart,
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
import {
  DollarSign,
  ShoppingCart,
  TrendingUp,
  CreditCard,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react';

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

const MetricCard = ({ 
  title, 
  value, 
  change, 
  icon: Icon,
  prefix = '',
  suffix = '',
}: {
  title: string;
  value: string | number;
  change?: number;
  icon: React.ElementType;
  prefix?: string;
  suffix?: string;
}) => {
  const isPositive = change && change > 0;
  
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">
          {prefix}{typeof value === 'number' ? value.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) : value}{suffix}
        </div>
        {change !== undefined && (
          <div className={`flex items-center text-xs mt-1 ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
            {isPositive ? <ArrowUpRight className="h-3 w-3 mr-1" /> : <ArrowDownRight className="h-3 w-3 mr-1" />}
            {Math.abs(change).toFixed(1)}% vs período anterior
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export const SalesDashboard = () => {
  const [selectedPeriod, setSelectedPeriod] = useState('30days');
  const [selectedGateway, setSelectedGateway] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');

  const { 
    salesMetrics, 
    loading, 
    updateDateRange, 
    updateFilters,
    refetch 
  } = useAnalyticsDashboard({
    gateway: selectedGateway === 'all' ? undefined : selectedGateway,
    status: selectedStatus === 'all' ? undefined : selectedStatus,
  });

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

  const activeFiltersCount = [
    selectedGateway !== 'all',
    selectedStatus !== 'all',
  ].filter(Boolean).length;

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
        <h1 className="text-3xl font-bold tracking-tight mb-2">💰 Dashboard de Vendas</h1>
        <p className="text-muted-foreground">
          Análise completa de receita, conversões e performance de vendas
        </p>
      </div>

      {/* Filters */}
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

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Receita Total"
          value={salesMetrics?.totalRevenue || 0}
          icon={DollarSign}
          prefix="R$ "
        />
        <MetricCard
          title="Total de Pedidos"
          value={salesMetrics?.totalOrders || 0}
          icon={ShoppingCart}
        />
        <MetricCard
          title="Ticket Médio"
          value={salesMetrics?.averageOrderValue || 0}
          icon={CreditCard}
          prefix="R$ "
        />
        <MetricCard
          title="Taxa de Conversão"
          value={(salesMetrics?.conversionRate || 0).toFixed(1)}
          icon={TrendingUp}
          suffix="%"
        />
      </div>

      {/* Charts */}
      <Tabs defaultValue="revenue" className="space-y-4">
        <TabsList>
          <TabsTrigger value="revenue">Receita por Período</TabsTrigger>
          <TabsTrigger value="gateways">Por Gateway</TabsTrigger>
          <TabsTrigger value="status">Por Status</TabsTrigger>
          <TabsTrigger value="plans">Top Planos</TabsTrigger>
        </TabsList>

        {/* Revenue Chart */}
        <TabsContent value="revenue" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Evolução de Receita</CardTitle>
              <CardDescription>Receita e volume de pedidos ao longo do tempo</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={350}>
                <AreaChart data={salesMetrics?.revenueByDay || []}>
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis yAxisId="left" />
                  <YAxis yAxisId="right" orientation="right" />
                  <Tooltip 
                    formatter={(value: any, name: string) => [
                      name === 'revenue' ? `R$ ${Number(value).toFixed(2)}` : value,
                      name === 'revenue' ? 'Receita' : 'Pedidos'
                    ]}
                  />
                  <Legend />
                  <Area 
                    yAxisId="left"
                    type="monotone" 
                    dataKey="revenue" 
                    stroke="#10b981" 
                    fillOpacity={1} 
                    fill="url(#colorRevenue)" 
                  />
                  <Line yAxisId="right" type="monotone" dataKey="orders" stroke="#3b82f6" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Gateways Chart */}
        <TabsContent value="gateways" className="space-y-4">
          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Receita por Gateway</CardTitle>
                <CardDescription>Distribuição de receita por método de pagamento</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={salesMetrics?.revenueByGateway || []}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ gateway, revenue }) => `${gateway}: R$ ${revenue.toFixed(0)}`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="revenue"
                    >
                      {(salesMetrics?.revenueByGateway || []).map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: any) => `R$ ${Number(value).toFixed(2)}`} />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Performance dos Gateways</CardTitle>
                <CardDescription>Volume de transações por gateway</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={salesMetrics?.revenueByGateway || []}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="gateway" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="count" fill="#3b82f6" name="Transações" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Status Chart */}
        <TabsContent value="status" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Distribuição por Status</CardTitle>
              <CardDescription>Status dos pedidos no sistema</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {(salesMetrics?.ordersByStatus || []).map((item, index) => (
                  <div key={item.status} className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div 
                        className="w-4 h-4 rounded" 
                        style={{ backgroundColor: COLORS[index % COLORS.length] }}
                      />
                      <span className="text-sm font-medium capitalize">{item.status}</span>
                    </div>
                    <div className="flex items-center space-x-4">
                      <Badge variant="secondary">{item.count} pedidos</Badge>
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
        </TabsContent>

        {/* Top Plans */}
        <TabsContent value="plans" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Top 5 Planos Mais Vendidos</CardTitle>
              <CardDescription>Receita gerada por cada plano</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={350}>
                <BarChart data={salesMetrics?.topPlans || []} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis dataKey="name" type="category" width={150} />
                  <Tooltip formatter={(value: any) => `R$ ${Number(value).toFixed(2)}`} />
                  <Legend />
                  <Bar dataKey="revenue" fill="#10b981" name="Receita" />
                  <Bar dataKey="sales" fill="#3b82f6" name="Vendas" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
