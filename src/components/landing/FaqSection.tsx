import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { BUSINESS } from '@/config/business';
import { FAQ_ITEMS } from '@/data/faq';
import { Reveal } from './Reveal';

export function FaqSection() {
  return (
    <section id="faq" className="border-b border-border py-20 md:py-24">
      <div className="mx-auto grid max-w-6xl items-start gap-10 px-4 sm:px-6 md:grid-cols-[0.82fr_1.18fr] md:gap-14">
        <div className="md:sticky md:top-24">
          <Reveal>
            <p className="font-mono text-[11.5px] text-muted-foreground">dúvidas</p>
          </Reveal>
          <Reveal delay={60}>
            <h2 className="mt-3 font-display text-[clamp(1.7rem,3.5vw,2.5rem)] font-semibold tracking-[-0.035em] text-balance">
              Perguntas frequentes sobre site para corretor
            </h2>
          </Reveal>
          <Reveal delay={110}>
            <p className="mt-4 text-[17px] leading-relaxed text-muted-foreground">
              Se a sua não estiver aqui, chama no WhatsApp — a gente responde em até 2 horas.
            </p>
            <a
              href={BUSINESS.whatsapp.url('Olá! Tenho uma dúvida sobre o site para corretor.')}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-6 inline-flex items-center rounded-xl border border-input px-6 py-3.5 font-semibold transition-colors hover:bg-muted"
            >
              Falar com a gente
            </a>
          </Reveal>
        </div>

        <Reveal delay={80}>
          <Accordion type="single" collapsible defaultValue="faq-0" className="flex flex-col gap-2.5">
            {FAQ_ITEMS.map((item, i) => (
              <AccordionItem
                key={item.question}
                value={`faq-${i}`}
                className="overflow-hidden rounded-xl border border-border bg-background px-0 data-[state=open]:bg-muted/40"
              >
                <AccordionTrigger className="px-5 py-4 text-left text-[15.5px] font-semibold tracking-[-0.015em] hover:no-underline">
                  {item.question}
                </AccordionTrigger>
                <AccordionContent className="px-5 pb-4 text-[14.5px] leading-relaxed text-muted-foreground">
                  {item.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </Reveal>
      </div>

      {/* Texto corrido com as buscas long-tail que a página já ranqueia —
          herdado do antigo SEOContent, que foi cortado da estrutura. */}
      <div className="mx-auto mt-16 max-w-6xl px-4 sm:px-6">
        <Reveal>
          <div className="rounded-xl border border-border bg-muted/40 p-7 sm:p-8">
            <h3 className="font-display text-[17px] font-semibold tracking-[-0.025em]">
              Por que todo corretor de imóveis precisa de um site próprio
            </h3>
            <div className="mt-3 max-w-[72ch] space-y-3 text-[14.5px] leading-relaxed text-muted-foreground">
              <p>
                Corretores com site próprio captam mais leads qualificados do que quem depende só de portal
                imobiliário e indicação. O portal cobra mensalidade, mostra o seu imóvel ao lado do concorrente e
                fica com o relacionamento do cliente. O seu site não: o contato chega direto no seu WhatsApp, com o
                imóvel identificado, e a visita que o Google manda é sua.
              </p>
              <p>
                Seja você <strong className="font-medium text-foreground">corretor autônomo</strong> ou uma{' '}
                <strong className="font-medium text-foreground">imobiliária</strong>, dá pra escolher entre um site
                para um único empreendimento ou um portfólio com múltiplos imóveis e filtro de busca. Em qualquer um
                dos casos o site é feito em React.js, hospedagem, CDN e certificado SSL já vêm inclusos, a captação
                funciona 24 horas por dia, e o pagamento é único — sem mensalidade surpresa no fim do mês.
              </p>
              <p>
                O site fica no ar no mesmo dia da contratação e você pode conectar um domínio próprio (.com.br) a
                qualquer momento, pagando apenas a taxa anual do registro.br. O código-fonte fica num repositório em
                seu nome, então nada prende você à plataforma.
              </p>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
