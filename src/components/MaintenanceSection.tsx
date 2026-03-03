import { motion } from 'framer-motion';
import { Check, Wrench, Shield, Clock, MessageCircle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

const MaintenanceSection = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const benefits = [
    { icon: Wrench, title: 'Atualizações de conteúdo', description: 'Alterações de textos, fotos e informações do seu site' },
    { icon: Shield, title: 'Correções de bugs', description: 'Resolução rápida de qualquer problema técnico' },
    { icon: Clock, title: 'Suporte técnico', description: 'Atendimento dedicado para suas necessidades' },
    { icon: MessageCircle, title: 'Backup regular', description: 'Seus dados sempre seguros e protegidos' },
  ];

  return (
    <section className="py-16 sm:py-24 bg-gradient-to-b from-muted/30 to-background" id="maintenance">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          className="text-center mb-12"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <div className="inline-flex items-center justify-center px-4 py-2 mb-4 rounded-full bg-primary/10 text-primary font-semibold text-sm">
            <Wrench className="w-4 h-4 mr-2" />
            Manutenção Mensal
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">
            Mantenha seu site sempre <span className="text-primary">atualizado</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Após a entrega do seu site, contrate a manutenção mensal e tenha suporte contínuo para manter tudo funcionando perfeitamente.
          </p>
        </motion.div>

        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
          >
            <Card className="border-primary/20 shadow-lg overflow-hidden">
              <CardContent className="p-0">
                <div className="grid md:grid-cols-2">
                  {/* Benefícios */}
                  <div className="p-8 space-y-6">
                    <h3 className="text-xl font-bold">O que está incluído:</h3>
                    <div className="space-y-4">
                      {benefits.map((benefit, index) => (
                        <motion.div
                          key={index}
                          className="flex items-start gap-3"
                          initial={{ opacity: 0, x: -10 }}
                          whileInView={{ opacity: 1, x: 0 }}
                          viewport={{ once: true }}
                          transition={{ delay: 0.1 * index }}
                        >
                          <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                            <benefit.icon className="w-4 h-4 text-primary" />
                          </div>
                          <div>
                            <p className="font-semibold text-sm">{benefit.title}</p>
                            <p className="text-xs text-muted-foreground">{benefit.description}</p>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </div>

                  {/* Preço e CTA */}
                  <div className="bg-primary/5 p-8 flex flex-col items-center justify-center text-center">
                    <p className="text-sm font-medium text-muted-foreground mb-2">Manutenção mensal por apenas</p>
                    <div className="text-5xl font-bold text-primary mb-1">
                      R$ 54,90
                    </div>
                    <p className="text-sm text-muted-foreground mb-6">/mês</p>

                    <ul className="space-y-2 mb-6 text-sm text-left">
                      <li className="flex items-center gap-2">
                        <Check className="h-4 w-4 text-primary flex-shrink-0" />
                        <span>Sem fidelidade, cancele quando quiser</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <Check className="h-4 w-4 text-primary flex-shrink-0" />
                        <span>Ativação imediata após pagamento</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <Check className="h-4 w-4 text-primary flex-shrink-0" />
                        <span>Disponível para projetos concluídos</span>
                      </li>
                    </ul>

                    <Button
                      size="lg"
                      className="w-full"
                      onClick={() => {
                        if (user) {
                          navigate('/admin/my-maintenances');
                        } else {
                          const message = encodeURIComponent(
                            "Olá! Gostaria de saber mais sobre a manutenção mensal da Habify."
                          );
                          window.open(`https://wa.me/5511961769504?text=${message}`, '_blank');
                        }
                      }}
                    >
                      {user ? 'Contratar Manutenção' : 'Saiba Mais'}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default MaintenanceSection;
