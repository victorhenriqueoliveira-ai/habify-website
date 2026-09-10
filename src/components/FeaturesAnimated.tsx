import React from 'react';
import { Zap, Shield, TrendingUp, Users, Clock, Award } from 'lucide-react';
import ScrollReveal, { StaggerContainer, StaggerItem } from './animations/ScrollReveal';
import TiltCard from './animations/TiltCard';
import AnimatedBorderCard from './animations/AnimatedBorderCard';

const features = [
  {
    icon: Zap,
    title: 'Performance Lightning',
    description: 'Sites ultra-rápidos com 95+ no Google PageSpeed. Carregamento instantâneo que converte visitantes em clientes.',
    gradient: 'from-pulse-500 to-pulse-600'
  },
  {
    icon: Shield,
    title: 'SEO Dominante',
    description: 'Otimização completa para mecanismos de busca. Apareça no topo do Google e capture mais leads qualificados.',
    gradient: 'from-accent to-primary'
  },
  {
    icon: TrendingUp,
    title: 'Conversão Máxima',
    description: 'Design focado em resultados. Cada elemento estrategicamente posicionado para gerar mais vendas.',
    gradient: 'from-primary to-pulse-500'
  },
  {
    icon: Users,
    title: 'Mobile First',
    description: '100% responsivo e otimizado para todos os dispositivos. Seus clientes terão a melhor experiência em qualquer tela.',
    gradient: 'from-pulse-600 to-accent'
  },
  {
    icon: Clock,
    title: 'Entrega Instantânea',
    description: 'Site profissional pronto na hora. Comece a gerar leads enquanto seus concorrentes ainda estão planejando.',
    gradient: 'from-accent to-pulse-500'
  },
  {
    icon: Award,
    title: 'Suporte Premium',
    description: 'Time especializado sempre disponível. Resposta em até 1h e suporte completo durante toda a jornada.',
    gradient: 'from-primary to-accent'
  }
];

const FeaturesAnimated = () => {
  return (
    <section className="py-24 relative overflow-hidden bg-background">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-gradient-to-b from-background via-background/50 to-background pointer-events-none" />
      
      <div className="container mx-auto px-4 relative z-10">
        <ScrollReveal>
          <div className="text-center mb-16">
            <span className="inline-block px-4 py-2 mb-4 text-sm font-semibold bg-primary/10 text-primary rounded-full border border-primary/20">
              Por que escolher a HabiFy?
            </span>
            <h2 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
              Tecnologia que Transforma Visitantes em Clientes
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Combinamos design premium, performance excepcional e estratégias comprovadas de conversão para gerar resultados reais.
            </p>
          </div>
        </ScrollReveal>

        <StaggerContainer className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <StaggerItem key={index}>
              <AnimatedBorderCard>
                <TiltCard className="h-full">
                  <div className="p-8 h-full flex flex-col bg-card hover:bg-card/80 transition-colors duration-300 rounded-lg">
                    {/* Icon with gradient background */}
                    <div className={`w-16 h-16 mb-6 rounded-xl bg-gradient-to-br ${feature.gradient} p-0.5 group-hover:scale-110 transition-transform duration-300`}>
                      <div className="w-full h-full bg-card rounded-xl flex items-center justify-center">
                        <feature.icon className="w-8 h-8 text-primary" />
                      </div>
                    </div>

                    {/* Content */}
                    <h3 className="text-2xl font-bold mb-3 text-foreground group-hover:text-primary transition-colors duration-300">
                      {feature.title}
                    </h3>
                    <p className="text-muted-foreground leading-relaxed flex-grow">
                      {feature.description}
                    </p>
                  </div>
                </TiltCard>
              </AnimatedBorderCard>
            </StaggerItem>
          ))}
        </StaggerContainer>
      </div>
    </section>
  );
};

export default FeaturesAnimated;
