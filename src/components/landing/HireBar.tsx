import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { BUSINESS, formatBRL } from '@/config/business';
import { usePlans } from '@/hooks/usePlans';
import { HabifyMark } from './HabifyMark';
import { cn } from '@/lib/utils';

/**
 * Barra fixa com o preço e o botão de contratar. Aparece depois do hero e
 * some quando o rodapé entra em cena, pra não cobrir o CTA final.
 */
export function HireBar() {
  const navigate = useNavigate();
  const { plans } = usePlans();
  const [visible, setVisible] = useState(false);

  const plan = plans.find((p) => p.type !== 'domain_registration');

  const prefetchCheckout = useCallback(() => {
    void import('@/pages/CheckoutPage');
  }, []);

  useEffect(() => {
    let ticking = false;

    const update = () => {
      const y = window.scrollY;
      const hero = document.querySelector('[data-hero]') as HTMLElement | null;
      const footer = document.querySelector('footer');
      const pastHero = y > (hero?.offsetHeight ?? 600) - 120;
      const atFooter = footer ? footer.getBoundingClientRect().top < window.innerHeight - 40 : false;
      setVisible(pastHero && !atFooter);
      ticking = false;
    };

    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(update);
    };

    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <div
      className={cn(
        'fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/95 backdrop-blur-md transition-transform duration-300 motion-reduce:transition-none',
        visible ? 'translate-y-0' : 'translate-y-full',
      )}
    >
      <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-3 sm:gap-5 sm:px-6">
        <HabifyMark className="hidden h-5 w-auto flex-none text-primary sm:block" />
        <span className="flex min-w-0 flex-col leading-tight">
          <strong className="truncate text-[13px] font-semibold tracking-[-0.02em] sm:text-[14.5px]">
            Site para corretor de imóveis
          </strong>
          <span className="hidden font-mono text-[11px] text-muted-foreground sm:block">
            publicado hoje · sem mensalidade
          </span>
        </span>
        <strong className="ml-auto flex-none font-display text-lg font-bold tracking-[-0.03em] sm:text-xl">
          R$&nbsp;{formatBRL(BUSINESS.pricing.sitePrice)}
        </strong>
        <button
          type="button"
          onClick={() => (plan ? navigate(`/checkout/${plan.id}`) : (window.location.hash = '#preco'))}
          onMouseEnter={prefetchCheckout}
          onFocus={prefetchCheckout}
          className="inline-flex flex-none items-center gap-2 rounded-lg bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground transition-[filter] hover:brightness-110 sm:px-5 sm:text-[15px]"
        >
          Criar meu site
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}
