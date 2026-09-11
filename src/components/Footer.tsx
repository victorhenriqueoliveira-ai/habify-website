import React from "react";
import { Button } from "@/components/ui/button";
import { Mail, Phone, Instagram, FileText, Lock } from "lucide-react";

const Footer = () => {
  return (
    <footer className="relative w-full bg-gradient-to-b from-background via-muted/20 to-muted/40 border-t border-border/50">
      {/* Tech Grid Background */}
      <div className="absolute inset-0 opacity-[0.02]">
        <div 
          className="w-full h-full" 
          style={{
            backgroundImage: `linear-gradient(to right, hsl(var(--border)) 1px, transparent 1px),
                            linear-gradient(to bottom, hsl(var(--border)) 1px, transparent 1px)`,
            backgroundSize: '40px 40px'
          }}
        />
      </div>
      
      <div className="relative section-container py-16">
        {/* Main Footer Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12 mb-12">
          
          {/* Brand Section */}
          <div className="space-y-6">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center shadow-lg shadow-primary/20">
                <img
                  src="/logotipo_habify.png"
                  alt="HabiFy"
                  width={38}
                  height={32}
                  className="h-8 w-auto brightness-0 invert"
                />
              </div>
              <div>
                <h3 className="text-2xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                  HabiFy
                </h3>
              </div>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Plataforma tecnológica para criação de landing pages profissionais para o mercado imobiliário.
            </p>
          </div>

          {/* Links Rápidos */}
          <div className="space-y-4">
            <h4 className="text-sm font-bold text-foreground uppercase tracking-wider">
              Navegação
            </h4>
            <ul className="space-y-3">
              <li>
                <a 
                  href="#hero" 
                  className="text-sm text-muted-foreground hover:text-primary transition-colors flex items-center gap-2 group"
                >
                  <span className="w-1 h-1 rounded-full bg-muted-foreground group-hover:bg-primary transition-colors" />
                  Início
                </a>
              </li>
              <li>
                <a 
                  href="#portfolio" 
                  className="text-sm text-muted-foreground hover:text-primary transition-colors flex items-center gap-2 group"
                >
                  <span className="w-1 h-1 rounded-full bg-muted-foreground group-hover:bg-primary transition-colors" />
                  Portfólio
                </a>
              </li>
              <li>
                <a 
                  href="#plans" 
                  className="text-sm text-muted-foreground hover:text-primary transition-colors flex items-center gap-2 group"
                >
                  <span className="w-1 h-1 rounded-full bg-muted-foreground group-hover:bg-primary transition-colors" />
                  Planos
                </a>
              </li>
              <li>
                <a 
                  href="#testimonials" 
                  className="text-sm text-muted-foreground hover:text-primary transition-colors flex items-center gap-2 group"
                >
                  <span className="w-1 h-1 rounded-full bg-muted-foreground group-hover:bg-primary transition-colors" />
                  Depoimentos
                </a>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div className="space-y-4">
            <h4 className="text-sm font-bold text-foreground uppercase tracking-wider">
              Legal
            </h4>
            <ul className="space-y-3">
              <li>
                <a 
                  href="/termos-de-uso" 
                  className="text-sm text-muted-foreground hover:text-primary transition-colors flex items-center gap-2 group"
                >
                  <FileText className="w-3 h-3 text-muted-foreground group-hover:text-primary transition-colors" />
                  Termos de Uso
                </a>
              </li>
              <li>
                <a 
                  href="/politica-privacidade" 
                  className="text-sm text-muted-foreground hover:text-primary transition-colors flex items-center gap-2 group"
                >
                  <Lock className="w-3 h-3 text-muted-foreground group-hover:text-primary transition-colors" />
                  Política de Privacidade
                </a>
              </li>
            </ul>
          </div>

          {/* Contato */}
          <div className="space-y-4">
            <h4 className="text-sm font-bold text-foreground uppercase tracking-wider">
              Contato
            </h4>
            <div className="space-y-3">
              <a 
                href="mailto:contato@habify.com.br"
                className="flex items-center gap-3 text-sm text-muted-foreground hover:text-primary transition-colors group"
              >
                <div className="w-9 h-9 bg-muted rounded-lg flex items-center justify-center group-hover:bg-primary/10 transition-colors">
                  <Mail className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Email</p>
                  <p className="font-medium">contato@habify.com.br</p>
                </div>
              </a>
              
              <a 
                href="https://wa.me/5511911103963"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 text-sm text-muted-foreground hover:text-primary transition-colors group"
              >
                <div className="w-9 h-9 bg-muted rounded-lg flex items-center justify-center group-hover:bg-primary/10 transition-colors">
                  <Phone className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">WhatsApp</p>
                  <p className="font-medium">(11) 91110-3963</p>
                </div>
              </a>

              <div className="pt-2">
                <Button 
                  onClick={() => window.open('https://www.instagram.com/habify.br/', '_blank')}
                  size="icon"
                  variant="outline"
                  className="rounded-lg"
                >
                  <Instagram className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-border/50 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-xs text-muted-foreground text-center md:text-left">
              © {new Date().getFullYear()} HabiFy. Todos os direitos reservados.
            </p>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">Powered by</span>
              <span className="text-xs font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                HabiFy
              </span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
