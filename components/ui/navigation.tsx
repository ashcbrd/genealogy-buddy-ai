"use client";

import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { useSession, signOut } from "next-auth/react";

interface NavigationProps {
  variant?: "landing" | "dashboard";
}

export function Navigation({ variant = "landing" }: NavigationProps) {
  const { data: session } = useSession();

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
            
            {/* Anonymous User Indicator */}
            {!session && variant === "dashboard" && (
              <Badge variant="secondary" className="hidden sm:flex">
                Free Trial
              </Badge>
            )}
            
            {/* Landing Page - No Session */}
            {variant === "landing" && !session && (
              <>
                <Button variant="ghost" asChild>
                  <Link href="/tools">Try Tools</Link>
                </Button>
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
                <Button variant="ghost" asChild>
                  <Link href="/tools">Tools</Link>
                </Button>
                {session && (
                  <>
                    <Button variant="ghost" asChild>
                      <Link href="/subscription">Subscription</Link>
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
