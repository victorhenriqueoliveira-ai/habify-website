import React from 'react';
import { motion } from 'framer-motion';
import { Star, Award, Users, TrendingUp } from 'lucide-react';
import VideoTestimonial from './premium/VideoTestimonial';
import MetricsDisplay from './premium/MetricsDisplay';
import ScrollReveal from './animations/ScrollReveal';

const testimonials = [
  {
    thumbnail: '/background-section1.png',
    author: 'Carlos Mendes',
    role: 'Corretor Autônomo, São Paulo',
    rating: 5,
    quote: 'Depois da HabiFy, meus leads triplicaram! Agora tenho minha própria máquina de vendas trabalhando 24h. Em 1 mês já recuperei o investimento.',
  },
  {
    thumbnail: '/background-section2.png',
    author: 'Marina Santos',
    role: 'Corretora, Belo Horizonte',
    rating: 5,
    quote: 'Parei de depender só do ZAP Imóveis. Agora tenho leads exclusivos da minha própria landing page. A qualidade dos contatos melhorou muito!',
  },
  {
    thumbnail: '/background-section3.png',
    author: 'Roberto Silva',
    role: 'Corretor, Rio de Janeiro',
    rating: 5,
    quote: 'O HabiFy me deu credibilidade profissional que eu não tinha. Clientes me acham mais confiável por ter meu próprio site. Fechei 5 vendas no primeiro mês!',
  },
  {
    thumbnail: '/background-section1.png',
    author: 'Ana Paula',
    role: 'Imobiliária Pequena, Curitiba',
    rating: 5,
    quote: 'Simples demais! Mandei as fotos pelo sistema e em 3 dias úteis estava online. Agora não preciso mais brigar por leads nos portais caros.',
  },
];

const TestimonialsPremium: React.FC = () => {
  return (
    <section className="py-24 relative overflow-hidden bg-background" id="testimonials">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-muted/30 via-background to-muted/30" />

      <div className="container mx-auto px-4 relative z-10">
        {/* Header */}
        <ScrollReveal>
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-2 mb-4 rounded-full bg-primary/10 text-primary font-semibold text-sm border border-primary/20">
              <Users className="w-4 h-4" />
              Depoimentos Reais
            </div>
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              Corretores que <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">Transformaram suas Vendas</span>
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Veja como profissionais do mercado imobiliário estão gerando mais leads e vendendo mais com a HabiFy
            </p>
          </div>
        </ScrollReveal>

        {/* Social Proof Stats */}
        <div className="mb-16">
          <MetricsDisplay />
        </div>

        {/* Testimonials Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          {testimonials.map((testimonial, index) => (
            <VideoTestimonial
              key={index}
              {...testimonial}
            />
          ))}
        </div>

        {/* Rating Summary */}
        <ScrollReveal>
          <div className="bg-gradient-to-r from-primary/10 via-accent/10 to-primary/10 rounded-2xl p-8 border border-primary/20">
            <div className="flex flex-col md:flex-row items-center justify-between gap-8">
              <div className="text-center md:text-left">
                <div className="flex items-center justify-center md:justify-start gap-2 mb-2">
                  <div className="flex">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-6 h-6 text-yellow-400 fill-yellow-400" />
                    ))}
                  </div>
                  <span className="text-3xl font-bold text-foreground">4.9</span>
                </div>
                <p className="text-muted-foreground">Baseado em 500+ avaliações verificadas</p>
              </div>

              <div className="flex items-center gap-8">
                <div className="text-center">
                  <div className="text-3xl font-bold text-primary mb-1">98%</div>
                  <div className="text-sm text-muted-foreground">Satisfação</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-accent mb-1">500+</div>
                  <div className="text-sm text-muted-foreground">Clientes</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-primary mb-1">145%</div>
                  <div className="text-sm text-muted-foreground">ROI Médio</div>
                </div>
              </div>
            </div>
          </div>
        </ScrollReveal>

        {/* CTA */}
        <ScrollReveal>
          <div className="text-center mt-12">
            <a
              href="#plans"
              className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-primary to-accent text-primary-foreground rounded-full font-bold text-lg hover:shadow-2xl hover:shadow-primary/50 transition-all duration-300 hover:scale-105"
            >
              Junte-se aos Nossos Clientes
              <TrendingUp className="w-5 h-5" />
            </a>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
};

export default TestimonialsPremium;
