import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LoadingStateProps {
  label?: string;
  size?: 'sm' | 'md' | 'lg';
  /** Centraliza na tela toda (uso em carregamento de página inteira). */
  fullScreen?: boolean;
}

const sizeClass = { sm: 'h-6 w-6', md: 'h-8 w-8', lg: 'h-12 w-12' } as const;

/**
 * Spinner de carregamento padrão do admin — substitui os 15+ divs de
 * `animate-spin rounded-full border-b-2 border-primary` copiados à mão
 * com tamanhos inconsistentes pelas páginas.
 */
export function LoadingState({ label = 'Carregando...', size = 'md', fullScreen = false }: LoadingStateProps) {
  const content = (
    <div className="flex flex-col items-center gap-3 text-center">
      <Loader2 className={cn(sizeClass[size], 'animate-spin text-primary')} />
      {label && <p className="text-sm text-muted-foreground">{label}</p>}
    </div>
  );

  return fullScreen ? (
    <div className="flex min-h-[60vh] items-center justify-center">{content}</div>
  ) : (
    content
  );
}
