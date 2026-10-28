import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface ChartCardProps {
  title: string;
  description?: string;
  /** Ações no canto superior direito (seletor de série, link, botão). */
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
}

/**
 * Moldura padrão de um gráfico no admin — título, descrição e o desenho
 * numa área com padding próprio.
 *
 * O `min-w-0` no contêiner do gráfico não é decorativo: sem ele o
 * `ResponsiveContainer` dentro de um grid flexível mede a largura do
 * conteúdo em vez da coluna e o gráfico estoura pro lado no mobile.
 */
export function ChartCard({ title, description, actions, children, className }: ChartCardProps) {
  return (
    <section className={cn('admin-card-elevated flex flex-col', className)}>
      <header className="flex flex-wrap items-start justify-between gap-x-3 gap-y-2 border-b border-border p-4 sm:p-5">
        <div className="min-w-0">
          <h3 className="font-display text-[15.5px] font-bold tracking-[-0.02em] text-foreground">{title}</h3>
          {description && (
            <p className="mt-0.5 text-[12.5px] leading-relaxed text-muted-foreground">{description}</p>
          )}
        </div>
        {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
      </header>
      <div className="min-w-0 flex-1 p-3 sm:p-4">{children}</div>
    </section>
  );
}
