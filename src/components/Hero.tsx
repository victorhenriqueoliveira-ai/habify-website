import React, { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { ArrowRight, Zap, Trophy, TrendingUp, CheckCircle, Shield, Clock } from "lucide-react";
import CountUp from "react-countup";
import { useInView } from "react-intersection-observer";
import LottieAnimation from "./LottieAnimation";
import OptimizedImage from "./OptimizedImage";
import MagneticButton from "./animations/MagneticButton";
import ParallaxLayer from "./animations/ParallaxLayer";
import { trackCTAClick } from "@/utils/analytics";
import HeroAnimation from "./HeroAnimation";

const Hero = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [lottieData, setLottieData] = useState<any>(null);
  const [isMobile, setIsMobile] = useState(false);
  const { ref: statsRef, inView: statsInView } = useInView({ triggerOnce: true, threshold: 0.3 });

  useEffect(() => {
    // Check if mobile on mount and when window resizes
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    // Skip Lottie loading - use fallback image instead
    setLottieData(null);
  }, []);

  useEffect(() => {
    // Skip effect on mobile
    if (isMobile) return;
    
    const handleScroll = () => {
      const scrollY = window.scrollY;
      const elements = document.querySelectorAll('.parallax');
      elements.forEach(el => {
        const element = el as HTMLElement;
        const speed = parseFloat(element.dataset.speed || '0.1');
        const yPos = -scrollY * speed;
        element.style.setProperty('--parallax-y', `${yPos}px`);
      });
    };
    
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [isMobile]);
  
  return (
    <section 
      className="overflow-hidden relative min-h-screen flex items-center" 
      id="hero" 
      style={{
        backgroundImage: 'url("/Header-background.webp")',
        backgroundPosition: 'center 30%', 
        padding: isMobile ? '120px 16px 60px' : '80px 20px 20px'
      }}
    >
      {/* Animated Background Gradients with Parallax */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <ParallaxLayer speed={0.3} className="absolute inset-0">
          <div className="absolute -top-[20%] -right-[10%] w-[60%] h-[60%] bg-gradient-to-br from-pulse-500/30 via-pulse-400/20 to-transparent rounded-full blur-3xl animate-pulse-slow"></div>
        </ParallaxLayer>
        <ParallaxLayer speed={0.5} className="absolute inset-0">
          <div className="absolute -bottom-[10%] -left-[10%] w-[50%] h-[50%] bg-gradient-to-tr from-pulse-600/20 via-pulse-500/10 to-transparent rounded-full blur-3xl animate-float"></div>
        </ParallaxLayer>
        <ParallaxLayer speed={0.4} className="absolute inset-0">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[40%] h-[40%] bg-gradient-to-r from-pulse-400/10 to-pulse-600/10 rounded-full blur-2xl animate-pulse-slow" style={{ animationDelay: '1s' }}></div>
        </ParallaxLayer>
      </div>
      
      <div className="container px-4 sm:px-6 lg:px-8 relative z-10" ref={containerRef}>
        <div className="flex flex-col lg:flex-row gap-8 lg:gap-16 items-center">
          {/* Left Column - Content */}
          <div className="w-full lg:w-1/2 space-y-3 lg:space-y-4">
            {/* Trust Badges Above Title */}
            <div className="flex flex-wrap gap-3 sm:gap-4 opacity-0 animate-fade-in" style={{ animationDelay: "0.1s" }}>
              <div className="inline-flex items-center gap-2 px-3 sm:px-4 py-1.5 rounded-full bg-background/60 backdrop-blur-md border border-pulse-500/20 shadow-lg">
                <Zap className="w-4 h-4 text-pulse-500" />
                <span className="text-xs sm:text-sm font-semibold text-foreground">Site pronto na hora</span>
              </div>
              <div className="inline-flex items-center gap-2 px-3 sm:px-4 py-1.5 rounded-full bg-background/60 backdrop-blur-md border border-pulse-500/20 shadow-lg">
                <Trophy className="w-4 h-4 text-pulse-500" />
                <span className="text-xs sm:text-sm font-semibold text-foreground">100% Satisfação</span>
              </div>
              <div className="inline-flex items-center gap-2 px-3 sm:px-4 py-1.5 rounded-full bg-background/60 backdrop-blur-md border border-pulse-500/20 shadow-lg">
                <TrendingUp className="w-4 h-4 text-pulse-500" />
                <span className="text-xs sm:text-sm font-semibold text-foreground">ROI Garantido</span>
              </div>
            </div>

            {/* Main Title */}
            <h1 
              className="section-title text-4xl sm:text-5xl lg:text-5xl xl:text-6xl leading-[1.1] opacity-0 animate-fade-in font-black" 
              style={{ animationDelay: "0.3s" }}
            >
              Site para Corretor de Imóveis:{" "}
              <span className="relative inline-block">
                Crie seu Site Profissional na{" "}
              </span>
              <span className="relative inline-block">
                <span className="relative z-10 bg-gradient-to-r from-pulse-500 via-pulse-600 to-pulse-700 bg-clip-text text-transparent">
                  Hora{" "}
                </span>
                <span className="relative inline-block">
                  com Captação Automática de Leads
                </span>
                <span className="absolute inset-0 bg-gradient-to-r from-pulse-500/20 to-pulse-600/20 blur-xl"></span>
              </span>
            </h1>
            
            {/* Subtitle */}
            <p 
              style={{ animationDelay: "0.5s" }} 
              className="section-subtitle opacity-0 animate-fade-in text-muted-foreground text-lg sm:text-xl leading-relaxed"
            >
              <strong className="text-foreground">Pare de perder clientes para corretores que já têm site.</strong> Sua landing page profissional pronta na hora — leads direto no WhatsApp automaticamente, SEO otimizado, plataforma própria em React.js. Pagamento único a partir de R$ 74,90.
            </p>

            {/* Animated Stats Counter */}
            {/* <div 
              ref={statsRef}
              className="grid grid-cols-3 gap-4 sm:gap-6 py-6 opacity-0 animate-fade-in" 
              style={{ animationDelay: "0.6s" }}
            >
              <div className="text-center sm:text-left">
                <div className="text-3xl sm:text-4xl lg:text-5xl font-black bg-gradient-to-r from-pulse-500 to-pulse-600 bg-clip-text text-transparent">
                  {statsInView && <CountUp end={150} duration={2.5} suffix="+" />}
                </div>
                <div className="text-xs sm:text-sm text-muted-foreground font-medium mt-1">Sites Criados</div>
              </div>
              <div className="text-center sm:text-left">
                <div className="text-3xl sm:text-4xl lg:text-5xl font-black bg-gradient-to-r from-pulse-500 to-pulse-600 bg-clip-text text-transparent">
                  {statsInView && <CountUp end={3200} duration={2.5} suffix="+" />}
                </div>
                <div className="text-xs sm:text-sm text-muted-foreground font-medium mt-1">Leads Gerados</div>
              </div>
              <div className="text-center sm:text-left">
                <div className="text-3xl sm:text-4xl lg:text-5xl font-black bg-gradient-to-r from-pulse-500 to-pulse-600 bg-clip-text text-transparent">
                  {statsInView && <CountUp end={280} duration={2.5} suffix="%" />}
                </div>
                <div className="text-xs sm:text-sm text-muted-foreground font-medium mt-1">Aumento Médio</div>
              </div>
            </div> */}
            
            {/* Premium CTA — Impossible to Ignore */}
            <div 
              className="flex flex-col items-center sm:items-start gap-2 opacity-0 animate-fade-in" 
              style={{ animationDelay: "0.7s" }}
            >
              <MagneticButton 
                className="group relative overflow-hidden flex items-center justify-center w-full sm:w-auto text-center font-extrabold rounded-2xl border-2 border-[#FFB800]/40 bg-gradient-to-r from-[#FE5C02] via-[#FF8C00] to-[#FE5C02] bg-[length:300%_auto] text-white px-12 sm:px-16 py-4 sm:py-5 text-xl sm:text-2xl shadow-[0_0_40px_rgba(254,92,2,0.7),0_0_80px_rgba(254,92,2,0.3)] hover:shadow-[0_0_60px_rgba(254,92,2,0.9),0_0_120px_rgba(254,92,2,0.4)] transition-all duration-300 hover:scale-[1.08] focus:outline-none focus:ring-4 focus:ring-pulse-500/50 animate-cta-glow"
                onClick={() => {
                  trackCTAClick('Criar meu site agora', 'hero-section');
                  window.location.href = '#plans';
                }}
                strength={0.4}
              >
                {/* Continuous shimmer sweep */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer-sweep" />
                {/* Pulsing ring */}
                <span className="absolute inset-0 rounded-2xl border-2 border-white/30 animate-ping-slow" />
                
                <span className="relative z-10 flex items-center gap-3">
                  🚀 Criar meu site agora
                  <ArrowRight className="w-6 h-6 animate-bounce-x" />
                </span>
              </MagneticButton>
              
              {/* Micro-text urgência */}
              <p className="text-xs sm:text-sm text-white/80 font-medium tracking-wide text-center sm:text-left">
                Pagamento único • Sem mensalidade • Site pronto na hora
              </p>
            </div>

            {/* Trust Indicators Below CTAs */}
            <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground opacity-0 animate-fade-in" style={{ animationDelay: "0.8s" }}>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-white" />
                <span className="text-white">Qualidade 100% garantida</span>
              </div>
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-white" />
                <span className="text-white">Dados 100% seguros</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-white" />
                <span className="text-white">Resposta em até 1h</span>
              </div>
            </div>
          </div>
          
          {/* Right Column - Image/Mockup */}
          <div className="w-full lg:w-1/2 relative mt-8 lg:mt-0">
            <div className="relative animate-fade-in" style={{ animationDelay: "0.9s" }}>
              {/* Glassmorphism Card Background */}
              <div className="absolute inset-0 bg-gradient-to-br from-background/40 via-background/20 to-transparent backdrop-blur-md rounded-3xl border border-pulse-500/20 shadow-2xl -z-10 transform rotate-3"></div>
              <div className="absolute inset-0 bg-gradient-to-tl from-background/40 via-background/20 to-transparent backdrop-blur-md rounded-3xl border border-pulse-500/20 shadow-2xl -z-10 transform -rotate-2"></div>

              {/* Animated Hero */}
              <div className="relative transition-all duration-500 ease-out overflow-hidden rounded-3xl shadow-2xl border-2 border-pulse-500/30 hover:border-pulse-500/50 group">
                <div className="absolute -inset-1 bg-gradient-to-r from-pulse-500/50 via-pulse-600/50 to-pulse-500/50 rounded-3xl blur-xl opacity-50 group-hover:opacity-100 transition-opacity duration-500"></div>
                <div className="relative">
                  <HeroAnimation />
                </div>
              </div>

              {/* Floating Badge */}
              <div className="absolute -bottom-4 -left-4 sm:-bottom-6 sm:-left-6 bg-gradient-to-br from-pulse-500 to-pulse-600 text-white px-4 sm:px-6 py-3 sm:py-4 rounded-2xl shadow-2xl border border-pulse-400 animate-float">
                <div className="text-xs sm:text-sm font-semibold">✓ SEO Otimizado</div>
                <div className="text-xl sm:text-2xl font-black">100/100</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
