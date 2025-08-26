import * as crypto from "crypto";
import { logger } from "./logger";
import { verifyHMAC } from "./security";

/**
 * Generic webhook utilities for handling various webhook sources
 * Provides signature verification, event processing, and retry logic
 */

export interface WebhookEvent {
  id: string;
  type: string;
  source: string;
  timestamp: number;
  data: Record<string, unknown>;
  metadata?: Record<string, unknown>;
}

export interface WebhookHandler {
  source: string;
  events: string[];
  handler: (event: WebhookEvent) => Promise<void>;
  verifySignature?: (payload: string, signature: string, secret: string) => boolean;
}

export interface WebhookProcessingResult {
  success: boolean;
  event: WebhookEvent;
  error?: Error;
  retryAfter?: number;
}

/**
 * Webhook registry for managing different webhook sources
 */
class WebhookRegistry {
  private handlers = new Map<string, WebhookHandler[]>();

  register(handler: WebhookHandler): void {
    const key = `${handler.source}`;
    if (!this.handlers.has(key)) {
      this.handlers.set(key, []);
    }
    this.handlers.get(key)!.push(handler);

    logger.info("Webhook handler registered", {
      source: handler.source,
      events: handler.events,
    });
  }

  getHandlers(source: string, eventType: string): WebhookHandler[] {
    const sourceHandlers = this.handlers.get(source) || [];
    return sourceHandlers.filter(handler => 
      handler.events.includes(eventType) || handler.events.includes('*')
    );
  }

  listSources(): string[] {
    return Array.from(this.handlers.keys());
  }

  listEvents(source: string): string[] {
    const sourceHandlers = this.handlers.get(source) || [];
    return Array.from(new Set(sourceHandlers.flatMap(h => h.events)));
  }
}

// Global webhook registry
export const webhookRegistry = new WebhookRegistry();

/**
 * Stripe signature verification
 */
export function verifyStripeSignature(
  payload: string,
  signature: string,
  secret: string
): boolean {
  try {
    const elements = signature.split(',');
    const signatureElements: Record<string, string> = {};

    for (const element of elements) {
      const [key, value] = element.split('=');
      signatureElements[key] = value;
    }

    if (!signatureElements.t || !signatureElements.v1) {
      return false;
    }

    const timestamp = signatureElements.t;
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(timestamp + '.' + payload)
      .digest('hex');

    return crypto.timingSafeEqual(
      Buffer.from(signatureElements.v1, 'hex'),
      Buffer.from(expectedSignature, 'hex')
    );
  } catch (error) {
    logger.error("Stripe signature verification failed", error as Error);
    return false;
  }
}

/**
 * GitHub webhook signature verification
 */
export function verifyGitHubSignature(
  payload: string,
  signature: string,
  secret: string
): boolean {
  try {
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(payload)
      .digest('hex');

    const receivedSignature = signature.replace('sha256=', '');

    return crypto.timingSafeEqual(
      Buffer.from(expectedSignature, 'hex'),
      Buffer.from(receivedSignature, 'hex')
    );
  } catch (error) {
    logger.error("GitHub signature verification failed", error as Error);
    return false;
  }
}

/**
 * Generic HMAC signature verification
 */
export function verifyGenericSignature(
  payload: string,
  signature: string,
  secret: string,
  algorithm: string = 'sha256'
): boolean {
  try {
    const expectedSignature = crypto
      .createHmac(algorithm, secret)
      .update(payload)
      .digest('hex');

    return crypto.timingSafeEqual(
      Buffer.from(signature, 'hex'),
      Buffer.from(expectedSignature, 'hex')
    );
  } catch (error) {
    logger.error("Generic signature verification failed", error as Error);
    return false;
  }
}

/**
 * Process webhook event
 */
export async function processWebhookEvent(
  source: string,
  payload: string,
  signature?: string,
  headers: Record<string, string> = {}
): Promise<WebhookProcessingResult[]> {
  const startTime = Date.now();
  
  try {
    logger.info("Processing webhook event", { source, payloadSize: payload.length });

    // Parse the payload
    let parsedPayload: Record<string, unknown>;
    try {
      parsedPayload = JSON.parse(payload) as Record<string, unknown>;
    } catch (error) {
      throw new Error("Invalid JSON payload");
    }

    // Create webhook event object
    const event: WebhookEvent = {
      id: (parsedPayload.id as string) || crypto.randomUUID(),
      type: (parsedPayload.type as string) || (parsedPayload.event_type as string) || 'unknown',
      source,
      timestamp: (parsedPayload.timestamp as number) || Date.now(),
      data: (parsedPayload.data as Record<string, unknown>) || parsedPayload,
      metadata: {
        headers,
        receivedAt: Date.now(),
      },
    };

    // Get handlers for this event
    const handlers = webhookRegistry.getHandlers(source, event.type);
    
    if (handlers.length === 0) {
      logger.warn("No handlers found for webhook event", {
        source: event.source,
        type: event.type,
      });
      return [];
    }

    // Process each handler
    const results: WebhookProcessingResult[] = [];
    
    for (const handler of handlers) {
      try {
        // Verify signature if handler requires it
        if (handler.verifySignature && signature) {
          const secret = getWebhookSecret(source);
          if (!secret || !handler.verifySignature(payload, signature, secret)) {
            throw new Error("Webhook signature verification failed");
          }
        }

        // Process the event
        await handler.handler(event);
        
        results.push({
          success: true,
          event,
        });

        logger.info("Webhook event processed successfully", {
          source: event.source,
          type: event.type,
          handler: handler.events,
          duration: Date.now() - startTime,
        });

      } catch (error) {
        const err = error as Error;
        results.push({
          success: false,
          event,
          error: err,
        });

        logger.error("Webhook event processing failed", err, {
          source: event.source,
          type: event.type,
          handler: handler.events,
          duration: Date.now() - startTime,
        });
      }
    }

    return results;

  } catch (error) {
    const err = error as Error;
    logger.error("Webhook processing failed", err, {
      source,
      duration: Date.now() - startTime,
    });
    
    throw err;
  }
}

