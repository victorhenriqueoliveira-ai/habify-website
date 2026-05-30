import React from 'react';
import { Helmet } from 'react-helmet-async';

const AdvancedSchema: React.FC = () => {
  // Organization Schema
  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "HabiFy",
    "legalName": "HabiFy Tecnologia LTDA",
    "url": "https://habify.com.br",
    "logo": "https://habify.com.br/logotipo_habify.png",
    "description": "Plataforma de criação de sites profissionais para corretores de imóveis e imobiliárias. Sites otimizados para conversão e captação de leads.",
    "foundingDate": "2023",
    "contactPoint": {
      "@type": "ContactPoint",
      "telephone": "+55-11-96176-9504",
      "contactType": "Sales",
      "areaServed": "BR",
      "availableLanguage": ["Portuguese"]
    },
    "sameAs": [
      "https://www.instagram.com/habify",
      "https://www.facebook.com/habify",
      "https://www.linkedin.com/company/habify"
    ],
    "address": {
      "@type": "PostalAddress",
      "addressCountry": "BR",
      "addressRegion": "SP",
      "addressLocality": "São Paulo"
    }
  };

  // Service Schema
  const serviceSchema = {
    "@context": "https://schema.org",
    "@type": "Service",
    "name": "Criação de Sites para Corretores de Imóveis",
    "serviceType": "Web Design",
    "description": "Landing page profissional otimizada para corretores de imóveis com captação automática de leads, SEO e integração WhatsApp",
    "provider": {
      "@type": "Organization",
      "name": "HabiFy"
    },
    "areaServed": {
      "@type": "Country",
      "name": "Brasil"
    },
    "hasOfferCatalog": {
      "@type": "OfferCatalog",
      "name": "Planos HabiFy",
      "itemListElement": [
        {
          "@type": "Offer",
          "itemOffered": {
            "@type": "Service",
            "name": "Site Profissional para Corretor",
            "description": "Landing page otimizada com captação de leads e SEO"
          }
        }
      ]
    },
    "audience": {
      "@type": "Audience",
      "audienceType": "Corretores de Imóveis e Imobiliárias"
    }
  };

  // FAQ Schema - synced with FAQSection.tsx
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": [
      {
        "@type": "Question",
        "name": "O site é feito em WordPress?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Não! A HabiFy utiliza plataforma proprietária, muito mais rápida, segura e otimizada do que WordPress. A HabiFy utiliza tecnologias avançadas, como React.js, tailwindcss e typescript. Sites HabiFy carregam até 5x mais rápido que WordPress e têm 3x mais conversão."
        }
      },
      {
        "@type": "Question",
        "name": "Preciso investir em Google Ads para ter leads?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Não é obrigatório! Seu site já vem 100% otimizado para SEO e aparece naturalmente no Google. Anúncios pagos (Google Ads, Facebook Ads) são opcionais para acelerar resultados, mas você já recebe leads organicamente sem custos extras. Muitos clientes têm ótimos resultados apenas com o tráfego orgânico incluído."
        }
      },
      {
        "@type": "Question",
        "name": "Quanto tempo leva para o site ficar pronto?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Apenas 72 horas úteis após o envio completo das suas fotos e informações. Trabalhamos rápido para você começar a captar leads o mais rápido possível. Assim que seu site estiver pronto, você recebe acesso ao painel administrativo e o link para começar a divulgar."
        }
      },
      {
        "@type": "Question",
        "name": "Posso editar o site depois de pronto?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Sim! Após solicitação, fazemos as edições em até 72 horas úteis. Para ter acesso a edições ilimitadas, você pode contratar um plano de manutenção. Alternativamente, podemos enviar o código-fonte do site para você, já que o site é 100% seu e você tem total propriedade."
        }
      },
      {
        "@type": "Question",
        "name": "Posso colocar vários imóveis no mesmo site?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Sim! Oferecemos dois formatos: Site para Projeto Único (ideal para 1 empreendimento/imóvel específico) e Portfólio com Múltiplos Imóveis (até 5 imóveis listados com sistema de filtros). Escolha o formato que melhor atende suas necessidades e tipo de negócio."
        }
      },
      {
        "@type": "Question",
        "name": "Como funciona a captação de leads 24/7?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Seu site possui botões de CTA estrategicamente posicionados que direcionam clientes interessados diretamente para o seu WhatsApp a qualquer hora do dia ou da noite. Os visitantes clicam no botão e iniciam uma conversa direta com você. Simples, direto e eficiente para não perder nenhuma oportunidade!"
        }
      },
      {
        "@type": "Question",
        "name": "O que está incluído na hospedagem?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "A hospedagem profissional em servidor de alta performance e o certificado SSL (cadeado de segurança) estão inclusos. O domínio personalizado (ex: seunome.com.br) fica por conta do cliente, com custo médio de R$ 40/ano. Garantia de uptime 99.9%."
        }
      },
      {
        "@type": "Question",
        "name": "O site após entregue para o cliente, é de minha propriedade?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Sim! Após a entrega, o site é 100% seu. Você terá acesso total ao código-fonte e poderá fazer as alterações que desejar. Nossa equipe também está disponível para ajudar com edições e manutenções, caso você precise."
        }
      }
    ]
  };

  // HowTo Schema
  const howToSchema = {
    "@context": "https://schema.org",
    "@type": "HowTo",
    "name": "Como Criar Site para Corretor de Imóveis com a HabiFy",
    "description": "Guia passo a passo para criar seu site profissional de corretor em 72 horas",
    "totalTime": "PT72H",
    "step": [
      {
        "@type": "HowToStep",
        "name": "Escolha seu Plano",
        "text": "Selecione o plano ideal para seu negócio entre nossas opções de site único ou site + manutenção",
        "position": 1
      },
      {
        "@type": "HowToStep",
        "name": "Envie suas Informações",
        "text": "Preencha o formulário com seus dados, logo, fotos dos imóveis e textos que deseja no site",
        "position": 2
      },
      {
        "@type": "HowToStep",
        "name": "Receba seu Site Pronto",
        "text": "Em até 72 horas, seu site profissional estará online e pronto para captar leads automaticamente",
        "position": 3
      }
    ]
  };

  // WebSite Schema
  const websiteSchema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": "HabiFy - Site para Corretor de Imóveis",
    "alternateName": ["Site para Corretor", "Criar Site Corretor de Imóveis", "Site de Corretor de Imóveis"],
    "description": "Plataforma para criar site profissional para corretores de imóveis e imobiliárias com captação automática de leads",
    "url": "https://habify.com.br",
    "potentialAction": {
      "@type": "SearchAction",
      "target": {
        "@type": "EntryPoint",
        "urlTemplate": "https://habify.com.br/?s={search_term_string}"
      },
      "query-input": "required name=search_term_string"
    }
  };

  // Product Schema (without fabricated aggregateRating to avoid Google penalties)
  const productSchema = {
    "@context": "https://schema.org",
    "@type": "Product",
    "name": "Site Profissional para Corretor de Imóveis",
    "description": "Landing page otimizada para corretores com captação automática de leads, SEO e integração WhatsApp",
    "brand": {
      "@type": "Brand",
      "name": "HabiFy"
    },
    "offers": {
      "@type": "AggregateOffer",
      "priceCurrency": "BRL",
      "lowPrice": "300.00",
      "highPrice": "300.00",
      "offerCount": "1"
    }
  };

  return (
    <Helmet>
      <script type="application/ld+json">
        {JSON.stringify(organizationSchema)}
      </script>
      <script type="application/ld+json">
        {JSON.stringify(serviceSchema)}
      </script>
      <script type="application/ld+json">
        {JSON.stringify(faqSchema)}
      </script>
      <script type="application/ld+json">
        {JSON.stringify(howToSchema)}
      </script>
      <script type="application/ld+json">
        {JSON.stringify(websiteSchema)}
      </script>
      <script type="application/ld+json">
        {JSON.stringify(productSchema)}
      </script>
    </Helmet>
  );
};

export default AdvancedSchema;
