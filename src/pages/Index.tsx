
import React, { useEffect } from "react";
import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import SEO from "@/components/SEO";
import StructuredData from "@/components/StructuredData";
import FloatingWhatsAppButton from "@/components/FloatingWhatsAppButton";
import PortfolioShowcase from "@/components/PortfolioShowcase";
import TechnologyExplainer from "@/components/TechnologyExplainer";
import LeadCaptureFlow from "@/components/LeadCaptureFlow";
import TrafficExplainer from "@/components/TrafficExplainer";
import ProjectTypesExplainer from "@/components/ProjectTypesExplainer";
import FAQSection from "@/components/FAQSection";
import ProblemsSection from "@/components/HumanoidSection";
import SpecsSection from "@/components/SpecsSection";
import DetailsSection from "@/components/DetailsSection";
import ImageShowcaseSection from "@/components/ImageShowcaseSection";
import FeaturesAnimated from "@/components/FeaturesAnimated";
import PricingSection from "@/components/PricingSection";
import Testimonials from "@/components/Testimonials";
import Newsletter from "@/components/Newsletter";
import MadeByHumans from "@/components/MadeByHumans";
import Footer from "@/components/Footer";
import { preloadCriticalImages } from "@/utils/preloadImages";

const Index = () => {
  // Preload critical images on mount
  useEffect(() => {
    preloadCriticalImages();
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
      <SEO />
      <StructuredData />
      <Navbar />
      <FloatingWhatsAppButton />
      <main className="space-y-0">
        <Hero />
        <FeaturesAnimated />
        <PortfolioShowcase />
        <ProblemsSection />
        {/* <SpecsSection /> */}
        <LeadCaptureFlow />
        <TechnologyExplainer />
        <ProjectTypesExplainer />
        <TrafficExplainer />
        <PricingSection />
        <FAQSection />
        <Testimonials />
      </main>
      <Footer />
    </div>
  );
};

export default Index;