/**
 * Get webhook secret for a source
 */
function getWebhookSecret(source: string): string | undefined {
  switch (source.toLowerCase()) {
    case 'stripe':
      return process.env.STRIPE_WEBHOOK_SECRET;
    case 'github':
      return process.env.GITHUB_WEBHOOK_SECRET;
    case 'sendgrid':
      return process.env.SENDGRID_WEBHOOK_SECRET;
    case 'resend':
      return process.env.RESEND_WEBHOOK_SECRET;
    default:
      return process.env[`${source.toUpperCase()}_WEBHOOK_SECRET`];
  }
}

/**
 * Webhook retry logic with exponential backoff
 */
export class WebhookRetryQueue {
  private queue: Array<{
    event: WebhookEvent;
    handler: WebhookHandler;
    attempts: number;
    nextRetry: number;
  }> = [];

  private processing = false;

  constructor(
    private maxAttempts: number = 3,
    private baseDelay: number = 1000,
    private maxDelay: number = 60000
  ) {
    // Process queue every 10 seconds
    setInterval(() => this.processQueue(), 10000);
  }

  add(event: WebhookEvent, handler: WebhookHandler): void {
    this.queue.push({
      event,
      handler,
      attempts: 0,
      nextRetry: Date.now(),
    });

    logger.info("Added event to webhook retry queue", {
      eventId: event.id,
      source: event.source,
      type: event.type,
    });
  }

  private async processQueue(): Promise<void> {
    if (this.processing || this.queue.length === 0) {
      return;
    }

    this.processing = true;
    const now = Date.now();

    try {
      const itemsToProcess = this.queue.filter(item => item.nextRetry <= now);
      
      for (const item of itemsToProcess) {
        try {
          await item.handler.handler(item.event);
          
          // Success - remove from queue
          const index = this.queue.indexOf(item);
          if (index > -1) {
            this.queue.splice(index, 1);
          }

          logger.info("Webhook retry successful", {
            eventId: item.event.id,
            attempts: item.attempts + 1,
          });

        } catch (error) {
          item.attempts++;
          
          if (item.attempts >= this.maxAttempts) {
            // Max attempts reached - remove from queue
            const index = this.queue.indexOf(item);
            if (index > -1) {
              this.queue.splice(index, 1);
            }

            logger.error("Webhook retry max attempts reached", error as Error, {
              eventId: item.event.id,
              attempts: item.attempts,
            });

          } else {
            // Calculate next retry time with exponential backoff
            const delay = Math.min(
              this.baseDelay * Math.pow(2, item.attempts),
              this.maxDelay
            );
            item.nextRetry = now + delay;

            logger.warn("Webhook retry failed, will retry", {
              eventId: item.event.id,
              attempts: item.attempts,
              nextRetry: new Date(item.nextRetry).toISOString(),
              error: (error as Error).message,
            });
          }
        }
      }

    } finally {
      this.processing = false;
    }
  }

  getQueueLength(): number {
    return this.queue.length;
  }

  getQueueStats(): {
    total: number;
    pending: number;
    overdue: number;
  } {
    const now = Date.now();
    const pending = this.queue.filter(item => item.nextRetry > now).length;
    const overdue = this.queue.filter(item => item.nextRetry <= now).length;

    return {
      total: this.queue.length,
      pending,
      overdue,
    };
  }
}

// Global retry queue instance
export const webhookRetryQueue = new WebhookRetryQueue();

/**
 * Webhook event store for debugging and auditing
 */
export class WebhookEventStore {
  private events: WebhookEvent[] = [];
  private maxEvents: number = 1000;

  add(event: WebhookEvent): void {
    this.events.push(event);
    
    // Keep only the most recent events
    if (this.events.length > this.maxEvents) {
      this.events = this.events.slice(-this.maxEvents);
    }
  }

  getEvents(
    filters: {
      source?: string;
      type?: string;
      limit?: number;
      offset?: number;
    } = {}
  ): WebhookEvent[] {
    let filtered = this.events;

    if (filters.source) {
      filtered = filtered.filter(e => e.source === filters.source);
    }

    if (filters.type) {
      filtered = filtered.filter(e => e.type === filters.type);
    }

    // Sort by timestamp (most recent first)
    filtered.sort((a, b) => b.timestamp - a.timestamp);

    // Apply pagination
    const offset = filters.offset || 0;
    const limit = filters.limit || 100;
    
    return filtered.slice(offset, offset + limit);
  }

  getEventById(id: string): WebhookEvent | undefined {
    return this.events.find(e => e.id === id);
  }

  getStats(): {
    total: number;
    bySource: Record<string, number>;
    byType: Record<string, number>;
    recentCount: number;
  } {
    const bySource: Record<string, number> = {};
    const byType: Record<string, number> = {};
    const oneHourAgo = Date.now() - 60 * 60 * 1000;
    let recentCount = 0;

    for (const event of this.events) {
      bySource[event.source] = (bySource[event.source] || 0) + 1;
      byType[event.type] = (byType[event.type] || 0) + 1;
      
      if (event.timestamp > oneHourAgo) {
        recentCount++;
      }
    }

    return {
      total: this.events.length,
      bySource,
      byType,
      recentCount,
    };
  }
}

// Global event store instance
export const webhookEventStore = new WebhookEventStore();