import { Helmet } from 'react-helmet-async';

const StructuredData = () => {
  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "HabiFy",
    "url": "https://habify.com",
    "logo": "https://habify.com/logotipo_habify.png",
    "description": "Plataforma completa para corretores criarem sites profissionais para venda de imóveis com captação automática de leads 24/7",
    "foundingDate": "2024",
    "contactPoint": {
      "@type": "ContactPoint",
      "telephone": "+55-11-96176-9504",
      "contactType": "Sales",
      "areaServed": "BR",
      "availableLanguage": ["Portuguese"]
    },
    "sameAs": [
      "https://www.instagram.com/habify.br/"
    ],
    "address": {
      "@type": "PostalAddress",
      "addressCountry": "BR",
      "addressLocality": "Brasil"
    }
  };

  const serviceSchema = {
    "@context": "https://schema.org",
    "@type": "Service",
    "serviceType": "Criação de Sites para Imóveis",
    "name": "Criação de Landing Pages Profissionais para Corretores de Imóveis",
    "description": "Desenvolvimento de sites profissionais para corretores e imobiliárias com captação automática de leads, SEO otimizado e entrega em 72 horas",
    "provider": {
      "@type": "Organization",
      "name": "HabiFy",
      "url": "https://habify.com"
    },
    "areaServed": {
      "@type": "Country",
      "name": "Brasil"
    },
    "offers": {
      "@type": "Offer",
      "price": "997",
      "priceCurrency": "BRL",
      "priceValidUntil": "2025-12-31",
      "availability": "https://schema.org/InStock",
      "url": "https://habify.com#plans"
    },
    "aggregateRating": {
      "@type": "AggregateRating",
      "ratingValue": "4.9",
      "reviewCount": "87",
      "bestRating": "5",
      "worstRating": "1"
    }
  };

  const websiteSchema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": "HabiFy",
    "url": "https://habify.com",
    "description": "Sites profissionais para corretores de imóveis com captação automática de leads",
    "potentialAction": {
      "@type": "SearchAction",
      "target": "https://habify.com/?s={search_term_string}",
      "query-input": "required name=search_term_string"
    }
  };

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      {
        "@type": "ListItem",
        "position": 1,
        "name": "Home",
        "item": "https://habify.com/"
      },
      {
        "@type": "ListItem",
        "position": 2,
        "name": "Portfólio",
        "item": "https://habify.com/#portfolio"
      },
      {
        "@type": "ListItem",
        "position": 3,
        "name": "Planos",
        "item": "https://habify.com/#plans"
      }
    ]
  };

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": [
      {
        "@type": "Question",
        "name": "O site é feito em WordPress?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Não! A HabiFy utiliza plataforma proprietária, muito mais rápida, segura e otimizada do que WordPress. Desenvolvemos uma tecnologia exclusiva focada em conversão e performance."
        }
      },
      {
        "@type": "Question",
        "name": "Preciso investir em Google Ads para ter leads?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Não é obrigatório. Seu site já vem 100% otimizado para SEO e aparece naturalmente no Google. Anúncios pagos (Google Ads, Facebook Ads) são opcionais para acelerar resultados, mas você já recebe leads organicamente."
        }
      },
      {
        "@type": "Question",
        "name": "Quanto tempo leva para o site ficar pronto?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "72 horas úteis após o envio completo das suas fotos e informações. Trabalhamos rápido para você começar a captar leads o mais rápido possível."
        }
      },
      {
        "@type": "Question",
        "name": "Posso editar o site depois de pronto?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Sim! Você terá acesso a um painel administrativo intuitivo onde pode editar preços, fotos, descrições e todo o conteúdo do site sem necessidade de conhecimento técnico."
        }
      },
      {
        "@type": "Question",
        "name": "Posso colocar vários imóveis no mesmo site?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Sim! Temos planos para site único (1 projeto específico) e portfólio completo (até 20+ imóveis). Escolha o que melhor atende suas necessidades."
        }
      },
      {
        "@type": "Question",
        "name": "Como funciona a captação de leads 24/7?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Seu site possui formulários inteligentes que capturam dados de clientes interessados a qualquer hora do dia. Você recebe notificação instantânea no WhatsApp sempre que alguém preencher o formulário."
        }
      },
      {
        "@type": "Question",
        "name": "O que está incluído na hospedagem?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Hospedagem profissional em servidor de alta performance, certificado SSL (segurança), domínio personalizado e garantia de uptime 99.9%. Tudo já incluído no valor do plano."
        }
      },
      {
        "@type": "Question",
        "name": "Como integrar com Google Meu Negócio?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Após a criação do site, enviamos um tutorial completo passo-a-passo de como conectar seu perfil do Google Meu Negócio. É simples e leva menos de 5 minutos para configurar."
        }
      }
    ]
  };

  const allSchemas = [
    organizationSchema,
    serviceSchema,
    websiteSchema,
    breadcrumbSchema,
    faqSchema
  ];

  return (
    <Helmet>
      <script type="application/ld+json">
        {JSON.stringify(allSchemas)}
      </script>
    </Helmet>
  );
};

export default StructuredData;
