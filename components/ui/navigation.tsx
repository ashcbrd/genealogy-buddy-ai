"use client";

import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { useUserStatus, useUsageData } from "@/hooks/use-user-status";
import { AlertTriangle } from "lucide-react";

interface NavigationProps {
  variant?: "landing" | "dashboard";
}

export function Navigation({ variant = "landing" }: NavigationProps) {
  const { data: session } = useSession();
  const { tier, isAuthenticated } = useUserStatus();
  const { data: usageData } = useUsageData();

  // Check if user has any limits reached or near limits
  const hasLimitReached = usageData ? Object.values(usageData.usage).some(
    usage => !usage.unlimited && usage.used >= usage.limit
  ) : false;
  
  const hasWarnings = usageData ? Object.values(usageData.usage).some(
    usage => !usage.unlimited && usage.limit > 0 && (usage.used / usage.limit) >= 0.8
  ) : false;

  return (
    <nav className="sticky top-0 z-50 backdrop-blur-sm bg-background/80 border-b border-border/50">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <Link href="/" className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center text-primary-foreground text-xl font-bold">
              🧬
            </div>
            <span className="text-2xl font-bold text-foreground">
              Genealogy Buddy AI
            </span>
          </Link>

          <div className="flex items-center space-x-4">
            <ThemeToggle />

            {/* Landing Page - No Session */}
            {variant === "landing" && !session && (
              <>
                <Button variant="ghost" asChild>
                  <Link href="/login">Sign In</Link>
                </Button>

                <Button asChild>
                  <Link href="/register">Get Started</Link>
                </Button>
              </>
            )}

            {/* Dashboard Navigation - Both Authenticated and Anonymous */}
            {variant === "dashboard" && (
              <>
                {session && (
                  <Button variant="ghost" asChild>
                    <Link href="/dashboard">Dashboard</Link>
                  </Button>
                )}
                {session && (
                  <Button variant="ghost" asChild>
                    <Link href="/tools">Tools</Link>
                  </Button>
                )}
                {session && (
                  <>
                    <Button variant="ghost" asChild className="relative">
                      <Link href="/subscription" className="flex items-center gap-2">
                        Subscription
                        {hasLimitReached && (
                          <AlertTriangle className="h-4 w-4 text-destructive" />
                        )}
                        {hasWarnings && !hasLimitReached && (
                          <AlertTriangle className="h-4 w-4 text-amber-500" />
                        )}
                        {tier && tier !== 'FREE' && (
                          <Badge variant="secondary" className="ml-1 text-xs">
                            {tier.charAt(0) + tier.slice(1).toLowerCase()}
                          </Badge>
                        )}
                      </Link>
                    </Button>
                    <Button variant="ghost" asChild>
                      <Link href="/profile">Profile</Link>
                    </Button>
                  </>
                )}
                {!session && (
                  <Button variant="default" size="sm" asChild>
                    <Link href="/register">Sign Up Free</Link>
                  </Button>
                )}
              </>
            )}

            {session && (
              <Button
                variant="outline"
                onClick={() => signOut({ callbackUrl: "/" })}
              >
                Sign Out
              </Button>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
