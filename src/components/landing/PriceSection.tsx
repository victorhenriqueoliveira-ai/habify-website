import { useNavigate } from 'react-router-dom';
import { Check, Loader2 } from 'lucide-react';
import { BUSINESS, formatBRL, maxInstallmentsFor } from '@/config/business';
import { usePlans } from '@/hooks/usePlans';
import { Reveal } from './Reveal';
import { CtaButton } from './CtaButton';
import { CountUpValue } from './CountUpValue';

const INCLUDED = [
  { strong: 'Site em React', rest: ' publicado no mesmo dia' },
  { strong: 'Até 5 imóveis', rest: ' com galeria, planta e filtro' },
  { strong: 'Hospedagem, CDN e SSL', rest: ' inclusos' },
  { strong: 'Lead direto no WhatsApp', rest: ', sem painel pra checar' },
  { strong: 'Código-fonte é seu', rest: ', sem fidelidade' },
  { strong: 'Domínio próprio', rest: ' conectado sem custo extra' },
];

const BENEFITS = [
  {
    index: '01 / mensalidade',
    title: 'R$ 0 por mês. Nunca.',
    body: 'Você paga uma vez e pronto. Não tem renovação automática nem cobrança aparecendo no cartão seis meses depois.',
  },
  {
    index: '02 / propriedade',
    title: 'O código-fonte é seu.',
    body: 'O site fica num repositório seu. Quiser levar pra outro lugar depois, leva — não existe contrato de fidelidade.',
  },
  {
    index: '03 / prazo',
    title: 'Publicado no mesmo dia.',
    body: 'Você preenche as informações, a plataforma compila e sobe. Não é orçamento, não é reunião, não é prazo de três semanas.',
  },
];

export function PriceSection() {
  const navigate = useNavigate();
  const { plans, loading } = usePlans();

  const price = BUSINESS.pricing.sitePrice;
  const installments = maxInstallmentsFor(price);

  // O preço exibido vem da constante (prerender-safe). O usePlans serve só
  // para descobrir qual plano abrir no checkout — se ainda não respondeu,
  // o botão espera em vez de mostrar um preço diferente.
  const plan = plans.find((p) => p.type !== 'domain_registration');

  const goToCheckout = () => {
    if (plan) navigate(`/checkout/${plan.id}`);
    else window.location.href = BUSINESS.whatsapp.url('Olá! Quero criar meu site mas o checkout não abriu.');
  };

  return (
    <section id="preco" className="border-b border-border bg-muted/40 py-20 md:py-24">
      <div className="mx-auto max-w-6xl px-4 text-center sm:px-6">
        <Reveal>
          <p className="font-mono text-[11.5px] text-muted-foreground">preço</p>
        </Reveal>
        <Reveal delay={60}>
          <h2 className="mt-3 font-display text-[clamp(1.7rem,3.5vw,2.5rem)] font-semibold tracking-[-0.035em] text-balance">
            Quanto custa um site para corretor de imóveis
          </h2>
        </Reveal>

        <Reveal delay={110}>
          <div className="relative mx-auto mt-10 max-w-3xl overflow-hidden rounded-2xl border border-border bg-background text-left shadow-xl">
            <span aria-hidden="true" className="absolute inset-x-0 top-0 h-[3px] bg-primary" />
            <div className="grid md:grid-cols-[1.05fr_0.95fr]">
              <div className="p-8 sm:p-9">
                <span className="inline-flex rounded-md bg-primary/10 px-2.5 py-1.5 font-mono text-[11px] text-primary">
                  pagamento único
                </span>

                <div className="mt-4 flex flex-wrap items-baseline gap-2.5">
                  <strong className="font-display text-[clamp(2.75rem,5.6vw,4.25rem)] font-bold leading-none tracking-[-0.05em] tabular-nums">
                    <CountUpValue value={price} format={(v) => `R$\u00a0${formatBRL(v)}`} />
                  </strong>
                  <span className="text-[15px] font-medium text-muted-foreground">uma vez só</span>
                </div>

                <p className="mt-3 max-w-[38ch] text-[15.5px] leading-relaxed text-muted-foreground">
                  Vendeu um imóvel ou vinte, o site continua custando o que você pagou: nada por mês, nada de
                  renovação.
                </p>

                <CtaButton onClick={goToCheckout} disabled={loading} className="mt-7">
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                      Abrindo…
                    </>
                  ) : (
                    'Criar meu site agora'
                  )}
                </CtaButton>

                <p className="mt-3 font-mono text-[11.5px] text-muted-foreground">
                  PIX ou cartão em até {installments}x <span className="text-border">/</span> garantia de{' '}
                  {BUSINESS.pricing.guaranteeDays} dias
                </p>
              </div>

              <ul className="flex flex-col justify-center gap-3 border-t border-border bg-muted/50 p-8 sm:p-9 md:border-l md:border-t-0">
                {INCLUDED.map((item) => (
                  <li key={item.strong} className="flex items-start gap-2.5 text-[14.5px] leading-snug text-muted-foreground">
                    <span className="mt-0.5 grid h-4 w-4 flex-none place-items-center rounded-full bg-success/10">
                      <Check className="h-2.5 w-2.5 text-success" aria-hidden="true" />
                    </span>
                    <span>
                      <strong className="font-semibold text-foreground">{item.strong}</strong>
                      {item.rest}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </Reveal>

        <Reveal delay={60}>
          <div className="mt-8 grid overflow-hidden rounded-xl border border-border bg-background text-left md:grid-cols-3">
            {BENEFITS.map((b) => (
              <div
                key={b.index}
                className="border-b border-border p-7 transition-colors last:border-b-0 hover:bg-muted/50 md:border-b-0 md:border-r md:last:border-r-0"
              >
                <span className="font-mono text-[11.5px] text-muted-foreground">{b.index}</span>
                <h3 className="mt-3 font-display text-[17px] font-semibold tracking-[-0.025em]">{b.title}</h3>
                <p className="mt-2 text-[14.5px] leading-relaxed text-muted-foreground">{b.body}</p>
              </div>
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  );
}
