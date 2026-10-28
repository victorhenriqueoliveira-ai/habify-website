import { useNavigate } from 'react-router-dom';
import { BUSINESS, formatBRL } from '@/config/business';
import { usePlans } from '@/hooks/usePlans';
import { Reveal } from './Reveal';
import { CtaButton } from './CtaButton';

export function FinalCta() {
  const navigate = useNavigate();
  const { plans } = usePlans();
  const plan = plans.find((p) => p.type !== 'domain_registration');

  return (
    <section className="relative overflow-hidden bg-foreground py-24 text-background">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-[0.14]"
        style={{
          backgroundImage:
            'linear-gradient(hsl(var(--background)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--background)) 1px, transparent 1px)',
          backgroundSize: '68px 68px',
          maskImage: 'radial-gradient(ellipse 62% 70% at 50% 42%, #000 0%, transparent 70%)',
          WebkitMaskImage: 'radial-gradient(ellipse 62% 70% at 50% 42%, #000 0%, transparent 70%)',
        }}
      />

      <div className="relative mx-auto max-w-6xl px-4 text-center sm:px-6">
        <Reveal>
          <h2 className="font-display text-[clamp(1.7rem,3.5vw,2.5rem)] font-semibold tracking-[-0.035em] text-balance">
            Seu concorrente já tem site. <em className="not-italic text-primary">E você?</em>
          </h2>
          <p className="mx-auto mt-4 max-w-[50ch] text-[17px] leading-relaxed text-background/60">
            Preencher leva cinco minutos e o site fica pronto hoje. Pagamento único, e se não gostar você tem{' '}
            {BUSINESS.pricing.guaranteeDays} dias de garantia.
          </p>

          <CtaButton
            onClick={() => (plan ? navigate(`/checkout/${plan.id}`) : (window.location.hash = '#preco'))}
            className="mt-9"
            prefetchCheckout
          >
            Criar meu site agora
          </CtaButton>

          <p className="mt-4 flex flex-wrap items-center justify-center gap-2 font-mono text-[11.5px] text-background/50">
            R$ {formatBRL(BUSINESS.pricing.sitePrice)}
            <span className="text-background/25">/</span> sem mensalidade
            <span className="text-background/25">/</span> sem fidelidade
          </p>
        </Reveal>
      </div>
    </section>
  );
}
