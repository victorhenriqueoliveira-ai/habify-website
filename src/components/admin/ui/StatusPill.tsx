import { cn } from '@/lib/utils';

export type StatusTone = 'neutral' | 'primary' | 'warning' | 'info' | 'success' | 'destructive';

const toneClass: Record<StatusTone, string> = {
  neutral: 'border-border bg-muted text-muted-foreground',
  primary: 'border-primary/25 bg-primary/10 text-primary',
  warning: 'border-warning/25 bg-warning/10 text-warning',
  info: 'border-info/25 bg-info/10 text-info',
  success: 'border-success/25 bg-success/10 text-success',
  destructive: 'border-destructive/25 bg-destructive/10 text-destructive',
};

const dotClass: Record<StatusTone, string> = {
  neutral: 'bg-muted-foreground',
  primary: 'bg-primary',
  warning: 'bg-warning',
  info: 'bg-info',
  success: 'bg-success',
  destructive: 'bg-destructive',
};

interface StatusPillProps {
  label: string;
  tone?: StatusTone;
  /** Pulsa o ponto — pra estado em curso (gerando, publicando, na fila). */
  pulse?: boolean;
  className?: string;
}

/**
 * Pílula de status do admin.
 *
 * Existe porque o `Badge` do shadcn só tem `default | secondary | outline |
 * destructive` — então "Pendente", "Em revisão" e "Concluído" acabavam
 * todos com a mesma aparência, e as páginas contornavam isso com
 * `text-yellow-600`/`text-green-600` fora do design system. Aqui o estado
 * é lido pela cor **e** pelo ponto, não só pelo texto.
 */
export function StatusPill({ label, tone = 'neutral', pulse, className }: StatusPillProps) {
  return (
    <span
      className={cn(
        'inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border px-2 py-0.5 text-[11.5px] font-medium',
        toneClass[tone],
        className,
      )}
    >
      <span
        className={cn(
          'h-1.5 w-1.5 shrink-0 rounded-full',
          dotClass[tone],
          pulse && 'motion-safe:animate-pulse',
        )}
        aria-hidden="true"
      />
      {label}
    </span>
  );
}
