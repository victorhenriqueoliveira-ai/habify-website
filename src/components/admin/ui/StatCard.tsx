import { TrendingDown, TrendingUp, type LucideIcon } from 'lucide-react';
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
 *
 * O rótulo vai em mono maiúsculo e o número em tabular-nums, pro valor
 * ficar alinhado de um card pro outro mesmo com dígitos de larguras
 * diferentes.
 */
export function StatCard({ label, value, icon: Icon, description, tone = 'default', trend }: StatCardProps) {
  const TrendIcon = trend && trend.value >= 0 ? TrendingUp : TrendingDown;

  return (
    <div className="admin-card-elevated p-4 sm:p-[18px]">
      <div className="flex items-start justify-between gap-2">
        <span className="font-mono text-[10px] uppercase leading-4 tracking-[0.09em] text-muted-foreground">
          {label}
        </span>
        {Icon && <Icon className={cn('h-4 w-4 shrink-0', toneClass[tone])} aria-hidden="true" />}
      </div>

      <div
        className={cn(
          'mt-2.5 font-display text-[26px] font-bold leading-none tracking-[-0.03em] tabular-nums',
          toneClass[tone],
        )}
      >
        {value}
      </div>

      {(description || trend) && (
        <div className="mt-2 flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-[12px] text-muted-foreground">
          {trend && (
            <span
              className={cn(
                'inline-flex items-center gap-1 font-medium tabular-nums',
                trend.value >= 0 ? 'text-success' : 'text-destructive',
              )}
            >
              <TrendIcon className="h-3 w-3" aria-hidden="true" />
              {trend.value >= 0 ? '+' : ''}
              {trend.value}%
            </span>
          )}
          <span className="truncate">{trend?.label ?? description}</span>
        </div>
      )}
    </div>
  );
}

export function StatCardGrid({ children }: { children: ReactNode }) {
  return <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">{children}</div>;
}
