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
    "serviceType": "Criação de Sites para Corretores de Imóveis",
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

  // FAQ Schema
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": [
      {
        "@type": "Question",
        "name": "Como criar um site para corretor de imóveis?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Com a HabiFy, você cria seu site profissional em 3 passos: 1) Escolha seu plano, 2) Envie suas informações e fotos, 3) Receba seu site pronto em até 72h. Totalmente otimizado para conversão e captação de leads no WhatsApp."
        }
      },
      {
        "@type": "Question",
        "name": "Quanto custa um site para corretor?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "O site profissional HabiFy custa R$ 74,90 (pagamento único). Inclui design profissional, SEO otimizado, integração WhatsApp e suporte técnico. Sem mensalidades de plataforma. Manutenção opcional por R$ 54,90/mês."
        }
      },
      {
        "@type": "Question",
        "name": "O site para corretor gera leads automaticamente?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Sim! Todos os sites HabiFy possuem formulários otimizados que enviam leads diretamente para seu WhatsApp. Integração automática com principais plataformas de captação."
        }
      },
      {
        "@type": "Question",
        "name": "Preciso de conhecimento técnico para ter um site?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Não! A HabiFy cuida de tudo. Você só precisa enviar suas informações e fotos. Nós criamos, otimizamos e entregamos seu site profissional pronto para captar leads."
        }
      },
      {
        "@type": "Question",
        "name": "O site funciona bem no celular?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Sim! Todos os sites são 100% responsivos e otimizados para mobile. Mais de 70% dos seus leads virão de smartphones, por isso garantimos experiência perfeita em todos os dispositivos."
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
      "lowPrice": "74.90",
      "highPrice": "74.90",
      "offerCount": "1"
    }
  };

  // LocalBusiness Schema
  const localBusinessSchema = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    "name": "HabiFy",
    "image": "https://habify.com.br/logotipo_habify.png",
    "@id": "https://habify.com.br",
    "url": "https://habify.com.br",
    "telephone": "+55-11-96176-9504",
    "priceRange": "R$ 74,90 - Sob Consulta",
    "address": {
      "@type": "PostalAddress",
      "streetAddress": "Av. Paulista",
      "addressLocality": "São Paulo",
      "addressRegion": "SP",
      "postalCode": "01310-000",
      "addressCountry": "BR"
    },
    "geo": {
      "@type": "GeoCoordinates",
      "latitude": -23.550520,
      "longitude": -46.633308
    },
    "openingHoursSpecification": {
      "@type": "OpeningHoursSpecification",
      "dayOfWeek": [
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday"
      ],
      "opens": "09:00",
      "closes": "18:00"
    },
    "sameAs": [
      "https://www.instagram.com/habify",
      "https://www.facebook.com/habify"
    ]
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
      <script type="application/ld+json">
        {JSON.stringify(localBusinessSchema)}
      </script>
    </Helmet>
  );
};

export default AdvancedSchema;
