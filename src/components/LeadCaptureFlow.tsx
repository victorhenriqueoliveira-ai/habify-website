import { motion } from "framer-motion";
import { Search, Eye, MousePointerClick, MessageCircle, ArrowRight, Clock, Smartphone } from "lucide-react";

const steps = [
  {
    icon: Search,
    number: "1",
    title: "Cliente Encontra Seu Site",
    description: "Via Google, Instagram, Facebook ou links diretos. Seu site está disponível 24 horas por dia, 7 dias por semana.",
    color: "from-blue-500 to-blue-600"
  },
  {
    icon: Eye,
    number: "2",
    title: "Navega e se Interessa",
    description: "Fotos profissionais em alta resolução, descrição completa do imóvel, localização e todos os detalhes que importam.",
    color: "from-purple-500 to-purple-600"
  },
  {
    icon: MousePointerClick,
    number: "3",
    title: "Clica no Botão de CTA",
    description: "Botões estratégicos de WhatsApp posicionados em pontos-chave da página. Um clique e o cliente inicia conversa direta com você.",
    color: "from-orange-500 to-orange-600"
  },
  {
    icon: MessageCircle,
    number: "4",
    title: "Conversa Direta no WhatsApp",
    description: "O cliente é direcionado automaticamente para seu WhatsApp, já demonstrando interesse. Pronto para você fechar negócio!",
    color: "from-green-500 to-green-600"
  }
];

const LeadCaptureFlow = () => {
  return (
    <section className="py-16 sm:py-24 bg-gradient-to-b from-muted/20 to-background" id="how-it-works">
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
            <Clock className="w-4 h-4 mr-2" />
            Captação 24/7
          </div>
          <h2 className="section-title text-3xl sm:text-4xl lg:text-5xl mb-4">
            Como Funciona a{" "}
            <span className="text-primary">Captação Automática</span>
          </h2>
          <p className="section-subtitle text-lg max-w-2xl mx-auto">
            Seu site trabalha para você o tempo todo, capturando leads mesmo enquanto você dorme
          </p>
        </motion.div>

        {/* Flow Diagram */}
        <div className="relative max-w-5xl mx-auto">
          {/* Steps */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {steps.map((step, index) => (
              <motion.div
                key={index}
                className="relative"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.15 }}
              >
                {/* Connector Line (hidden on mobile, shown on desktop between cards) */}
                {index < steps.length - 1 && (
                  <div className="hidden lg:block absolute top-1/3 -right-4 w-8 h-0.5 bg-gradient-to-r from-primary/50 to-primary/20 z-0" />
                )}

                {/* Card */}
                <div className="relative bg-card rounded-xl p-6 border border-border/50 hover:border-primary/50 hover:shadow-xl transition-all duration-300 h-full">
                  {/* Number Badge */}
                  <div className={`absolute -top-4 -left-4 w-12 h-12 rounded-full bg-gradient-to-br ${step.color} flex items-center justify-center text-white font-bold text-lg shadow-lg`}>
                    {step.number}
                  </div>

                  {/* Icon */}
                  <div className="w-16 h-16 rounded-lg bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center mb-4 mt-4">
                    <step.icon className="w-8 h-8 text-primary" />
                  </div>

                  {/* Content */}
                  <h3 className="text-lg font-bold text-foreground mb-2">
                    {step.title}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {step.description}
                  </p>

                  {/* Arrow (mobile only) */}
                  {index < steps.length - 1 && (
                    <div className="lg:hidden flex justify-center mt-4">
                      <ArrowRight className="w-6 h-6 text-primary/50" />
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </div>

          {/* Highlight Box */}
          <motion.div
            className="mt-12 bg-gradient-to-br from-primary/10 via-primary/5 to-background border-2 border-primary/20 rounded-2xl p-8"
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.5 }}
          >
            <div className="flex flex-col md:flex-row items-center gap-6">
              <div className="flex-shrink-0">
                <div className="w-20 h-20 rounded-full bg-primary/20 flex items-center justify-center">
                  <Smartphone className="w-10 h-10 text-primary" />
                </div>
              </div>
              <div className="flex-1 text-center md:text-left">
                <h3 className="text-2xl font-bold text-foreground mb-2">
                  Funciona Mesmo Você Dormindo 💤
                </h3>
                <p className="text-muted-foreground mb-4">
                  Seu site captura leads <strong>24 horas por dia, 7 dias por semana</strong>. Cliente interessado às 2h da manhã? Sem problema! O formulário captura os dados e você recebe a notificação no WhatsApp para atender quando acordar.
                </p>
                <div className="flex flex-wrap gap-3 justify-center md:justify-start">
                  <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-full shadow-sm border border-border">
                    <Clock className="w-4 h-4 text-primary" />
                    <span className="text-sm font-semibold">24/7 Online</span>
                  </div>
                  <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-full shadow-sm border border-border">
                    <MessageCircle className="w-4 h-4 text-green-600" />
                    <span className="text-sm font-semibold">Notificação Instantânea</span>
                  </div>
                  <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-full shadow-sm border border-border">
                    <MousePointerClick className="w-4 h-4 text-blue-600" />
                    <span className="text-sm font-semibold">Conversão Otimizada</span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* CTA */}
          <motion.div 
            className="text-center mt-12"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.6 }}
          >
            <a
              href="#plans"
              className="inline-flex items-center gap-2 px-8 py-4 bg-primary text-primary-foreground rounded-full font-bold hover:bg-primary/90 transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              Quero Captar Leads 24/7
              <ArrowRight className="w-5 h-5" />
            </a>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default LeadCaptureFlow;
