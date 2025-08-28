"use client";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToolAccess, useUserStatus, useUsageData } from "@/hooks/use-user-status";
import { AlertTriangle, Crown, Loader2, ArrowUpRight, Shield, Clock } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";

interface UsageGuardProps {
  tool: 'documents' | 'dna' | 'photos' | 'research' | 'trees';
  children: ReactNode;
  fallback?: ReactNode;
}

export function UsageGuard({ tool, children, fallback }: UsageGuardProps) {
  const { isAuthenticated, isLoading, securityValidated, tier } = useUserStatus();
  const { canUse, reason, usage, securityCheck, upgradeRequired } = useToolAccess(tool);
  const { error: usageError, isLoading: usageLoading } = useUsageData();

  // Show loading state
  if (isLoading || !isAuthenticated || !securityValidated || usageLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin" />
          <p className="text-sm text-muted-foreground">
            {!isAuthenticated ? 'Please sign in to continue' : 
             !securityValidated ? 'Validating security...' :
             'Loading usage data...'}
          </p>
        </div>
      </div>
    );
  }
  
  // Show usage data error if available
  if (usageError) {
    return (
      <Card className="mx-auto max-w-2xl">
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 bg-destructive/10 rounded-full flex items-center justify-center mb-4">
            <AlertTriangle className="h-6 w-6 text-destructive" />
          </div>
          <CardTitle>Unable to Load Usage Data</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-center">
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Connection Error</AlertTitle>
            <AlertDescription className="mt-2">
              {usageError}
            </AlertDescription>
          </Alert>
          <div className="space-y-3">
            <Button onClick={() => window.location.reload()} size="lg" className="w-full">
              <ArrowUpRight className="mr-2 h-4 w-4" />
              Retry
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // If user can use the tool, render children
  if (canUse) {
    return <>{children}</>;
  }

  // If custom fallback provided, use it
  if (fallback) {
    return <>{fallback}</>;
  }

  // Default restriction UI
  const toolNames = {
    documents: 'Document Analysis',
    dna: 'DNA Analysis', 
    photos: 'Photo Analysis',
    research: 'Research Chat',
    trees: 'Family Tree Builder',
  };

  const isUpgradeNeeded = usage?.limit === 0 || upgradeRequired;
  const isLimitReached = usage && !usage.unlimited && usage.used >= usage.limit;
  const hasSecurityIssue = !securityCheck;

  return (
    <Card className="mx-auto max-w-2xl">
      <CardHeader className="text-center">
        <div className={`mx-auto w-12 h-12 rounded-full flex items-center justify-center mb-4 ${
          hasSecurityIssue ? 'bg-yellow-100' :
          isUpgradeNeeded ? 'bg-blue-100' : 
          'bg-orange-100'
        }`}>
          {hasSecurityIssue ? <Shield className="h-6 w-6 text-yellow-600" /> :
           isUpgradeNeeded ? <Crown className="h-6 w-6 text-blue-600" /> :
           <Clock className="h-6 w-6 text-orange-600" />}
        </div>
        <CardTitle>
          {hasSecurityIssue ? 'Security Validation Required' :
           isUpgradeNeeded ? `${toolNames[tool]} Not Available` : 
           'Usage Limit Reached'}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 text-center">
        <Alert variant={hasSecurityIssue ? "destructive" : isUpgradeNeeded ? "default" : "default"}>
          {hasSecurityIssue ? <Shield className="h-4 w-4" /> :
           isUpgradeNeeded ? <Crown className="h-4 w-4" /> :
           <AlertTriangle className="h-4 w-4" />}
          <AlertTitle>
            {hasSecurityIssue ? 'Security Check Failed' :
             isUpgradeNeeded ? 'Plan Upgrade Required' :
             'Access Restricted'}
          </AlertTitle>
          <AlertDescription className="mt-2">
            {reason}
            {tier && (
              <div className="mt-2 text-xs">
                Current plan: <span className="font-medium">{tier}</span>
              </div>
            )}
          </AlertDescription>
        </Alert>

        {usage && (
          <div className="bg-muted/50 rounded-lg p-4">
            <div className="text-sm text-muted-foreground mb-2">Current Usage</div>
            <div className="text-2xl font-bold">
              {usage.used} / {usage.unlimited ? '∞' : usage.limit}
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              {usage.unlimited ? 'Unlimited usage' : 'Monthly limit'}
            </div>
          </div>
        )}

        <div className="space-y-3">
          {hasSecurityIssue ? (
            <Button onClick={() => window.location.reload()} size="lg" className="w-full">
              <Shield className="mr-2 h-4 w-4" />
              Retry Security Check
              <ArrowUpRight className="ml-2 h-4 w-4" />
            </Button>
          ) : (
            <Button asChild size="lg" className="w-full">
              <Link href="/subscription">
                <Crown className="mr-2 h-4 w-4" />
                {isUpgradeNeeded ? 'Upgrade Your Plan' : 'Upgrade for More Usage'}
                <ArrowUpRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          )}

          {isLimitReached && !hasSecurityIssue && (
            <p className="text-sm text-muted-foreground">
              Your usage will reset at the beginning of next month, or you can upgrade now for immediate access.
            </p>
          )}
          
          {hasSecurityIssue && (
            <p className="text-sm text-muted-foreground">
              If this issue persists, please contact support for assistance.
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

interface UsageWarningProps {
  tool: 'documents' | 'dna' | 'photos' | 'research' | 'trees';
  threshold?: number; // Warning threshold (default 0.8 = 80%)
}

export function UsageWarning({ tool, threshold = 0.8 }: UsageWarningProps) {
  const { canUse, usage } = useToolAccess(tool);

  if (!usage) return null;

  // Show info for all users, not just those approaching limits
  const usagePercentage = usage.unlimited ? 0 : (usage.limit > 0 ? usage.used / usage.limit : 0);
  const isAtLimit = !usage.unlimited && usage.used >= usage.limit;
  const isNearLimit = !usage.unlimited && usage.limit > 0 && usagePercentage >= threshold;

  // Don't show anything if unlimited
  if (usage.unlimited) return null;

  // For users who have reached limit or are approaching it
  if (isAtLimit || isNearLimit) {
    const remaining = usage.limit - usage.used;
    
    return (
      <Alert variant={isAtLimit ? "destructive" : "default"} className="mb-6">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>
          {isAtLimit ? 'Usage Limit Reached' : 'Approaching Usage Limit'}
        </AlertTitle>
        <AlertDescription>
          {isAtLimit ? (
            <>
              You have used all {usage.limit} {tool} analyses for this month. 
              You can still try to analyze, but you'll need to upgrade to continue. 
            </>
          ) : (
            <>
              You have {remaining} {tool} analysis{remaining !== 1 ? 'es' : ''} remaining this month. 
            </>
          )}
          {' '}
          <Link href="/subscription" className="font-medium underline underline-offset-4 hover:no-underline">
            Upgrade your plan
          </Link>
          {' '}for unlimited access.
        </AlertDescription>
      </Alert>
    );
  }

  // For users with available usage, show a subtle info message
  if (usage.limit > 0) {
    return (
      <div className="mb-4 text-sm text-muted-foreground bg-muted/30 rounded-lg px-3 py-2">
        Usage: {usage.used}/{usage.limit} {tool} analyses this month
        {' · '}
        <Link href="/subscription" className="hover:underline">
          View plans
        </Link>
      </div>
    );
  }

  return null;
}