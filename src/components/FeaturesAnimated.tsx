import React from "react";
import { TiltCard, AnimatedBorderCard } from "./ui/tilt-card";
import { ScrollReveal, StaggerContainer, StaggerItem } from "./animations/ScrollReveal";
import { 
  Zap, 
  Clock, 
  TrendingUp, 
  Shield, 
  Smartphone, 
  Award,
  Search,
  MessageSquare,
  BarChart3
} from "lucide-react";

interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
}

const FeatureCard = ({ icon, title, description }: FeatureCardProps) => {
  return (
    <TiltCard
      className="h-full"
      tiltMaxAngleX={8}
      tiltMaxAngleY={8}
      scale={1.02}
    >
      <AnimatedBorderCard className="h-full">
        <div className="flex flex-col items-start space-y-4">
          <div className="rounded-xl bg-gradient-to-br from-pulse-500 to-pulse-600 w-12 h-12 flex items-center justify-center text-white shadow-lg">
            {icon}
          </div>
          <h3 className="text-xl font-bold text-foreground">{title}</h3>
          <p className="text-muted-foreground leading-relaxed">{description}</p>
        </div>
      </AnimatedBorderCard>
    </TiltCard>
  );
};

const FeaturesAnimated = () => {
  const features = [
    {
      icon: <TrendingUp className="w-6 h-6" />,
      title: "ROI Comprovado",
      description: "100% dos corretores recuperam o investimento com apenas 1 venda. O restante é lucro puro, sem dependência de portais caros."
    },
    {
      icon: <Clock className="w-6 h-6" />,
      title: "Entrega Relâmpago",
      description: "Seu site profissional fica pronto em até 72 horas úteis. Enquanto outros demoram semanas, você já está vendendo."
    },
    {
      icon: <Zap className="w-6 h-6" />,
      title: "Zero Complicação",
      description: "Você só precisa enviar fotos e informações. Nós cuidamos de design, SEO, hospedagem e toda tecnologia."
    },
    {
      icon: <Search className="w-6 h-6" />,
      title: "SEO Otimizado",
      description: "Sites ranqueados no Google desde o primeiro dia. Apareça nas buscas quando compradores procuram imóveis na sua região."
    },
    {
      icon: <Smartphone className="w-6 h-6" />,
      title: "100% Responsivo",
      description: "Design perfeito em celular, tablet e desktop. 80% dos leads vêm do mobile, seu site precisa funcionar perfeitamente."
    },
    {
      icon: <MessageSquare className="w-6 h-6" />,
      title: "Leads no WhatsApp",
      description: "Captura automática 24/7. Cada visitante interessado vira uma notificação no seu WhatsApp em segundos."
    },
    {
      icon: <Shield className="w-6 h-6" />,
      title: "Sem Mensalidades Surpresa",
      description: "Planos com manutenção incluída. Sem taxas ocultas, sem surpresas. Você sabe exatamente o que está pagando."
    },
    {
      icon: <Award className="w-6 h-6" />,
      title: "Credibilidade Profissional",
      description: "Site próprio transmite confiança. Clientes levam você mais a sério do que corretores sem presença digital."
    },
    {
      icon: <BarChart3 className="w-6 h-6" />,
      title: "Seu Próprio Funil",
      description: "Pare de pagar comissões absurdas para portais. Construa sua própria máquina de vendas e seja dono dos seus leads."
    }
  ];

  return (
    <section className="py-20 relative bg-gradient-to-b from-background via-muted/20 to-background overflow-hidden" id="features">
      {/* Background decorations */}
      <div className="absolute top-20 left-10 w-72 h-72 bg-pulse-500/10 rounded-full blur-3xl animate-float"></div>
      <div className="absolute bottom-20 right-10 w-96 h-96 bg-pulse-600/10 rounded-full blur-3xl animate-float" style={{ animationDelay: '2s' }}></div>
      
      <div className="container px-4 sm:px-6 lg:px-8 relative z-10">
        <ScrollReveal direction="up" className="text-center mb-16">
          <div className="inline-flex items-center justify-center px-4 py-2 mb-6 rounded-full bg-pulse-500/10 text-pulse-600 font-semibold text-sm border border-pulse-500/20">
            <Zap className="w-4 h-4 mr-2" />
            Por que escolher HabiFy
          </div>
          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-display font-black mb-6 bg-gradient-to-r from-foreground via-foreground to-pulse-600 bg-clip-text text-transparent">
            A escolha certa para<br />seu negócio
          </h2>
          <p className="text-lg sm:text-xl text-muted-foreground max-w-3xl mx-auto">
            Cada recurso foi pensado para transformar você em uma máquina de vendas 24/7
          </p>
        </ScrollReveal>

        <StaggerContainer 
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mt-16"
          staggerDelay={0.1}
        >
          {features.map((feature, index) => (
            <StaggerItem key={index}>
              <FeatureCard
                icon={feature.icon}
                title={feature.title}
                description={feature.description}
              />
            </StaggerItem>
          ))}
        </StaggerContainer>
      </div>
    </section>
  );
};

export default FeaturesAnimated;
