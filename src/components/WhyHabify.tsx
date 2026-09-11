import { motion } from "framer-motion";
import {
  Zap,
  ShieldCheck,
  LayoutTemplate,
  Wrench,
  Building2,
  Layers,
  Sprout,
  MousePointerClick,
  Check,
  X,
} from "lucide-react";
import { CornerMarks, Highlight } from "@/components/shared/DesignAccents";

const pillars = [
  {
    icon: Zap,
    title: "Plataforma própria, não é WordPress",
    description:
      "Desenvolvida do zero em React.js — a mesma tecnologia usada por Airbnb e QuintoAndar. Sem plugins pra quebrar, sem lentidão.",
  },
  {
    icon: Wrench,
    title: "Manutenção rápida",
    description:
      "Precisa mudar preço, foto ou texto? Solicite e receba em até 72h. Com plano de manutenção, edições são ilimitadas.",
  },
  {
    icon: ShieldCheck,
    title: "Hospedagem + SSL inclusos",
    description: "Sem servidor separado pra contratar. Certificado de segurança incluso e uptime garantido de 99,9%.",
  },
  {
    icon: LayoutTemplate,
    title: "10 templates profissionais",
    description: "Escolha entre 10 designs exclusivos, todos responsivos e desenhados pra converter visita em contato.",
  },
];

const comparison = [
  { feature: "Velocidade de carregamento", habify: true, others: false },
  { feature: "SEO otimizado nativamente", habify: true, others: false },
  { feature: "Captação de leads 24/7", habify: true, others: false },
  { feature: "Hospedagem e SSL inclusos", habify: true, others: false },
];

const projectTypes = [
  {
    icon: Building2,
    title: "Um único empreendimento",
    subtitle: "Landing page focada",
    description: "Pra construtoras e corretores promovendo 1 imóvel específico — lançamento, alto padrão, terreno.",
  },
  {
    icon: Layers,
    title: "Portfólio completo",
    subtitle: "Até 5 imóveis com filtros",
    description: "Pra quem tem uma carteira de imóveis pra vender ou alugar ao mesmo tempo.",
  },
];

const WhyHabify = () => {
  return (
    <section className="relative overflow-hidden bg-background py-16 sm:py-24" id="differentiation">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          className="mx-auto mb-12 max-w-3xl text-center sm:mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <span className="mb-4 inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-2 text-sm font-semibold text-primary">
            <Zap className="h-4 w-4" />
            Nossa tecnologia
          </span>
          <h2 className="section-title text-3xl sm:text-4xl lg:text-5xl">
            Uma plataforma <Highlight>própria</Highlight>, pensada pra imóveis
          </h2>
        </motion.div>

        {/* Pillars */}
        <div className="mb-16 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
          {pillars.map((pillar, index) => (
            <motion.div
              key={pillar.title}
              className="rounded-xl border border-border/50 bg-card p-6 transition-all duration-300 hover:border-primary/50 hover:shadow-lg"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.08 }}
            >
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                <pillar.icon className="h-6 w-6 text-primary" />
              </div>
              <h3 className="mb-2 text-lg font-bold text-foreground">{pillar.title}</h3>
              <p className="text-sm text-muted-foreground">{pillar.description}</p>
            </motion.div>
          ))}
        </div>

        {/* Compact comparison */}
        <motion.div
          className="mx-auto mb-16 max-w-3xl overflow-hidden rounded-xl border border-border"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.1 }}
        >
          <table className="w-full">
            <thead className="bg-muted/50">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-bold text-foreground">Característica</th>
                <th className="px-6 py-3 text-center text-sm font-bold text-primary">HabiFy</th>
                <th className="px-6 py-3 text-center text-sm font-bold text-muted-foreground">
                  WordPress / builders
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border bg-card">
              {comparison.map((row) => (
                <tr key={row.feature}>
                  <td className="px-6 py-3 text-sm font-medium text-foreground">{row.feature}</td>
                  <td className="px-6 py-3 text-center">
                    <Check className="mx-auto h-5 w-5 text-success" />
                  </td>
                  <td className="px-6 py-3 text-center">
                    <X className="mx-auto h-5 w-5 text-destructive" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </motion.div>

        {/* Project types */}
        <motion.div
          className="mx-auto mb-16 max-w-4xl"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.15 }}
        >
          <h3 className="mb-6 text-center text-2xl font-bold text-foreground">
            Um imóvel só, ou um portfólio inteiro — você escolhe
          </h3>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            {projectTypes.map((type) => (
              <div key={type.title} className="rounded-xl border border-border/50 bg-card p-6">
                <div className="mb-4 flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                    <type.icon className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-bold text-foreground">{type.title}</h4>
                    <p className="text-xs text-muted-foreground">{type.subtitle}</p>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">{type.description}</p>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Organic vs paid traffic — compact */}
        <motion.div
          className="relative mx-auto max-w-4xl overflow-hidden rounded-2xl border border-border bg-dot-grid p-8"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2 }}
        >
          <CornerMarks />
          <div className="relative grid grid-cols-1 gap-8 sm:grid-cols-2">
            <div>
              <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-success/10 px-3 py-1 text-xs font-bold text-success">
                <Sprout className="h-3.5 w-3.5" />
                Incluído em todos os planos
              </div>
              <p className="text-sm text-muted-foreground">
                Seu site já vem com <strong className="text-foreground">SEO otimizado</strong>, integração com Google
                Meu Negócio e links prontos pra redes sociais — leads orgânicos sem custo extra.
              </p>
            </div>
            <div>
              <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-warning/10 px-3 py-1 text-xs font-bold text-warning">
                <MousePointerClick className="h-3.5 w-3.5" />
                Opcional, você decide
              </div>
              <p className="text-sm text-muted-foreground">
                Quiser acelerar? Google Ads e Meta Ads são <strong className="text-foreground">separados do nosso serviço</strong> —
                muitos clientes vendem bem só com o orgânico incluído.
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default WhyHabify;
