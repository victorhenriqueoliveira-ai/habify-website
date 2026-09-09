import { useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { logger } from '@/lib/logger';
import { supabase } from '@/integrations/supabase/client';

/**
 * Analytics and Event Tracking Hook
 * Fase 2 - Item 11: Analytics de uso
 */

export type EventCategory = 
  | 'user_action'
  | 'navigation'
  | 'form_submission'
  | 'payment'
  | 'project'
  | 'authentication'
  | 'error';

export interface AnalyticsEvent {
  category: EventCategory;
  action: string;
  label?: string;
  value?: number;
  metadata?: Record<string, any>;
}

export const useAnalytics = () => {
  const { user } = useAuth();

  /**
   * Track a custom event
   */
  const trackEvent = useCallback(async (event: AnalyticsEvent) => {
    try {
      // Log event
      logger.info(`Analytics Event: ${event.category} - ${event.action}`, {
        userId: user?.id,
        category: event.category,
        action: event.action,
        label: event.label,
        value: event.value,
        ...event.metadata,
      });

      // audit_logs RLS only allows authenticated inserts tied to auth.uid() = user_id
      // (it's a security audit table, not a marketing analytics table). Skip anonymous
      // visitors instead of firing a request that will always 401.
      if (!user?.id) return;

      // Store in database for analytics
      await supabase.from('audit_logs').insert({
        action: `analytics_${event.category}`,
        user_id: user?.id,
        target_type: 'analytics',
        details: {
          category: event.category,
          action: event.action,
          label: event.label,
          value: event.value,
          metadata: event.metadata,
          timestamp: new Date().toISOString(),
        },
      });

      // In production, you could also send to external analytics service
      // if (import.meta.env.PROD) {
      //   gtag('event', event.action, {
      //     event_category: event.category,
      //     event_label: event.label,
      //     value: event.value,
      //   });
      // }
    } catch (error) {
      console.error('Failed to track event:', error);
    }
  }, [user]);

  /**
   * Track page view
   */
  const trackPageView = useCallback((pagePath: string, pageTitle?: string) => {
    trackEvent({
      category: 'navigation',
      action: 'page_view',
      label: pagePath,
      metadata: { pageTitle },
    });
  }, [trackEvent]);

  /**
   * Track user action
   */
  const trackUserAction = useCallback((action: string, metadata?: Record<string, any>) => {
    trackEvent({
      category: 'user_action',
      action,
      metadata,
    });
  }, [trackEvent]);

  /**
   * Track form submission
   */
  const trackFormSubmission = useCallback((
    formName: string,
    success: boolean,
    metadata?: Record<string, any>
  ) => {
    trackEvent({
      category: 'form_submission',
      action: success ? 'form_submit_success' : 'form_submit_error',
      label: formName,
      value: success ? 1 : 0,
      metadata,
    });
  }, [trackEvent]);

  /**
   * Track payment event
   */
  const trackPayment = useCallback((
    action: 'payment_initiated' | 'payment_success' | 'payment_failed',
    amount?: number,
    metadata?: Record<string, any>
  ) => {
    trackEvent({
      category: 'payment',
      action,
      value: amount,
      metadata,
    });
  }, [trackEvent]);

  /**
   * Track project event
   */
  const trackProject = useCallback((
    action: 'project_created' | 'project_updated' | 'project_deleted' | 'project_viewed',
    projectId?: string,
    metadata?: Record<string, any>
  ) => {
    trackEvent({
      category: 'project',
      action,
      label: projectId,
      metadata,
    });
  }, [trackEvent]);

  /**
   * Track conversion
   */
  const trackConversion = useCallback((
    conversionType: string,
    value?: number,
    metadata?: Record<string, any>
  ) => {
    logger.info('Conversion tracked', {
      userId: user?.id,
      conversionType,
      value,
      ...metadata,
    });

    trackEvent({
      category: 'user_action',
      action: 'conversion',
      label: conversionType,
      value,
      metadata: {
        ...metadata,
        timestamp: new Date().toISOString(),
      },
    });
  }, [user, trackEvent]);

  /**
   * Track feature usage
   */
  const trackFeatureUsage = useCallback((featureName: string, metadata?: Record<string, any>) => {
    trackEvent({
      category: 'user_action',
      action: 'feature_used',
      label: featureName,
      metadata,
    });
  }, [trackEvent]);

  return {
    trackEvent,
    trackPageView,
    trackUserAction,
    trackFormSubmission,
    trackPayment,
    trackProject,
    trackConversion,
    trackFeatureUsage,
  };
};

/**
 * Hook para tracking automático de rotas
 */
export const useRouteTracking = () => {
  const { trackPageView } = useAnalytics();

  return useCallback((location: { pathname: string; search?: string }) => {
    const fullPath = location.pathname + (location.search || '');
    trackPageView(fullPath);
  }, [trackPageView]);
};
