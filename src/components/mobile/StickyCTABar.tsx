import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, MessageCircle } from 'lucide-react';

interface StickyCTABarProps {
  showAfterScroll?: number;
}

const StickyCTABar: React.FC<StickyCTABarProps> = ({ showAfterScroll = 500 }) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY;
      setIsVisible(scrollPosition > showAfterScroll);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll(); // Check initial position

    return () => window.removeEventListener('scroll', handleScroll);
  }, [showAfterScroll]);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: 'spring', damping: 30, stiffness: 300 }}
          className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-lg border-t border-border shadow-2xl"
        >
          <div className="container mx-auto px-4 py-3">
            <div className="flex gap-3">
              <a
                href="#plans"
                onClick={(e) => {
                  e.preventDefault();
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
                }}
                className="flex-1 flex items-center justify-center gap-2 py-4 px-4 bg-gradient-to-r from-primary to-accent text-primary-foreground rounded-xl font-bold text-sm shadow-lg hover:shadow-xl transition-shadow touch-manipulation min-h-[48px]"
              >
                <span>Criar Site</span>
                <ArrowRight className="w-4 h-4" />
              </a>
              
              <a
                href="https://wa.me/5511961769504?text=Olá!%20Gostaria%20de%20criar%20meu%20site%20profissional%20com%20a%20HabiFy"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 py-4 px-4 border-2 border-[#25D366] text-[#25D366] rounded-xl font-bold text-sm hover:bg-[#25D366]/10 transition-colors touch-manipulation min-h-[48px]"
              >
                <MessageCircle className="w-4 h-4" />
                <span className="hidden xs:inline">WhatsApp</span>
              </a>
            </div>
          </div>

          {/* Safe area padding for iOS devices */}
          <div className="h-[env(safe-area-inset-bottom)]" />
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default StickyCTABar;
