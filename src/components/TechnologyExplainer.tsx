import { motion } from "framer-motion";
import { Zap, Shield, Palette, Layout, Check, X } from "lucide-react";

const features = [
  {
    icon: Zap,
    title: "100% Proprietário, Zero WordPrxxx",
    description: "Plataforma própria desenvolvida do zero com as melhores tecnologias do mercado. Velocidade, segurança e otimização garantidas."
  },
  {
    icon: Palette,
    title: "Manutenção Rápida e Eficiente",
    description: "Precisa atualizar preços, fotos ou descrições? Solicite alterações e receba em até 72h. Clientes com plano de manutenção têm edições ilimitadas."
  },
  {
    icon: Shield,
    title: "Hospedagem Inclusa + SSL",
    description: "Não precisa contratar servidor separadamente. Hospedagem profissional com certificado de segurança SSL inclusos. Uptime garantido 99.9%."
  },
  {
    icon: Layout,
    title: "10 Templates Profissionais",
    description: "Escolha entre 10 designs exclusivos e modernos. Todos 100% responsivos, otimizados para mobile e focados em conversão."
  }
];

const comparison = [
  { feature: "Velocidade de Carregamento", habify: true, WordPrxxx: false, builders: true },
  { feature: "SEO Otimizado Nativamente", habify: true, WordPrxxx: false, builders: false },
  { feature: "Edição Fácil e Intuitiva", habify: true, WordPrxxx: false, builders: true },
  { feature: "Suporte Dedicado", habify: true, WordPrxxx: false, builders: false },
  { feature: "Hospedagem Inclusa", habify: true, WordPrxxx: false, builders: true },
  { feature: "Atualizações Automáticas", habify: true, WordPrxxx: false, builders: true },
  { feature: "Segurança Reforçada", habify: true, WordPrxxx: false, builders: true },
  { feature: "Captação de Leads 24/7", habify: true, WordPrxxx: false, builders: false }
];

const TechnologyExplainer = () => {
  return (
    <section className="py-16 sm:py-24 bg-background" id="technology">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-4 mb-8 sm:mb-16">
          <div className="flex-1 h-[1px] bg-gray-300"></div>
        </div>
        {/* Header */}
        <motion.div 
          className="text-center mb-12 sm:mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <div className="inline-flex items-center justify-center px-4 py-2 mb-4 rounded-full bg-primary/10 text-primary font-semibold text-sm">
            <Zap className="w-4 h-4 mr-2" />
            Nossa Tecnologia
          </div>
          <h2 className="section-title text-3xl sm:text-4xl lg:text-5xl mb-4">
            Plataforma Própria,{" "}
            <span className="text-primary">Não é </span>
            <span className="line-through">WordPrxxx</span>
          </h2>
          <p className="section-subtitle text-lg max-w-2xl mx-auto">
            Desenvolvemos uma tecnologia exclusiva, muito mais rápida, segura e otimizada para vendas de imóveis
          </p>
        </motion.div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              className="bg-card rounded-xl p-6 border border-border/50 hover:border-primary/50 hover:shadow-lg transition-all duration-300"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
            >
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                <feature.icon className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-lg font-bold text-foreground mb-2">
                {feature.title}
              </h3>
              <p className="text-sm text-muted-foreground">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </div>

        {/* Comparison Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2 }}
        >
          <h3 className="text-2xl font-bold text-center mb-8">
            Compare e Veja a Diferença
          </h3>
          
          <div className="overflow-x-auto">
            <div className="inline-block min-w-full align-middle">
              <div className="overflow-hidden border border-border rounded-xl">
                <table className="min-w-full divide-y divide-border">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="px-6 py-4 text-left text-sm font-bold text-foreground">
                        Característica
                      </th>
                      <th className="px-6 py-4 text-center text-sm font-bold text-foreground">
                        <div className="flex flex-col items-center">
                          <span className="text-primary">HabiFy</span>
                          <span className="text-xs font-normal text-muted-foreground">Plataforma Própria</span>
                        </div>
                      </th>
                      <th className="px-6 py-4 text-center text-sm font-bold text-muted-foreground">
                        <div className="flex flex-col items-center">
                          <span>WordPrxxx</span>
                          <span className="text-xs font-normal">+ Plugins</span>
                        </div>
                      </th>
                      <th className="px-6 py-4 text-center text-sm font-bold text-muted-foreground">
                        <div className="flex flex-col items-center">
                          <span>Wix/Builders</span>
                          <span className="text-xs font-normal">Genéricos</span>
                        </div>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-card divide-y divide-border">
                    {comparison.map((row, index) => (
                      <tr key={index} className="hover:bg-muted/30 transition-colors">
                        <td className="px-6 py-4 text-sm text-foreground font-medium">
                          {row.feature}
                        </td>
                        <td className="px-6 py-4 text-center">
                          {row.habify ? (
                            <div className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-green-100 text-green-600">
                              <Check className="w-5 h-5" />
                            </div>
                          ) : (
                            <div className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-red-100 text-red-600">
                              <X className="w-5 h-5" />
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 text-center">
                          {row.WordPrxxx ? (
                            <div className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-green-100 text-green-600">
                              <Check className="w-5 h-5" />
                            </div>
                          ) : (
                            <div className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-red-100 text-red-600">
                              <X className="w-5 h-5" />
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 text-center">
                          {row.builders ? (
                            <div className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-green-100 text-green-600">
                              <Check className="w-5 h-5" />
                            </div>
                          ) : (
                            <div className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-red-100 text-red-600">
                              <X className="w-5 h-5" />
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Highlight */}
          <div className="mt-8 p-6 bg-primary/5 border border-primary/20 rounded-xl">
            <p className="text-center text-foreground font-semibold">
              💡 <strong>Resultado:</strong> Sites HabiFy carregam até <span className="text-primary">5x mais rápido</span> que WordPrxxx e têm <span className="text-primary">3x mais conversão</span> que builders genéricos
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default TechnologyExplainer;
