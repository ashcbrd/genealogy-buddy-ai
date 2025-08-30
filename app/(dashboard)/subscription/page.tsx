"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useUserStatus } from "@/hooks/use-user-status";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
// import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Navigation } from "@/components/ui/navigation";
import {
  CreditCard,
  Check,
  X,
  Loader2,
  AlertCircle,
  Crown,
  Zap,
  Shield,
  Users,
  // Calendar,
  // TrendingUp,
  // Download,
  ChevronRight,
} from "lucide-react";
import { SUBSCRIPTION_LIMITS, type SubscriptionData } from "@/types";
import { Footer } from "@/components/footer";

const PLANS = [
  {
    name: "Free",
    tier: "FREE",
    price: 0,
    description: "Perfect for getting started with basic tools",
    icon: <Users className="w-6 h-6" />,
    color: "gray",
  },
  {
    name: "Explorer",
    tier: "EXPLORER",
    price: 19,
    description: "Unlock translation & premium AI research",
    icon: <Zap className="w-6 h-6" />,
    color: "blue",
    popular: true,
  },
  {
    name: "Researcher",
    tier: "RESEARCHER",
    price: 39,
    description: "Advanced features for serious genealogists",
    icon: <Shield className="w-6 h-6" />,
    color: "purple",
  },
  {
    name: "Professional",
    tier: "PROFESSIONAL",
    price: 79,
    description: "Complete toolkit for professionals & teams",
    icon: <Crown className="w-6 h-6" />,
    color: "gold",
  },
];

