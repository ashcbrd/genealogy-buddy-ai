"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Home,
  Search,
  ArrowLeft,
  FileText,
  TreePine,
  Dna,
  Camera,
  MessageCircle,
  MapPin,
  Clock,
  Compass,
  Lightbulb,
} from "lucide-react";

export default function NotFound() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");

  // Fun buddy-themed messages that rotate
  const messages = [
    "Your buddy searched everywhere, but this page seems to be hiding...",
    "Even your research buddy couldn't trace this page's location!",
    "This page wandered off the family tree and got lost...",
    "Your buddy thinks this page might have moved to a different address...",
    "Like a mysterious ancestor, this page has vanished without a trace...",
  ];

  const [currentMessage, setCurrentMessage] = useState(messages[0]);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentMessage(messages[Math.floor(Math.random() * messages.length)]);
    }, 4000);

    return () => clearInterval(interval);
  }, []);

  const handleSearch = () => {
    if (searchQuery.trim()) {
      router.push(`/?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const quickLinks = [
    {
      title: "Dashboard",
      description: "View your research progress",
      href: "/dashboard",
      icon: <Home className="w-5 h-5" />,
    },
    {
      title: "AI Tools",
      description: "Explore all genealogy tools",
      href: "/tools",
      icon: <Lightbulb className="w-5 h-5" />,
      badge: "Featured",
    },
    {
      title: "Document Analyzer",
      description: "Analyze historical documents",
      href: "/tools/document-analyzer",
      icon: <FileText className="w-5 h-5" />,
    },
    {
      title: "Family Tree Builder",
      description: "Build your family tree with AI",
      href: "/tools/tree-builder",
      icon: <TreePine className="w-5 h-5" />,
    },
    {
      title: "DNA Interpreter",
      description: "Understand your genetic heritage",
      href: "/tools/dna-interpreter",
      icon: <Dna className="w-5 h-5" />,
    },
    {
      title: "Photo Storyteller",
      description: "Discover stories in old photos",
      href: "/tools/photo-storyteller",
      icon: <Camera className="w-5 h-5" />,
    },
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <div className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <Link href="/" className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-primary-foreground text-lg font-bold">
              🧬
            </div>
            <span className="text-xl font-bold text-foreground">
              Genealogy Buddy AI
            </span>
          </Link>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center py-12 px-4">
        <div className="max-w-4xl w-full text-center">
          {/* 404 Display */}
          <div className="mb-8">
            <div className="text-8xl md:text-9xl font-bold text-primary/20 mb-4">
              404
            </div>
            <div className="flex items-center justify-center gap-2 mb-4">
              <MapPin className="w-5 h-5 text-muted-foreground" />
              <span className="text-xl text-muted-foreground">
                Page Not Found
              </span>
            </div>
          </div>

          {/* Dynamic Message */}
          <div className="mb-8">
            <h1 className="text-2xl md:text-3xl font-bold mb-4 text-foreground">
              Oops! Your Buddy Can't Find This Page
            </h1>
            <p className="text-lg text-muted-foreground mb-6 min-h-[1.5rem] transition-opacity duration-500">
              {currentMessage}
            </p>
            <p className="text-muted-foreground">
              Don't worry though – your buddy loves solving mysteries, and
              getting lost sometimes leads to the best discoveries!
            </p>
          </div>

          {/* Search Bar */}
          <Card className="mb-8 max-w-md mx-auto">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Search className="w-5 h-5" />
                Quick Search
              </CardTitle>
              <CardDescription>
                Looking for something specific? Let us help you find it.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Search for tools, help topics..."
                  className="flex-1 px-3 py-2 border border-border rounded-md bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && handleSearch()}
                />
                <Button onClick={handleSearch} size="sm">
                  <Search className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <div className="mb-8">
            <div className="flex flex-wrap gap-3 justify-center mb-6">
              <Button
                variant="default"
                size="lg"
                className="hover-lift"
                asChild
              >
                <Link href="/">
                  <Home className="mr-2 h-4 w-4" />
                  Go Home
                </Link>
              </Button>
              <Button
                variant="outline"
                size="lg"
                className="hover-lift"
                onClick={() => router.back()}
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Go Back
              </Button>
              <Button
                variant="outline"
                size="lg"
                className="hover-lift"
                asChild
              >
                <Link href="/tools">
                  <Compass className="mr-2 h-4 w-4" />
                  Explore Tools
                </Link>
              </Button>
            </div>
          </div>

          <Separator className="my-8" />

          {/* Popular Destinations */}
          <div className="text-left">
            <h2 className="text-xl font-semibold mb-4 text-center">
              Popular Destinations
            </h2>
            <p className="text-muted-foreground text-center mb-6">
              Here are some places our users love to explore
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {quickLinks.map((link, index) => (
                <Card
                  key={index}
                  className="group hover:shadow-md transition-all duration-200 hover:-translate-y-1"
                >
                  <CardContent className="p-4">
                    <Link href={link.href} className="block">
                      <div className="flex items-start gap-3">
                        <div className="p-2 rounded-lg bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                          {link.icon}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-medium text-foreground group-hover:text-primary transition-colors">
                              {link.title}
                            </h3>
                            {link.badge && (
                              <Badge variant="secondary" className="text-xs">
                                {link.badge}
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {link.description}
                          </p>
                        </div>
                      </div>
                    </Link>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Help Section */}
          <div className="mt-12 pt-8 border-t">
            <div className="flex items-center justify-center gap-2 text-muted-foreground">
              <Clock className="w-4 h-4" />
              <span className="text-sm">
                Still can't find what you're looking for?{" "}
                <Link href="/contact" className="text-primary hover:underline">
                  Contact our support team
                </Link>
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="border-t bg-muted/20 py-6">
        <div className="container mx-auto px-4 text-center">
          <p className="text-sm text-muted-foreground">
            © 2024 Genealogy Buddy AI. All rights reserved. • Your buddy is
            always ready to help discover your family story!
          </p>
        </div>
      </div>
    </div>
  );
}
