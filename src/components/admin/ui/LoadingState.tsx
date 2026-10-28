import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LoadingStateProps {
  label?: string;
  size?: 'sm' | 'md' | 'lg';
  /** Centraliza na tela toda (uso em carregamento de página inteira). */
  fullScreen?: boolean;
}

const sizeClass = { sm: 'h-4 w-4', md: 'h-5 w-5', lg: 'h-7 w-7' } as const;

/**
 * Spinner de carregamento padrão do admin — substitui os 15+ divs de
 * `animate-spin rounded-full border-b-2 border-primary` copiados à mão
 * com tamanhos inconsistentes pelas páginas.
 */
export function LoadingState({ label = 'Carregando...', size = 'md', fullScreen = false }: LoadingStateProps) {
  const content = (
    <div className="flex flex-col items-center gap-2.5 text-center">
      <Loader2 className={cn(sizeClass[size], 'animate-spin text-primary')} aria-hidden="true" />
      {label && (
        <p className="font-mono text-[11px] uppercase tracking-[0.08em] text-muted-foreground">{label}</p>
      )}
    </div>
  );

  return fullScreen ? (
    <div className="flex min-h-[55vh] items-center justify-center">{content}</div>
  ) : (
    content
  );
}

/**
 * Esqueleto de lista/tabela. Preferir isto ao spinner quando já se sabe a
 * forma do conteúdo que vai chegar: a tela não "salta" quando os dados
 * entram, porque as faixas já ocupam a altura final.
 */
export function SkeletonRows({ rows = 5, className }: { rows?: number; className?: string }) {
  return (
    <div className={cn('space-y-2', className)} aria-hidden="true">
      {Array.from({ length: rows }).map((_, index) => (
        <div
          key={index}
          className="h-14 animate-pulse rounded-lg border border-border bg-muted/60"
          style={{ animationDelay: `${index * 70}ms` }}
        />
      ))}
    </div>
  );
}
