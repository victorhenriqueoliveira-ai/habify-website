import { motion } from "framer-motion";
import { HelpCircle, MessageCircle } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const faqs = [
  {
    id: "faq-1",
    question: "O site é feito em WordPress?",
    answer: "Não! A HabiFy utiliza plataforma proprietária, muito mais rápida, segura e otimizada que WordPress — construída com React.js, Tailwind CSS e TypeScript. Sites HabiFy carregam até 5x mais rápido que WordPress e têm 3x mais conversão que builders genéricos."
  },
  {
    id: "faq-2",
    question: "Preciso investir em Google Ads para ter leads?",
    answer: "Não é obrigatório! Seu site já vem 100% otimizado para SEO e aparece naturalmente no Google. Anúncios pagos (Google Ads, Facebook Ads) são opcionais para acelerar resultados, mas você já recebe leads organicamente sem custos extras. Muitos clientes têm ótimos resultados apenas com o tráfego orgânico incluído."
  },
  {
    id: "faq-3",
    question: "Quanto tempo leva para o site ficar pronto?",
    answer: "Seu site fica pronto na hora, assim que você envia suas fotos e informações. Nossa plataforma gera e publica o site automaticamente, sem espera. Você recebe acesso ao painel administrativo e o link para começar a divulgar imediatamente."
  },
  {
    id: "faq-4",
    question: "Posso editar o site depois de pronto?",
    answer: "Sim! Após solicitação, fazemos as edições em até 72 horas úteis. Para ter acesso a edições ilimitadas, você pode contratar um plano de manutenção. Alternativamente, podemos enviar o código-fonte do site para você, já que o site é 100% seu e você tem total propriedade."
  },
  {
    id: "faq-5",
    question: "Posso colocar vários imóveis no mesmo site?",
    answer: "Sim! Oferecemos dois formatos: Site para Projeto Único (ideal para 1 empreendimento/imóvel específico) e Portfólio com Múltiplos Imóveis (até 5 imóveis listados com sistema de filtros). Escolha o formato que melhor atende suas necessidades e tipo de negócio."
  },
  {
    id: "faq-6",
    question: "Como funciona a captação de leads 24/7?",
    answer: "Seu site possui botões de CTA estrategicamente posicionados que direcionam clientes interessados diretamente para o seu WhatsApp a qualquer hora do dia ou da noite. Os visitantes clicam no botão e iniciam uma conversa direta com você. Simples, direto e eficiente para não perder nenhuma oportunidade!"
  },
  {
    id: "faq-7",
    question: "O que está incluído na hospedagem?",
    answer: "A hospedagem profissional em servidor de alta performance e o certificado SSL (cadeado de segurança) estão inclusos. O domínio personalizado (ex: seunome.com.br) fica por conta do cliente, com custo médio de R$ 40/ano. Garantia de uptime 99.9%."
  },
  {
    id: "faq-8",
    question: "O site após entregue para o cliente, é de minha propriedade?",
    answer: "Sim! Após a entrega, o site é 100% seu. Você terá acesso total ao código-fonte e poderá fazer as alterações que desejar. Nossa equipe também está disponível para ajudar com edições e manutenções, caso você precise."
  }
];

const FAQSection = () => {
  return (
    <section className="py-16 sm:py-24 bg-gradient-to-b from-background to-muted/30" id="faq">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-4 mb-8 sm:mb-16">
          <div className="flex-1 h-[1px] bg-gray-300"></div>
        </div>
        {/* Header */}
        <motion.div 
          className="text-center mb-12 sm:mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <div className="inline-flex items-center justify-center px-4 py-2 mb-4 rounded-full bg-primary/10 text-primary font-semibold text-sm">
            <HelpCircle className="w-4 h-4 mr-2" />
            Perguntas Frequentes
          </div>
          <h2 className="section-title text-3xl sm:text-4xl lg:text-5xl mb-4">
            Dúvidas?{" "}
            <span className="text-primary">Nós Respondemos</span>
          </h2>
          <p className="section-subtitle text-lg max-w-2xl mx-auto">
            Tudo o que você precisa saber antes de criar seu site profissional
          </p>
        </motion.div>

        {/* FAQ Accordion */}
        <motion.div
          className="max-w-4xl mx-auto"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2 }}
        >
          <Accordion type="single" collapsible className="space-y-4">
            {faqs.map((faq, index) => (
              <motion.div
                key={faq.id}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.05 }}
              >
                <AccordionItem 
                  value={faq.id} 
                  className="bg-card border border-border rounded-xl px-6 hover:border-primary/50 hover:shadow-md transition-all duration-200"
                >
                  <AccordionTrigger className="text-left hover:no-underline py-5">
                    <div className="flex items-start gap-3 pr-4">
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center mt-1">
                        <span className="text-sm font-bold text-primary">
                          {index + 1}
                        </span>
                      </div>
                      <span className="font-semibold text-foreground text-base sm:text-lg">
                        {faq.question}
                      </span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground pl-11 pr-4 pb-5 text-base leading-relaxed">
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              </motion.div>
            ))}
          </Accordion>
        </motion.div>

        {/* Still Have Questions CTA */}
        <motion.div
          className="max-w-3xl mx-auto mt-12"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.4 }}
        >
          <div className="bg-gradient-to-br from-primary/5 to-primary/10 border-2 border-primary/20 rounded-2xl p-8 text-center">
            <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-4">
              <MessageCircle className="w-8 h-8 text-primary" />
            </div>
            <h3 className="text-2xl font-bold text-foreground mb-3">
              Ainda tem dúvidas?
            </h3>
            <p className="text-muted-foreground mb-6 text-lg">
              Nossa equipe está pronta para te ajudar! Fale com um especialista e tire todas as suas dúvidas pelo WhatsApp.
            </p>
            <a
              href="https://wa.me/5511961769504?text=Olá!%20Tenho%20algumas%20dúvidas%20sobre%20a%20criação%20do%20site"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-8 py-4 bg-primary text-primary-foreground rounded-full font-bold hover:bg-primary/90 transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              <MessageCircle className="w-5 h-5" />
              Falar com Especialista
            </a>
            <p className="text-sm text-muted-foreground mt-4">
              💬 Respondemos em até 2 horas
            </p>
          </div>
        </motion.div>

        {/* Trust Badges */}
        <motion.div
          className="flex flex-wrap justify-center items-center gap-6 mt-12 max-w-4xl mx-auto"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.5 }}
        >
          <div className="flex items-center gap-2 px-4 py-2 bg-card rounded-full border border-border shadow-sm">
            <span className="text-2xl">⚡</span>
            <span className="text-sm font-semibold text-foreground">Site pronto na hora</span>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 bg-card rounded-full border border-border shadow-sm">
            <span className="text-2xl">🔒</span>
            <span className="text-sm font-semibold text-foreground">100% Seguro</span>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default FAQSection;
