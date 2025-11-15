
import React, { useRef } from "react";

interface TestimonialProps {
  content: string;
  author: string;
  role: string;
  gradient: string;
  backgroundImage?: string;
}

const testimonials: TestimonialProps[] = [{
  content: "Depois da HabiFy, meus leads triplicaram! Agora tenho minha própria máquina de vendas trabalhando 24h. Em 1 mês já recuperei o investimento.",
  author: "Carlos Mendes",
  role: "Corretor Autônomo, São Paulo",
  gradient: "from-blue-700 via-indigo-800 to-purple-900",
  backgroundImage: "/background-section1.png"
}, {
  content: "Parei de depender só do ZAP Imóveis. Agora tenho leads exclusivos da minha própria landing page. A qualidade dos contatos melhorou muito!",
  author: "Marina Santos",
  role: "Corretora, Belo Horizonte",
  gradient: "from-indigo-900 via-purple-800 to-orange-500",
  backgroundImage: "/background-section2.png"
}, {
  content: "O HabiFy me deu credibilidade profissional que eu não tinha. Clientes me acham mais confiável por ter meu próprio site. Fechei 5 vendas no primeiro mês!",
  author: "Roberto Silva",
  role: "Corretor, Rio de Janeiro",
  gradient: "from-purple-800 via-pink-700 to-red-500",
  backgroundImage: "/background-section3.png"
}, {
  content: "Simples demais! Mandei as fotos pelo sistema e em 3 dias úteis estava online. Agora não preciso mais brigar por leads nos portais caros.",
  author: "Ana Paula",
  role: "Imobiliária Pequena, Curitiba",
  gradient: "from-orange-600 via-red-500 to-purple-600",
  backgroundImage: "/background-section1.png"
}];

const TestimonialCard = ({
  content,
  author,
  role,
  backgroundImage = "/background-section1.png"
}: TestimonialProps) => {
  return <div className="bg-cover bg-center rounded-lg p-8 h-full flex flex-col justify-between text-white transform transition-transform duration-300 hover:-translate-y-2 relative overflow-hidden" style={{
    backgroundImage: `url('${backgroundImage}')`
  }}>      
      <div className="relative z-0">
        <p className="text-xl mb-8 font-medium leading-relaxed pr-20">{`"${content}"`}</p>
        <div>
          <h4 className="font-semibold text-xl">{author}</h4>
          <p className="text-white/80">{role}</p>
        </div>
      </div>
    </div>;
};

const Testimonials = () => {
  const sectionRef = useRef<HTMLDivElement>(null);

  return <section className="py-12 bg-white relative" id="testimonials" ref={sectionRef}> {/* Reduced from py-20 */}
      <div className="section-container opacity-0 animate-on-scroll">
        <div className="flex items-center gap-4 mb-8 sm:mb-16">
          <div className="flex-1 h-[1px] bg-gray-300"></div>
        </div>        
        <h2 className="text-5xl font-bold mb-12 text-left">Corretores que já transformaram suas vendas</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {testimonials.map((testimonial, index) => <TestimonialCard key={index} content={testimonial.content} author={testimonial.author} role={testimonial.role} gradient={testimonial.gradient} backgroundImage={testimonial.backgroundImage} />)}
        </div>
      </div>
    </section>;
};

export default Testimonials;
