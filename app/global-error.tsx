"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Home, 
  RefreshCw, 
  AlertTriangle,
  FileX,
  MessageCircle,
  Shield
} from "lucide-react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log error to an error reporting service
    console.error("Global error:", error);
  }, [error]);

  const errorMessages = [
    "Your research buddy encountered an unexpected puzzle...",
    "Oops! Your buddy stumbled on something in the digital archives...",
    "Your buddy hit a temporary roadblock while exploring...",
    "Something caught your research buddy off guard...",
  ];

  const randomMessage = errorMessages[Math.floor(Math.random() * errorMessages.length)];

  return (
    <html>
      <body>
        <div className="min-h-screen bg-background flex flex-col">
          {/* Header */}
          <div className="border-b bg-card">
            <div className="container mx-auto px-4 py-4">
              <Link href="/" className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-primary-foreground text-lg font-bold">
                  🧬
                </div>
                <span className="text-xl font-bold text-foreground">Genealogy Buddy AI</span>
              </Link>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1 flex items-center justify-center py-12 px-4">
            <div className="max-w-2xl w-full text-center">
              {/* Error Icon */}
              <div className="mb-8">
                <div className="w-24 h-24 mx-auto mb-6 bg-destructive/10 rounded-full flex items-center justify-center">
                  <AlertTriangle className="w-12 h-12 text-destructive" />
                </div>
              </div>

              {/* Error Message */}
              <div className="mb-8">
                <h1 className="text-2xl md:text-3xl font-bold mb-4 text-foreground">
                  Oops! Something Went Wrong
                </h1>
                <p className="text-lg text-muted-foreground mb-6">
                  {randomMessage}
                </p>
                <p className="text-muted-foreground">
                  Don&apos;t worry – your buddy is already working to figure this out and get back to helping you!
                </p>
              </div>

              {/* Error Details */}
              {process.env.NODE_ENV === "development" && (
                <Alert className="mb-6 text-left">
                  <FileX className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Error Details (Development Mode):</strong>
                    <br />
                    {error.message}
                    {error.digest && (
                      <>
                        <br />
                        <span className="text-xs text-muted-foreground">
                          Error ID: {error.digest}
                        </span>
                      </>
                    )}
                  </AlertDescription>
                </Alert>
              )}

              {/* Action Cards */}
              <div className="grid md:grid-cols-2 gap-4 mb-8">
                <Card className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <RefreshCw className="w-5 h-5" />
                      Try Again
                    </CardTitle>
                    <CardDescription>
                      Sometimes a simple refresh can resolve the issue
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <Button onClick={reset} className="w-full">
                      <RefreshCw className="mr-2 h-4 w-4" />
                      Refresh Page
                    </Button>
                  </CardContent>
                </Card>

                <Card className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Home className="w-5 h-5" />
                      Start Fresh
                    </CardTitle>
                    <CardDescription>
                      Return to the homepage and continue your research
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <Button variant="outline" className="w-full" asChild>
                      <Link href="/">
                        <Home className="mr-2 h-4 w-4" />
                        Go Home
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              </div>

              {/* Additional Actions */}
              <div className="flex flex-wrap gap-3 justify-center mb-8">
                <Button variant="outline" asChild>
                  <Link href="/dashboard">
                    Go to Dashboard
                  </Link>
                </Button>
                <Button variant="outline" asChild>
                  <Link href="/tools">
                    Browse Tools
                  </Link>
                </Button>
                <Button variant="outline" asChild>
                  <Link href="/contact">
                    <MessageCircle className="mr-2 h-4 w-4" />
                    Contact Support
                  </Link>
                </Button>
              </div>

              {/* Security Badge */}
              <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                <Shield className="w-4 h-4" />
                <span>
                  Your data is safe and secure. This error doesn&apos;t affect your research.
                </span>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="border-t bg-muted/20 py-6">
            <div className="container mx-auto px-4 text-center">
              <p className="text-sm text-muted-foreground">
                © 2024 Genealogy Buddy AI. All rights reserved. • Your research buddy is always here to help!
              </p>
            </div>
          </div>
        </div>
      </body>
    </html>
  );
}