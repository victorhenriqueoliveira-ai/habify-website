import { useState, useEffect, useCallback } from "react";
import useEmblaCarousel from "embla-carousel-react";
import { ChevronLeft, ChevronRight, ExternalLink, TrendingUp, Award } from "lucide-react";
import { motion } from "framer-motion";

interface Project {
  id: string;
  name: string;
  url: string;
  image: string;
  type: string;
  results: string;
  badge: string;
}

const projects: Project[] = [
  {
    id: "1",
    name: "Ralph Santos Imóveis",
    url: "https://ralphsantos.com.br",
    image: "/lovable-uploads/dc13e94f-beeb-4671-8a22-0968498cdb4c.png",
    type: "Portfólio Completo",
    results: "Leads qualificados diariamente",
    badge: "Premium"
  },
  {
    id: "2",
    name: "MAC São Paulo",
    url: "https://macsaopaulo.com.br",
    image: "/lovable-uploads/af412c03-21e4-4856-82ff-d1a975dc84a9.png",
    type: "Landing Page Comercial",
    results: "Conversão otimizada para vendas",
    badge: "Corporativo"
  }
];

const PortfolioShowcase = () => {
  const [emblaRef, emblaApi] = useEmblaCarousel({ 
    loop: true,
    align: "center",
    skipSnaps: false
  });
  const [selectedIndex, setSelectedIndex] = useState(0);

  const scrollPrev = useCallback(() => {
    if (emblaApi) emblaApi.scrollPrev();
  }, [emblaApi]);

  const scrollNext = useCallback(() => {
    if (emblaApi) emblaApi.scrollNext();
  }, [emblaApi]);

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setSelectedIndex(emblaApi.selectedScrollSnap());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    onSelect();
    emblaApi.on("select", onSelect);
    return () => {
      emblaApi.off("select", onSelect);
    };
  }, [emblaApi, onSelect]);

  return (
    <section className="py-16 sm:py-24 bg-gradient-to-b from-background to-muted/20 overflow-hidden" id="portfolio">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div 
          className="text-center mb-12 sm:mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <div className="inline-flex items-center justify-center px-4 py-2 mb-4 rounded-full bg-primary/10 text-primary font-semibold text-sm">
            <Award className="w-4 h-4 mr-2" />
            Nosso Portfólio
          </div>
          <h2 className="section-title text-3xl sm:text-4xl lg:text-5xl mb-4">
            Projetos que Transformaram Corretores em{" "}
            <span className="text-primary">Máquinas de Vendas</span>
          </h2>
          <p className="section-subtitle text-lg max-w-2xl mx-auto">
            Cada site é criado com foco em conversão, performance e resultados reais
          </p>
        </motion.div>

        {/* Carousel */}
        <div className="relative">
          <div className="overflow-hidden" ref={emblaRef}>
            <div className="flex gap-6">
              {projects.map((project, index) => (
                <motion.div
                  key={project.id}
                  className="flex-[0_0_100%] sm:flex-[0_0_80%] lg:flex-[0_0_60%] min-w-0"
                  initial={{ opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                >
                  <div className="bg-card rounded-2xl shadow-xl overflow-hidden border border-border/50 hover:shadow-2xl transition-all duration-300 group">
                    {/* Image Container */}
                    <div className="relative overflow-hidden bg-muted aspect-video">
                      <img
                        src={project.image}
                        alt={`Site ${project.name}`}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                      
                      {/* Badge */}
                      <div className="absolute top-4 left-4 px-3 py-1 rounded-full bg-primary text-primary-foreground text-xs font-bold shadow-lg">
                        {project.badge}
                      </div>

                      {/* Overlay on hover */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end justify-center pb-8">
                        <a
                          href={project.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 px-6 py-3 bg-white text-primary rounded-full font-bold hover:bg-primary hover:text-white transition-all duration-200 shadow-lg"
                        >
                          <ExternalLink className="w-4 h-4" />
                          Visitar Site
                        </a>
                      </div>
                    </div>

                    {/* Content */}
                    <div className="p-6">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h3 className="text-xl font-bold text-foreground mb-1">
                            {project.name}
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            {project.type}
                          </p>
                        </div>
                      </div>

                      {/* Results */}
                      <div className="flex items-center gap-2 mt-4 p-3 bg-green-500/10 rounded-lg border border-green-500/20">
                        <TrendingUp className="w-5 h-5 text-green-600" />
                        <span className="text-sm font-semibold text-green-700">
                          {project.results}
                        </span>
                      </div>

                      {/* Visit Link */}
                      <a
                        href={project.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-4 text-sm text-primary hover:text-primary/80 font-semibold inline-flex items-center gap-1 transition-colors"
                      >
                        Ver site completo
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Navigation Buttons */}
          <button
            onClick={scrollPrev}
            className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white shadow-lg hover:shadow-xl flex items-center justify-center text-primary hover:bg-primary hover:text-white transition-all duration-200 z-10"
            aria-label="Projeto anterior"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          <button
            onClick={scrollNext}
            className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white shadow-lg hover:shadow-xl flex items-center justify-center text-primary hover:bg-primary hover:text-white transition-all duration-200 z-10"
            aria-label="Próximo projeto"
          >
            <ChevronRight className="w-6 h-6" />
          </button>

          {/* Dots */}
          <div className="flex justify-center gap-2 mt-8">
            {projects.map((_, index) => (
              <button
                key={index}
                onClick={() => emblaApi?.scrollTo(index)}
                className={`w-2 h-2 rounded-full transition-all duration-300 ${
                  index === selectedIndex
                    ? "bg-primary w-8"
                    : "bg-muted-foreground/30 hover:bg-muted-foreground/50"
                }`}
                aria-label={`Ir para projeto ${index + 1}`}
              />
            ))}
          </div>
        </div>

        {/* CTA */}
        <motion.div 
          className="text-center mt-12"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.3 }}
        >
          <a
            href="#plans"
            className="inline-flex items-center gap-2 px-8 py-4 bg-primary text-primary-foreground rounded-full font-bold hover:bg-primary/90 transition-all duration-200 shadow-lg hover:shadow-xl"
          >
            Quero um site como esses
            <ChevronRight className="w-5 h-5" />
          </a>
        </motion.div>
      </div>
    </section>
  );
};

export default PortfolioShowcase;
