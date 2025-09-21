
import React from "react";
import { Button } from "@/components/ui/button";
import { Mail, MapPin, Phone, Instagram, Linkedin, Youtube } from "lucide-react";

const Footer = () => {
  return (
    <footer className="relative w-full bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white overflow-hidden">
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-0 left-0 w-full h-full opacity-20" 
             style={{
               backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
             }}>
        </div>
      </div>
      
      <div className="relative section-container py-16">
        {/* Main footer content */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-12 mb-12">
          {/* Brand section */}
          <div className="lg:col-span-2 space-y-6">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-gradient-to-br from-primary to-primary/80 rounded-xl flex items-center justify-center">
                <img src="/logotipo_habify.png" alt="HabiFy" className="h-8 w-auto filter brightness-0 invert" />
              </div>
              <div>
                <h3 className="text-2xl font-bold">HabiFy</h3>
                <p className="text-slate-300 text-sm">Transformando imóveis em vendas</p>
              </div>
            </div>
            <p className="text-slate-300 text-lg leading-relaxed max-w-md">
              Enquanto outros corretores brigam por leads em portais caros, você terá sua própria máquina de vendas. 
              <span className="text-white font-medium"> HabiFy transforma qualquer imóvel em uma landing page que converte.</span>
            </p>
            <div className="flex space-x-4">
              <Button onClick={() => {window.open('https://www.instagram.com/habify.br/', '_blank')}} size="icon" >
                <Instagram className="h-5 w-5" />
              </Button>
            </div>
          </div>

          {/* Quick links */}
          <div className="space-y-6">
            <h4 className="text-xl font-semibold">Links Rápidos</h4>
            <ul className="space-y-3">
              <li><a href="#specifications" className="text-slate-300 hover:text-white transition-colors">Como Funciona</a></li>
              <li><a href="#features" className="text-slate-300 hover:text-white transition-colors">Recursos</a></li>
              <li><a href="#pricing" className="text-slate-300 hover:text-white transition-colors">Planos</a></li>
              <li><a href="#testimonials" className="text-slate-300 hover:text-white transition-colors">Depoimentos</a></li>
            </ul>
          </div>

          {/* Contact info */}
          <div className="space-y-6">
            <h4 className="text-xl font-semibold">Contato</h4>
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-primary/20 rounded-lg flex items-center justify-center">
                  <Mail className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-white font-medium">contato@habify.com.br</p>
                  <p className="text-slate-300 text-sm">Suporte e vendas</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-primary/20 rounded-lg flex items-center justify-center">
                  <Phone className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-white font-medium">(11) 9999-9999</p>
                  <p className="text-slate-300 text-sm">WhatsApp Business</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-primary/20 rounded-lg flex items-center justify-center">
                  <MapPin className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-white font-medium">São Paulo, SP</p>
                  <p className="text-slate-300 text-sm">Brasil</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="pt-8 border-t border-slate-700">
          <div className="flex flex-col lg:flex-row items-center justify-between space-y-4 lg:space-y-0">
            <div className="flex flex-col sm:flex-row items-center gap-2 text-sm text-slate-300">
              <span>© 2025 HabiFy. Todos os direitos reservados.</span>
              <span className="hidden sm:inline text-slate-500">•</span>
            </div>
          </div>
        </div>
      </div>
      
      {/* Subtle gradient overlay at top */}
      <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent"></div>
    </footer>
  );
};

export default Footer;
