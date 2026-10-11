import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

type StatCardTone = 'default' | 'primary' | 'warning' | 'info' | 'success' | 'destructive';

interface StatCardProps {
  label: string;
  value: string | number;
  icon?: LucideIcon;
  description?: string;
  tone?: StatCardTone;
  /** Variação percentual vs. período anterior, ex: { value: 12, label: 'vs mês anterior' }. */
  trend?: { value: number; label?: string };
}

const toneClass: Record<StatCardTone, string> = {
  default: 'text-foreground',
  primary: 'text-primary',
  warning: 'text-warning',
  info: 'text-info',
  success: 'text-success',
  destructive: 'text-destructive',
};

/**
 * Card de estatística padrão do admin — substitui as 3 implementações
 * duplicadas de MetricCard (SalesDashboard/UsersDashboard/ProjectsDashboard)
 * e os grids de stat escritos à mão em outras páginas.
 */
export function StatCard({ label, value, icon: Icon, description, tone = 'default', trend }: StatCardProps) {
  return (
    <div className="admin-card-elevated p-5">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-muted-foreground">{label}</span>
        {Icon && <Icon className={cn('h-4 w-4', toneClass[tone])} />}
      </div>
      <div className={cn('mt-2 text-2xl font-semibold', toneClass[tone])}>{value}</div>
      {(description || trend) && (
        <div className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
          {trend && (
            <span className={trend.value >= 0 ? 'text-success' : 'text-destructive'}>
              {trend.value >= 0 ? '+' : ''}
              {trend.value}%
            </span>
          )}
          {trend?.label ?? description}
        </div>
      )}
    </div>
  );
}

export function StatCardGrid({ children }: { children: ReactNode }) {
  return <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{children}</div>;
}
