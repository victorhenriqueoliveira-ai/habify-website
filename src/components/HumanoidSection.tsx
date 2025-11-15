import React, { useRef } from "react";

const ProblemsSection = () => {
  const sectionRef = useRef<HTMLDivElement>(null);

  return (
    <section className="py-6 sm:py-10 bg-white relative" id="problems" ref={sectionRef}>
      <div className="container px-4 sm:px-6 lg:px-8 mx-auto">
        <div className="flex items-center gap-4 mb-8 sm:mb-16">
          <div className="flex-1 h-[1px] bg-gray-300"></div>
        </div>
        
        <div className="max-w-4xl mx-auto text-center mb-12 sm:mb-20 animate-on-scroll">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-display leading-tight mb-4 sm:mb-8">
            Você está perdendo clientes todos os dias por não ter presença digital profissional
          </h2>
          <p className="text-base sm:text-lg lg:text-xl text-gray-700 mb-8 sm:mb-12 leading-relaxed">
            Enquanto outros corretores capturam leads 24/7 com suas landing pages, você depende apenas 
            de portais caros e perde oportunidades de ouro. É hora de ter sua própria máquina de vendas online.
          </p>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 text-left">
            {[
              {
                title: "Leads Perdidos",
                desc: "Clientes procuram imóveis 24/7, mas você só aparece nos portais caros"
              },
              {
                title: "Credibilidade Baixa",
                desc: "Sem site próprio, você parece menos profissional que a concorrência"
              },
              {
                title: "Dependência Total", 
                desc: "Reféns dos portais: eles sobem o preço, você paga ou sai do jogo"
              },
              {
                title: "Leads Desorganizados",
                desc: "Contatos espalhados no WhatsApp, email e papel - oportunidades se perdem"
              }
            ].map((item, index) => (
              <div key={index} className="bg-red-50 p-6 rounded-xl border border-red-100">
                <h3 className="font-semibold text-lg mb-3 text-red-700">{item.title}</h3>
                <p className="text-red-600 text-sm">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default ProblemsSection;