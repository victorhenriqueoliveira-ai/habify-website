import { AlertTriangle, CheckCircle2, Info, XCircle, type LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

type NoticeTone = 'info' | 'success' | 'warning' | 'destructive';

const tones: Record<NoticeTone, { wrap: string; icon: string; fallback: LucideIcon }> = {
  info: { wrap: 'border-info/25 bg-info/[0.06]', icon: 'text-info', fallback: Info },
  success: { wrap: 'border-success/25 bg-success/[0.06]', icon: 'text-success', fallback: CheckCircle2 },
  warning: { wrap: 'border-warning/30 bg-warning/[0.07]', icon: 'text-warning', fallback: AlertTriangle },
  destructive: { wrap: 'border-destructive/25 bg-destructive/[0.06]', icon: 'text-destructive', fallback: XCircle },
};

interface AdminNoticeProps {
  tone?: NoticeTone;
  title: string;
  description?: ReactNode;
  icon?: LucideIcon;
  /** Ação à direita no desktop, abaixo do texto no mobile. */
  action?: ReactNode;
  className?: string;
}

/**
 * Faixa de aviso do admin — o "Card com borda colorida + ícone em círculo"
 * que várias páginas reescreviam à mão, cada uma com um espaçamento
 * próprio. A cor vem do semântico (verde/âmbar/vermelho), nunca do laranja
 * da marca, que aqui fica só pra ação.
 */
export function AdminNotice({
  tone = 'info',
  title,
  description,
  icon,
  action,
  className,
}: AdminNoticeProps) {
  const { wrap, icon: iconClass, fallback } = tones[tone];
  const Icon = icon ?? fallback;

  return (
    <div
      className={cn(
        'flex flex-wrap items-center gap-x-4 gap-y-3 rounded-lg border px-4 py-3.5',
        wrap,
        className,
      )}
    >
      <Icon className={cn('mt-0.5 h-[18px] w-[18px] shrink-0 self-start', iconClass)} aria-hidden="true" />
      <div className="min-w-[14rem] flex-1">
        <h3 className="text-[14px] font-semibold text-foreground">{title}</h3>
        {description && (
          <p className="mt-0.5 text-[13px] leading-relaxed text-muted-foreground">{description}</p>
        )}
      </div>
      {action && <div className="flex shrink-0 items-center gap-2">{action}</div>}
    </div>
  );
}
