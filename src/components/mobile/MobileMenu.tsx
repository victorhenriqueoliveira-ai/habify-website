import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Menu, Home, Briefcase, DollarSign, HelpCircle, MessageCircle, LogIn } from 'lucide-react';
import { trackCTAClick, trackWhatsAppClick } from '@/utils/analytics';

interface MobileMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

const menuItems = [
  { icon: Home, label: 'Início', href: '#' },
  { icon: Briefcase, label: 'Portfólio', href: '#portfolio' },
  { icon: DollarSign, label: 'Planos', href: '#plans' },
  { icon: HelpCircle, label: 'FAQ', href: '#faq' },
  { icon: MessageCircle, label: 'Depoimentos', href: '#testimonials' },
  { icon: LogIn, label: 'Login', href: '/admin/login' },
];

const MobileMenu: React.FC<MobileMenuProps> = ({ isOpen, onClose }) => {
  useEffect(() => {
    if (isOpen) {
      // Prevent body scroll
      document.body.style.overflow = 'hidden';
      document.body.style.position = 'fixed';
      document.body.style.width = '100%';
    } else {
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.width = '';
    }

    return () => {
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.width = '';
    };
  }, [isOpen]);

  const handleNavigation = (href: string) => {
    onClose();
    
    setTimeout(() => {
      if (href.startsWith('/')) {
        // Navegação para rota absoluta (ex: /admin/login)
        window.location.href = href;
      } else if (href === '#') {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        // Scroll para seção âncora
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
      }
    }, 300);
  };

  const handleWhatsAppClick = () => {
    trackWhatsAppClick('mobile_menu');
    onClose();
  };

  const handlePlanClick = () => {
    trackCTAClick('mobile_menu', 'criar_meu_site');
    handleNavigation('#plans');
  };

  return (
    <AnimatePresence mode="wait">
      {isOpen && (
        <>
          {/* Backdrop/Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[9998]"
            onClick={onClose}
            style={{ touchAction: 'none' }}
          />

          {/* Menu Panel */}
          <motion.aside
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ 
              type: 'spring', 
              damping: 25, 
              stiffness: 200,
              mass: 0.8
            }}
            className="fixed top-0 right-0 bottom-0 w-[85vw] max-w-[320px] bg-background shadow-2xl z-[9999] flex flex-col"
            style={{
              borderLeft: '1px solid hsl(var(--border))',
            }}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-border shrink-0">
              <img
                src="/logotipo_habify.png"
                alt="HabiFy"
                className="h-9 w-auto object-contain"
              />
              <button
                onClick={onClose}
                className="w-10 h-10 flex items-center justify-center rounded-lg bg-muted/50 hover:bg-muted active:scale-95 transition-all"
                aria-label="Fechar menu"
              >
                <X className="w-5 h-5 text-foreground" />
              </button>
            </div>

            {/* Navigation Items */}
            <nav className="flex-1 overflow-y-auto overflow-x-hidden py-6 px-4">
              <ul className="space-y-2">
                {menuItems.map((item, index) => (
                  <motion.li
                    key={item.label}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05, duration: 0.3 }}
                  >
                    <button
                      onClick={() => handleNavigation(item.href)}
                      className="w-full flex items-center gap-4 px-4 py-3.5 rounded-xl bg-muted/30 hover:bg-muted active:bg-muted/60 transition-all group"
                      style={{ minHeight: '52px' }}
                    >
                      <div className="w-10 h-10 flex items-center justify-center rounded-lg bg-primary/10 group-hover:bg-primary/20 group-active:bg-primary/30 transition-colors shrink-0">
                        <item.icon className="w-5 h-5 text-primary" />
                      </div>
                      <span className="text-base font-medium text-foreground group-hover:text-primary transition-colors">
                        {item.label}
                      </span>
                    </button>
                  </motion.li>
                ))}
              </ul>
            </nav>

            {/* CTA Buttons Footer */}
            <div className="shrink-0 p-5 border-t border-border space-y-3 pb-safe">
              <button
                onClick={handlePlanClick}
                className="w-full py-4 px-5 bg-gradient-to-r from-primary to-accent text-primary-foreground rounded-xl font-bold text-base text-center shadow-lg active:shadow-md active:scale-[0.97] transition-all"
                style={{ minHeight: '52px' }}
              >
                Criar Meu Site
              </button>
              <a
                href="https://wa.me/5511911103963?text=Olá!%20Gostaria%20de%20criar%20meu%20site%20profissional%20com%20a%20HabiFy"
                target="_blank"
                rel="noopener noreferrer"
                onClick={handleWhatsAppClick}
                className="w-full py-4 px-5 flex items-center justify-center gap-2 border-2 border-[#25D366] text-[#25D366] rounded-xl font-bold text-base text-center hover:bg-[#25D366]/10 active:bg-[#25D366]/20 active:scale-[0.97] transition-all"
                style={{ minHeight: '52px' }}
              >
                <MessageCircle className="w-5 h-5" />
                Falar no WhatsApp
              </a>
            </div>
          </motion.aside>
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
        className="md:hidden w-11 h-11 flex items-center justify-center rounded-lg hover:bg-muted/50 active:bg-muted transition-all"
        aria-label="Abrir menu"
        style={{ minWidth: '44px', minHeight: '44px' }}
      >
        <Menu className="w-6 h-6 text-foreground" />
      </button>
      <MobileMenu isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  );
};

export default MobileMenu;
