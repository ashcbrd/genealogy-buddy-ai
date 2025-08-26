"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import Link from "next/link";
import { useSession } from "next-auth/react";
import {
  Crown,
  Zap,
  Users,
  FileText,
  MessageCircle,
  TreePine,
  ArrowRight,
  X,
  CheckCircle,
  Sparkles
} from "lucide-react";

interface UpgradePromptProps {
  isOpen: boolean;
  onClose: () => void;
  trigger: "limit_reached" | "feature_locked" | "usage_warning";
  toolName?: string;
  usage?: {
    current: number;
    limit: number;
  };
  onSignUp?: () => void;
}

export function UpgradePrompt({
  isOpen,
  onClose,
  trigger,
  toolName = "this tool",
  usage,
  onSignUp
}: UpgradePromptProps) {
  const { data: session } = useSession();
  const [countdown, setCountdown] = useState(10);
  const [showCountdown, setShowCountdown] = useState(trigger === "usage_warning");

  const isAnonymous = !session;
  const isFreeTier = isAnonymous || true; // Assume free tier for now

  useEffect(() => {
    if (!showCountdown || !isOpen) return;

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          setShowCountdown(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [showCountdown, isOpen]);

  const progressPercentage = usage ? Math.round((usage.current / usage.limit) * 100) : 0;

  const triggerConfig = {
    limit_reached: {
      title: isAnonymous ? "Free Trial Limit Reached" : "Monthly Limit Reached",
      description: isAnonymous 
        ? `You've used all your free trial ${toolName} analyses. Sign up for free to continue with the same limits.`
        : `You've used all your monthly ${toolName} analyses. Upgrade for higher limits.`,
      urgency: "high" as const,
      icon: Crown
    },
    feature_locked: {
      title: "Premium Feature",
      description: `${toolName} ${isAnonymous ? 'requires a free account' : 'is not included in your plan'}.`,
      urgency: "medium" as const,
      icon: Zap
    },
    usage_warning: {
      title: "Almost at Your Limit",
      description: `You're running low on ${toolName} uses. ${isAnonymous ? 'Consider signing up' : 'Consider upgrading'} to avoid interruption.`,
      urgency: "low" as const,
      icon: Sparkles
    }
  };

  const config = triggerConfig[trigger];
  const Icon = config.icon;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
                config.urgency === "high" ? "bg-red-500/10 text-red-600" :
                config.urgency === "medium" ? "bg-blue-500/10 text-blue-600" :
                "bg-orange-500/10 text-orange-600"
              }`}>
                <Icon className="w-6 h-6" />
              </div>
              <div>
                <DialogTitle className="text-xl">{config.title}</DialogTitle>
                <DialogDescription className="text-base">
                  {config.description}
                </DialogDescription>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-8 w-8 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Usage Progress */}
          {usage && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Current Usage</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span>This Month</span>
                    <span>{usage.current} / {usage.limit}</span>
                  </div>
                  <Progress value={progressPercentage} className="h-2" />
                  <p className="text-sm text-muted-foreground">
                    You&apos;ve used {progressPercentage}% of your {isAnonymous ? 'free trial' : 'monthly'} allowance
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Benefits Comparison */}
          <div className="grid md:grid-cols-2 gap-4">
            {isAnonymous ? (
              <>
                <Card className="border-2 border-primary">
                  <CardHeader className="text-center pb-3">
                    <Badge variant="default" className="w-fit mx-auto mb-2">
                      Recommended
                    </Badge>
                    <CardTitle className="text-xl">Free Account</CardTitle>
                    <CardDescription>Full access to basic features</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="space-y-2">
                      <div className="flex items-center text-sm">
                        <CheckCircle className="w-4 h-4 text-green-600 mr-2 flex-shrink-0" />
                        <span>2 document analyses/month</span>
                      </div>
                      <div className="flex items-center text-sm">
                        <CheckCircle className="w-4 h-4 text-green-600 mr-2 flex-shrink-0" />
                        <span>5 research chat sessions/month</span>
                      </div>
                      <div className="flex items-center text-sm">
                        <CheckCircle className="w-4 h-4 text-green-600 mr-2 flex-shrink-0" />
                        <span>1 family tree/month</span>
                      </div>
                      <div className="flex items-center text-sm">
                        <CheckCircle className="w-4 h-4 text-green-600 mr-2 flex-shrink-0" />
                        <span>Save & organize research</span>
                      </div>
                      <div className="flex items-center text-sm">
                        <CheckCircle className="w-4 h-4 text-green-600 mr-2 flex-shrink-0" />
                        <span>Access to all basic tools</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="text-center pb-3">
                    <Badge variant="secondary" className="w-fit mx-auto mb-2">
                      Current
                    </Badge>
                    <CardTitle className="text-xl">Anonymous Trial</CardTitle>
                    <CardDescription>Limited trial access</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="space-y-2">
                      <div className="flex items-center text-sm">
                        <FileText className="w-4 h-4 text-muted-foreground mr-2 flex-shrink-0" />
                        <span>2 document analyses only</span>
                      </div>
                      <div className="flex items-center text-sm">
                        <MessageCircle className="w-4 h-4 text-muted-foreground mr-2 flex-shrink-0" />
                        <span>5 research chats only</span>
                      </div>
                      <div className="flex items-center text-sm">
                        <TreePine className="w-4 h-4 text-muted-foreground mr-2 flex-shrink-0" />
                        <span>1 family tree only</span>
                      </div>
                      <div className="flex items-center text-sm">
                        <X className="w-4 h-4 text-muted-foreground mr-2 flex-shrink-0" />
                        <span>No data saving</span>
                      </div>
                      <div className="flex items-center text-sm">
                        <X className="w-4 h-4 text-muted-foreground mr-2 flex-shrink-0" />
                        <span>30-day session expiry</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </>
            ) : (
              <>
                <Card className="border-2 border-primary">
                  <CardHeader className="text-center pb-3">
                    <Badge variant="default" className="w-fit mx-auto mb-2">
                      Recommended
                    </Badge>
                    <CardTitle className="text-xl">Explorer Plan</CardTitle>
                    <CardDescription>$9.99/month - More of everything</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="space-y-2">
                      <div className="flex items-center text-sm">
                        <CheckCircle className="w-4 h-4 text-green-600 mr-2 flex-shrink-0" />
                        <span>10 document analyses/month</span>
                      </div>
                      <div className="flex items-center text-sm">
                        <CheckCircle className="w-4 h-4 text-green-600 mr-2 flex-shrink-0" />
                        <span>Unlimited research chats</span>
                      </div>
                      <div className="flex items-center text-sm">
                        <CheckCircle className="w-4 h-4 text-green-600 mr-2 flex-shrink-0" />
                        <span>3 family trees/month</span>
                      </div>
                      <div className="flex items-center text-sm">
                        <CheckCircle className="w-4 h-4 text-green-600 mr-2 flex-shrink-0" />
                        <span>5 DNA & photo analyses</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="text-center pb-3">
                    <Badge variant="secondary" className="w-fit mx-auto mb-2">
                      Current
                    </Badge>
                    <CardTitle className="text-xl">Free Plan</CardTitle>
                    <CardDescription>Limited monthly usage</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="space-y-2">
                      <div className="flex items-center text-sm">
                        <FileText className="w-4 h-4 text-muted-foreground mr-2 flex-shrink-0" />
                        <span>2 document analyses/month</span>
                      </div>
                      <div className="flex items-center text-sm">
                        <MessageCircle className="w-4 h-4 text-muted-foreground mr-2 flex-shrink-0" />
                        <span>5 research chats/month</span>
                      </div>
                      <div className="flex items-center text-sm">
                        <TreePine className="w-4 h-4 text-muted-foreground mr-2 flex-shrink-0" />
                        <span>1 family tree/month</span>
                      </div>
                      <div className="flex items-center text-sm">
                        <X className="w-4 h-4 text-muted-foreground mr-2 flex-shrink-0" />
                        <span>No DNA/photo analysis</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 pt-4">
            {isAnonymous ? (
              <>
                <Button 
                  size="lg" 
                  className="flex-1" 
                  onClick={onSignUp}
                  asChild
                >
                  <Link href="/register">
                    {showCountdown ? `Sign Up Free (${countdown}s)` : "Sign Up Free"}
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Link>
                </Button>
                
                <Button 
                  variant="outline" 
                  size="lg"
                  className="flex-1"
                  asChild
                >
                  <Link href="/login">
                    Already have account?
                  </Link>
                </Button>
              </>
            ) : (
              <>
                <Button 
                  size="lg" 
                  className="flex-1" 
                  asChild
                >
                  <Link href="/subscription">
                    Upgrade Plan
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Link>
                </Button>
                
                <Button 
                  variant="outline" 
                  size="lg"
                  className="flex-1"
                  onClick={onClose}
                >
                  Continue with Free
                </Button>
              </>
            )}
            
            {trigger !== "limit_reached" && (
              <Button 
                variant="ghost" 
                size="lg"
                onClick={onClose}
                className="sm:w-auto"
              >
                Maybe Later
              </Button>
            )}
          </div>

          {/* Social Proof */}
          <div className="text-center pt-4 border-t">
            <div className="flex items-center justify-center space-x-4 text-sm text-muted-foreground">
              <div className="flex items-center">
                <Users className="w-4 h-4 mr-1" />
                <span>10,000+ families trust us</span>
              </div>
              <div>•</div>
              <div>100% free to start</div>
              {isAnonymous && (
                <>
                  <div>•</div>
                  <div>No credit card required</div>
                </>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}