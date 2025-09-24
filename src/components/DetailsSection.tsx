import { ArrowRight } from "lucide-react";
import React, { useState } from "react";
import { toast } from "sonner";

const DetailsSection = () => {
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    company: ""
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.fullName || !formData.email) {
      toast.error("Por favor, preencha todos os campos obrigatórios");
      return;
    }

    toast.success("Solicitação enviada! Entraremos em contato em breve.");

    setFormData({
      fullName: "",
      email: "",
      company: ""
    });
  };

  return (
    <section id="get-access" className="w-full bg-white py-0">
      <div className="container px-4 sm:px-6 lg:px-8 mx-auto">
        <div className="grid grid-cols-1 gap-6 md:gap-8 lg:grid-cols-2">
          {/* Left Card - Os Números */}
          <div className="rounded-2xl sm:rounded-3xl overflow-hidden shadow-elegant">
            <div className="relative h-48 sm:h-64 p-6 sm:p-8 flex items-end" style={{
              backgroundImage: "url('/background-section3.png')",
              backgroundSize: "cover",
              backgroundPosition: "center"
            }}>
              <h2 className="text-2xl sm:text-3xl font-display text-white font-bold">
                Os números que importam
              </h2>
            </div>
            
            <div className="bg-white p-4 sm:p-8" style={{
              backgroundColor: "#FFFFFF",
              border: "1px solid #ECECEC"
            }}>
              <h3 className="text-lg sm:text-xl font-display mb-6 sm:mb-8">
                Resultados comprovados em mais de 500 projetos
              </h3>

              <div className="space-y-4 sm:space-y-6">
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center mt-1 flex-shrink-0">
                    <svg width="14" height="10" viewBox="0 0 14 10" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M1 5L5 9L13 1" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <div className="p-3 rounded-lg bg-green-50 border border-green-100">
                      <span className="font-semibold text-base">Conversão:</span> 8x maior que portais tradicionais
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center mt-1 flex-shrink-0">
                    <svg width="14" height="10" viewBox="0 0 14 10" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M1 5L5 9L13 1" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <div className="p-3 rounded-lg bg-green-50 border border-green-100">
                      <span className="font-semibold text-base">Economia:</span> R$ 1.200/mês vs portais premium
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center mt-1 flex-shrink-0">
                    <svg width="14" height="10" viewBox="0 0 14 10" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M1 5L5 9L13 1" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <div className="p-3 rounded-lg bg-green-50 border border-green-100">
                      <span className="font-semibold text-base">Velocidade:</span> Leads em 15min após ir ao ar
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center mt-1 flex-shrink-0">
                    <svg width="14" height="10" viewBox="0 0 14 10" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M1 5L5 9L13 1" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <div className="p-3 rounded-lg bg-green-50 border border-green-100">
                      <span className="font-semibold text-base">Qualidade:</span> 85% dos leads já pré-aprovados
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center mt-1 flex-shrink-0">
                    <svg width="14" height="10" viewBox="0 0 14 10" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M1 5L5 9L13 1" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <div className="p-3 rounded-lg bg-green-50 border border-green-100">
                      <span className="font-semibold text-base">ROI:</span> 650% de retorno médio comprovado
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="max-w-5xl pl-4 sm:pl-8">
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-display leading-tight mb-8 sm:mb-12">
              <span className="block bg-clip-text text-transparent bg-[url('/text-mask-image.jpg')] bg-cover bg-center">
                Enquanto outros corretores brigam por leads em portais caros, você terá sua própria máquina de vendas. HabiFy transforma qualquer imóvel em uma landing page que converte visitantes em compradores qualificados.
              </span>
            </h2>
          </div>
        </div>
        <div 
          className="flex flex-col sm:flex-row gap-4 opacity-0 animate-fade-in items-center justify-center mt-12 mb-20" 
          style={{ animationDelay: "0.7s" }}
        >
          <a 
            href="#plans"
            className="flex items-center justify-center group w-full sm:w-auto text-center font-bold rounded-full border border-[#FE5C02] bg-[#fff] text-[#FE5C02] px-6 py-4 sm:px-8 sm:py-4 text-base sm:text-lg shadow-lg hover:bg-[#FE5C02] hover:text-white transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-[#FE5C02] focus:ring-offset-2"
            style={{
              boxSizing: 'border-box',
              cursor: 'pointer',
              lineHeight: '20px',
            }}
          >
              Criar meu site
            <ArrowRight className="ml-2 w-5 h-5 transition-transform group-hover:translate-x-1" />
          </a>
        </div>
      </div>
    </section>
  );
};

export default DetailsSection;