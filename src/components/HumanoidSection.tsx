import React from "react";
import { UserX, ShieldAlert, Lock, MessagesSquare, ArrowRight } from "lucide-react";
import { trackCTAClick } from "@/utils/analytics";

const problems = [
  {
    icon: UserX,
    title: "Leads Perdidos 24/7",
    desc: "Clientes pesquisam imóveis à noite e nos fins de semana. Sem site, você simplesmente não existe para eles.",
    stat: "78%",
    statLabel: "pesquisam online antes de ligar para um corretor"
  },
  {
    icon: ShieldAlert,
    title: "Credibilidade Zero",
    desc: "Seu concorrente tem site profissional e você manda um PDF pelo WhatsApp. Quem o cliente vai escolher?",
    stat: "3x",
    statLabel: "mais confiança em corretores com presença digital"
  },
  {
    icon: Lock,
    title: "Refém dos Portais",
    desc: "ZAP, OLX, VivaReal... Eles sobem o preço quando querem. Você paga ou desaparece. Sem controle nenhum.",
    stat: "R$500+",
    statLabel: "gastos mensais em portais que não são seus"
  },
  {
    icon: MessagesSquare,
    title: "Oportunidades Perdidas",
    desc: "Leads espalhados em 5 apps diferentes. Enquanto você procura o contato, outro corretor já fechou a venda.",
    stat: "40%",
    statLabel: "dos leads se perdem por falta de organização"
  }
];

const ProblemsSection = () => {
  return (
    <section className="py-16 sm:py-24 bg-background relative" id="problems">
      <div className="container px-4 sm:px-6 lg:px-8 mx-auto">
        <div className="flex items-center gap-4 mb-10 sm:mb-16">
          <div className="flex-1 h-[1px] bg-border"></div>
        </div>
        
        <div className="max-w-4xl mx-auto text-center mb-12 sm:mb-16 animate-on-scroll">
          <span className="inline-block px-4 py-2 mb-6 text-sm font-semibold bg-destructive/10 text-destructive rounded-full border border-destructive/20">
            ⚠️ Realidade do mercado
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-display font-black leading-tight mb-6">
            Seus concorrentes já têm site.{" "}
            <span className="bg-gradient-to-r from-destructive to-destructive/70 bg-clip-text text-transparent">E você?</span>
          </h2>
          <p className="text-lg sm:text-xl text-muted-foreground leading-relaxed max-w-3xl mx-auto">
            Enquanto você depende de portais caros e cartão de visita, outros corretores estão captando leads 
            automaticamente com suas próprias landing pages. Cada dia sem site é dinheiro perdido.
          </p>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12 animate-on-scroll">
          {problems.map((item, index) => (
            <div 
              key={index} 
              className="bg-card p-6 sm:p-8 rounded-2xl border border-border hover:border-destructive/30 transition-all duration-300 hover:shadow-lg hover:shadow-destructive/5 group"
            >
              <div className="w-12 h-12 mb-5 rounded-xl bg-destructive/10 flex items-center justify-center group-hover:bg-destructive/20 transition-colors">
                <item.icon className="w-6 h-6 text-destructive" />
              </div>
              <h3 className="font-bold text-lg mb-3 text-foreground">{item.title}</h3>
              <p className="text-muted-foreground text-sm mb-5 leading-relaxed">{item.desc}</p>
              <div className="pt-4 border-t border-border">
                <span className="text-2xl font-black text-destructive">{item.stat}</span>
                <p className="text-xs text-muted-foreground mt-1">{item.statLabel}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="text-center animate-on-scroll">
          <button
            onClick={() => {
              trackCTAClick('Resolva isso agora', 'problems-section');
              document.getElementById('plans')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }}
            className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-gradient-to-r from-destructive to-destructive/80 text-destructive-foreground font-bold text-lg hover:scale-105 transition-transform duration-300 shadow-lg shadow-destructive/25"
          >
            Resolva isso agora
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    </section>
  );
};

export default ProblemsSection;
