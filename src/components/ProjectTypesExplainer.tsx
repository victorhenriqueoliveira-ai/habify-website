import { motion } from "framer-motion";
import { Building2, Briefcase, Check, ArrowRight } from "lucide-react";

const ProjectTypesExplainer = () => {
  return (
    <section className="py-12 sm:py-16 bg-muted/30" id="project-types">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div 
          className="text-center mb-12"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-foreground mb-4">
            Qual tipo de site é{" "}
            <span className="text-primary">ideal para você?</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Escolha o formato que melhor se encaixa no seu negócio
          </p>
        </motion.div>

        {/* Comparison Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-5xl mx-auto">
          {/* Single Project */}
          <motion.div
            className="bg-card rounded-2xl p-8 border-2 border-border hover:border-primary/50 hover:shadow-xl transition-all duration-300"
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <div className="flex items-center gap-4 mb-6">
              <div className="w-16 h-16 rounded-xl bg-blue-100 flex items-center justify-center">
                <Building2 className="w-8 h-8 text-blue-600" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-foreground">
                  Site para Um Único Projeto
                </h3>
                <p className="text-sm text-muted-foreground">Landing Page Focada</p>
              </div>
            </div>

            {/* Description */}
            <p className="text-muted-foreground mb-6">
              Perfeito para construtoras, incorporadoras ou corretores que querem promover <strong>um empreendimento específico</strong>.
            </p>

            {/* Features */}
            <div className="space-y-3 mb-6">
              <div className="flex items-start gap-3">
                <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                <span className="text-sm text-foreground">
                  <strong>1 projeto/imóvel</strong> destacado
                </span>
              </div>
              <div className="flex items-start gap-3">
                <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                <span className="text-sm text-foreground">
                  Portfólio com <strong>até 5 fotos</strong> profissionais
                </span>
              </div>
              <div className="flex items-start gap-3">
                <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                <span className="text-sm text-foreground">
                  Design <strong>100% focado</strong> na conversão daquele imóvel
                </span>
              </div>
              <div className="flex items-start gap-3">
                <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                <span className="text-sm text-foreground">
                  Ideal para <strong>lançamentos</strong> e apartamentos de alto padrão
                </span>
              </div>
            </div>

            {/* Example */}
            <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
              <p className="text-sm font-semibold text-gray-900 mb-2">
                📍 Exemplo de uso:
              </p>
              <p className="text-sm text-gray-700">
                "Condomínio Vista Mar - Apartamentos de 3 quartos com vista para o mar em Balneário Camboriú"
              </p>
            </div>

            {/* Benefit */}
            <div className="mt-6 p-4 bg-gradient-to-r from-primary/5 to-primary/10 rounded-lg">
              <p className="text-sm font-semibold text-foreground">
                ✨ <strong>Benefício:</strong> Cliente vê todos os detalhes do empreendimento em uma página otimizada para converter visitas em leads
              </p>
            </div>
          </motion.div>

          {/* Multiple Properties Portfolio */}
          <motion.div
            className="bg-card rounded-2xl p-8 border-2 border-primary/50 hover:border-primary hover:shadow-xl transition-all duration-300 relative"
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            {/* Popular Badge */}
            <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-2 bg-primary text-primary-foreground rounded-full text-xs font-bold shadow-lg">
              🔥 Mais Popular
            </div>

            <div className="flex items-center gap-4 mb-6">
              <div className="w-16 h-16 rounded-xl bg-primary/10 flex items-center justify-center">
                <Briefcase className="w-8 h-8 text-primary" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-foreground">
                  Site Portfólio Completo
                </h3>
                <p className="text-sm text-muted-foreground">Vitrine de Múltiplos Imóveis</p>
              </div>
            </div>

            {/* Description */}
            <p className="text-muted-foreground mb-6">
              Ideal para corretores autônomos, imobiliárias ou quem tem <strong>vários imóveis para vender/alugar</strong>.
            </p>

            {/* Features */}
            <div className="space-y-3 mb-6">
              <div className="flex items-start gap-3">
                <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                <span className="text-sm text-foreground">
                  <strong>Múltiplos projetos</strong> no mesmo site
                </span>
              </div>
              <div className="flex items-start gap-3">
                <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                <span className="text-sm text-foreground">
                  Até <strong>20+ imóveis listados</strong> com fotos e detalhes
                </span>
              </div>
              <div className="flex items-start gap-3">
                <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                <span className="text-sm text-foreground">
                  Sistema de <strong>filtros</strong> (tipo, preço, localização)
                </span>
              </div>
              <div className="flex items-start gap-3">
                <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                <span className="text-sm text-foreground">
                  Perfeito para <strong>estoque variado</strong> de propriedades
                </span>
              </div>
            </div>

            {/* Example */}
            <div className="bg-primary/5 rounded-lg p-4 border border-primary/20">
              <p className="text-sm font-semibold text-gray-900 mb-2">
                📍 Exemplo de uso:
              </p>
              <p className="text-sm text-gray-700">
                "João Silva CRECI 12345 - Apartamentos, Casas e Terrenos em São Paulo e região metropolitana"
              </p>
            </div>

            {/* Benefit */}
            <div className="mt-6 p-4 bg-gradient-to-r from-primary/10 to-primary/20 rounded-lg">
              <p className="text-sm font-semibold text-foreground">
                ✨ <strong>Benefício:</strong> Cliente vê todas suas opções em um só lugar, aumentando as chances de encontrar o imóvel ideal e gerar mais leads
              </p>
            </div>
          </motion.div>
        </div>

        {/* Help Section */}
        <motion.div
          className="max-w-3xl mx-auto mt-12 text-center"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.3 }}
        >
          <div className="bg-gradient-to-br from-muted to-muted/50 rounded-2xl p-8 border border-border">
            <h4 className="text-lg font-bold text-foreground mb-3">
              🤔 Ainda tem dúvidas sobre qual escolher?
            </h4>
            <p className="text-muted-foreground mb-6">
              Nossa equipe está pronta para te ajudar a escolher a melhor opção para o seu negócio
            </p>
            <a
              href="https://wa.me/5511961769504?text=Olá!%20Tenho%20dúvidas%20sobre%20qual%20tipo%20de%20site%20é%20melhor%20para%20mim"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-full font-bold hover:bg-primary/90 transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              Falar com Especialista
              <ArrowRight className="w-5 h-5" />
            </a>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default ProjectTypesExplainer;
