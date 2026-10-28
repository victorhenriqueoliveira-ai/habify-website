import { chartPalette } from './chartTheme';
import { cn } from '@/lib/utils';

export interface DistributionItem {
  label: string;
  count: number;
  percentage: number;
}

interface DistributionListProps {
  items: DistributionItem[];
  /** Palavra que acompanha a contagem, ex: "pedidos", "usuários". */
  unit?: string;
  className?: string;
}

/**
 * Lista de distribuição com barra proporcional — "X% dos pedidos estão
 * pagos", "Y% dos usuários são corretores".
 *
 * Estava escrita duas vezes, igual, no dashboard de vendas e no de
 * usuários; as duas com a barra em `w-32` fixo, que estourava no celular.
 * Aqui a barra ocupa o espaço que sobra.
 */
export function DistributionList({ items, unit = 'itens', className }: DistributionListProps) {
  const palette = chartPalette();

  return (
    <ul className={cn('space-y-3', className)}>
      {items.map((item, index) => {
        const color = palette[index % palette.length];
        return (
          <li key={item.label} className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
            <span
              className="h-2.5 w-2.5 shrink-0 rounded-full"
              style={{ backgroundColor: color }}
              aria-hidden="true"
            />
            <span className="min-w-[6rem] text-[13.5px] font-medium capitalize">{item.label}</span>
            <span className="font-mono text-[11px] tabular-nums text-muted-foreground">
              {item.count} {unit}
            </span>
            <div className="h-1.5 min-w-[4rem] flex-1 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full"
                style={{ width: `${item.percentage}%`, backgroundColor: color }}
              />
            </div>
            <span className="w-12 text-right font-mono text-[11.5px] tabular-nums text-muted-foreground">
              {item.percentage.toFixed(1)}%
            </span>
          </li>
        );
      })}
    </ul>
  );
}
