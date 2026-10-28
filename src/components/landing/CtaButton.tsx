import { useCallback, type ReactNode } from 'react';
import { ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CtaButtonProps {
  children: ReactNode;
  href?: string;
  onClick?: () => void;
  disabled?: boolean;
  size?: 'md' | 'lg';
  className?: string;
  /** Pré-carrega o chunk do checkout no hover/foco — sem isso o clique
   *  espera o download e parece que a página travou. */
  prefetchCheckout?: boolean;
}

/**
 * CTA principal da landing. O brilho varrendo (animate-cta-sweep) é o que
 * puxa o olho para o ponto de conversão — por isso só este botão tem, e
 * nenhum outro elemento da página usa laranja de fundo.
 */
export function CtaButton({
  children,
  href,
  onClick,
  disabled,
  size = 'lg',
  className,
  prefetchCheckout,
}: CtaButtonProps) {
  const prefetch = useCallback(() => {
    if (prefetchCheckout) void import('@/pages/CheckoutPage');
  }, [prefetchCheckout]);

  const classes = cn(
    'group relative isolate inline-flex items-center justify-center gap-2.5 overflow-hidden rounded-xl',
    'bg-primary font-semibold text-primary-foreground shadow-lg shadow-primary/25',
    'transition-[filter,transform] hover:-translate-y-0.5 hover:brightness-110',
    'disabled:translate-y-0 disabled:opacity-60 disabled:shadow-none',
    size === 'lg' ? 'px-8 py-4 text-[16.5px]' : 'px-6 py-3.5 text-base',
    className,
  );

  const inner = (
    <>
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10 motion-safe:animate-cta-sweep"
        style={{
          background:
            'linear-gradient(105deg, transparent 35%, rgba(255,255,255,0.42) 50%, transparent 65%)',
        }}
      />
      {children}
      <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
    </>
  );

  if (href) {
    return (
      <a href={href} onMouseEnter={prefetch} onFocus={prefetch} className={classes}>
        {inner}
      </a>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      onMouseEnter={prefetch}
      onFocus={prefetch}
      disabled={disabled}
      className={classes}
    >
      {inner}
    </button>
  );
}
