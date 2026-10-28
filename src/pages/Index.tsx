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
