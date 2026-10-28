import { lazy, Suspense, useEffect } from 'react';
import AdvancedSEO from '@/components/seo/AdvancedSEO';
import AdvancedSchema from '@/components/seo/AdvancedSchema';
import { LandingNav } from '@/components/landing/LandingNav';
import { Hero } from '@/components/landing/Hero';
import { setupScrollTracking } from '@/utils/analytics';

// Abaixo da dobra: carrega sob demanda. O Hero e a nav vêm no bundle
// inicial porque são o LCP.
const PriceSection = lazy(() =>
  import('@/components/landing/PriceSection').then((m) => ({ default: m.PriceSection })),
);
const PortfolioGrid = lazy(() =>
  import('@/components/landing/PortfolioGrid').then((m) => ({ default: m.PortfolioGrid })),
);
const WhatYouGet = lazy(() =>
  import('@/components/landing/WhatYouGet').then((m) => ({ default: m.WhatYouGet })),
);
const FaqSection = lazy(() =>
  import('@/components/landing/FaqSection').then((m) => ({ default: m.FaqSection })),
);
const FinalCta = lazy(() => import('@/components/landing/FinalCta').then((m) => ({ default: m.FinalCta })));
const HireBar = lazy(() => import('@/components/landing/HireBar').then((m) => ({ default: m.HireBar })));
const Footer = lazy(() => import('@/components/Footer'));

const Index = () => {
  useEffect(() => setupScrollTracking(), []);

  /**
   * Rola até a âncora quando a página é aberta com hash (ex.: /#preco).
   *
   * O Link do react-router navega para "/" mas não trata o hash sozinho —
   * então vir de outra rota com /#preco caía no topo do site. Espera o
   * elemento existir, porque as seções abaixo da dobra são lazy.
   */
  useEffect(() => {
    const id = window.location.hash.slice(1);
    if (!id) return;

    let attempts = 0;
    const tryScroll = () => {
      const target = document.getElementById(id);
      if (target) {
        const top = target.getBoundingClientRect().top + window.scrollY - 68;
        target.scrollIntoView({ behavior: 'auto', block: 'start' });
        window.scrollTo({ top, behavior: 'auto' });
        return;
      }
      if (attempts++ < 40) window.setTimeout(tryScroll, 50);
    };
    tryScroll();
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <AdvancedSEO />
      <AdvancedSchema />
      <LandingNav />

      <main>
        <Hero />
        <Suspense fallback={<div className="min-h-[520px]" />}>
          <PriceSection />
        </Suspense>
        <Suspense fallback={<div className="min-h-[520px]" />}>
          <PortfolioGrid />
        </Suspense>
        <Suspense fallback={<div className="min-h-[640px]" />}>
          <WhatYouGet />
        </Suspense>
        <Suspense fallback={<div className="min-h-[520px]" />}>
          <FaqSection />
        </Suspense>
        <Suspense fallback={<div className="min-h-[360px]" />}>
          <FinalCta />
        </Suspense>
      </main>

      <Suspense fallback={<div className="h-20" />}>
        <Footer />
      </Suspense>
      <Suspense fallback={null}>
        <HireBar />
      </Suspense>
    </div>
  );
};

export default Index;
