"use client";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useToolAccess, useUserStatus } from "@/hooks/use-user-status";
import { Crown, Info, AlertTriangle, Lock, ArrowUpRight } from "lucide-react";
import Link from "next/link";

interface UsageInfoProps {
  tool: "documents" | "dna" | "photos" | "research";
}

export function UsageInfo({ tool }: UsageInfoProps) {
  const { tier } = useUserStatus();
  const { usage } = useToolAccess(tool);

  if (!usage) return null;

  const toolNames = {
    documents: "Document Analysis",
    dna: "DNA Analysis",
    photos: "Photo Analysis",
    research: "Research Chat",
  };

  const toolName = toolNames[tool];

  // For unlimited users, show success info
  if (usage.unlimited) {
    return (
      <Alert className="mb-6 border-green-200 bg-green-50/50">
        <Crown className="h-4 w-4 text-green-600" />
        <AlertDescription className="flex items-center justify-between">
          <span className="text-green-800">
            <strong>{toolName}</strong> • Unlimited usage on your {tier} plan
          </span>
          <Badge
            variant="secondary"
            className="text-green-700 border-green-200"
          >
            {tier} Plan
          </Badge>
        </AlertDescription>
      </Alert>
    );
  }

  // For users with no access to this tool
  if (usage.limit === 0) {
    return (
      <Alert className="mb-6 border-amber-200 bg-amber-50/50">
        <Lock className="h-4 w-4 text-amber-600" />
        <AlertDescription className="flex items-center justify-between">
          <div className="text-amber-800">
            <strong>{toolName}</strong> is not available on your {tier} plan.
            You can still explore the interface, but you'll need to upgrade to
            analyze.
          </div>
          <Button size="sm" asChild className="bg-amber-600 hover:bg-amber-700">
            <Link href="/subscription">
              Upgrade Plan
              <ArrowUpRight className="ml-1 h-3 w-3" />
            </Link>
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  // Calculate usage status
  const usagePercentage = usage.used / usage.limit;
  const isAtLimit = usage.used >= usage.limit;
  const isNearLimit = usagePercentage >= 0.8;
  const remaining = usage.limit - usage.used;

  // Usage limit reached
  if (isAtLimit) {
    return (
      <Alert className="mb-6 border-yellow-200 bg-yellow-50/50">
        <AlertDescription className="flex items-center justify-between w-full">
          <div className="text-yellow-800 flex items-center gap-x-2">
            <AlertTriangle className="h-4 w-4 text-yellow-600" />
            <strong>Usage limit reached.</strong> You've used all {usage.limit}{" "}
            {tool} analyses this month. You can still try to analyze, but you'll
            need to upgrade to continue.
          </div>
          <Button size="sm" asChild>
            <Link href="/subscription">
              Upgrade Now
              <ArrowUpRight className="ml-1 h-3 w-3" />
            </Link>
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  // Approaching usage limit
  if (isNearLimit) {
    return (
      <Alert className="mb-6 border-amber-200 bg-amber-50/50">
        <AlertTriangle className="h-4 w-4 text-amber-600" />
        <AlertDescription className="flex items-center justify-between">
          <div className="text-amber-800">
            <strong>Approaching limit.</strong> You have {remaining} {tool}{" "}
            analysis{remaining !== 1 ? "es" : ""} remaining this month.
          </div>
          <div className="flex items-center gap-2">
            <Badge
              variant="outline"
              className="text-amber-700 border-amber-300"
            >
              {usage.used}/{usage.limit} used
            </Badge>
            <Button
              size="sm"
              variant="outline"
              asChild
              className="border-amber-300 text-amber-700 hover:bg-amber-100"
            >
              <Link href="/subscription">
                Upgrade
                <ArrowUpRight className="ml-1 h-3 w-3" />
              </Link>
            </Button>
          </div>
        </AlertDescription>
      </Alert>
    );
  }

  // Normal usage - subtle info
  return (
    <Alert className="mb-6 border-blue-200 bg-blue-50/30">
      <Info className="h-4 w-4 text-blue-600" />
      <AlertDescription className="flex items-center justify-between">
        <div className="text-blue-800">
          <strong>{toolName}</strong> • {usage.used}/{usage.limit} analyses used
          this month
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-blue-700 border-blue-200">
            {tier} Plan
          </Badge>
          <Link
            href="/subscription"
            className="text-sm text-blue-600 hover:text-blue-800 hover:underline"
          >
            View Plans
          </Link>
        </div>
      </AlertDescription>
    </Alert>
  );
}
