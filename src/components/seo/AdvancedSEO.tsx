import { Helmet } from 'react-helmet-async';

interface AdvancedSEOProps {
  title?: string;
  description?: string;
  canonical?: string;
  ogImage?: string;
  keywords?: string[];
  article?: boolean;
}

const AdvancedSEO: React.FC<AdvancedSEOProps> = ({
  title = 'Habify - Criar Site para Corretor de Imóveis | Site Profissional',
  description = 'Crie seu site profissional para corretor de imóveis em 72h. Landing page otimizada, captação automática de leads no WhatsApp e SEO para Google. Site para corretor que vende 24/7.',
  canonical = 'https://habify.com.br',
  ogImage = 'https://habify.com.br/new-og-image.png',
  keywords = [
    'site para corretor',
    'criar site para corretor',
    'site corretor de imóveis',
    'landing page para corretor',
    'site imobiliário',
    'website para corretor',
    'site profissional corretor',
    'criar site imobiliário',
    'plataforma para corretores',
    'marketing digital imobiliário',
    'captação de leads imobiliários',
    'site para imobiliária',
    'corretor autônomo site',
    'portfólio online corretor'
  ],
  article = false,
}) => {
  return (
    <Helmet>
      {/* Primary Meta Tags */}
      <title>{title}</title>
      <meta name="title" content={title} />
      <meta name="description" content={description} />
      <meta name="keywords" content={keywords.join(', ')} />
      
      {/* Canonical URL */}
      <link rel="canonical" href={canonical} />
      
      {/* Language */}
      <html lang="pt-BR" />
      <meta httpEquiv="content-language" content="pt-BR" />
      
      {/* Geo Tags */}
      <meta name="geo.region" content="BR" />
      <meta name="geo.placename" content="Brasil" />
      <meta name="geo.position" content="-23.550520;-46.633308" />
      <meta name="ICBM" content="-23.550520, -46.633308" />
      
      {/* Open Graph / Facebook */}
      <meta property="og:type" content={article ? 'article' : 'website'} />
      <meta property="og:url" content={canonical} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={ogImage} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:image:alt" content="HabiFy - Site para Corretor de Imóveis" />
      <meta property="og:locale" content="pt_BR" />
      <meta property="og:site_name" content="HabiFy" />
      
      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:url" content={canonical} />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={ogImage} />
      <meta name="twitter:image:alt" content="HabiFy - Site para Corretor de Imóveis" />
      
      {/* Apple Meta Tags */}
      <meta name="apple-mobile-web-app-capable" content="yes" />
      <meta name="apple-mobile-web-app-status-bar-style" content="default" />
      <meta name="apple-mobile-web-app-title" content="HabiFy" />
      
      {/* Microsoft Tags */}
      <meta name="msapplication-TileColor" content="#FE5C02" />
      <meta name="msapplication-config" content="/browserconfig.xml" />
      
      {/* Theme Color */}
      <meta name="theme-color" content="#FE5C02" />
      
      {/* Preconnect to improve performance */}
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      <link rel="dns-prefetch" href="https://www.google-analytics.com" />
      
      {/* Alternate Languages */}
      <link rel="alternate" hrefLang="pt-BR" href={canonical} />
      <link rel="alternate" hrefLang="x-default" href={canonical} />
      
      {/* Robots */}
      <meta name="robots" content="index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1" />
      <meta name="googlebot" content="index, follow" />
      <meta name="bingbot" content="index, follow" />
      
      {/* Author */}
      <meta name="author" content="HabiFy" />
      <meta name="publisher" content="HabiFy" />
      
      {/* Copyright */}
      <meta name="copyright" content="HabiFy © 2024" />
      
      {/* Rating */}
      <meta name="rating" content="general" />
    </Helmet>
  );
};

export default AdvancedSEO;