export default function SubscriptionPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const { isAnonymous, isAuthenticated } = useUserStatus();
  const [subscription, setSubscription] = useState<SubscriptionData | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(true);
  const [isUpgrading, setIsUpgrading] = useState<string | null>(null);

  const fetchSubscriptionData = useCallback(async () => {
    try {
      // Require authentication
      if (!session || !isAuthenticated) {
        setIsLoading(false);
        return;
      }

      const res = await fetch("/api/subscription/current");
      const data = await res.json();
      setSubscription(data);
    } catch (error) {
      console.error("Error fetching subscription:", error);
      // Fallback for errors
      setSubscription({
        tier: "FREE",
        usage: {
          documents: 0,
          dna: 0,
          research: 0,
          photos: 0,
        },
      });
    } finally {
      setIsLoading(false);
    }
  }, [session, isAuthenticated]);

  useEffect(() => {
    fetchSubscriptionData();
  }, [fetchSubscriptionData]);

  const handleUpgrade = async (tier: string) => {
    // Check if user is authenticated
    if (!session || !isAuthenticated) {
      // Redirect unauthenticated users to sign up with plan parameter
      router.push(`/register?plan=${tier}`);
      return;
    }

    setIsUpgrading(tier);

    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tier }),
      });

      const { url } = await res.json();
      window.location.href = url;
    } catch (error) {
      console.error("Error creating checkout session:", error);
    } finally {
      setIsUpgrading(null);
    }
  };

  const handleManageBilling = async () => {
    try {
      const res = await fetch("/api/stripe/portal", {
        method: "POST",
      });

      const { url } = await res.json();
      window.location.href = url;
    } catch (error) {
      console.error("Error accessing billing portal:", error);
    }
  };

  // Show login prompt for unauthenticated users
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation variant="dashboard" />
        <div className="container mx-auto px-4 py-8 max-w-4xl">
          <div className="text-center py-16">
            <h1 className="text-4xl font-bold mb-4">Authentication Required</h1>
            <p className="text-xl text-muted-foreground mb-8">
              Please log in to manage your subscription and view billing
              information.
            </p>
            <div className="flex gap-4 justify-center">
              <Link href="/login">
                <Button size="lg">Log In</Button>
              </Link>
              <Link href="/register">
                <Button size="lg" variant="outline">
                  Create Account
                </Button>
              </Link>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation variant="dashboard" />
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Subscription & Billing</h1>
          <p className="text-muted-foreground">
            Manage your subscription and unlock premium features like document
            translation and enhanced AI research
          </p>
        </div>

        {/* Current Plan */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Current Plan</CardTitle>
            <CardDescription>
              Your active subscription and billing details
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-3">
                  <h3 className="text-2xl font-bold">
                    {PLANS.find((p) => p.tier === subscription?.tier)?.name ||
                      "Free"}
                  </h3>
                  <Badge
                    variant={
                      subscription?.tier === "FREE" ? "secondary" : "default"
                    }
                  >
                    {subscription?.tier === "FREE" ? "Free Plan" : "Active"}
                  </Badge>
                </div>
                {subscription?.currentPeriodEnd && (
                  <p className="text-sm text-muted-foreground mt-1">
                    Next billing date:{" "}
                    {new Date(
                      subscription.currentPeriodEnd
                    ).toLocaleDateString()}
                  </p>
                )}
                {subscription?.canceledAt && (
                  <Alert className="mt-2">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      Your subscription will end on{" "}
                      {new Date(
                        subscription.currentPeriodEnd!
                      ).toLocaleDateString()}
                    </AlertDescription>
                  </Alert>
                )}
              </div>
              {subscription?.tier !== "FREE" && (
                <Button onClick={handleManageBilling}>
                  <CreditCard className="mr-2 h-4 w-4" />
                  Manage Billing
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Usage Statistics */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Monthly Usage</CardTitle>
            <CardDescription>Track your usage across all tools</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {subscription &&
              (subscription.tier || "FREE") in SUBSCRIPTION_LIMITS ? (
                Object.entries(
                  SUBSCRIPTION_LIMITS[subscription.tier || "FREE"]
                ).map(([key, limit]) => {
                  if (typeof limit !== "number") return null;
                  const used =
                    subscription.usage?.[
                      key as keyof typeof subscription.usage
                    ] || 0;
                  const percentage = limit === -1 ? 0 : (used / limit) * 100;

                  return (
                    <div key={key}>
                      <div className="flex justify-between text-sm mb-2">
                        <span className="capitalize">
                          {key.replace(/([A-Z])/g, " $1").trim()}
                        </span>
                        <span>
                          {limit === -1 ? "Unlimited" : `${used} / ${limit}`}
                        </span>
                      </div>
                      {limit !== -1 && (
                        <Progress value={percentage} className="h-2" />
                      )}
                    </div>
                  );
                })
              ) : (
                <div className="text-sm text-muted-foreground">
                  No usage data available
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Pricing Plans */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-6">Available Plans</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {PLANS.map((plan) => {
              const limits =
                SUBSCRIPTION_LIMITS[
                  plan.tier as keyof typeof SUBSCRIPTION_LIMITS
                ];
              const isCurrent = (subscription?.tier || "FREE") === plan.tier;

              return (
                <Card
                  key={plan.tier}
                  className={`relative flex flex-col ${
                    plan.popular ? "border-primary shadow-lg" : ""
                  } ${isCurrent ? "ring-2 ring-primary" : ""}`}
                >
                  {plan.popular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <Badge className="bg-primary">Most Popular</Badge>
                    </div>
                  )}
                  {isCurrent && (
                    <div className="absolute -top-3 right-4">
                      <Badge variant="secondary">Current Plan</Badge>
                    </div>
                  )}

                  <CardHeader>
                    <div className="flex items-center justify-between mb-2">
                      <div className={`text-${plan.color}-500`}>
                        {plan.icon}
                      </div>
                      {plan.tier !== "FREE" && (
                        <Badge variant="outline">${plan.price}/mo</Badge>
                      )}
                    </div>
                    <CardTitle>{plan.name}</CardTitle>
                    <CardDescription>{plan.description}</CardDescription>
                    <div className="text-3xl font-bold mt-4">
                      {plan.price === 0 ? "Free" : `${plan.price}`}
                      {plan.price > 0 && (
                        <span className="text-sm font-normal text-muted-foreground">
                          /month
                        </span>
                      )}
                    </div>
                  </CardHeader>

                  <CardContent>
                    <ul className="space-y-2">
                      <li className="flex items-center gap-2 text-sm">
                        {limits.documents === -1 ? (
                          <>
                            <Check className="w-4 h-4 text-green-500" />
                            <span>Unlimited document analyses</span>
                          </>
                        ) : (
                          <>
                            <Check className="w-4 h-4 text-green-500" />
                            <span>{limits.documents} document analyses/mo</span>
                          </>
                        )}
                      </li>
                      <li className="flex items-center gap-2 text-sm">
                        {limits.dna === -1 ? (
                          <>
                            <Check className="w-4 h-4 text-green-500" />
                            <span>Unlimited DNA analyses</span>
                          </>
                        ) : limits.dna > 0 ? (
                          <>
                            <Check className="w-4 h-4 text-green-500" />
                            <span>{limits.dna} DNA analyses/mo</span>
                          </>
                        ) : (
                          <>
                            <X className="w-4 h-4 text-gray-400" />
                            <span className="text-muted-foreground">
                              DNA analysis
                            </span>
                          </>
                        )}
                      </li>
                      <li className="flex items-center gap-2 text-sm">
                        {limits.translationEnabled ? (
                          <>
                            <Check className="w-4 h-4 text-green-500" />
                            <span>Document Translation (15 languages)</span>
                          </>
                        ) : (
                          <>
                            <X className="w-4 h-4 text-red-500" />
                            <span className="text-muted-foreground">
                              No translation access
                            </span>
                          </>
                        )}
                      </li>
                      <li className="flex items-center gap-2 text-sm">
                        {limits.translationEnabled ? (
                          <>
                            <Check className="w-4 h-4 text-green-500" />
                            <span>Historical Terms Explanations</span>
                          </>
                        ) : (
                          <>
                            <X className="w-4 h-4 text-red-500" />
                            <span className="text-muted-foreground">
                              Historical terms explanations
                            </span>
                          </>
                        )}
                      </li>
                      <li className="flex items-center gap-2 text-sm">
                        {limits.research === -1 ? (
                          <>
                            <Check className="w-4 h-4 text-green-500" />
                            <span>Unlimited AI research questions</span>
                          </>
                        ) : limits.research > 0 ? (
                          <>
                            <Check className="w-4 h-4 text-green-500" />
                            <span>
                              {limits.research} AI research questions/mo
                            </span>
                          </>
                        ) : (
                          <>
                            <X className="w-4 h-4 text-gray-400" />
                            <span className="text-muted-foreground">
                              AI research questions
                            </span>
                          </>
                        )}
                      </li>
                      {plan.tier !== "FREE" && (
                        <>
                          <li className="flex items-center gap-2 text-sm">
                            <Check className="w-4 h-4 text-green-500" />
                            <span>Guided Research Narratives</span>
                          </li>
                          <li className="flex items-center gap-2 text-sm">
                            <Check className="w-4 h-4 text-green-500" />
                            <span>Clickable Trusted Source Links</span>
                          </li>
                          <li className="flex items-center gap-2 text-sm">
                            <Check className="w-4 h-4 text-green-500" />
                            <span>Detailed Historical Context</span>
                          </li>
                        </>
                      )}
                      <li className="flex items-center gap-2 text-sm">
                        {limits.photos === -1 ? (
                          <>
                            <Check className="w-4 h-4 text-green-500" />
                            <span>Unlimited photo analyses</span>
                          </>
                        ) : limits.photos > 0 ? (
                          <>
                            <Check className="w-4 h-4 text-green-500" />
                            <span>{limits.photos} photo analyses/mo</span>
                          </>
                        ) : (
                          <>
                            <X className="w-4 h-4 text-gray-400" />
                            <span className="text-muted-foreground">
                              Photo analysis
                            </span>
                          </>
                        )}
                      </li>
                      <li className="flex items-center gap-2 text-sm">
                        {limits.gedcomExport ? (
                          <>
                            <Check className="w-4 h-4 text-green-500" />
                            <span>GEDCOM export</span>
                          </>
                        ) : (
                          <>
                            <X className="w-4 h-4 text-gray-400" />
                            <span className="text-muted-foreground">
                              GEDCOM export
                            </span>
                          </>
                        )}
                      </li>
                      <li className="flex items-center gap-2 text-sm">
                        {limits.prioritySupport ? (
                          <>
                            <Check className="w-4 h-4 text-green-500" />
                            <span>Priority support</span>
                          </>
                        ) : (
                          <>
                            <Check className="w-4 h-4 text-green-500" />
                            <span>Email support</span>
                          </>
                        )}
                      </li>
                    </ul>
                  </CardContent>

                  <CardFooter className="mt-auto">
                    {isCurrent ? (
                      <Button className="w-full" disabled variant="outline">
                        Current Plan
                      </Button>
                    ) : plan.tier === "FREE" ? (
                      <Button className="w-full" variant="outline" disabled>
                        Always Free
                      </Button>
                    ) : (
                      <Button
                        className="w-full"
                        onClick={() => handleUpgrade(plan.tier)}
                        disabled={isUpgrading === plan.tier}
                      >
                        {isUpgrading === plan.tier ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Processing...
                          </>
                        ) : (
                          <>
                            Upgrade to {plan.name}
                            <ChevronRight className="ml-1 h-4 w-4" />
                          </>
                        )}
                      </Button>
                    )}
                  </CardFooter>
                </Card>
              );
            })}
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
