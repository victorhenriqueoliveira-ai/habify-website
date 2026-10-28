import React from 'react';
import { Helmet } from 'react-helmet-async';
import { BUSINESS } from '@/config/business';
import { FAQ_ITEMS } from '@/data/faq';

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
      "telephone": "+55-11-91110-3963",
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

  // FAQ Schema — derivado de src/data/faq.ts, a mesma fonte que a seção
  // renderiza. Antes era uma cópia à mão, que divergia do texto visível a
  // cada edição e derrubava o rich result.
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": FAQ_ITEMS.map((item) => ({
      "@type": "Question",
      "name": item.question,
      "acceptedAnswer": { "@type": "Answer", "text": item.answer },
    })),
  };

  // HowTo Schema
  const howToSchema = {
    "@context": "https://schema.org",
    "@type": "HowTo",
    "name": "Como Criar Site para Corretor de Imóveis com a HabiFy",
    "description": "Guia passo a passo para criar seu site profissional de corretor na hora",
    "totalTime": "PT5M",
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
        "text": "Na hora, seu site profissional já estará online e pronto para captar leads automaticamente",
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
      "lowPrice": BUSINESS.pricing.sitePrice.toFixed(2),
      "highPrice": BUSINESS.pricing.sitePrice.toFixed(2),
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
