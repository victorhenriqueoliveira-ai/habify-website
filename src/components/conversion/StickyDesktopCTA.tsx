import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, X } from 'lucide-react';
import { trackCTAClick } from '@/utils/analytics';

interface StickyDesktopCTAProps {
  showAfterScroll?: number;
  dismissible?: boolean;
}

const StickyDesktopCTA: React.FC<StickyDesktopCTAProps> = ({ 
  showAfterScroll = 800,
  dismissible = true 
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    // Check if was previously dismissed
    const dismissed = sessionStorage.getItem('stickyCtaDismissed');
    if (dismissed) {
      setIsDismissed(true);
      return;
    }

    const handleScroll = () => {
      const scrollPosition = window.scrollY;
      setIsVisible(scrollPosition > showAfterScroll && !isDismissed);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();

    return () => window.removeEventListener('scroll', handleScroll);
  }, [showAfterScroll, isDismissed]);

  const handleDismiss = () => {
    setIsDismissed(true);
    sessionStorage.setItem('stickyCtaDismissed', 'true');
  };

  const handleCTAClick = () => {
    trackCTAClick('Sticky Desktop CTA', 'sticky-header');
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
      {isVisible && !isDismissed && (
        <motion.div
          initial={{ y: -100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -100, opacity: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="hidden md:block fixed top-0 left-0 right-0 z-40 bg-gradient-to-r from-primary via-accent to-primary text-primary-foreground shadow-2xl"
        >
          <div className="container mx-auto px-4">
            <div className="flex items-center justify-between py-3">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                  <span className="font-semibold">🔥 Oferta Limitada</span>
                </div>
                <span className="text-sm opacity-90">
                  Ganhe consultoria grátis + bônus de R$ 500 ao criar seu site hoje
                </span>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={handleCTAClick}
                  className="flex items-center gap-2 px-6 py-2 bg-white text-primary rounded-lg font-bold hover:bg-white/90 transition-colors"
                >
                  <span>Quero Aproveitar</span>
                  <ArrowRight className="w-4 h-4" />
                </button>

                {dismissible && (
                  <button
                    onClick={handleDismiss}
                    className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/20 transition-colors"
                    aria-label="Fechar"
                  >
                    <X className="w-5 h-5" />
                  </button>
                )}
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default StickyDesktopCTA;
