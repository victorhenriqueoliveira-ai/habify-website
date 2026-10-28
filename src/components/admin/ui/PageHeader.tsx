import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface PageHeaderProps {
  title: string;
  description?: string;
  icon?: LucideIcon;
  /** Rótulo em mono acima do título — a seção a que a página pertence. */
  eyebrow?: string;
  actions?: ReactNode;
  className?: string;
}

/**
 * Cabeçalho padrão de página do admin.
 *
 * O ícone sai do quadrado laranja que existia antes: laranja é reservado
 * pra ação (botões, item ativo), então aqui ele fica neutro e o que
 * identifica a seção é o eyebrow em mono — o mesmo recurso dos rótulos de
 * grupo da sidebar.
 */
export function PageHeader({
  title,
  description,
  icon: Icon,
  eyebrow,
  actions,
  className,
}: PageHeaderProps) {
  return (
    <div className={cn('flex flex-wrap items-start justify-between gap-x-4 gap-y-3', className)}>
      <div className="flex min-w-0 items-start gap-3">
        {Icon && (
          <span className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-border bg-card text-muted-foreground">
            <Icon className="h-[17px] w-[17px]" aria-hidden="true" />
          </span>
        )}
        <div className="min-w-0">
          {eyebrow && (
            <p className="mb-1 font-mono text-[10px] uppercase tracking-[0.09em] text-muted-foreground">
              {eyebrow}
            </p>
          )}
          <h1 className="font-display text-[22px] font-bold tracking-[-0.025em] text-foreground sm:text-[26px]">
            {title}
          </h1>
          {description && (
            <p className="mt-1 max-w-prose text-[13.5px] leading-relaxed text-muted-foreground">
              {description}
            </p>
          )}
        </div>
      </div>
      {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}
