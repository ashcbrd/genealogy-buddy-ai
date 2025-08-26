/**
 * Centralized logging utility for the application
 * Provides structured logging with different levels and contexts
 */

export type LogLevel = "debug" | "info" | "warn" | "error" | "fatal";

interface LogContext {
  userId?: string;
  requestId?: string;
  path?: string;
  method?: string;
  ip?: string;
  userAgent?: string;
  timestamp?: string;
  [key: string]: any;
}

interface LogEntry {
  level: LogLevel;
  message: string;
  context?: LogContext;
  error?: Error;
  data?: any;
}

class Logger {
  private isDevelopment = process.env.NODE_ENV === "development";
  private logLevel = process.env.LOG_LEVEL || "info";

  private shouldLog(level: LogLevel): boolean {
    const levels = ["debug", "info", "warn", "error", "fatal"];
    return levels.indexOf(level) >= levels.indexOf(this.logLevel as LogLevel);
  }

  private formatMessage(entry: LogEntry): string {
    const timestamp = new Date().toISOString();
    const level = entry.level.toUpperCase().padEnd(5);
    const context = entry.context ? JSON.stringify(entry.context) : "";
    const error = entry.error ? `\nError: ${entry.error.message}\nStack: ${entry.error.stack}` : "";
    const data = entry.data ? `\nData: ${JSON.stringify(entry.data, null, 2)}` : "";

    return `${timestamp} [${level}] ${entry.message}${context ? ` | Context: ${context}` : ""}${error}${data}`;
  }

  private log(entry: LogEntry): void {
    if (!this.shouldLog(entry.level)) return;

    const message = this.formatMessage(entry);

    // In production, you might want to send logs to external services
    if (this.isDevelopment) {
      switch (entry.level) {
        case "debug":
        case "info":
          console.log(message);
          break;
        case "warn":
          console.warn(message);
          break;
        case "error":
        case "fatal":
          console.error(message);
          break;
      }
    } else {
      // In production, send to logging service (e.g., Winston, Sentry, etc.)
      console.log(message);
    }
  }

  debug(message: string, context?: LogContext, data?: any): void {
    this.log({ level: "debug", message, context, data });
  }

  info(message: string, context?: LogContext, data?: any): void {
    this.log({ level: "info", message, context, data });
  }

  warn(message: string, context?: LogContext, data?: any): void {
    this.log({ level: "warn", message, context, data });
  }

  error(message: string, error?: Error, context?: LogContext, data?: any): void {
    this.log({ level: "error", message, error, context, data });
  }

  fatal(message: string, error?: Error, context?: LogContext, data?: any): void {
    this.log({ level: "fatal", message, error, context, data });
  }

  // Specialized logging methods for common scenarios
  apiRequest(method: string, path: string, context?: LogContext): void {
    this.info(`API Request: ${method} ${path}`, {
      ...context,
      method,
      path,
      timestamp: new Date().toISOString(),
    });
  }

  apiResponse(method: string, path: string, status: number, duration: number, context?: LogContext): void {
    this.info(`API Response: ${method} ${path} - ${status}`, {
      ...context,
      method,
      path,
      status,
      duration,
      timestamp: new Date().toISOString(),
    });
  }

  authEvent(event: string, userId?: string, success: boolean = true, context?: LogContext): void {
    this.info(`Auth Event: ${event}${success ? " (Success)" : " (Failed)"}`, {
      ...context,
      userId,
      event,
      success,
      timestamp: new Date().toISOString(),
    });
  }

  paymentEvent(event: string, userId: string, amount?: number, currency?: string, context?: LogContext): void {
    this.info(`Payment Event: ${event}`, {
      ...context,
      userId,
      event,
      amount,
      currency,
      timestamp: new Date().toISOString(),
    });
  }

  analysisEvent(
    type: string,
    userId: string,
    success: boolean,
    duration: number,
    context?: LogContext
  ): void {
    this.info(`Analysis Event: ${type}${success ? " (Success)" : " (Failed)"}`, {
      ...context,
      userId,
      type,
      success,
      duration,
      timestamp: new Date().toISOString(),
    });
  }

  uploadEvent(
    type: "document" | "photo",
    userId: string,
    filename: string,
    size: number,
    success: boolean,
    context?: LogContext
  ): void {
    this.info(`Upload Event: ${type}${success ? " (Success)" : " (Failed)"}`, {
      ...context,
      userId,
      type,
      filename,
      size,
      success,
      timestamp: new Date().toISOString(),
    });
  }
}

// Create singleton instance
export const logger = new Logger();

// Export types for use in other files
export type { LogContext, LogEntry };

// Utility function to create request context from Next.js request
export function createRequestContext(req: Request, userId?: string): LogContext {
  return {
    userId,
    path: new URL(req.url).pathname,
    method: req.method,
    userAgent: req.headers.get("user-agent") || undefined,
    timestamp: new Date().toISOString(),
  };
}

// Utility function to measure execution time
export function withTiming<T>(
  fn: () => Promise<T> | T,
  onComplete: (duration: number, success: boolean, error?: Error) => void
): Promise<T> {
  const start = Date.now();
  
  try {
    const result = fn();
    
    if (result instanceof Promise) {
      return result
        .then((value) => {
          onComplete(Date.now() - start, true);
          return value;
        })
        .catch((error) => {
          onComplete(Date.now() - start, false, error);
          throw error;
        });
    } else {
      onComplete(Date.now() - start, true);
      return Promise.resolve(result);
    }
  } catch (error) {
    onComplete(Date.now() - start, false, error as Error);
    throw error;
  }
}