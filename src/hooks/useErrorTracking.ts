import React, { useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { logger } from '@/lib/logger';
import { supabase } from '@/integrations/supabase/client';

/**
 * Error Tracking Hook
 * Captura erros globais e envia para logging
 * Fase 2 - Item 11: Error Tracking
 */

interface ErrorReport {
  error_message: string;
  error_stack?: string;
  user_id?: string;
  user_email?: string;
  page_url: string;
  user_agent: string;
  timestamp: string;
  error_type: 'uncaught' | 'unhandled_rejection' | 'manual';
  severity: 'low' | 'medium' | 'high' | 'critical';
}

export const useErrorTracking = () => {
  const { user } = useAuth();

  const logErrorToDatabase = async (report: ErrorReport) => {
    try {
      // ✅ SÓ logar se user_id existir
      if (!report.user_id) {
        console.warn('⚠️ Error log skipped: no user_id');
        return;
      }
      
      // ✅ Verificar se user existe antes de inserir
      const { data: profileExists } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', report.user_id)
        .maybeSingle();
      
      if (!profileExists) {
        console.warn('⚠️ Error log skipped: user not found in profiles');
        return;
      }
      
      // Log to audit_logs table
      await supabase.from('audit_logs').insert({
        action: 'error_occurred',
        user_id: report.user_id,
        target_type: 'error',
        details: {
          error_message: report.error_message,
          error_stack: report.error_stack,
          page_url: report.page_url,
          user_agent: report.user_agent,
          error_type: report.error_type,
          severity: report.severity,
        },
      });
    } catch (error) {
      // Fallback to console if database logging fails
      console.error('❌ Failed to log error to database:', error);
    }
  };

  const trackError = async (
    error: Error,
    errorType: ErrorReport['error_type'] = 'manual',
    severity: ErrorReport['severity'] = 'medium'
  ) => {
    const report: ErrorReport = {
      error_message: error.message,
      error_stack: error.stack,
      user_id: user?.id,
      user_email: user?.email,
      page_url: window.location.href,
      user_agent: navigator.userAgent,
      timestamp: new Date().toISOString(),
      error_type: errorType,
      severity,
    };

    // Log to console
    logger.error('Error tracked', {
      userId: user?.id,
      errorType,
      severity,
    }, error);

    // Log to database
    await logErrorToDatabase(report);

    // In production, you could also send to external service
    // if (import.meta.env.PROD) {
    //   await sendToSentry(report);
    // }
  };

  useEffect(() => {
    // Global error handler
    const handleError = (event: ErrorEvent) => {
      event.preventDefault(); // Prevent default browser error handling
      
      trackError(
        new Error(event.message),
        'uncaught',
        'high'
      );
    };

    // Unhandled promise rejection handler
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      event.preventDefault();
      
      const error = event.reason instanceof Error 
        ? event.reason 
        : new Error(String(event.reason));
      
      trackError(error, 'unhandled_rejection', 'high');
    };

    // Attach handlers
    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);

    // Cleanup
    return () => {
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, [user]);

  return {
    trackError,
  };
};

/**
 * Error Boundary Helper
 * Wrapper para componentes com error tracking
 */
export const withErrorTracking = (
  Component: React.ComponentType<any>,
  componentName: string
): React.ComponentType<any> => {
  const WrappedComponent = (props: any) => {
    const { trackError } = useErrorTracking();

    useEffect(() => {
      const originalConsoleError = console.error;
      
      console.error = (...args: any[]) => {
        // Check if this is a React error
        if (args[0]?.includes?.('React')) {
          trackError(
            new Error(`React Error in ${componentName}: ${args.join(' ')}`),
            'manual',
            'medium'
          );
        }
        
        originalConsoleError.apply(console, args);
      };

      return () => {
        console.error = originalConsoleError;
      };
    }, [trackError]);

    return React.createElement(Component, props);
  };

  WrappedComponent.displayName = `withErrorTracking(${componentName})`;
  return WrappedComponent;
};
