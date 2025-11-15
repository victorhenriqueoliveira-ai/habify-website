import React, { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { MobileMenuTrigger } from "./mobile/MobileMenu";

const Navbar = () => {
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const scrollToSection = (sectionId: string) => {
    const element = document.querySelector(sectionId);
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
    <header
      className={cn(
        "fixed top-0 left-0 right-0 z-50 py-3 md:py-4 transition-all duration-300",
        isScrolled
          ? "bg-background/95 backdrop-blur-lg shadow-lg border-b border-border"
          : "bg-background/80 backdrop-blur-sm md:bg-transparent"
      )}
    >
      <div className="container flex items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Logo */}
        <a
          href="#"
          className="flex items-center space-x-2 touch-manipulation min-h-[44px]"
          onClick={(e) => {
            e.preventDefault();
            scrollToTop();
          }}
          aria-label="HabiFy Logo and Home Link"
        >
          <img
            src="/logotipo_habify.png"
            alt="Logotipo HabiFy"
            className="h-8 sm:h-10 md:h-12 w-auto max-h-12 object-contain select-none"
            style={{ maxWidth: "160px" }}
            draggable={false}
          />
        </a>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center space-x-6 lg:space-x-8">
          <button onClick={scrollToTop} className="nav-link font-medium hover:text-primary transition-colors">
            Início
          </button>
          <button 
            onClick={() => scrollToSection('#portfolio')} 
            className="nav-link font-medium hover:text-primary transition-colors"
          >
            Portfólio
          </button>
          <button 
            onClick={() => scrollToSection('#plans')} 
            className="nav-link font-medium hover:text-primary transition-colors"
          >
            Planos
          </button>
          <button 
            onClick={() => scrollToSection('#faq')} 
            className="nav-link font-medium hover:text-primary transition-colors"
          >
            FAQ
          </button>
          <a 
            href="/login" 
            className="px-6 py-2.5 bg-primary from-primary text-primary-foreground rounded-lg font-semibold hover:shadow-lg hover:shadow-primary/50 transition-all duration-300"
          >
            Login
          </a>
        </nav>

        {/* Mobile Menu Trigger */}
        <MobileMenuTrigger />
      </div>
    </header>
  );
};

export default Navbar;
