import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface DetailFieldProps {
  label: string;
  value?: ReactNode;
  icon?: LucideIcon;
  /** Texto exibido quando não há valor. */
  empty?: string;
  /** Ocupa a linha inteira num grid de campos. */
  wide?: boolean;
  className?: string;
}

/**
 * Par rótulo/valor de uma tela de detalhes.
 *
 * O bloco "ícone + rótulo pequeno + valor em negrito" estava escrito à mão
 * umas vinte vezes só no detalhe do projeto, cada ocorrência com seu
 * próprio tamanho de texto e espaçamento — `text-sm` numa, `text-xs` na
 * de baixo, `space-x-2` aqui e `gap-3` ali.
 */
export function DetailField({
  label,
  value,
  icon: Icon,
  empty = '—',
  wide,
  className,
}: DetailFieldProps) {
  const isEmpty = value === null || value === undefined || value === '';

  return (
    <div className={cn('flex items-start gap-2.5', wide && 'sm:col-span-full', className)}>
      {Icon && (
        <Icon className="mt-[3px] h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
      )}
      <div className="min-w-0">
        <p className="font-mono text-[10px] uppercase tracking-[0.09em] text-muted-foreground">
          {label}
        </p>
        <div
          className={cn(
            'mt-0.5 break-words text-[13.5px] font-semibold',
            isEmpty && 'font-normal text-muted-foreground',
          )}
        >
          {isEmpty ? empty : value}
        </div>
      </div>
    </div>
  );
}

/** Grade padrão de campos dentro de um bloco de detalhes. */
export function DetailGrid({
  children,
  columns = 2,
  className,
}: {
  children: ReactNode;
  columns?: 2 | 3;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'grid gap-x-4 gap-y-4',
        columns === 3 ? 'grid-cols-2 sm:grid-cols-3' : 'grid-cols-1 sm:grid-cols-2',
        className,
      )}
    >
      {children}
    </div>
  );
}
