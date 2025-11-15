import { motion } from "framer-motion";
import { Sprout, Zap, TrendingUp, DollarSign, Check, AlertCircle } from "lucide-react";

const TrafficExplainer = () => {
  return (
    <section className="py-16 sm:py-24 bg-background" id="traffic">
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
            <TrendingUp className="w-4 h-4 mr-2" />
            Como Conseguir Leads
          </div>
          <h2 className="section-title text-3xl sm:text-4xl lg:text-5xl mb-4">
            Tráfego Orgânico vs{" "}
            <span className="text-primary">Tráfego Pago</span>
          </h2>
          <p className="section-subtitle text-lg max-w-3xl mx-auto">
            Entenda a diferença entre os leads que você recebe automaticamente e como acelerar resultados com anúncios pagos
          </p>
        </motion.div>

        {/* Comparison Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-6xl mx-auto">
          {/* Organic Traffic */}
          <motion.div
            className="relative"
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200 rounded-2xl p-8 h-full">
              {/* Badge */}
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-full text-sm font-bold mb-6">
                <Check className="w-4 h-4" />
                Incluído em Todos os Planos
              </div>

              {/* Icon */}
              <div className="w-16 h-16 rounded-xl bg-green-600 flex items-center justify-center mb-4">
                <Sprout className="w-8 h-8 text-white" />
              </div>

              {/* Title */}
              <h3 className="text-2xl font-bold text-gray-900 mb-3">
                Tráfego Orgânico
              </h3>
              <p className="text-gray-700 mb-6">
                Visitantes que chegam naturalmente ao seu site, sem custos por clique
              </p>

              {/* Features */}
              <div className="space-y-4 mb-6">
                <div className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-gray-900">SEO Otimizado para Google</p>
                    <p className="text-sm text-gray-600">Seu site aparece nas buscas naturalmente</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-gray-900">Integração Google Meu Negócio</p>
                    <p className="text-sm text-gray-600">Apareça no Google Maps e buscas locais</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-gray-900">Compartilhamento em Redes Sociais</p>
                    <p className="text-sm text-gray-600">Instagram, Facebook, WhatsApp Status</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-gray-900">Meta Tags Otimizadas</p>
                    <p className="text-sm text-gray-600">Cards visuais ao compartilhar links</p>
                  </div>
                </div>
              </div>

              {/* Timeline */}
              <div className="bg-white rounded-lg p-4 border border-green-200">
                <div className="flex items-center gap-2 mb-2">
                  <AlertCircle className="w-5 h-5 text-green-600" />
                  <p className="font-bold text-gray-900">Tempo de Resultado</p>
                </div>
                <p className="text-sm text-gray-700">
                  <strong>30 a 90 dias</strong> para começar a aparecer bem posicionado no Google e gerar leads consistentes
                </p>
              </div>

              {/* Cost */}
              <div className="mt-6 pt-6 border-t border-green-200">
                <div className="flex items-center justify-between">
                  <span className="text-lg font-bold text-gray-900">Custo Extra</span>
                  <span className="text-3xl font-bold text-green-600">R$ 0</span>
                </div>
                <p className="text-sm text-gray-600 mt-1">
                  Já incluído no valor do seu plano
                </p>
              </div>
            </div>
          </motion.div>

          {/* Paid Traffic */}
          <motion.div
            className="relative"
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <div className="bg-gradient-to-br from-orange-50 to-red-50 border-2 border-orange-200 rounded-2xl p-8 h-full">
              {/* Badge */}
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-full text-sm font-bold mb-6">
                <Zap className="w-4 h-4" />
                Opcional - Você Decide
              </div>

              {/* Icon */}
              <div className="w-16 h-16 rounded-xl bg-orange-600 flex items-center justify-center mb-4">
                <DollarSign className="w-8 h-8 text-white" />
              </div>

              {/* Title */}
              <h3 className="text-2xl font-bold text-gray-900 mb-3">
                Tráfego Pago
              </h3>
              <p className="text-gray-700 mb-6">
                Anúncios pagos para acelerar resultados e aumentar volume de leads
              </p>

              {/* Features */}
              <div className="space-y-4 mb-6">
                <div className="flex items-start gap-3">
                  <Zap className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-gray-900">Google Ads</p>
                    <p className="text-sm text-gray-600">Apareça no topo das buscas imediatamente</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Zap className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-gray-900">Facebook/Instagram Ads</p>
                    <p className="text-sm text-gray-600">Segmentação por localização e interesses</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Zap className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-gray-900">Segmentação Avançada</p>
                    <p className="text-sm text-gray-600">Público-alvo específico (idade, renda, etc)</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Zap className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-gray-900">Relatórios em Tempo Real</p>
                    <p className="text-sm text-gray-600">Acompanhe performance dos anúncios</p>
                  </div>
                </div>
              </div>

              {/* Timeline */}
              <div className="bg-white rounded-lg p-4 border border-orange-200">
                <div className="flex items-center gap-2 mb-2">
                  <Zap className="w-5 h-5 text-orange-600" />
                  <p className="font-bold text-gray-900">Tempo de Resultado</p>
                </div>
                <p className="text-sm text-gray-700">
                  <strong>Imediato a 7 dias</strong> para começar a receber leads assim que os anúncios estiverem aprovados
                </p>
              </div>

              {/* Cost */}
              <div className="mt-6 pt-6 border-t border-orange-200">
                <div className="flex items-center justify-between">
                  <span className="text-lg font-bold text-gray-900">Investimento Médio</span>
                  <span className="text-2xl font-bold text-orange-600">R$ 500-2.000/mês</span>
                </div>
                <p className="text-sm text-gray-600 mt-1">
                  Você gerencia e paga direto para Google/Meta
                </p>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Explanation Box */}
        <motion.div
          className="max-w-4xl mx-auto mt-12"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.3 }}
        >
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-2xl p-8">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 rounded-full bg-blue-600 flex items-center justify-center">
                  <AlertCircle className="w-6 h-6 text-white" />
                </div>
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">
                  ✅ Entenda: O que está incluído no seu site HabiFy
                </h3>
                <p className="text-gray-700 mb-4">
                  Quando você contrata um site HabiFy, <strong>já está incluído tudo o que você precisa para receber leads organicamente</strong>:
                </p>
                <ul className="space-y-2 mb-4">
                  <li className="flex items-start gap-2">
                    <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-700">Site 100% otimizado para aparecer no Google (SEO)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-700">Integração com Google Meu Negócio (tutorial incluso)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-700">Captação automática de leads 24/7 via CTA para WhatsApp</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-700">Links prontos para compartilhar em redes sociais</span>
                  </li>
                </ul>
                <div className="bg-white rounded-lg p-4 border border-blue-200">
                  <p className="text-gray-900 font-semibold mb-2">
                    💡 Sobre Anúncios Pagos (Google Ads / Facebook Ads):
                  </p>
                  <p className="text-gray-700 text-sm">
                    <strong>São completamente opcionais e separados do nosso serviço.</strong> Se você quiser resultados mais rápidos ou aumentar o volume de leads, pode contratar e gerenciar anúncios por conta própria. Mas seu site já funciona perfeitamente sem isso, gerando leads organicamente!
                  </p>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Recommendation */}
        <motion.div
          className="max-w-4xl mx-auto mt-8"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.4 }}
        >
          <div className="bg-gradient-to-r from-primary/5 to-primary/10 border border-primary/20 rounded-xl p-6">
            <h4 className="font-bold text-lg text-foreground mb-2">
              💼 Nossa Recomendação:
            </h4>
            <p className="text-muted-foreground">
              <strong>Comece com tráfego orgânico</strong> (já incluído) e compartilhe seu site nas redes sociais. Depois de 30-60 dias, se quiser acelerar, considere investir em anúncios pagos. Muitos dos nossos clientes têm ótimos resultados apenas com o orgânico!
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default TrafficExplainer;
