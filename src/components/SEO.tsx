import { Helmet } from 'react-helmet-async';

interface SEOProps {
  title?: string;
  description?: string;
  keywords?: string;
  image?: string;
  url?: string;
  type?: string;
}

const SEO = ({
  title = "HabiFy - Crie Sites para Imóveis que Vendem | Landing Page Profissional",
  description = "Plataforma completa para corretores criarem sites profissionais em 72h. Captação automática de leads 24/7. SEO otimizado. Sem WordPrxxx. A partir de R$ 597.",
  keywords = "site para corretor, landing page imóveis, site imobiliário, captação de leads, marketing imobiliário, site para imobiliária, site profissional corretor, página de vendas imóveis, website para corretor de imóveis",
  image = "https://habify.com/fotos/site_habify.png",
  url = "https://habify.com",
  type = "website"
}: SEOProps) => {
  return (
    <Helmet>
      {/* Primary Meta Tags */}
      <title>{title}</title>
      <meta name="title" content={title} />
      <meta name="description" content={description} />
      <meta name="keywords" content={keywords} />
      
      {/* Open Graph / Facebook */}
      <meta property="og:type" content={type} />
      <meta property="og:url" content={url} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={image} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:site_name" content="HabiFy" />
      <meta property="og:locale" content="pt_BR" />
      
      {/* Twitter */}
      {/* <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:url" content={url} />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={image} /> */}
      
      {/* Additional Meta Tags */}
      <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1" />
      <meta name="googlebot" content="index, follow" />
      <meta name="language" content="Portuguese" />
      <meta name="author" content="HabiFy" />
      <meta name="theme-color" content="#FE5C02" />
      
      {/* Canonical URL */}
      <link rel="canonical" href={url} />
      
      {/* Geo Tags */}
      <meta name="geo.region" content="BR" />
      <meta name="geo.placename" content="Brasil" />
      
      {/* Performance Hints */}
      <link rel="dns-prefetch" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
    </Helmet>
  );
};

export default SEO;
