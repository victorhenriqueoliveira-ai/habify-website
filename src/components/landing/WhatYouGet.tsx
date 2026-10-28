import { useEffect, useRef, useState } from 'react';
import { BUSINESS, formatBRL } from '@/config/business';
import { Reveal } from './Reveal';
import { cn } from '@/lib/utils';

const LOAD_TIMES = [
  { name: 'Habify', value: '0,8s', width: 94, fast: true },
  { name: 'WordPress', value: '4,2s', width: 34, fast: false },
  { name: 'Site builder', value: '6,1s', width: 22, fast: false },
];

/** Comparativo de carregamento — as barras crescem ao entrar na tela. */
function LoadChart() {
  const ref = useRef<HTMLDivElement>(null);
  const [grown, setGrown] = useState(true);

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    setGrown(false);
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (!e.isIntersecting) return;
          setGrown(true);
          observer.disconnect();
        });
      },
      { threshold: 0.35 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={ref} className="flex min-h-[15.5rem] flex-col justify-center gap-3.5 bg-muted p-6">
      {LOAD_TIMES.map((row) => (
        <div key={row.name} className="flex items-center gap-3 font-mono text-[11.5px] text-muted-foreground">
          <span className="w-[6.5rem] flex-none">{row.name}</span>
          <span className="h-[7px] flex-1 overflow-hidden rounded-full bg-background">
            <span
              className={cn(
                'block h-full rounded-full transition-[width] duration-[1100ms] ease-out',
                row.fast ? 'bg-success' : 'bg-input',
              )}
              style={{ width: grown ? `${row.width}%` : '0%' }}
            />
          </span>
          <span className={cn('w-[3.25rem] flex-none text-right', row.fast ? 'text-foreground' : '')}>
            {row.value}
          </span>
        </div>
      ))}
      <p className="mt-1.5 font-mono text-[11.5px] leading-relaxed text-muted-foreground">
        tempo até a página aparecer
        <br />
        no celular, em rede 4G
      </p>
    </div>
  );
}

const LEADS = [
  { initial: 'M', name: 'Marina S.', text: 'Oi! Tenho interesse no apto 203 do Jardim Paulista', time: '22:41' },
  { initial: 'R', name: 'Rafael T.', text: 'Ainda está disponível a casa na Vila Nova?', time: '23:08' },
  { initial: 'C', name: 'Camila O.', text: 'Quero agendar uma visita amanhã', time: '06:12' },
];

function WhatsAppPanel() {
  return (
    <div className="flex min-h-[15.5rem] flex-col justify-center gap-2.5 bg-muted p-6">
      {LEADS.map((lead) => (
        <div
          key={lead.name}
          className="flex items-start gap-2.5 rounded-xl border border-border bg-background px-3 py-2.5 shadow-sm"
        >
          <span className="grid h-7 w-7 flex-none place-items-center rounded-full bg-success text-[11.5px] font-bold text-white">
            {lead.initial}
          </span>
          <span className="text-[13.5px] leading-snug">
            <strong className="block text-[12.5px] font-semibold text-muted-foreground">{lead.name}</strong>
            {lead.text}
          </span>
          <span className="ml-auto flex-none font-mono text-[10px] text-muted-foreground">{lead.time}</span>
        </div>
      ))}
    </div>
  );
}

const COMPARISON = [
  {
    feature: 'Velocidade de carregamento',
    habify: 'Menos de 1 segundo',
    others: '4 a 6 segundos',
  },
  {
    feature: 'Indexação no Google',
    habify: 'HTML pré-renderizado, 100/100 em SEO',
    others: 'Depende de plugin configurado à mão',
  },
  {
    feature: 'Captação de leads',
    habify: 'WhatsApp direto, 24 horas por dia',
    others: 'Formulário que cai em e-mail',
  },
  {
    feature: 'Hospedagem e SSL',
    habify: 'Inclusos, sem cobrança separada',
    others: 'Contratados à parte, renovação anual',
  },
  {
    feature: 'Manutenção',
    habify: 'Nada pra atualizar',
    others: 'Plugins e tema toda semana',
  },
  {
    feature: 'Custo',
    habify: 'Pagamento único',
    others: 'Mensalidade recorrente',
  },
];

