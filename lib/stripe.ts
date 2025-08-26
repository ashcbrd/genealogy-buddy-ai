import Stripe from "stripe";
import { prisma } from "./prisma";

// Extended Stripe subscription interface to ensure type safety
interface StripeSubscription extends Stripe.Subscription {
  current_period_start: number;
  current_period_end: number;
  canceled_at: number | null;
}

// Initialize Stripe with secret key
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

// Webhook endpoint secret for verifying webhook signatures
const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET!;

// Stripe Price IDs for each subscription tier
export const STRIPE_PRICE_IDS = {
  EXPLORER: process.env.STRIPE_EXPLORER_PRICE_ID!,
  RESEARCHER: process.env.STRIPE_RESEARCHER_PRICE_ID!,
  PROFESSIONAL: process.env.STRIPE_PROFESSIONAL_PRICE_ID!,
} as const;

// Subscription tier mapping from price IDs
const PRICE_TO_TIER: Record<string, string> = {
  [STRIPE_PRICE_IDS.EXPLORER]: "EXPLORER",
  [STRIPE_PRICE_IDS.RESEARCHER]: "RESEARCHER",
  [STRIPE_PRICE_IDS.PROFESSIONAL]: "PROFESSIONAL",
};

/**
 * Create a Stripe customer for a new user
 */
export async function createCustomer(
  email: string,
  userId: string
): Promise<string> {
  try {
    const customer = await stripe.customers.create({
      email,
      metadata: {
        userId,
      },
    });

    // Update user record with Stripe customer ID
    await prisma.user.update({
      where: { id: userId },
      data: {
        subscription: {
          create: {
            stripeCustomerId: customer.id,
            tier: "FREE",
          },
        },
      },
    });

    return customer.id;
  } catch (error) {
    console.error("Failed to create Stripe customer:", error);
    throw new Error("Failed to create customer");
  }
}

/**
 * Create a checkout session for subscription upgrade
 */
export async function createCheckoutSession(
  customerId: string,
  priceId: string,
  successUrl: string,
  cancelUrl: string
): Promise<string> {
  try {
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ["card"],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: "subscription",
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: {
        customerId,
      },
    });

    return session.url!;
  } catch (error) {
    console.error("Failed to create checkout session:", error);
    throw new Error("Failed to create checkout session");
  }
}

/**
 * Create a customer portal session for managing subscription
 */
export async function createPortalSession(
  customerId: string,
  returnUrl: string
): Promise<string> {
  try {
    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: returnUrl,
    });

    return session.url;
  } catch (error) {
    console.error("Failed to create portal session:", error);
    throw new Error("Failed to create portal session");
  }
}

/**
 * Handle Stripe webhooks
 */
export async function handleWebhook(
  signature: string,
  payload: string
): Promise<void> {
  let event: Stripe.Event;

  try {
    // Verify webhook signature
    event = stripe.webhooks.constructEvent(payload, signature, endpointSecret);
  } catch (error) {
    console.error("Webhook signature verification failed:", error);
    throw new Error("Webhook signature verification failed");
  }

  try {
    switch (event.type) {
      case "customer.subscription.created":
      case "customer.subscription.updated":
        await handleSubscriptionUpdate(event.data.object as StripeSubscription);
        break;

      case "customer.subscription.deleted":
        await handleSubscriptionDeleted(
          event.data.object as StripeSubscription
        );
        break;

      case "invoice.payment_succeeded":
        await handlePaymentSucceeded(event.data.object as Stripe.Invoice);
        break;

      case "invoice.payment_failed":
        await handlePaymentFailed(event.data.object as Stripe.Invoice);
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }
  } catch (error) {
    console.error(`Error handling webhook ${event.type}:`, error);
    throw error;
  }
}

/**
 * Handle subscription creation/updates
 */
async function handleSubscriptionUpdate(
  subscription: StripeSubscription
): Promise<void> {
  const customerId = subscription.customer as string;
  const priceId = subscription.items.data[0]?.price.id;

  if (!priceId || !PRICE_TO_TIER[priceId]) {
    console.error("Unknown price ID:", priceId);
    return;
  }

  const tier = PRICE_TO_TIER[priceId] as
    | "EXPLORER"
    | "RESEARCHER"
    | "PROFESSIONAL";

  await prisma.subscription.update({
    where: { stripeCustomerId: customerId },
    data: {
      tier,
      stripeSubscriptionId: subscription.id,
      stripePriceId: priceId,
      currentPeriodStart: new Date(subscription.current_period_start * 1000),
      currentPeriodEnd: new Date(subscription.current_period_end * 1000),
      canceledAt: subscription.canceled_at
        ? new Date(subscription.canceled_at * 1000)
        : null,
    },
  });

  console.log(`Subscription updated: customer ${customerId} -> ${tier}`);
}

/**
 * Handle subscription cancellation
 */
async function handleSubscriptionDeleted(
  subscription: StripeSubscription
): Promise<void> {
  const customerId = subscription.customer as string;

  await prisma.subscription.update({
    where: { stripeCustomerId: customerId },
    data: {
      tier: "FREE",
      stripeSubscriptionId: null,
      stripePriceId: null,
      currentPeriodStart: null,
      currentPeriodEnd: null,
      canceledAt: new Date(),
    },
  });

  console.log(`Subscription canceled: customer ${customerId} -> FREE`);
}

/**
 * Handle successful payment
 */
async function handlePaymentSucceeded(invoice: Stripe.Invoice): Promise<void> {
  const customerId = invoice.customer as string;
  console.log(`Payment succeeded for customer: ${customerId}`);

  // You could add logic here to send payment confirmation emails,
  // update usage limits, etc.
}

/**
 * Handle failed payment
 */
async function handlePaymentFailed(invoice: Stripe.Invoice): Promise<void> {
  const customerId = invoice.customer as string;
  console.log(`Payment failed for customer: ${customerId}`);

  // You could add logic here to send payment failure notifications,
  // temporarily suspend access, etc.
}

/**
 * Get customer by user ID
 */
export async function getCustomerByUserId(
  userId: string
): Promise<string | null> {
  const subscription = await prisma.subscription.findUnique({
    where: { userId },
    select: { stripeCustomerId: true },
  });

  return subscription?.stripeCustomerId || null;
}

/**
 * Get subscription details
 */
export async function getSubscriptionDetails(
  customerId: string
): Promise<Stripe.Subscription | null> {
  try {
    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      status: "active",
      limit: 1,
    });

    return subscriptions.data[0] || null;
  } catch (error) {
    console.error("Failed to get subscription details:", error);
    return null;
  }
}

/**
 * Cancel subscription at period end
 */
export async function cancelSubscription(
  subscriptionId: string
): Promise<void> {
  try {
    await stripe.subscriptions.update(subscriptionId, {
      cancel_at_period_end: true,
    });
  } catch (error) {
    console.error("Failed to cancel subscription:", error);
    throw new Error("Failed to cancel subscription");
  }
}

/**
 * Reactivate canceled subscription
 */
export async function reactivateSubscription(
  subscriptionId: string
): Promise<void> {
  try {
    await stripe.subscriptions.update(subscriptionId, {
      cancel_at_period_end: false,
    });
  } catch (error) {
    console.error("Failed to reactivate subscription:", error);
    throw new Error("Failed to reactivate subscription");
  }
}

// Export Stripe instance for direct use if needed
export { stripe };

// Export types for use elsewhere
export type { Stripe } from "stripe";
