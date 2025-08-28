"use client";

import React from "react";
import Link from "next/link";
// import { useSession } from "next-auth/react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Navigation } from "@/components/ui/navigation";
import {
  FileText,
  Dna,
  TreePine,
  MessageCircle,
  Camera,
  ArrowRight,
  Star,
  Clock,
  CheckCircle,
  Sparkles,
  TrendingUp,
} from "lucide-react";
import { SUBSCRIPTION_LIMITS } from "@/types";
import { useUserStatus, useUsageData } from "@/hooks/use-user-status";
import { Footer } from "@/components/footer";


type ToolId =
  | "document-analyzer"
  | "dna-interpreter"
  | "tree-builder"
  | "research-copilot"
  | "photo-storyteller";

interface Tool {
  id: string;
  name: string;
  description: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  tone: string;
  features: string[];
  href: string;
  popular?: boolean;
  new?: boolean;
}

/** Tools config */
const TOOLS: Tool[] = [
  {
    id: "document-analyzer",
    name: "Document Analyzer",
    description:
      "Extract names, dates, places, and relationships from historical documents using AI-powered OCR and analysis",
    icon: FileText,
    tone: "docs" as const,
    features: [
      "OCR text extraction",
      "Name and date recognition",
      "Relationship mapping",
      "Confidence scoring",
      "Research suggestions",
    ],
    href: "/tools/document-analyzer",
    popular: true,
  },
  {
    id: "dna-interpreter",
    name: "DNA & Heritage Interpreter",
    description:
      "Understand your genetic heritage with plain-language explanations and historical migration patterns",
    icon: Dna,
    tone: "dna" as const,
    features: [
      "Ethnicity breakdown",
      "Migration patterns",
      "Haplogroup analysis",
      "DNA match interpretation",
      "Historical context",
    ],
    href: "/tools/dna-interpreter",
  },
  {
    id: "tree-builder",
    name: "Smart Family Tree Builder",
    description:
      "Build comprehensive family trees with AI suggestions for probable connections and missing links",
    icon: TreePine,
    tone: "trees" as const,
    features: [
      "AI-powered suggestions",
      "Relationship validation",
      "GEDCOM export",
      "Visual tree builder",
      "Probability scoring",
    ],
    href: "/tools/tree-builder",
    popular: true,
  },
  {
    id: "research-copilot",
    name: "AI Research Copilot",
    description:
      "Get expert genealogy guidance and research strategies from your AI assistant",
    icon: MessageCircle,
    tone: "research" as const,
    features: [
      "Research strategies",
      "Record interpretation",
      "Historical context",
      "Next steps guidance",
      "Methodology education",
    ],
    href: "/tools/research-copilot",
  },
  {
    id: "photo-storyteller",
    name: "Photo Enhancer & Storyteller",
    description:
      "Analyze historical photos for time periods, contexts, and create engaging family narratives",
    icon: Camera,
    tone: "photos" as const,
    features: [
      "Date estimation",
      "Clothing analysis",
      "Historical context",
      "Story generation",
      "Location clues",
    ],
    href: "/tools/photo-storyteller",
    new: true,
  },
] as const;

/** map tool tone → CSS tokens (no dynamic Tailwind classes) */
const TONE = {
  docs: {
    ring: "var(--chart-1)",
    wash: "color-mix(in oklab, var(--chart-1) 16%, transparent)",
  },
  dna: {
    ring: "var(--lineage-dna)",
    wash: "color-mix(in oklab, var(--lineage-dna) 16%, transparent)",
  },
  trees: {
    ring: "var(--lineage-birth)",
    wash: "color-mix(in oklab, var(--lineage-birth) 16%, transparent)",
  },
  photos: {
    ring: "var(--chart-3)",
    wash: "color-mix(in oklab, var(--chart-3) 16%, transparent)",
  },
  research: {
    ring: "var(--chart-4)",
    wash: "color-mix(in oklab, var(--chart-4) 16%, transparent)",
  },
} as const;


