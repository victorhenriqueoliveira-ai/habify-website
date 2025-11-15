import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ExternalLink, TrendingUp, Award, ChevronLeft, ChevronRight } from 'lucide-react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { EffectCoverflow, Navigation, Autoplay } from 'swiper/modules';
import LightboxModal from './premium/LightboxModal';
import 'swiper/css';
import 'swiper/css/effect-coverflow';
import 'swiper/css/navigation';

interface Project {
  id: string;
  name: string;
  url: string;
  image: string;
  type: string;
  description: string;
  metrics: {
    leads: string;
    traffic: string;
    conversion: string;
  };
  features: string[];
  badge: string;
}

const projects: Project[] = [
  {
    id: '1',
    name: 'Ralph Santos Imóveis',
    url: 'https://ralphsantos.com.br',
    image: '/fotos/site_ralphsantos.png',
    type: 'Portfólio Completo',
    description: 'Site completo com portfólio de imóveis, integração WhatsApp e SEO otimizado. Solução premium para corretor de alto padrão.',
    metrics: {
      leads: '+145%',
      traffic: '+320%',
      conversion: '+89%'
    },
    features: [
      'Design responsivo premium',
      'Integração WhatsApp automática',
      'SEO avançado - Posição #1 Google',
      'Galeria de imóveis otimizada',
      'Formulário de contato inteligente'
    ],
    badge: 'Premium'
  },
  {
    id: '2',
    name: 'MAC São Paulo',
    url: 'https://macsaopaulo.com.br',
    image: '/fotos/site_macsaopaulo.png',
    type: 'Landing Page Comercial',
    description: 'Landing page focada em conversão para empreendimento comercial. CTAs estratégicos e design moderno.',
    metrics: {
      leads: '+98%',
      traffic: '+210%',
      conversion: '+67%'
    },
    features: [
      'Design focado em conversão',
      'Carregamento ultra-rápido',
      'Analytics integrado',
      'Multi-dispositivo otimizado',
      'A/B Testing implementado'
    ],
    badge: 'Corporativo'
  }
];

const PortfolioShowcasePremium: React.FC = () => {
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);

  return (
    <section className="py-24 relative overflow-hidden bg-gradient-to-b from-background via-muted/20 to-background" id="portfolio">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-grid-pattern opacity-5" />
      
      <div className="container mx-auto px-4 relative z-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 mb-4 rounded-full bg-primary/10 text-primary font-semibold text-sm border border-primary/20">
            <Award className="w-4 h-4" />
            Portfólio Premium
          </div>
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            Projetos que <span className="bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">Transformaram Negócios</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Cada site é criado com design premium, performance excepcional e foco total em conversão de leads
          </p>
        </motion.div>

        {/* 3D Carousel */}
        <div className="relative max-w-7xl mx-auto">
          <Swiper
            effect={'coverflow'}
            grabCursor={true}
            centeredSlides={true}
            slidesPerView={'auto'}
            coverflowEffect={{
              rotate: 50,
              stretch: 0,
              depth: 100,
              modifier: 1,
              slideShadows: true,
            }}
            navigation={{
              prevEl: '.swiper-button-prev-custom',
              nextEl: '.swiper-button-next-custom',
            }}
            autoplay={{
              delay: 5000,
              disableOnInteraction: false,
            }}
            modules={[EffectCoverflow, Navigation, Autoplay]}
            className="portfolio-swiper"
            style={{ padding: '40px 0' }}
          >
            {projects.map((project) => (
              <SwiperSlide
                key={project.id}
                style={{ width: '70%', maxWidth: '900px' }}
              >
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  className="relative rounded-2xl overflow-hidden shadow-2xl border-2 border-border/50 bg-card cursor-pointer group"
                  onClick={() => setSelectedProject(project)}
                >
                  {/* Image */}
                  <div className="relative aspect-video overflow-hidden">
                    <img
                      src={project.image}
                      alt={project.name}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                    />
                    
                    {/* Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <div className="absolute bottom-0 left-0 right-0 p-6 transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="px-3 py-1 bg-primary text-primary-foreground rounded-full text-xs font-semibold">
                            {project.badge}
                          </span>
                        </div>
                        <h3 className="text-2xl font-bold text-white mb-2">{project.name}</h3>
                        <p className="text-white/80 mb-4">{project.type}</p>
                        
                        <div className="flex flex-wrap gap-3 mb-4">
                          <div className="flex items-center gap-1 text-green-400">
                            <TrendingUp className="w-4 h-4" />
                            <span className="font-semibold">{project.metrics.leads}</span>
                            <span className="text-xs">leads</span>
                          </div>
                          <div className="flex items-center gap-1 text-blue-400">
                            <TrendingUp className="w-4 h-4" />
                            <span className="font-semibold">{project.metrics.traffic}</span>
                            <span className="text-xs">tráfego</span>
                          </div>
                        </div>

                        <button className="flex items-center gap-2 px-4 py-2 bg-white text-black rounded-lg font-semibold hover:bg-white/90 transition-colors">
                          <span>Ver Detalhes</span>
                          <ExternalLink className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Badge */}
                    <div className="absolute top-4 right-4 px-3 py-1 bg-background/90 backdrop-blur-sm rounded-full text-sm font-semibold border border-border">
                      {project.type}
                    </div>
                  </div>
                </motion.div>
              </SwiperSlide>
            ))}
          </Swiper>

          {/* Custom Navigation */}
          <button className="swiper-button-prev-custom absolute left-0 top-1/2 -translate-y-1/2 z-10 w-12 h-12 bg-background/80 backdrop-blur-sm border border-border rounded-full flex items-center justify-center hover:bg-primary hover:text-primary-foreground transition-colors shadow-lg">
            <ChevronLeft className="w-6 h-6" />
          </button>
          <button className="swiper-button-next-custom absolute right-0 top-1/2 -translate-y-1/2 z-10 w-12 h-12 bg-background/80 backdrop-blur-sm border border-border rounded-full flex items-center justify-center hover:bg-primary hover:text-primary-foreground transition-colors shadow-lg">
            <ChevronRight className="w-6 h-6" />
          </button>
        </div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mt-16"
        >
          <a
            href="#plans"
            className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-primary to-accent text-primary-foreground rounded-full font-bold text-lg hover:shadow-2xl hover:shadow-primary/50 transition-all duration-300 hover:scale-105"
          >
            Quero Meu Site Premium
            <TrendingUp className="w-5 h-5" />
          </a>
        </motion.div>
      </div>

      {/* Lightbox Modal */}
      {selectedProject && (
        <LightboxModal
          isOpen={!!selectedProject}
          onClose={() => setSelectedProject(null)}
          project={selectedProject}
        />
      )}
    </section>
  );
};

export default PortfolioShowcasePremium;
