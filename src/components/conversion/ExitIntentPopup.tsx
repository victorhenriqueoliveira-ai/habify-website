import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Zap, Gift } from 'lucide-react';

const ExitIntentPopup: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [hasShown, setHasShown] = useState(false);

  useEffect(() => {
    // Check if already shown in this session
    const shown = sessionStorage.getItem('exitIntentShown');
    if (shown) {
      setHasShown(true);
      return;
    }

    const handleMouseLeave = (e: MouseEvent) => {
      // Only trigger if mouse leaves from top of window (user closing tab)
      if (e.clientY <= 0 && !hasShown) {
        setIsVisible(true);
        setHasShown(true);
        sessionStorage.setItem('exitIntentShown', 'true');
      }
    };

    // Wait 5 seconds before activating exit intent
    const timer = setTimeout(() => {
      document.addEventListener('mouseleave', handleMouseLeave);
    }, 5000);

    return () => {
      clearTimeout(timer);
      document.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [hasShown]);

  const handleClose = () => {
    setIsVisible(false);
  };

  const handleCTA = () => {
    setIsVisible(false);
    // Scroll to plans section
    const element = document.querySelector('#plans');
    if (element) {
      const offset = 80;
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - offset;
      
      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
    }
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60]"
            onClick={handleClose}
          />

          {/* Popup */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 50 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 50 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed inset-0 flex items-center justify-center z-[61] p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-card rounded-2xl shadow-2xl max-w-2xl w-full overflow-hidden border-2 border-primary/20">
              {/* Header with gradient */}
              <div className="bg-gradient-to-r from-primary via-accent to-primary p-6 text-primary-foreground relative overflow-hidden">
                <div className="absolute inset-0 opacity-20">
                  <div className="absolute inset-0" style={{
                    backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)',
                    backgroundSize: '40px 40px'
                  }} />
                </div>
                
                <button
                  onClick={handleClose}
                  className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-white/20 hover:bg-white/30 transition-colors"
                  aria-label="Fechar"
                >
                  <X className="w-5 h-5" />
                </button>

                <div className="relative z-10">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                      <Gift className="w-7 h-7" />
                    </div>
                    <h2 className="text-3xl font-bold">Espere! Oferta Especial</h2>
                  </div>
                  <p className="text-lg opacity-90">
                    Não perca essa oportunidade única de transformar sua presença digital
                  </p>
                </div>
              </div>

              {/* Content */}
              <div className="p-8">
                <div className="mb-6">
                  <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-500/10 text-green-600 dark:text-green-400 rounded-full font-semibold mb-4 border border-green-500/20">
                    <Zap className="w-5 h-5" />
                    Oferta Válida por Tempo Limitado
                  </div>

                  <h3 className="text-2xl font-bold mb-4 text-foreground">
                    🎁 Ganhe Consulta Estratégica Gratuita
                  </h3>

                  <p className="text-lg text-muted-foreground mb-6 leading-relaxed">
                    Antes de ir, que tal uma conversa rápida e gratuita com nosso especialista? 
                    Vamos te mostrar exatamente como aumentar seus leads em até 300% com um site profissional.
                  </p>

                  <ul className="space-y-3 mb-8">
                    {[
                      'Análise gratuita do seu perfil profissional',
                      'Estratégia personalizada de captação de leads',
                      'Demonstração ao vivo da plataforma',
                      'Bônus exclusivo de R$ 500 em funcionalidades extras'
                    ].map((item, index) => (
                      <li key={index} className="flex items-start gap-3">
                        <div className="w-6 h-6 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                          <span className="text-primary font-bold text-sm">✓</span>
                        </div>
                        <span className="text-foreground">{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* CTAs */}
                <div className="flex flex-col sm:flex-row gap-4">
                  <a
                    href="https://wa.me/5511911103963?text=Olá!%20Vi%20a%20oferta%20especial%20e%20quero%20agendar%20minha%20consulta%20gratuita"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 flex items-center justify-center gap-2 px-6 py-4 bg-gradient-to-r from-[#25D366] to-[#20BA5A] text-white rounded-xl font-bold hover:shadow-2xl hover:shadow-[#25D366]/50 transition-all duration-300 hover:scale-105"
                    onClick={handleClose}
                  >
                    <span>Quero Minha Consulta Grátis</span>
                    <Zap className="w-5 h-5" />
                  </a>

                  <button
                    onClick={handleCTA}
                    className="flex-1 px-6 py-4 border-2 border-primary text-primary rounded-xl font-bold hover:bg-primary/10 transition-colors"
                  >
                    Ver Planos
                  </button>
                </div>

                <p className="text-center text-sm text-muted-foreground mt-4">
                  ⏰ Promoção válida apenas hoje
                </p>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default ExitIntentPopup;
