import { Card } from '@/components/ui/card';
import { useMaintenancesStats } from '@/hooks/useMaintenancesStats';
import { Skeleton } from '@/components/ui/skeleton';
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
  Cell
} from 'recharts';
import { DollarSign, TrendingUp, Clock, CheckCircle2, XCircle } from 'lucide-react';

const COLORS = ['#10b981', '#ef4444', '#f59e0b'];

export default function MaintenancesDashboard() {
  const { data: stats, isLoading } = useMaintenancesStats();

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Dashboard de Manutenções</h1>
          <p className="text-muted-foreground">Análise de receita e performance</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="p-6">
              <Skeleton className="h-20 w-full" />
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (!stats) return null;

  const statusData = [
    { name: 'Ativas', value: stats.activeMaintenances, color: COLORS[0] },
    { name: 'Expiradas', value: stats.expiredMaintenances, color: COLORS[1] },
    { name: 'Pendentes', value: stats.pendingMaintenances, color: COLORS[2] }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Dashboard de Manutenções</h1>
        <p className="text-muted-foreground">Análise de receita e performance</p>
      </div>

      {/* Cards de Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Receita Total</p>
              <p className="text-2xl font-bold">
                R$ {stats.totalRevenue.toFixed(2)}
              </p>
            </div>
            <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-full">
              <DollarSign className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Manutenções Ativas</p>
              <p className="text-2xl font-bold">{stats.activeMaintenances}</p>
            </div>
            <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-full">
              <CheckCircle2 className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Taxa de Renovação</p>
              <p className="text-2xl font-bold">{stats.renewalRate.toFixed(1)}%</p>
            </div>
            <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-full">
              <TrendingUp className="h-6 w-6 text-purple-600 dark:text-purple-400" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Expiradas</p>
              <p className="text-2xl font-bold">{stats.expiredMaintenances}</p>
            </div>
            <div className="p-3 bg-red-100 dark:bg-red-900/30 rounded-full">
              <XCircle className="h-6 w-6 text-red-600 dark:text-red-400" />
            </div>
          </div>
        </Card>
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Receita Mensal */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Receita Mensal (Últimos 6 Meses)</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={stats.monthlyRevenue}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip 
                formatter={(value: number) => `R$ ${value.toFixed(2)}`}
                contentStyle={{ 
                  backgroundColor: 'hsl(var(--background))',
                  border: '1px solid hsl(var(--border))'
                }}
              />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="revenue" 
                stroke="hsl(var(--primary))" 
                strokeWidth={2}
                name="Receita"
              />
            </LineChart>
          </ResponsiveContainer>
        </Card>

        {/* Quantidade de Manutenções por Mês */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Manutenções Contratadas (Últimos 6 Meses)</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={stats.monthlyRevenue}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'hsl(var(--background))',
                  border: '1px solid hsl(var(--border))'
                }}
              />
              <Legend />
              <Bar 
                dataKey="count" 
                fill="hsl(var(--primary))" 
                name="Quantidade"
              />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        {/* Status das Manutenções */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Distribuição por Status</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={statusData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {statusData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'hsl(var(--background))',
                  border: '1px solid hsl(var(--border))'
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </Card>

        {/* Métricas Adicionais */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Métricas de Performance</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center p-4 bg-muted rounded-lg">
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-muted-foreground" />
                <span className="text-sm font-medium">Manutenções Pendentes</span>
              </div>
              <span className="text-lg font-bold">{stats.pendingMaintenances}</span>
            </div>
            
            <div className="flex justify-between items-center p-4 bg-muted rounded-lg">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
                <span className="text-sm font-medium">Taxa de Conclusão</span>
              </div>
              <span className="text-lg font-bold">{stats.renewalRate.toFixed(1)}%</span>
            </div>
            
            <div className="flex justify-between items-center p-4 bg-muted rounded-lg">
              <div className="flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-muted-foreground" />
                <span className="text-sm font-medium">Ticket Médio</span>
              </div>
              <span className="text-lg font-bold">
                R$ {(stats.totalRevenue / (stats.activeMaintenances + stats.expiredMaintenances + stats.pendingMaintenances || 1)).toFixed(2)}
              </span>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
