import React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, FileText, Shield, AlertCircle, Scale, Mail } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function TermosDeUso(): JSX.Element {
  const navigate = useNavigate();

  const sections = [
    {
      icon: FileText,
      title: "1. Aceitação dos Termos",
      content: "Ao acessar ou utilizar a plataforma Habify, você concorda integralmente com estes Termos de Uso e com nossa Política de Privacidade. Se você não concordar com qualquer parte destes termos, não utilize o serviço."
    },
    {
      icon: Shield,
      title: "2. Descrição do Serviço",
      content: "A Habify é uma plataforma tecnológica que fornece ferramentas para criação de landing pages e sites profissionais construídos em React.js voltados para o mercado imobiliário, incluindo corretores e imobiliárias. Os serviços incluem: hospedagem básica, área administrativa, templates personalizáveis, e serviços complementares de manutenção e suporte técnico."
    },
    {
      icon: AlertCircle,
      title: "3. Cadastro e Responsabilidades",
      content: "Para contratar planos ou criar projetos, é necessário realizar cadastro fornecendo dados verdadeiros, atualizados e completos. Você é responsável por manter a confidencialidade da sua senha e por todas as atividades realizadas em sua conta. A Habify pode suspender contas com informações inválidas ou em caso de suspeita de fraude ou uso inadequado."
    },
    {
      icon: Scale,
      title: "4. Planos e Pagamentos",
      content: "Os planos de serviço estão descritos na plataforma com seus respectivos preços e funcionalidades. Pagamentos são processados por gateways de pagamento integrados (AbacatePay para PIX e Hubla para Cartão de Crédito). Os créditos e funcionalidades ficam vinculados ao plano contratado. Políticas de cancelamento e reembolso seguem as regras descritas no momento da compra. Para contestar cobranças, entre em contato com nosso suporte."
    },
  ];

  const additionalSections = [
    {
      title: "5. Criação e Gestão de Projetos",
      items: [
        "Cada plano define quantos projetos você pode criar",
        "Projetos podem ser de empreendimento único ou portfólio de múltiplos imóveis",
        "Você é responsável pelo conteúdo enviado (textos, imagens, dados)",
        "A Habify não se responsabiliza por conteúdo inadequado ou que viole direitos de terceiros"
      ]
    },
    {
      title: "6. Uso Permitido e Proibições",
      items: [
        "Você pode usar a plataforma para criar e gerenciar páginas dentro das funcionalidades oferecidas",
        "É proibido usar o serviço para fins ilegais, enviar spam ou conteúdo discriminatório",
        "É proibido infringir direitos autorais, marcas ou direitos de terceiros",
        "É proibido disponibilizar conteúdo pornográfico ilegal, violento ou que incite crimes"
      ]
    },
    {
      title: "7. Propriedade Intelectual",
      items: [
        "O software, design, código e documentação da Habify são de propriedade exclusiva da Habify",
        "Você recebe uma licença não exclusiva para uso do serviço conforme contratado",
        "Conteúdos criados por você pertencem a você",
        "A Habify pode armazenar e exibir seu conteúdo para prestação do serviço"
      ]
    },
    {
      title: "8. Disponibilidade e Limitações",
      items: [
        "Nos esforçamos para manter o serviço disponível, mas não garantimos 100% de uptime",
        "Não nos responsabilizamos por perdas indiretas, lucros cessantes ou interrupções causadas por terceiros",
        "Nossa responsabilidade máxima é limitada a entrega dos serviços contratados",
        "Manutenções programadas serão comunicadas previamente quando possível"
      ]
    }
  ];

  return (
    <main className="min-h-screen bg-gradient-to-b from-background via-muted/20 to-muted/40">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-background border-b border-border/50">
        <div className="section-container py-12">
          <Button
            variant="ghost"
            onClick={() => navigate('/')}
            className="mb-6"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar para Home
          </Button>
          
          <div className="max-w-4xl">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-14 h-14 bg-primary rounded-2xl flex items-center justify-center shadow-lg shadow-primary/20">
                <FileText className="h-7 w-7 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                  Termos de Uso
                </h1>
                <p className="text-muted-foreground">Última atualização: {new Date().toLocaleDateString('pt-BR')}</p>
              </div>
            </div>
            <p className="text-lg text-muted-foreground mt-4">
              Ao utilizar a plataforma Habify, você concorda com estes termos e condições.
            </p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="section-container py-12">
        <div className="max-w-4xl mx-auto space-y-6">
          
          {/* Main Sections */}
          {sections.map((section, index) => (
            <Card key={index} className="border-border/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                    <section.icon className="h-5 w-5 text-primary" />
                  </div>
                  {section.title}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground leading-relaxed">
                  {section.content}
                </p>
              </CardContent>
            </Card>
          ))}

          {/* Additional Sections with Lists */}
          {additionalSections.map((section, index) => (
            <Card key={index} className="border-border/50">
              <CardHeader>
                <CardTitle>{section.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  {section.items.map((item, itemIndex) => (
                    <li key={itemIndex} className="flex items-start gap-3">
                      <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0" />
                      <span className="text-muted-foreground leading-relaxed">{item}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ))}

          {/* Security & Privacy */}
          <Card className="border-border/50 bg-gradient-to-br from-primary/5 to-transparent">
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <Shield className="h-5 w-5 text-primary" />
                9. Segurança e Proteção de Dados
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground leading-relaxed">
                Tratamos os dados pessoais conforme nossa Política de Privacidade, utilizando medidas técnicas e administrativas 
                para proteger suas informações. Em caso de incidente de segurança relevante, comunicaremos os titulares e 
                autoridades competentes conforme exigido por lei.
              </p>
            </CardContent>
          </Card>

          {/* Final Sections */}
          <Card className="border-border/50">
            <CardHeader>
              <CardTitle>10. Alterações nos Termos</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground leading-relaxed">
                A Habify pode alterar estes Termos periodicamente. Publicaremos a nova versão com a data de atualização. 
                O uso continuado do serviço após alterações implica em concordância com os novos termos.
              </p>
            </CardContent>
          </Card>

          <Card className="border-border/50">
            <CardHeader>
              <CardTitle>11. Legislação Aplicável</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground leading-relaxed">
                Estes Termos são regidos pelas leis brasileiras. Para dirimir controvérsias, fica eleito o foro da 
                comarca de São Paulo/SP, com renúncia a qualquer outro.
              </p>
            </CardContent>
          </Card>

          {/* Contact Card */}
          <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <Mail className="h-5 w-5 text-primary" />
                12. Contato
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                Em caso de dúvidas sobre estes Termos ou sobre seus dados pessoais:
              </p>
              <div className="space-y-2">
                <a 
                  href="mailto:contato@habify.com.br"
                  className="flex items-center gap-2 text-primary hover:underline font-medium"
                >
                  <Mail className="h-4 w-4" />
                  contato@habify.com.br
                </a>
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex gap-4 pt-6">
            <Button
              variant="outline"
              onClick={() => navigate('/')}
              className="flex-1"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar para Home
            </Button>
            <Button
              onClick={() => window.print()}
              className="flex-1"
            >
              <FileText className="mr-2 h-4 w-4" />
              Imprimir Termos
            </Button>
          </div>
        </div>
      </div>
    </main>
  );
}
