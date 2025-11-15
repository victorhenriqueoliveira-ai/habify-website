import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Menu, Home, Briefcase, Phone, DollarSign, HelpCircle, MessageCircle } from 'lucide-react';

interface MobileMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

const menuItems = [
  { icon: Home, label: 'Início', href: '#hero' },
  { icon: Briefcase, label: 'Portfólio', href: '#portfolio' },
  { icon: DollarSign, label: 'Planos', href: '#plans' },
  { icon: HelpCircle, label: 'FAQ', href: '#faq' },
  { icon: MessageCircle, label: 'Depoimentos', href: '#testimonials' },
];

const MobileMenu: React.FC<MobileMenuProps> = ({ isOpen, onClose }) => {
  useEffect(() => {
    // Prevent body scroll when menu is open
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  const handleLinkClick = (href: string) => {
    onClose();
    setTimeout(() => {
      const element = document.querySelector(href);
      if (element) {
        const offset = 80;
        const elementPosition = element.getBoundingClientRect().top;
        const offsetPosition = elementPosition + window.pageYOffset - offset;
        
        window.scrollTo({
          top: offsetPosition,
          behavior: 'smooth'
        });
      }
    }, 300);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
            onClick={onClose}
          />

          {/* Menu Panel */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed right-0 top-0 bottom-0 w-[280px] sm:w-[320px] md:w-[380px] bg-background border-l border-border shadow-2xl z-50 flex flex-col safe-area-inset-right"
            style={{
              paddingRight: 'env(safe-area-inset-right)',
            }}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 sm:p-6 border-b border-border">
              <div className="flex items-center gap-2 sm:gap-3">
                <img
                  src="/logotipo_habify.png"
                  alt="HabiFy"
                  className="h-8 sm:h-10 w-auto object-contain"
                />
              </div>
              <button
                onClick={onClose}
                className="w-11 h-11 flex items-center justify-center rounded-lg hover:bg-muted transition-colors touch-manipulation active:scale-95"
                aria-label="Fechar menu"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Menu Items */}
            <nav className="flex-1 overflow-y-auto py-4 sm:py-6 overscroll-contain">
              <ul className="space-y-1 sm:space-y-2 px-3 sm:px-4">
                {menuItems.map((item, index) => (
                  <motion.li
                    key={item.label}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <button
                      onClick={() => handleLinkClick(item.href)}
                      className="w-full flex items-center gap-3 sm:gap-4 px-3 sm:px-4 py-3 sm:py-4 rounded-xl hover:bg-muted active:bg-muted/80 transition-colors touch-manipulation group min-h-[48px]"
                    >
                      <div className="w-10 h-10 sm:w-11 sm:h-11 flex items-center justify-center rounded-lg bg-primary/10 group-hover:bg-primary/20 group-active:bg-primary/30 transition-colors flex-shrink-0">
                        <item.icon className="w-5 h-5 text-primary" />
                      </div>
                      <span className="text-sm sm:text-base font-medium text-foreground group-hover:text-primary transition-colors text-left">
                        {item.label}
                      </span>
                    </button>
                  </motion.li>
                ))}
              </ul>
            </nav>

            {/* CTA Buttons */}
            <div className="p-4 sm:p-6 border-t border-border space-y-2 sm:space-y-3 pb-safe">
              <a
                href="#plans"
                onClick={(e) => {
                  e.preventDefault();
                  handleLinkClick('#plans');
                }}
                className="block w-full py-3.5 sm:py-4 px-4 sm:px-6 bg-gradient-to-r from-primary to-accent text-primary-foreground rounded-xl font-bold text-sm sm:text-base text-center shadow-lg active:shadow-md active:scale-[0.98] transition-all touch-manipulation min-h-[48px]"
              >
                Criar Meu Site
              </a>
              <a
                href="https://wa.me/5511961769504?text=Olá!%20Gostaria%20de%20criar%20meu%20site%20profissional%20com%20a%20HabiFy"
                target="_blank"
                rel="noopener noreferrer"
                className="block w-full py-3.5 sm:py-4 px-4 sm:px-6 border-2 border-[#25D366] text-[#25D366] rounded-xl font-bold text-sm sm:text-base text-center hover:bg-[#25D366]/10 active:bg-[#25D366]/20 active:scale-[0.98] transition-all touch-manipulation min-h-[48px]"
                onClick={onClose}
              >
                Falar no WhatsApp
              </a>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

// Mobile Menu Trigger Button Component
export const MobileMenuTrigger: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="md:hidden w-11 h-11 flex items-center justify-center rounded-lg hover:bg-muted active:bg-muted/80 transition-colors touch-manipulation min-h-[44px] min-w-[44px]"
        aria-label="Abrir menu"
      >
        <Menu className="w-6 h-6" />
      </button>
      <MobileMenu isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  );
};

export default MobileMenu;
