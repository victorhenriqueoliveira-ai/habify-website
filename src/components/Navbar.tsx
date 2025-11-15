import React, { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { Menu, X } from "lucide-react";

const Navbar = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Detecta scroll para mudar o estilo do header
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Bloqueia scroll de fundo ao abrir o menu
  useEffect(() => {
    if (isMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
  }, [isMenuOpen]);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
    setIsMenuOpen(false);
  };

  return (
    <>
      <header
        className={cn(
          "fixed top-0 left-0 right-0 z-50 py-2 sm:py-3 md:py-4 transition-all duration-300",
          isScrolled
            ? "bg-white/80 backdrop-blur-md shadow-sm"
            : "bg-white md:bg-transparent"
        )}
      >
        <div className="container flex items-center justify-between px-4 sm:px-6 lg:px-8">
          <a
            href="#"
            className="flex items-center space-x-2"
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
          <nav className="hidden md:flex items-center space-x-8">
            <a href="#" onClick={(e) => { e.preventDefault(); scrollToTop(); }} className="nav-link">
              Home
            </a>
            <a href="#features" className="nav-link">About</a>
            <a href="#faq" className="nav-link">FAQ</a>
            <a href="/termos-de-uso" className="nav-link">Termos de Uso</a>
            <a href="/login" className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors">
              Login
            </a>
          </nav>

          {/* Mobile menu button */}
          <button
            className="md:hidden text-gray-700 p-3 focus:outline-none"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            aria-label={isMenuOpen ? "Close menu" : "Open menu"}
          >
            {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </header>

      {/* Mobile Navigation — fora do header, cobre a tela */}
      <div
        className={cn(
          "fixed inset-0 z-40 bg-white flex flex-col pt-20 px-6 transition-all duration-300 ease-in-out md:hidden",
          isMenuOpen
            ? "opacity-100 translate-x-0"
            : "opacity-0 translate-x-full pointer-events-none"
        )}
      >
        <nav className="flex flex-col space-y-8 items-center mt-8">
          <a
            href="#"
            onClick={(e) => {
              e.preventDefault();
              scrollToTop();
            }}
            className="text-xl font-medium py-3 px-6 w-full text-center rounded-lg hover:bg-gray-100"
          >
            Home
          </a>
          <a
            href="#features"
            onClick={() => setIsMenuOpen(false)}
            className="text-xl font-medium py-3 px-6 w-full text-center rounded-lg hover:bg-gray-100"
          >
            About
          </a>
          <a
            href="#faq"
            onClick={() => setIsMenuOpen(false)}
            className="text-xl font-medium py-3 px-6 w-full text-center rounded-lg hover:bg-gray-100"
          >
            FAQ
          </a>
          <a
            href="/termos-de-uso"
            onClick={() => setIsMenuOpen(false)}
            className="text-xl font-medium py-3 px-6 w-full text-center rounded-lg hover:bg-gray-100"
          >
            Termos de Uso
          </a>
          <a
            href="/login"
            onClick={() => setIsMenuOpen(false)}
            className="bg-primary text-white py-3 px-6 w-full text-center rounded-lg hover:bg-primary/90 transition-colors text-xl font-medium"
          >
            Login
          </a>
        </nav>
      </div>
    </>
  );
};

export default Navbar;
