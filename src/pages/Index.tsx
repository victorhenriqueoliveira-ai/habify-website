
import React, { useEffect, lazy, Suspense } from "react";
import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import AdvancedSEO from "@/components/seo/AdvancedSEO";
import AdvancedSchema from "@/components/seo/AdvancedSchema";
import { preloadCriticalImages } from "@/utils/preloadImages";
import { setupScrollTracking } from "@/utils/analytics";

// Lazy load non-critical components
const StickyCTABar = lazy(() => import("@/components/mobile/StickyCTABar"));
const StickyDesktopCTA = lazy(() => import("@/components/conversion/StickyDesktopCTA"));
const ProblemsSection = lazy(() => import("@/components/HumanoidSection"));
const PortfolioShowcasePremium = lazy(() => import("@/components/PortfolioShowcasePremium"));
const Testimonials = lazy(() => import("@/components/Testimonials"));
const TechnologyExplainer = lazy(() => import("@/components/TechnologyExplainer"));
const LeadCaptureFlow = lazy(() => import("@/components/LeadCaptureFlow"));
const TrafficExplainer = lazy(() => import("@/components/TrafficExplainer"));
const ProjectTypesExplainer = lazy(() => import("@/components/ProjectTypesExplainer"));
const FAQSection = lazy(() => import("@/components/FAQSection"));
const SEOContent = lazy(() => import("@/components/SEOContent"));
const PricingSection = lazy(() => import("@/components/PricingSection"));
const MaintenanceSection = lazy(() => import("@/components/MaintenanceSection"));
const FeaturesAnimated = lazy(() => import("@/components/FeaturesAnimated"));
const Footer = lazy(() => import("@/components/Footer"));
const FloatingWhatsAppButton = lazy(() => import("@/components/FloatingWhatsAppButton"));

const Index = () => {
  // Preload critical images on mount
  useEffect(() => {
    preloadCriticalImages();
  }, []);

  // Setup scroll depth tracking
  useEffect(() => {
    const cleanup = setupScrollTracking();
    return cleanup;
  }, []);

  // Initialize intersection observer to detect when elements enter viewport
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("animate-fade-in");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1 }
    );
    
    const elements = document.querySelectorAll(".animate-on-scroll");
    elements.forEach((el) => observer.observe(el));
    
    return () => {
      elements.forEach((el) => observer.unobserve(el));
    };
  }, []);

  useEffect(() => {
    // This helps ensure smooth scrolling for the anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
      anchor.addEventListener('click', function (e) {
        e.preventDefault();
        
        const targetId = this.getAttribute('href')?.substring(1);
        if (!targetId) return;
        
        const targetElement = document.getElementById(targetId);
        if (!targetElement) return;
        
        // Increased offset to account for mobile nav
        const offset = window.innerWidth < 768 ? 100 : 80;
        
        window.scrollTo({
          top: targetElement.offsetTop - offset,
          behavior: 'smooth'
        });
      });
    });
  }, []);

  return (
    <div className="min-h-screen">
      <AdvancedSEO />
      <AdvancedSchema />
      <Navbar />
      <Suspense fallback={<div className="h-0" />}>
        <StickyCTABar showAfterScroll={300} />
        <StickyDesktopCTA showAfterScroll={800} />
      </Suspense>
      <main className="space-y-0">
        <Hero />
        <Suspense fallback={<div className="min-h-[400px] bg-background" />}>
          <FeaturesAnimated />
        </Suspense>
        <Suspense fallback={<div className="min-h-[600px] bg-background" />}>
          <PortfolioShowcasePremium />
        </Suspense>
        <Suspense fallback={<div className="min-h-[500px] bg-background" />}>
          <LeadCaptureFlow />
        </Suspense>
        <Suspense fallback={<div className="min-h-[400px] bg-background" />}>
          <TechnologyExplainer />
        </Suspense>
        <Suspense fallback={<div className="min-h-[400px] bg-background" />}>
          <ProjectTypesExplainer />
        </Suspense>
        <Suspense fallback={<div className="min-h-[400px] bg-background" />}>
          <TrafficExplainer />
        </Suspense>
        <Suspense fallback={<div className="min-h-[500px] bg-background" />}>
          <PricingSection />
        </Suspense>
        <Suspense fallback={<div className="min-h-[400px] bg-background" />}>
          <MaintenanceSection />
        </Suspense>
        <Suspense fallback={<div className="min-h-[400px] bg-background" />}>
          <SEOContent />
        </Suspense>
        <Suspense fallback={<div className="min-h-[400px] bg-background" />}>
          <FAQSection />
        </Suspense>
      </main>
      <Suspense fallback={<div className="h-20 bg-background" />}>
        <Footer />
      </Suspense>
      <Suspense fallback={null}>
        <FloatingWhatsAppButton />
      </Suspense>
    </div>
  );
};

export default Index;
