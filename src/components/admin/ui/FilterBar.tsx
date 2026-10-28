import { Search, X } from 'lucide-react';
import type { ReactNode } from 'react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

interface FilterBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  /** Selects, dropdowns e botões à direita da busca. */
  children?: ReactNode;
  className?: string;
}

/**
 * Barra de busca + filtros.
 *
 * Antes cada página embrulhava isto num `Card` com um `CardTitle`
 * "Filtros" — um card inteiro, com título, pra uma caixa de texto. Aqui a
 * barra é só uma faixa, e os filtros quebram pra baixo da busca no mobile
 * em vez de empurrar a tela pro lado.
 */
export function FilterBar({
  value,
  onChange,
  placeholder = 'Buscar...',
  children,
  className,
}: FilterBarProps) {
  return (
    <div className={cn('flex flex-wrap items-center gap-2', className)}>
      <div className="relative min-w-[13rem] flex-1">
        <Search
          className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
          aria-hidden="true"
        />
        <Input
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          className="h-9 pl-9 pr-9"
        />
        {value && (
          <button
            type="button"
            onClick={() => onChange('')}
            aria-label="Limpar busca"
            className="absolute right-2 top-1/2 grid h-6 w-6 -translate-y-1/2 place-items-center rounded text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <X className="h-3.5 w-3.5" aria-hidden="true" />
          </button>
        )}
      </div>
      {children}
    </div>
  );
}
