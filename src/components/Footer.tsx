
import React from "react";

const Footer = () => {
  return (
    <footer className="w-full bg-background border-t border-border py-8 mt-16">
      <div className="section-container">
        <div className="text-center space-y-4">
          <p className="text-muted-foreground text-sm max-w-2xl mx-auto">
            Transformamos suas ideias em sites profissionais e modernos. 
            Desenvolvido com tecnologia de ponta para garantir a melhor experiência.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-2 text-xs text-muted-foreground">
            <span>© 2024 Habify. Todos os direitos reservados.</span>
            <span className="hidden sm:inline">•</span>
            <span>Desenvolvido com ❤️ no Brasil</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
export default Footer;
