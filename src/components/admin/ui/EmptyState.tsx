import { Inbox, type LucideIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: { label: string; onClick: () => void; icon?: LucideIcon };
  className?: string;
}

/**
 * Estado vazio padrão do admin — substitui os `<div className="text-center
 * py-8">` escritos à mão em cada página. Não embrulha em Card — quem chama
 * decide se coloca dentro de um `admin-card-elevated`/`Card` ou não.
 */
export function EmptyState({
  icon: Icon = Inbox,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center px-6 py-12 text-center', className)}>
      <span className="mb-4 grid h-12 w-12 place-items-center rounded-xl border border-border bg-muted text-muted-foreground">
        <Icon className="h-5 w-5" aria-hidden="true" />
      </span>
      <h3 className="font-display text-[16px] font-bold tracking-[-0.02em] text-foreground">{title}</h3>
      {description && (
        <p className="mt-1.5 max-w-[34ch] text-[13.5px] leading-relaxed text-muted-foreground">
          {description}
        </p>
      )}
      {action && (
        <Button onClick={action.onClick} className="mt-5">
          {action.icon && <action.icon className="mr-2 h-4 w-4" aria-hidden="true" />}
          {action.label}
        </Button>
      )}
    </div>
  );
}
