"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import type { ReactNode } from "react";

interface ProtectedRouteProps {
  children: ReactNode;
  redirectTo?: string;
  loadingComponent?: ReactNode;
}

export function ProtectedRoute({
  children,
  redirectTo = "/login",
  loadingComponent,
}: ProtectedRouteProps) {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "loading") return; // Still loading

    if (status === "unauthenticated") {
      // Store the current path to redirect back after login
      const currentPath = window.location.pathname;
      const redirectUrl = `${redirectTo}?from=${encodeURIComponent(
        currentPath
      )}`;
      router.push(redirectUrl);
    }
  }, [status, router, redirectTo]);

  // Show loading state
  if (status === "loading") {
    if (loadingComponent) {
      return <>{loadingComponent}</>;
    }

    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto" />
          <p className="mt-4 text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // Show nothing while redirecting
  if (status === "unauthenticated") {
    return null;
  }

  // Render the protected content
  return <>{children}</>;
}

// Higher-order component version for page-level protection
export function withAuth<T extends Record<string, unknown>>(
  Component: React.ComponentType<T>,
  options?: {
    redirectTo?: string;
    loadingComponent?: ReactNode;
  }
) {
  return function AuthenticatedComponent(props: T) {
    return (
      <ProtectedRoute
        redirectTo={options?.redirectTo}
        loadingComponent={options?.loadingComponent}
      >
        <Component {...props} />
      </ProtectedRoute>
    );
  };
}
