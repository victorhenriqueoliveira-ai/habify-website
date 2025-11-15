
import React from "react";
import OptimizedImage from "./OptimizedImage";

const ImageShowcaseSection = () => {
  return (
    <section className="w-full pt-0 pb-8 sm:pb-12 bg-white" id="showcase">
      <div className="container px-4 sm:px-6 lg:px-8 mx-auto">
        <div className="max-w-4xl mx-auto text-center mb-8 sm:mb-12 animate-on-scroll">
          <h2 className="text-3xl sm:text-4xl font-display font-bold tracking-tight text-gray-900 mb-3 sm:mb-4">
            De Fotos Simples a Vendas Garantidas
          </h2>
          <p className="text-base sm:text-lg text-gray-600 max-w-3xl mx-auto">
            Veja o resultado final: uma landing page otimizada que apresenta seu imóvel de forma irresistível, 
            captura dados dos interessados e envia leads quentes direto para seu WhatsApp.
          </p>
        </div>
        
        <div className="rounded-2xl sm:rounded-3xl overflow-hidden shadow-elegant mx-auto max-w-4xl animate-on-scroll">
          <div className="w-full">
            <OptimizedImage
              src="/lovable-uploads/c3d5522b-6886-4b75-8ffc-d020016bb9c2.png" 
              alt="Landing Page Profissional para Corretores de Imóveis" 
              className="w-full h-auto"
              objectFit="cover"
            />
          </div>
          <div className="bg-white p-4 sm:p-8">
            <h3 className="text-xl sm:text-2xl font-display font-semibold mb-3 sm:mb-4">Design Que Converte, Tecnologia Que Entrega</h3>
            <p className="text-gray-700 text-sm sm:text-base mb-4">
              Cada elemento foi pensado para maximizar conversões: formulários estratégicos, gatilhos mentais, 
              tour virtual imersivo e sistema de captura que qualifica leads automaticamente.
            </p>
            <div className="flex flex-wrap gap-2 text-xs">
              <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full">✓ SEO Otimizado</span>
              <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full">✓ Mobile First</span>
              <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded-full">✓ Integração WhatsApp</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ImageShowcaseSection;
