import { useEffect, useState } from 'react';
import { ArrowRight, Lock } from 'lucide-react';
import { BUSINESS, formatBRL } from '@/config/business';
import { cn } from '@/lib/utils';
import { CtaButton } from './CtaButton';

const DEPLOY_STEPS = [
  { label: 'Conteúdo gerado', time: '1.2s' },
  { label: 'Repositório criado', time: '3.4s' },
  { label: 'Build concluído', time: '18.6s' },
  { label: 'Publicado na Vercel', time: '42.0s' },
];

/** Passos do deploy acendendo em sequência — nascem todos prontos no HTML. */
function DeployPanel() {
  const [done, setDone] = useState(DEPLOY_STEPS.length);

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    setDone(0);
    const timers = DEPLOY_STEPS.map((_, i) =>
      window.setTimeout(() => setDone((n) => Math.max(n, i + 1)), 420 + i * 520),
    );
    return () => timers.forEach(window.clearTimeout);
  }, []);

  return (
    <div className="absolute -bottom-6 left-0 w-[min(17.5rem,86%)] rounded-xl border border-border bg-background p-4 shadow-xl motion-safe:animate-pop-in sm:-left-6" style={{ animationDelay: '0.58s' }}>
      <div className="mb-3 flex items-center gap-2 border-b border-border pb-3">
        <span className="font-mono text-[11px] text-muted-foreground">deploy</span>
        <span className="ml-auto inline-flex items-center gap-1.5 rounded-full bg-success/10 px-2 py-0.5 font-mono text-[10px] font-medium text-success">
          <span className="h-1.5 w-1.5 rounded-full bg-success motion-safe:animate-pulse" />
          no ar
        </span>
      </div>
      <ol className="flex flex-col gap-2.5">
        {DEPLOY_STEPS.map((step, i) => {
          const isDone = i < done;
          return (
            <li
              key={step.label}
              className={cn(
                'flex items-center gap-2.5 font-mono text-[11.5px] transition-opacity duration-500',
                isDone ? 'text-muted-foreground opacity-100' : 'text-muted-foreground opacity-30',
              )}
            >
              <span
                className={cn(
                  'grid h-3.5 w-3.5 flex-none place-items-center rounded-full border text-[8px] text-background transition-colors',
                  isDone ? 'border-success bg-success' : 'border-input',
                )}
              >
                {isDone ? '✓' : ''}
              </span>
              {step.label}
              <time className={cn('ml-auto text-[10.5px] transition-opacity', isDone ? 'opacity-100' : 'opacity-0')}>
                {step.time}
              </time>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

/** Anel do PageSpeed, desenhado de 0 a 100 ao carregar. */
function ScoreRing() {
  const CIRCUMFERENCE = 119.4;
  const [value, setValue] = useState(100);

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    setValue(0);
    const start = window.setTimeout(() => {
      const t0 = performance.now();
      const tick = (now: number) => {
        const k = Math.min(1, (now - t0) / 1500);
        setValue(Math.round(100 * (1 - Math.pow(1 - k, 3))));
        if (k < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    }, 700);
    return () => window.clearTimeout(start);
  }, []);

  return (
    <div className="absolute -top-5 right-0 flex items-center gap-3 rounded-xl border border-border bg-background px-4 py-3 shadow-xl motion-safe:animate-pop-in sm:-right-5" style={{ animationDelay: '0.42s' }}>
      <div className="relative h-11 w-11 flex-none">
        <svg viewBox="0 0 46 46" className="block -rotate-90" aria-hidden="true">
          <circle cx="23" cy="23" r="19" fill="none" strokeWidth="5" className="stroke-success/15" />
          <circle
            cx="23"
            cy="23"
            r="19"
            fill="none"
            strokeWidth="5"
            strokeLinecap="round"
            strokeDasharray={CIRCUMFERENCE}
            strokeDashoffset={CIRCUMFERENCE * (1 - value / 100)}
            className="stroke-success"
          />
        </svg>
        <span className="absolute inset-0 grid place-items-center font-mono text-xs font-medium text-success">
          {value}
        </span>
      </div>
      <p className="font-mono text-[10.5px] leading-snug text-muted-foreground">
        <strong className="block text-[11.5px] font-medium text-foreground">PageSpeed</strong>
        Performance
        <br />e SEO
      </p>
    </div>
  );
}

export function Hero() {
  return (
    <header data-hero className="relative overflow-hidden border-b border-border py-16 md:py-20">
      {/* grade de blueprint, bem discreta */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-[0.55]"
        style={{
          backgroundImage:
            'linear-gradient(hsl(var(--border)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--border)) 1px, transparent 1px)',
          backgroundSize: '68px 68px',
          maskImage: 'radial-gradient(ellipse 80% 62% at 28% 36%, #000 0%, transparent 72%)',
          WebkitMaskImage: 'radial-gradient(ellipse 80% 62% at 28% 36%, #000 0%, transparent 72%)',
        }}
      />

      <div className="relative mx-auto max-w-6xl px-4 sm:px-6">
        <div className="grid items-center gap-14 lg:grid-cols-[1.02fr_1fr] lg:gap-14">
          <div className="flex flex-col items-start">
            <span className="mb-5 inline-flex items-center gap-2 rounded-lg border border-border bg-muted px-3 py-1.5 font-mono text-[11.5px] text-muted-foreground">
              <span className="h-1.5 w-1.5 rounded-full bg-success motion-safe:animate-pulse" />
              <strong className="font-medium text-success">build 00:42</strong> · publicado automaticamente
            </span>

            <h1 className="font-display text-[clamp(2rem,4.6vw,3.5rem)] font-semibold leading-[1.08] tracking-[-0.04em] text-balance">
              Site para corretor de imóveis, em React. <em className="not-italic text-primary">No ar hoje.</em>
            </h1>

            <p className="mt-5 max-w-[52ch] text-lg leading-relaxed text-muted-foreground">
              Mesma tecnologia que Airbnb e QuintoAndar usam. Você preenche os dados do imóvel, a plataforma
              compila e publica. <strong className="font-semibold text-foreground">Carrega em menos de 1 segundo</strong>,
              o Google indexa, e o lead cai direto no seu WhatsApp.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-3.5">
              <CtaButton href="#preco" size="md">Criar meu site agora</CtaButton>
              <a
                href="#portfolio"
                className="inline-flex items-center rounded-xl border border-input px-6 py-3.5 font-semibold transition-colors hover:bg-muted"
              >
                Ver sites prontos
              </a>
            </div>

            <p className="mt-4 flex flex-wrap items-center gap-2 font-mono text-[11.5px] text-muted-foreground">
              R$ {formatBRL(BUSINESS.pricing.sitePrice)}, pagamento único
              <span className="text-border">/</span> sem mensalidade
              <span className="text-border">/</span> código-fonte é seu
            </p>
          </div>

          <div className="relative motion-safe:animate-float">
            <div
              aria-hidden="true"
              className="pointer-events-none absolute -inset-x-8 -inset-y-10 -z-10 rounded-full bg-primary/15 blur-3xl motion-safe:animate-breathe"
            />
            <div className="overflow-hidden rounded-xl border border-border bg-background shadow-2xl motion-safe:animate-pop-in">
              <div className="flex items-center gap-2 border-b border-border bg-muted px-3 py-2.5">
                <span className="h-2 w-2 rounded-full bg-input" />
                <span className="h-2 w-2 rounded-full bg-input" />
                <span className="h-2 w-2 rounded-full bg-input" />
                <span className="ml-2 flex flex-1 items-center gap-1.5 rounded-md border border-border bg-background px-2.5 py-1 font-mono text-[11px] text-muted-foreground">
                  <Lock className="h-2.5 w-2.5 text-success" aria-hidden="true" />
                  seusite<span className="text-muted-foreground/70">.com.br</span>
                </span>
              </div>
              <img
                src="/fotos/site_mariamarcia.webp"
                alt="Site para corretora de imóveis publicado pela Habify"
                width={1470}
                height={785}
                className="block w-full"
                style={{ aspectRatio: '1470 / 785', objectFit: 'cover', objectPosition: 'top center' }}
              />
            </div>

            <ScoreRing />
            <DeployPanel />
          </div>
        </div>

        <ul className="mt-14 flex flex-wrap items-center gap-x-7 gap-y-2.5 border-t border-border pt-5 font-mono text-[11.5px] text-muted-foreground">
          <li><strong className="font-medium text-foreground/80">React 18</strong> + Vite</li>
          <li>SSL e hospedagem <strong className="font-medium text-foreground/80">inclusos</strong></li>
          <li>Deploy <strong className="font-medium text-foreground/80">automático</strong></li>
          <li>Lead no <strong className="font-medium text-foreground/80">WhatsApp</strong></li>
          <li>Domínio <strong className="font-medium text-foreground/80">próprio</strong></li>
        </ul>
      </div>
    </header>
  );
}
