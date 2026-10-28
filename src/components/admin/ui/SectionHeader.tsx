import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

type SectionTone = 'default' | 'primary' | 'warning' | 'info' | 'success' | 'destructive';

const countClass: Record<SectionTone, string> = {
  default: 'border-border text-muted-foreground',
  primary: 'border-primary/30 bg-primary/10 text-primary',
  warning: 'border-warning/30 bg-warning/10 text-warning',
  info: 'border-info/30 bg-info/10 text-info',
  success: 'border-success/30 bg-success/10 text-success',
  destructive: 'border-destructive/30 bg-destructive/10 text-destructive',
};

interface SectionHeaderProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  /** Contagem exibida numa pílula em mono ao lado do título. */
  count?: number;
  tone?: SectionTone;
  actions?: ReactNode;
  className?: string;
}

/**
 * Cabeçalho de uma seção dentro de uma página — um nível abaixo do
 * `PageHeader`. Substitui o `CardHeader` com `CardTitle` de ícone+contagem
 * entre parênteses: a contagem vira pílula em mono, o que deixa de disputar
 * leitura com o título.
 */
export function SectionHeader({
  icon: Icon,
  title,
  description,
  count,
  tone = 'default',
  actions,
  className,
}: SectionHeaderProps) {
  return (
    <div className={cn('flex flex-wrap items-center justify-between gap-x-3 gap-y-2', className)}>
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          {Icon && <Icon className="h-[17px] w-[17px] shrink-0 text-muted-foreground" aria-hidden="true" />}
          <h2 className="font-display text-[16.5px] font-bold tracking-[-0.02em] text-foreground">{title}</h2>
          {count !== undefined && (
            <span
              className={cn(
                'rounded-full border px-2 py-px font-mono text-[10.5px] font-medium tabular-nums',
                countClass[tone],
              )}
            >
              {count}
            </span>
          )}
        </div>
        {description && (
          <p className="mt-1 max-w-prose text-[13px] leading-relaxed text-muted-foreground">{description}</p>
        )}
      </div>
      {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
    </div>
  );
}