function ComparisonTable() {
  return (
    <div className="overflow-x-auto rounded-xl border border-border">
      <table className="w-full min-w-[34rem] border-collapse text-left text-sm">
        <caption className="sr-only">
          Comparação entre um site Habify e sites feitos em WordPress ou construtores de site
        </caption>
        <thead>
          <tr className="border-b border-border bg-muted/60">
            <th scope="col" className="px-5 py-3.5 font-mono text-[11px] font-normal text-muted-foreground">
              o que muda na prática
            </th>
            <th scope="col" className="px-5 py-3.5 text-[13px] font-semibold text-primary">
              Habify
            </th>
            <th scope="col" className="px-5 py-3.5 text-[13px] font-semibold text-muted-foreground">
              WordPress / construtores
            </th>
          </tr>
        </thead>
        <tbody>
          {COMPARISON.map((row) => (
            <tr key={row.feature} className="border-b border-border last:border-b-0">
              <th scope="row" className="px-5 py-3.5 text-[13.5px] font-medium">
                {row.feature}
              </th>
              <td className="px-5 py-3.5 text-[13.5px] text-foreground">{row.habify}</td>
              <td className="px-5 py-3.5 text-[13.5px] text-muted-foreground">{row.others}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function WhatYouGet() {
  return (
    <section id="tecnologia" className="border-b border-border py-20 md:py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <Reveal>
          <p className="font-mono text-[11.5px] text-muted-foreground">tecnologia</p>
        </Reveal>
        <Reveal delay={60}>
          <h2 className="mt-3 font-display text-[clamp(1.7rem,3.5vw,2.5rem)] font-semibold tracking-[-0.035em] text-balance">
            O que vem no seu site de corretor
          </h2>
        </Reveal>

        <div className="mt-14 flex flex-col gap-[5.5rem]">
          <Reveal>
            <div className="grid items-center gap-10 md:grid-cols-2 md:gap-14">
              <div>
                <h3 className="font-display text-[clamp(1.3rem,2.7vw,1.75rem)] font-semibold leading-tight tracking-[-0.03em]">
                  Não é WordPress. Não vai quebrar.
                </h3>
                <p className="mt-3.5 text-base leading-relaxed text-muted-foreground">
                  É React.js compilado, servido por CDN — a mesma arquitetura que Airbnb e QuintoAndar usam. Não tem
                  plugin pra atualizar toda semana, não tem banco de dados caindo, não tem tela branca na véspera de
                  um lançamento.
                </p>
                <p className="mt-4 border-l-2 border-input pl-3.5 font-mono text-[11.5px] leading-relaxed text-muted-foreground">
                  100/100 em Performance e SEO no PageSpeed Insights.
                  <br />
                  Hospedagem, CDN e certificado SSL já inclusos.
                </p>
              </div>
              <div className="overflow-hidden rounded-xl border border-border shadow-sm">
                <LoadChart />
              </div>
            </div>
          </Reveal>

          <Reveal>
            <div className="grid items-center gap-10 md:grid-cols-2 md:gap-14">
              <div className="order-2 overflow-hidden rounded-xl border border-border shadow-sm md:order-1">
                <WhatsAppPanel />
              </div>
              <div className="order-1 md:order-2">
                <h3 className="font-display text-[clamp(1.3rem,2.7vw,1.75rem)] font-semibold leading-tight tracking-[-0.03em]">
                  O lead cai direto no seu WhatsApp.
                </h3>
                <p className="mt-3.5 text-base leading-relaxed text-muted-foreground">
                  Enquanto você está em visita, o site conversa por você. O cliente clica, abre a sua conversa, e você
                  responde do celular — sem painel pra checar, sem e-mail que você esquece de abrir.
                </p>
                <p className="mt-4 border-l-2 border-input pl-3.5 font-mono text-[11.5px] leading-relaxed text-muted-foreground">
                  Funciona de madrugada, no fim de semana e no feriado.
                </p>
              </div>
            </div>
          </Reveal>

          <Reveal>
            <div className="grid items-center gap-10 md:grid-cols-2 md:gap-14">
              <div>
                <h3 className="font-display text-[clamp(1.3rem,2.7vw,1.75rem)] font-semibold leading-tight tracking-[-0.03em]">
                  Um imóvel só, ou o portfólio inteiro.
                </h3>
                <p className="mt-3.5 text-base leading-relaxed text-muted-foreground">
                  Seja você <strong className="font-semibold text-foreground">corretor autônomo</strong> ou uma{' '}
                  <strong className="font-semibold text-foreground">imobiliária</strong>, dá pra publicar o site de um
                  único empreendimento ou reunir até cinco imóveis com filtro de busca, cada um com galeria, planta e
                  localização própria. Você escolhe na hora de criar, e muda depois se precisar.
                </p>
                <p className="mt-4 border-l-2 border-input pl-3.5 font-mono text-[11.5px] leading-relaxed text-muted-foreground">
                  Alterações de conteúdo você faz sozinho pelo painel.
                  <br />
                  Mudanças maiores: manutenção avulsa de R$ {formatBRL(BUSINESS.pricing.maintenanceMonthly)}, em até 72h.
                </p>
              </div>
              <div className="overflow-hidden rounded-xl border border-border shadow-sm">
                <img
                  src="/fotos/site_empreendimentosclassico.webp"
                  alt="Portfólio com múltiplos imóveis e filtro de busca"
                  width={1600}
                  height={900}
                  loading="lazy"
                  decoding="async"
                  className="block w-full"
                />
              </div>
            </div>
          </Reveal>
        </div>

        <Reveal>
          <div className="mt-20">
            <h3 className="font-display text-[clamp(1.2rem,2.2vw,1.5rem)] font-semibold tracking-[-0.025em]">
              Site Habify contra WordPress e construtores de site
            </h3>
            <p className="mb-6 mt-2.5 max-w-[62ch] text-[15px] leading-relaxed text-muted-foreground">
              A diferença não é só estética. Um site de corretor que demora cinco segundos pra abrir no celular perde
              a visita antes de mostrar o primeiro imóvel, e o Google rebaixa a página por isso.
            </p>
            <ComparisonTable />
          </div>
        </Reveal>
      </div>
    </section>
  );
}
