"use client";

import { Progress } from "@/components/ui/progress";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { useUsageData, useUserStatus } from "@/hooks/use-user-status";
import {
  AlertTriangle,
  Crown,
  Zap,
  Shield,
  Users,
  ArrowUpRight,
  Clock,
} from "lucide-react";
import Link from "next/link";

interface ToolUsageBarProps {
  label: string;
  used: number;
  limit: number;
  unlimited: boolean;
  icon?: React.ReactNode;
}

function ToolUsageBar({
  label,
  used,
  limit,
  unlimited,
  icon,
}: ToolUsageBarProps) {
  if (unlimited) {
    return (
      <div className="flex items-center justify-between py-2">
        <div className="flex items-center gap-2">
          {icon}
          <span className="text-sm font-medium">{label}</span>
        </div>
        <Badge variant="secondary" className="text-xs">
          {used} / Unlimited
        </Badge>
      </div>
    );
  }

  const percentage = limit > 0 ? (used / limit) * 100 : 0;
  const isNearLimit = percentage >= 80;
  const isAtLimit = used >= limit;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {icon}
          <span className="text-sm font-medium">{label}</span>
        </div>
        <div className="flex items-center gap-2">
          {isAtLimit && <AlertTriangle className="h-4 w-4 text-destructive" />}
          <span
            className={`text-sm ${
              isAtLimit
                ? "text-destructive"
                : isNearLimit
                ? "text-amber-600"
                : ""
            }`}
          >
            {used} / {limit}
          </span>
        </div>
      </div>
      <Progress
        value={percentage}
        className={`h-2 ${
          isAtLimit
            ? "[&>*]:bg-destructive"
            : isNearLimit
            ? "[&>*]:bg-amber-500"
            : ""
        }`}
      />
    </div>
  );
}

export function UsageDisplay() {
  const { data: usageData } = useUsageData();
  const { tier, isLoading } = useUserStatus();

  if (isLoading || !usageData) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Loading Usage...
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-4 bg-muted animate-pulse rounded" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const tierIcons = {
    FREE: <Users className="h-4 w-4" />,
    EXPLORER: <Zap className="h-4 w-4" />,
    RESEARCHER: <Shield className="h-4 w-4" />,
    PROFESSIONAL: <Crown className="h-4 w-4" />,
    ADMIN: <Crown className="h-4 w-4" />,
  };

  const tierColors = {
    FREE: "secondary",
    EXPLORER: "default",
    RESEARCHER: "default",
    PROFESSIONAL: "default",
    ADMIN: "default",
  } as const;

  const hasLimitsReached = Object.values(usageData.usage).some(
    (usage) => !usage.unlimited && usage.used >= usage.limit
  );

  const hasWarnings = Object.values(usageData.usage).some(
    (usage) =>
      !usage.unlimited && usage.limit > 0 && usage.used / usage.limit >= 0.8
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {tierIcons[tier]}
            Monthly Usage
          </div>
          <Badge variant={tierColors[tier]}>
            {tier.charAt(0) + tier.slice(1).toLowerCase()}
          </Badge>
        </CardTitle>
        <CardDescription>
          Track your tool usage for this billing period
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {hasLimitsReached && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              You've reached your monthly limit for some tools. Upgrade your
              plan to continue using all features.
            </AlertDescription>
          </Alert>
        )}

        {hasWarnings && !hasLimitsReached && (
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              You're approaching your monthly limits. Consider upgrading to
              avoid interruptions.
            </AlertDescription>
          </Alert>
        )}

        <div className="space-y-4">
          <ToolUsageBar
            label="Documents"
            used={usageData.usage.documents.used}
            limit={usageData.usage.documents.limit}
            unlimited={usageData.usage.documents.unlimited}
            icon={<div className="h-4 w-4 rounded bg-blue-500" />}
          />

          <ToolUsageBar
            label="DNA Analysis"
            used={usageData.usage.dna.used}
            limit={usageData.usage.dna.limit}
            unlimited={usageData.usage.dna.unlimited}
            icon={<div className="h-4 w-4 rounded bg-green-500" />}
          />

          <ToolUsageBar
            label="Photos"
            used={usageData.usage.photos.used}
            limit={usageData.usage.photos.limit}
            unlimited={usageData.usage.photos.unlimited}
            icon={<div className="h-4 w-4 rounded bg-purple-500" />}
          />

          <ToolUsageBar
            label="Research"
            used={usageData.usage.research.used}
            limit={usageData.usage.research.limit}
            unlimited={usageData.usage.research.unlimited}
            icon={<div className="h-4 w-4 rounded bg-orange-500" />}
          />

        </div>

        {tier === "FREE" && (
          <div className="pt-4 border-t">
            <Button asChild className="w-full">
              <Link href="/subscription">
                <Crown className="mr-2 h-4 w-4" />
                Upgrade Plan
                <ArrowUpRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        )}

        <div className="text-xs text-muted-foreground text-center">
          Usage resets on {new Date(usageData.periodEnd).toLocaleDateString()}
        </div>
      </CardContent>
    </Card>
  );
}

interface ToolUsageIndicatorProps {
  tool: "documents" | "dna" | "photos" | "research";
  showLabel?: boolean;
}

export function ToolUsageIndicator({
  tool,
  showLabel = true,
}: ToolUsageIndicatorProps) {
  const { data: usageData } = useUsageData();

  if (!usageData) return null;

  const usage = usageData.usage[tool];
  const isAtLimit = !usage.unlimited && usage.used >= usage.limit;
  const isNearLimit =
    !usage.unlimited && usage.limit > 0 && usage.used / usage.limit >= 0.8;

  const toolLabels = {
    documents: "Documents",
    dna: "DNA",
    photos: "Photos",
    research: "Research",
  };

  if (usage.unlimited) {
    return showLabel ? (
      <Badge variant="secondary" className="text-xs">
        {toolLabels[tool]}: Unlimited
      </Badge>
    ) : (
      <Badge variant="secondary" className="px-2 py-1">
        ∞
      </Badge>
    );
  }

  return (
    <Badge
      variant={
        isAtLimit ? "destructive" : isNearLimit ? "outline" : "secondary"
      }
      className="text-xs text-white"
    >
      {showLabel && `${toolLabels[tool]}: `}
      {usage.used}/{usage.limit}
      {isAtLimit && " (Limit Reached)"}
    </Badge>
  );
}