export default function ToolsPage() {
  const { isAnonymous, isAuthenticated, tier } = useUserStatus();
  const { data: usageData } = useUsageData();

  /** Limits for current tier */
  const getTierLimits = () => {
    return SUBSCRIPTION_LIMITS[tier] ?? SUBSCRIPTION_LIMITS.FREE;
  };

  /** All tools are accessible - API will handle restrictions */
  const getToolAccess = () => {
    // All tools are accessible for both anonymous and authenticated users
    // The API will handle access control when tools are actually used
    return true;
  };

  /** Get usage info from our usage data hook */
  const getUsageInfo = (toolId: ToolId) => {
    if (!usageData) return null;

    const toolKeyMap = {
      "document-analyzer": "documents",
      "dna-interpreter": "dna", 
      "tree-builder": "trees",
      "research-copilot": "research",
      "photo-storyteller": "photos",
    } as const;

    const key = toolKeyMap[toolId];
    const usage = usageData.usage[key];

    return {
      used: usage.used,
      limit: usage.unlimited ? -1 : usage.limit,
      unlimited: usage.unlimited,
      lastUsed: "Recently", // We don't have lastUsed in our current data structure
    };
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
              Please log in to access your genealogy tools and saved research.
            </p>
            <div className="flex gap-4 justify-center">
              <Link href="/login">
                <Button size="lg">
                  Log In
                </Button>
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

  // Show loading if we're waiting for usage data
  if (isAuthenticated && !usageData) {
    return (
      <div className="flex items-center justify-center h-[70vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto" />
          <p className="mt-4 text-muted-foreground">Loading tools…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation variant="dashboard" />
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-3xl font-bold">Your Buddy&apos;s Toolbox</h1>
          </div>
          <p className="text-muted-foreground">
            Ready to explore? Your research buddy has powerful tools to help uncover your family story!
          </p>
        </div>


        {/* Tools Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {TOOLS.map((tool) => {
            const toolId = tool.id as ToolId;
            const hasAccess = getToolAccess();
            const usage = getUsageInfo(toolId);

            const limit = usage?.limit ?? 0;
            const used = usage?.used ?? 0;
            const unlimited = usage?.unlimited ?? false;
            // Usage tracking for potential future use
            const _atLimit =
              hasAccess &&
              !unlimited &&
              typeof limit === "number" &&
              limit > 0 &&
              used >= limit;

            const tone = TONE[tool.tone as keyof typeof TONE];

            return (
              <Card key={tool.id} className="relative overflow-hidden">
                {/* ribbons */}
                {(tool.popular || tool.new) && (
                  <div className="absolute top-2 right-2 flex gap-2">
                    {tool.popular && (
                      <Badge variant="secondary">
                        <Star className="w-3 h-3 mr-1" /> Popular
                      </Badge>
                    )}
                    {tool.new && (
                      <Badge variant="secondary">
                        <Sparkles className="w-3 h-3 mr-1" /> New
                      </Badge>
                    )}
                  </div>
                )}

                <CardHeader className="pb-3">
                  <div
                    className="inline-flex p-3 rounded-lg border w-max"
                    style={{
                      borderColor: "var(--border)",
                      background: tone.wash,
                    }}
                  >
                    <tool.icon
                      className="w-6 h-6"
                      style={{ color: tone.ring }}
                    />
                  </div>

                  <div className="mt-4 flex items-center gap-2">
                    <CardTitle className="text-xl">{tool.name}</CardTitle>
                    <Badge
                      variant="outline"
                      className="text-foreground/70 min-w-max"
                    >
                      {unlimited ? "Unlimited" : 
                       typeof limit === 'number' && limit === 0 ? "Requires Upgrade" :
                       `${limit} Monthly`}
                    </Badge>
                  </div>

                  <CardDescription>{tool.description}</CardDescription>
                </CardHeader>

                <CardContent className="space-y-5">
                  {/* Key features */}
                  <ul className="space-y-1">
                    {tool.features.slice(0, 3).map((feature, i) => (
                      <li key={i} className="flex items-center gap-2 text-sm">
                        <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400 flex-shrink-0" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>

                  {/* Usage */}
                  {usage && (
                    <div className="pt-3 border-t">
                      <div className="flex justify-between items-center text-sm mb-2">
                        <span className="text-muted-foreground">
                          Monthly Usage
                        </span>
                        <span className="font-medium">
                          {unlimited
                            ? "Unlimited"
                            : limit === 0
                            ? "Requires Upgrade"
                            : `${used} / ${limit}`}
                        </span>
                      </div>


                      {/* last used */}
                      {usage.lastUsed && usage.lastUsed !== "Never" && (
                        <div className="flex items-center gap-1 text-xs text-muted-foreground mt-2">
                          <Clock className="w-3 h-3" />
                          Last used:{" "}
                          {new Date(usage.lastUsed).toLocaleDateString()}
                        </div>
                      )}
                    </div>
                  )}

                  {/* CTA */}
                  <div className="pt-1">
                    <Link href={tool.href}>
                      <Button className="w-full">
                        Open Tool
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    </Link>
                  </div>
                </CardContent>

                {/* subtle vignette */}
                <div
                  className="pointer-events-none absolute inset-0"
                  style={{
                    background:
                      "radial-gradient(700px 200px at 110% -20%, color-mix(in oklab, var(--ring) 12%, transparent), transparent 70%)",
                  }}
                />
              </Card>
            );
          })}
        </div>

        {/* Bottom CTA */}
        <Card
          className="mt-8 border-primary/20"
          style={{
            background:
              "linear-gradient(90deg, color-mix(in oklab, var(--primary) 10%, transparent), color-mix(in oklab, var(--lineage-dna) 10%, transparent))",
          }}
        >
          <CardContent className="p-8">
            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
              <div>
                <h3 className="text-2xl font-semibold mb-2">
                  Unlock All Tools
                </h3>
                <p className="text-muted-foreground">
                  Get unlimited access to every AI genealogy workflow with the
                  Professional plan.
                </p>
              </div>
              <Link href="/subscription">
                <Button size="lg" className="whitespace-nowrap">
                  <TrendingUp className="mr-2 h-5 w-5" />
                  Upgrade Now
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
      <Footer />
    </div>
  );
}
