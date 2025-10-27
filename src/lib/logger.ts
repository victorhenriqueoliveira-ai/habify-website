/**
 * Structured Logging Utility
 * Fase 2 - Item 11: Sistema de logging estruturado
 */

export enum LogLevel {
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error',
}

interface LogContext {
  userId?: string;
  component?: string;
  action?: string;
  [key: string]: any;
}

interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  context?: LogContext;
  error?: {
    message: string;
    stack?: string;
    code?: string;
  };
}

class Logger {
  private isDevelopment = import.meta.env.DEV;

  private formatLog(entry: LogEntry): string {
    return JSON.stringify({
      ...entry,
      environment: this.isDevelopment ? 'development' : 'production',
    }, null, this.isDevelopment ? 2 : 0);
  }

  private log(level: LogLevel, message: string, context?: LogContext, error?: Error) {
    const entry: LogEntry = {
      level,
      message,
      timestamp: new Date().toISOString(),
      context,
    };

    if (error) {
      entry.error = {
        message: error.message,
        stack: this.isDevelopment ? error.stack : undefined,
        code: (error as any).code,
      };
    }

    const formattedLog = this.formatLog(entry);

    // Console output
    switch (level) {
      case LogLevel.DEBUG:
        console.debug(formattedLog);
        break;
      case LogLevel.INFO:
        console.info(formattedLog);
        break;
      case LogLevel.WARN:
        console.warn(formattedLog);
        break;
      case LogLevel.ERROR:
        console.error(formattedLog);
        break;
    }

    // In production, you could send logs to external service here
    if (!this.isDevelopment && level === LogLevel.ERROR) {
      this.sendToExternalService(entry);
    }
  }

  private async sendToExternalService(entry: LogEntry) {
    // Placeholder for external logging service integration
    // Examples: Sentry, LogRocket, Datadog, etc.
    try {
      // await fetch('https://your-logging-service.com/api/logs', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(entry),
      // });
    } catch (error) {
      console.error('Failed to send log to external service:', error);
    }
  }

  debug(message: string, context?: LogContext) {
    this.log(LogLevel.DEBUG, message, context);
  }

  info(message: string, context?: LogContext) {
    this.log(LogLevel.INFO, message, context);
  }

  warn(message: string, context?: LogContext) {
    this.log(LogLevel.WARN, message, context);
  }

  error(message: string, context?: LogContext, error?: Error) {
    this.log(LogLevel.ERROR, message, context, error);
  }

  // Convenience methods for common scenarios
  apiError(endpoint: string, error: Error, context?: LogContext) {
    this.error(`API Error: ${endpoint}`, {
      ...context,
      endpoint,
      action: 'api_call',
    }, error);
  }

  userAction(action: string, context?: LogContext) {
    this.info(`User Action: ${action}`, {
      ...context,
      action,
    });
  }

  performanceWarning(operation: string, duration: number, context?: LogContext) {
    if (duration > 1000) { // More than 1 second
      this.warn(`Slow Operation: ${operation} took ${duration}ms`, {
        ...context,
        operation,
        duration,
      });
    }
  }
}

export const logger = new Logger();

// Utility function to measure performance
export const measurePerformance = async <T>(
  operation: string,
  fn: () => Promise<T>,
  context?: LogContext
): Promise<T> => {
  const startTime = performance.now();
  
  try {
    const result = await fn();
    const duration = performance.now() - startTime;
    
    logger.performanceWarning(operation, duration, context);
    
    return result;
  } catch (error) {
    const duration = performance.now() - startTime;
    logger.error(`Failed ${operation} after ${duration}ms`, context, error as Error);
    throw error;
  }
};
