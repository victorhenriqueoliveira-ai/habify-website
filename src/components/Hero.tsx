import React, { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { ArrowRight, MessageCircle, Zap, Trophy, TrendingUp, CheckCircle, Shield, Clock } from "lucide-react";
import CountUp from "react-countup";
import { useInView } from "react-intersection-observer";
import LottieAnimation from "./LottieAnimation";

const Hero = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
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
    
    const handleMouseMove = (e: MouseEvent) => {
      if (!containerRef.current || !imageRef.current) return;
      
      const {
        left,
        top,
        width,
        height
      } = containerRef.current.getBoundingClientRect();
      const x = (e.clientX - left) / width - 0.5;
      const y = (e.clientY - top) / height - 0.5;

      imageRef.current.style.transform = `perspective(1000px) rotateY(${x * 2.5}deg) rotateX(${-y * 2.5}deg) scale3d(1.02, 1.02, 1.02)`;
    };
    
    const handleMouseLeave = () => {
      if (!imageRef.current) return;
      imageRef.current.style.transform = `perspective(1000px) rotateY(0deg) rotateX(0deg) scale3d(1, 1, 1)`;
    };
    
    const container = containerRef.current;
    if (container) {
      container.addEventListener("mousemove", handleMouseMove);
      container.addEventListener("mouseleave", handleMouseLeave);
    }
    
    return () => {
      if (container) {
        container.removeEventListener("mousemove", handleMouseMove);
        container.removeEventListener("mouseleave", handleMouseLeave);
      }
    };
  }, [isMobile]);
  
  useEffect(() => {
    // Skip parallax on mobile
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
        padding: isMobile ? '120px 16px 60px' : '140px 20px 80px'
      }}
    >
      {/* Animated Background Gradients */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-[20%] -right-[10%] w-[60%] h-[60%] bg-gradient-to-br from-pulse-500/30 via-pulse-400/20 to-transparent rounded-full blur-3xl animate-pulse-slow"></div>
        <div className="absolute -bottom-[10%] -left-[10%] w-[50%] h-[50%] bg-gradient-to-tr from-pulse-600/20 via-pulse-500/10 to-transparent rounded-full blur-3xl animate-float"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[40%] h-[40%] bg-gradient-to-r from-pulse-400/10 to-pulse-600/10 rounded-full blur-2xl animate-pulse-slow" style={{ animationDelay: '1s' }}></div>
      </div>
      
      <div className="container px-4 sm:px-6 lg:px-8 relative z-10" ref={containerRef}>
        <div className="flex flex-col lg:flex-row gap-8 lg:gap-16 items-center">
          {/* Left Column - Content */}
          <div className="w-full lg:w-1/2 space-y-6 lg:space-y-8">
            {/* Trust Badges Above Title */}
            <div className="flex flex-wrap gap-3 sm:gap-4 opacity-0 animate-fade-in" style={{ animationDelay: "0.1s" }}>
              <div className="inline-flex items-center gap-2 px-3 sm:px-4 py-2 rounded-full bg-background/60 backdrop-blur-md border border-pulse-500/20 shadow-lg">
                <Zap className="w-4 h-4 text-pulse-500" />
                <span className="text-xs sm:text-sm font-semibold text-foreground">Entrega em 72h</span>
              </div>
              <div className="inline-flex items-center gap-2 px-3 sm:px-4 py-2 rounded-full bg-background/60 backdrop-blur-md border border-pulse-500/20 shadow-lg">
                <Trophy className="w-4 h-4 text-pulse-500" />
                <span className="text-xs sm:text-sm font-semibold text-foreground">100% Satisfação</span>
              </div>
              <div className="inline-flex items-center gap-2 px-3 sm:px-4 py-2 rounded-full bg-background/60 backdrop-blur-md border border-pulse-500/20 shadow-lg">
                <TrendingUp className="w-4 h-4 text-pulse-500" />
                <span className="text-xs sm:text-sm font-semibold text-foreground">ROI Garantido</span>
              </div>
            </div>

            {/* Main Title */}
            <h1 
              className="section-title text-4xl sm:text-5xl lg:text-6xl xl:text-7xl leading-[1.1] opacity-0 animate-fade-in font-black" 
              style={{ animationDelay: "0.3s" }}
            >
              Sua Máquina de Vendas 24/7: Site Profissional + Captação Automática de Leads em{" "}
              <span className="relative inline-block">
                <span className="relative z-10 bg-gradient-to-r from-pulse-500 via-pulse-600 to-pulse-700 bg-clip-text text-transparent">
                  72 Horas
                </span>
                <span className="absolute inset-0 bg-gradient-to-r from-pulse-500/20 to-pulse-600/20 blur-xl"></span>
              </span>
            </h1>
            
            {/* Subtitle */}
            <p 
              style={{ animationDelay: "0.5s" }} 
              className="section-subtitle opacity-0 animate-fade-in text-muted-foreground text-lg sm:text-xl leading-relaxed"
            >
              <strong className="text-foreground">Sem WordPress. Sem complicação.</strong> Plataforma própria 100% otimizada para conversão e SEO. Você envia as fotos, nós criamos sua máquina de vendas. Leads direto no WhatsApp automaticamente.
            </p>

            {/* Animated Stats Counter */}
            <div 
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
            </div>
            
            {/* Premium CTAs */}
            <div 
              className="flex flex-col sm:flex-row gap-4 opacity-0 animate-fade-in" 
              style={{ animationDelay: "0.7s" }}
            >
              <a 
                href="#plans"
                className="group relative overflow-hidden flex items-center justify-center w-full sm:w-auto text-center font-bold rounded-full border-2 border-transparent bg-gradient-to-r from-[#FE5C02] via-[#FF7020] to-[#FE5C02] bg-[length:200%_auto] text-white px-8 py-4 text-base sm:text-lg shadow-2xl shadow-pulse-500/50 hover:shadow-pulse-500/80 transition-all duration-300 hover:scale-105 hover:bg-right focus:outline-none focus:ring-4 focus:ring-pulse-500/50"
              >
                <span className="relative z-10 flex items-center gap-2">
                  Criar meu site agora
                  <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
                </span>
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
              </a>
              
              <a 
                href="https://wa.me/5511961769504?text=Olá!%20Gostaria%20de%20criar%20meu%20site%20profissional%20com%20a%20HabiFy"
                target="_blank"
                rel="noopener noreferrer"
                className="group relative overflow-hidden flex items-center justify-center w-full sm:w-auto text-center font-bold rounded-full border-2 border-[#25D366] bg-background/80 backdrop-blur-sm text-[#25D366] px-8 py-4 text-base sm:text-lg shadow-lg hover:bg-[#25D366] hover:text-white hover:shadow-2xl hover:shadow-[#25D366]/30 hover:scale-105 transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-[#25D366]/50"
              >
                <MessageCircle className="w-5 h-5 mr-2" />
                Falar com Especialista
              </a>
            </div>

            {/* Trust Indicators Below CTAs */}
            <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground opacity-0 animate-fade-in" style={{ animationDelay: "0.8s" }}>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-pulse-500" />
                <span>Sem cartão de crédito</span>
              </div>
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-pulse-500" />
                <span>Dados 100% seguros</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-pulse-500" />
                <span>Resposta em até 1h</span>
              </div>
            </div>
          </div>
          
          {/* Right Column - Image/Mockup */}
          <div className="w-full lg:w-1/2 relative mt-8 lg:mt-0">
            {lottieData ? (
              <div className="relative z-10 animate-fade-in" style={{ animationDelay: "0.9s" }}>
                <LottieAnimation 
                  animationPath={lottieData} 
                  className="w-full h-auto max-w-lg mx-auto"
                  loop={true}
                  autoplay={true}
                />
              </div>
            ) : (
              <div className="relative animate-fade-in" style={{ animationDelay: "0.9s" }}>
                {/* Glassmorphism Card Background */}
                <div className="absolute inset-0 bg-gradient-to-br from-background/40 via-background/20 to-transparent backdrop-blur-md rounded-3xl border border-pulse-500/20 shadow-2xl -z-10 transform rotate-3"></div>
                <div className="absolute inset-0 bg-gradient-to-tl from-background/40 via-background/20 to-transparent backdrop-blur-md rounded-3xl border border-pulse-500/20 shadow-2xl -z-10 transform -rotate-2"></div>
                
                {/* Main Image Container */}
                <div className="relative transition-all duration-500 ease-out overflow-hidden rounded-3xl shadow-2xl border-2 border-pulse-500/30 hover:border-pulse-500/50 group">
                  {/* Glow Effect */}
                  <div className="absolute -inset-1 bg-gradient-to-r from-pulse-500/50 via-pulse-600/50 to-pulse-500/50 rounded-3xl blur-xl opacity-50 group-hover:opacity-100 transition-opacity duration-500"></div>
                  
                  <div className="relative">
                    <img 
                      ref={imageRef} 
                      src="/Foto1.png" 
                      alt="Landing Page Profissional para Corretores - HabiFy" 
                      className="w-full h-auto object-cover transition-transform duration-500 ease-out group-hover:scale-105" 
                      style={{ transformStyle: 'preserve-3d' }} 
                      loading="eager"
                    />
                    {/* Overlay gradient */}
                    <div className="absolute inset-0 bg-gradient-to-t from-background/20 via-transparent to-transparent pointer-events-none"></div>
                  </div>
                </div>

                {/* Floating Badge */}
                <div className="absolute -bottom-4 -left-4 sm:-bottom-6 sm:-left-6 bg-gradient-to-br from-pulse-500 to-pulse-600 text-white px-4 sm:px-6 py-3 sm:py-4 rounded-2xl shadow-2xl border border-pulse-400 animate-float">
                  <div className="text-xs sm:text-sm font-semibold">✓ SEO Otimizado</div>
                  <div className="text-xl sm:text-2xl font-black">100/100</div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
