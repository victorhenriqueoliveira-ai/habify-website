// Google Analytics 4 Event Tracking

declare global {
  interface Window {
    gtag?: (...args: any[]) => void;
    dataLayer?: any[];
  }
}

interface AnalyticsEvent {
  action: string;
  category: string;
  label?: string;
  value?: number;
}

// Initialize Google Analytics
export const initGA = (measurementId: string) => {
  if (typeof window === 'undefined') return;

  // Create script element
  const script = document.createElement('script');
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${measurementId}`;
  document.head.appendChild(script);

  // Initialize dataLayer
  window.dataLayer = window.dataLayer || [];
  window.gtag = function() {
    window.dataLayer?.push(arguments);
  };
  
  window.gtag('js', new Date());
  window.gtag('config', measurementId);
};

// Track page view
export const trackPageView = (url: string) => {
  if (typeof window.gtag !== 'undefined') {
    window.gtag('config', 'GA_MEASUREMENT_ID', {
      page_path: url,
    });
  }
};

// Track custom event
export const trackEvent = ({ action, category, label, value }: AnalyticsEvent) => {
  if (typeof window.gtag !== 'undefined') {
    window.gtag('event', action, {
      event_category: category,
      event_label: label,
      value: value,
    });
  }
};

// Specific event trackers
export const trackCTAClick = (ctaName: string, location: string) => {
  trackEvent({
    action: 'cta_click',
    category: 'engagement',
    label: `${ctaName} - ${location}`,
  });
};

export const trackWhatsAppClick = (source: string) => {
  trackEvent({
    action: 'whatsapp_click',
    category: 'contact',
    label: source,
  });
};

export const trackPlanView = (planName: string) => {
  trackEvent({
    action: 'view_plan',
    category: 'pricing',
    label: planName,
  });
};

export const trackPlanClick = (planName: string, price: number) => {
  trackEvent({
    action: 'select_plan',
    category: 'conversion',
    label: planName,
    value: price,
  });
};

export const trackFormStart = (formName: string) => {
  trackEvent({
    action: 'form_start',
    category: 'lead_generation',
    label: formName,
  });
};

export const trackFormComplete = (formName: string) => {
  trackEvent({
    action: 'form_complete',
    category: 'lead_generation',
    label: formName,
  });
};

export const trackFormAbandonment = (formName: string, fieldName: string) => {
  trackEvent({
    action: 'form_abandonment',
    category: 'lead_generation',
    label: `${formName} - ${fieldName}`,
  });
};

export const trackScrollDepth = (percentage: number) => {
  trackEvent({
    action: 'scroll_depth',
    category: 'engagement',
    label: `${percentage}%`,
    value: percentage,
  });
};

export const trackVideoPlay = (videoName: string) => {
  trackEvent({
    action: 'video_play',
    category: 'engagement',
    label: videoName,
  });
};

export const trackPortfolioView = (projectName: string) => {
  trackEvent({
    action: 'portfolio_view',
    category: 'engagement',
    label: projectName,
  });
};

export const trackTestimonialView = (authorName: string) => {
  trackEvent({
    action: 'testimonial_view',
    category: 'social_proof',
    label: authorName,
  });
};

export const trackExitIntent = () => {
  trackEvent({
    action: 'exit_intent_triggered',
    category: 'engagement',
    label: 'exit_popup',
  });
};

export const trackStickyBarClick = (action: string) => {
  trackEvent({
    action: 'sticky_bar_click',
    category: 'engagement',
    label: action,
  });
};

// Scroll depth tracking helper
export const setupScrollTracking = () => {
  const thresholds = [25, 50, 75, 100];
  const tracked = new Set<number>();

  const handleScroll = () => {
    const windowHeight = window.innerHeight;
    const documentHeight = document.documentElement.scrollHeight - windowHeight;
    const scrolled = window.scrollY;
    const scrollPercentage = (scrolled / documentHeight) * 100;

    thresholds.forEach(threshold => {
      if (scrollPercentage >= threshold && !tracked.has(threshold)) {
        trackScrollDepth(threshold);
        tracked.add(threshold);
      }
    });
  };

  window.addEventListener('scroll', handleScroll, { passive: true });
  
  return () => window.removeEventListener('scroll', handleScroll);
};

// Form abandonment tracking helper
export const setupFormAbandonmentTracking = (formId: string) => {
  const form = document.getElementById(formId);
  if (!form) return;

  let formStarted = false;
  let lastFocusedField = '';

  const inputs = form.querySelectorAll('input, textarea, select');
  
  inputs.forEach(input => {
    input.addEventListener('focus', () => {
      if (!formStarted) {
        trackFormStart(formId);
        formStarted = true;
      }
      lastFocusedField = (input as HTMLElement).getAttribute('name') || '';
    });
  });

  // Track abandonment on page unload
  window.addEventListener('beforeunload', () => {
    if (formStarted && lastFocusedField) {
      trackFormAbandonment(formId, lastFocusedField);
    }
  });
};
