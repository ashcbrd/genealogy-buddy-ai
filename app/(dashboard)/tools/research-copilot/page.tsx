"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Send,
  Loader2,
  Bot,
  User,
  Sparkles,
  BookOpen,
  HelpCircle,
  ArrowLeft,
  MessageCircle,
  Info,
  Lightbulb,
  Crown,
  Clock,
  History,
} from "lucide-react";
import Link from "next/link";
import { Footer } from "@/components/footer";
import { UsageInfo } from "@/components/ui/usage-info";
import { ToolUsageIndicator } from "@/components/ui/usage-display";
import { useSimpleAnalysisRefresh } from "@/hooks/use-analysis-with-refresh";
import { getToolErrorMessage } from "@/lib/error-handler";
import { useToolAccess, useUserStatus } from "@/hooks/use-user-status";
import { ChatHistorySidebar } from "@/components/ui/chat-history-sidebar";
import { useChatHistory } from "@/hooks/use-chat-history";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

const EXAMPLE_QUESTIONS = [
  "How do I start researching my Irish ancestors?",
  "What records should I look for to find immigration dates?",
  "How can I break through a brick wall in my research?",
  "What's the best way to organize my genealogy research?",
  "How do I verify genealogical stories and historical accounts?",
  "What DNA test is best for genealogy research?",
];

export default function ResearchCopilotPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);
  const [historyOpen, setHistoryOpen] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  const { refreshUsageAfterAnalysis } = useSimpleAnalysisRefresh();
  const { usage, canUse } = useToolAccess("research");
  const { tier } = useUserStatus();
  const { loadChat } = useChatHistory();
  const isAtUsageLimit = usage && !usage.unlimited && usage.used >= usage.limit;
  const hasNoAccess = !canUse;
  const shouldUpgrade = isAtUsageLimit || hasNoAccess;

  // Check if user has premium research features
  const hasPremiumFeatures =
    tier && ["EXPLORER", "RESEARCHER", "PROFESSIONAL", "ADMIN"].includes(tier);
  const isPremiumMessage = (content: string) => {
    return (
      content.includes("**Direct Answer**") ||
      content.includes("**Research Narrative**") ||
      content.includes("**Trusted Sources**") ||
      content.includes("**Historical Context**")
    );
  };

  const scrollToNewMessage = () => {
    const root = scrollAreaRef.current;
    if (!root) return;

    const viewport = root.querySelector(
      "[data-radix-scroll-area-viewport]"
    ) as HTMLElement | null;
    if (!viewport) return;

    const nodes = viewport.querySelectorAll("[data-message]");
    const last = nodes[nodes.length - 1] as HTMLElement | undefined;

    if (last) {
      const padding = 100;
      const messageTop = last.offsetTop; // HTMLElement has offsetTop
      viewport.scrollTo({
        top: Math.max(0, messageTop - padding),
        behavior: "smooth",
      });
    } else {
      viewport.scrollTo({ top: viewport.scrollHeight, behavior: "smooth" });
    }
  };

  // Initialize with appropriate welcome message based on subscription
  useEffect(() => {
    if (messages.length === 0) {
      const welcomeMessage: Message = {
        id: "1",
        role: "assistant",
        content: hasPremiumFeatures
          ? "Hello! I'm your AI genealogy research assistant, trained on extensive historical records and research methodologies. I provide authoritative guidance on research strategies, record interpretation, and historical analysis. As an Explorer+ subscriber, you have access to guided narratives, detailed historical context, and links to trusted institutional sources. What genealogical challenge can I help you solve today?"
          : "Hello! I'm your AI genealogy research assistant, trained on extensive historical records and research methodologies. I provide authoritative guidance on research strategies, record interpretation, and historical analysis. What genealogical challenge can I help you solve today?",
        timestamp: new Date(),
      };
      setMessages([welcomeMessage]);
    }
  }, [hasPremiumFeatures, messages.length]);

  useEffect(() => {
    scrollToNewMessage();
  }, [messages]);

  const handleSendAction = async () => {
    if (!input.trim() || isLoading) return;

    if (shouldUpgrade) {
      window.location.href = "/subscription";
      return;
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);
    setError("");

    try {
      const res = await fetch("/api/tools/research/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: userMessage.content }),
      });

      const data = await res.json();
      if (!res.ok) {
        const errorMessage = getToolErrorMessage({
          toolType: "research",
          status: res.status,
          error: data.error || new Error("Failed to get response"),
        });
        throw new Error(errorMessage);
      }

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: data.response,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);

      // Refresh usage data immediately after successful analysis
      await refreshUsageAfterAnalysis();
    } catch (err) {
      const errorMessage = getToolErrorMessage({
        toolType: "research",
        error: err,
      });
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendAction();
    }
  };

  const selectExample = (question: string) => {
    setInput(question);
  };

  const clearChat = () => {
    const welcomeMessage: Message = {
      id: "1",
      role: "assistant",
      content: hasPremiumFeatures
        ? "Hello! I'm your AI genealogy research assistant, trained on extensive historical records and research methodologies. I provide authoritative guidance on research strategies, record interpretation, and historical analysis. As an Explorer+ subscriber, you have access to guided narratives, detailed historical context, and links to trusted institutional sources. What genealogical challenge can I help you solve today?"
        : "Hello! I'm your AI genealogy research assistant, trained on extensive historical records and research methodologies. I provide authoritative guidance on research strategies, record interpretation, and historical analysis. What genealogical challenge can I help you solve today?",
      timestamp: new Date(),
    };
    setMessages([welcomeMessage]);
    setCurrentChatId(null);
    setError("");
  };

  const handleChatSelect = async (chatId: string) => {
    const chat = await loadChat(chatId);
    if (chat) {
      setMessages(chat.messages);
      setCurrentChatId(chatId);
      setHistoryOpen(false); // Close sidebar on mobile
    }
  };

  const handleNewChat = () => {
    clearChat();
    setHistoryOpen(false); // Close sidebar on mobile
  };

  return (
    <div className="min-h-screen bg-background relative">
      {/* Chat History Sidebar */}
      <ChatHistorySidebar
        isOpen={historyOpen}
        onToggle={() => setHistoryOpen(!historyOpen)}
        onChatSelect={handleChatSelect}
        onNewChat={handleNewChat}
        currentChatId={currentChatId}
      />

      {/* Main Content */}
      <div
        className={`min-h-screen transition-all duration-300 ease-in-out ${
          historyOpen ? "lg:pl-80" : "pl-0"
        }`}
      >
        <div className="container mx-auto px-4 py-6 md:py-8 max-w-7xl">
          {/* Header */}
          <div className="mb-8 animate-fade-in">
            <div className="flex items-center gap-4 mb-4">
              <Button
                variant="outline"
                size="sm"
                className="hover-lift"
                asChild
              >
                <Link href="/tools">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Tools
                </Link>
              </Button>
              <Badge variant="secondary" className="gap-1">
                <MessageCircle className="h-3.5 w-3.5" />
                AI Research
              </Badge>
            </div>
            <div className="flex items-center gap-4 mb-3">
              <div className="w-12 h-12 bg-cyan-500/10 rounded-xl flex items-center justify-center">
                <MessageCircle className="w-6 h-6 text-cyan-600" />
              </div>
              <div className="flex-1">
                <h1 className="text-3xl md:text-4xl font-bold text-foreground">
                  Research Copilot
                </h1>
                <p className="text-lg text-muted-foreground mt-1">
                  Get intelligent, authoritative guidance for your genealogy
                  research
                </p>
              </div>
              <div className="hidden sm:block">
                <ToolUsageIndicator tool="research" />
              </div>
            </div>
          </div>

          <UsageInfo tool="research" />

          {error && (
            <Alert variant="destructive" className="mb-6 animate-slide-up">
              <Info className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="grid gap-8 lg:grid-cols-4">
            {/* Chat Section */}
            <div className="lg:col-span-3">
              <Card
                variant="elevated"
                className="h-[calc(100vh-280px)] min-h-[600px] max-h-[800px] flex flex-col animate-slide-up"
              >
                <CardHeader className="flex-shrink-0 border-b">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-xl">
                        AI Research Assistant
                      </CardTitle>
                      <CardDescription>
                        Ask questions about genealogy research methods and best
                        practices
                      </CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="hover-lift hidden lg:flex"
                        onClick={() => setHistoryOpen(!historyOpen)}
                      >
                        <History className="h-4 w-4 mr-2" />
                        {historyOpen ? "Hide" : "Show"} History
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={clearChat}
                        className="hover-lift"
                      >
                        Clear Chat
                      </Button>
                    </div>
                  </div>
                </CardHeader>

                {/* Messages */}
                <CardContent className="flex-1 flex flex-col p-0 overflow-hidden relative">
                  <ScrollArea className="flex-1 h-0" ref={scrollAreaRef}>
                    <div className="space-y-6 p-6 pb-32">
                      {messages.length === 0 && (
                        <div className="flex flex-col items-center justify-center py-12 text-center">
                          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                            <MessageCircle className="w-8 h-8 text-primary" />
                          </div>
                          <h3 className="text-lg font-medium mb-2">
                            Start a conversation
                          </h3>
                          <p className="text-muted-foreground max-w-sm">
                            Ask me anything about genealogy research, sources,
                            methods, or strategies.
                          </p>
                        </div>
                      )}

                      {messages.map((message) => (
                        <div
                          key={message.id}
                          data-message
                          className={`flex items-start gap-3 ${
                            message.role === "user" ? "flex-row-reverse" : ""
                          }`}
                        >
                          <Avatar className="w-8 h-8 flex-shrink-0">
                            <AvatarFallback
                              className={`text-xs ${
                                message.role === "assistant"
                                  ? "bg-primary/10 text-primary"
                                  : "bg-muted text-muted-foreground"
                              }`}
                            >
                              {message.role === "assistant" ? (
                                <Bot className="w-4 h-4" />
                              ) : (
                                <User className="w-4 w-4" />
                              )}
                            </AvatarFallback>
                          </Avatar>
                          <div
                            className={`max-w-[85%] rounded-lg px-4 py-3 relative overflow-hidden ${
                              message.role === "user"
                                ? "bg-primary text-primary-foreground ml-12"
                                : message.role === "assistant" &&
                                  isPremiumMessage(message.content) &&
                                  hasPremiumFeatures
                                ? "bg-gradient-to-br from-purple-50/80 to-blue-50/80 border border-purple-200/60 backdrop-blur-sm text-foreground mr-12 shadow-lg"
                                : "bg-muted/50 text-foreground mr-12"
                            }`}
                          >
                            {/* Premium badge for assistant messages */}
                            {message.role === "assistant" &&
                              isPremiumMessage(message.content) &&
                              hasPremiumFeatures && (
                                <div className="absolute -top-2 -right-2 z-10">
                                  <Badge className="bg-gradient-to-r from-purple-600 to-blue-600 text-white text-xs px-2 py-1 shadow-md">
                                    <Crown className="w-3 h-3 mr-1" />
                                    Premium
                                  </Badge>
                                </div>
                              )}

                            {/* Premium glow effect */}
                            {message.role === "assistant" &&
                              isPremiumMessage(message.content) &&
                              hasPremiumFeatures && (
                                <div className="absolute inset-0 bg-gradient-to-r from-purple-100/20 to-blue-100/20 rounded-lg pointer-events-none" />
                              )}

                            <div className="text-sm relative z-10 min-w-0">
                              <RichText content={message.content} />
                            </div>
                            <div className="text-xs opacity-70 mt-2 flex items-center justify-between">
                              <span>
                                {message.timestamp.toLocaleTimeString()}
                              </span>
                              {message.role === "assistant" &&
                                !hasPremiumFeatures && (
                                  <span className="text-muted-foreground">
                                    Upgrade to Explorer+ for guided narratives &
                                    trusted sources
                                  </span>
                                )}
                            </div>
                          </div>
                        </div>
                      ))}

                      {isLoading && (
                        <div data-message className="flex items-start gap-3">
                          <Avatar className="w-8 h-8">
                            <AvatarFallback className="bg-primary/10 text-primary">
                              <Bot className="w-4 h-4" />
                            </AvatarFallback>
                          </Avatar>
                          <div className="bg-muted/50 rounded-lg px-4 py-3 min-w-[200px]">
                            <div className="flex items-center gap-2 justify-center">
                              <Loader2 className="w-4 h-4 animate-spin" />
                              <span className="text-sm text-muted-foreground">
                                Researching your question...
                              </span>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </ScrollArea>

                  {/* Fixed Input at Bottom */}
                  <div className="absolute bottom-0 left-0 right-0 border-t p-4 bg-background/95 backdrop-blur-sm shadow-lg z-50">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 relative">
                        <Input
                          value={input}
                          onChange={(e) => setInput(e.target.value)}
                          onKeyDown={handleKeyPress}
                          placeholder="Ask about genealogy research methods, sources, or strategies..."
                          className="pr-12 transition-colors focus:border-primary/50"
                          disabled={isLoading}
                        />
                      </div>
                      <Button
                        onClick={handleSendAction}
                        disabled={!input.trim() || isLoading}
                        className="hover-lift"
                      >
                        {isLoading ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : shouldUpgrade ? (
                          <Crown className="h-4 w-4" />
                        ) : (
                          <Send className="h-4 w-4" />
                        )}
                        <span className="ml-2 hidden sm:inline">
                          {shouldUpgrade ? "Upgrade" : "Send"}
                        </span>
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              <Card variant="elevated" className="animate-slide-up">
                <CardHeader>
                  <CardTitle className="text-xl flex items-center gap-2">
                    <Lightbulb className="h-5 w-5" />
                    Example Questions
                  </CardTitle>
                  <CardDescription>
                    Click on any question to get started
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {EXAMPLE_QUESTIONS.map((question, index) => (
                    <button
                      key={index}
                      onClick={() => selectExample(question)}
                      className="w-full text-left p-3 rounded-lg border border-border hover:border-primary/50 hover:bg-muted/50 transition-all text-sm hover-lift"
                      disabled={isLoading}
                    >
                      <div className="flex items-start gap-2">
                        <HelpCircle className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                        <span className="text-foreground">{question}</span>
                      </div>
                    </button>
                  ))}
                </CardContent>
              </Card>

              <Card variant="elevated" className="animate-slide-up">
                <CardHeader>
                  <CardTitle className="text-xl flex items-center gap-2">
                    <BookOpen className="h-5 w-5" />
                    Research Tips
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3 text-sm">
                    <div className="flex items-start gap-2">
                      <div className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0" />
                      <p className="text-muted-foreground">
                        Start with what you know and work backward through time
                      </p>
                    </div>
                    <div className="flex items-start gap-2">
                      <div className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0" />
                      <p className="text-muted-foreground">
                        Always verify information with multiple sources
                      </p>
                    </div>
                    <div className="flex items-start gap-2">
                      <div className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0" />
                      <p className="text-muted-foreground">
                        Keep detailed records of your sources and findings
                      </p>
                    </div>
                    <div className="flex items-start gap-2">
                      <div className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0" />
                      <p className="text-muted-foreground">
                        Don&apos;t overlook local historical societies and
                        libraries
                      </p>
                    </div>
                    <div className="flex items-start gap-2">
                      <div className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0" />
                      <p className="text-muted-foreground">
                        Consider alternative spellings and name variations
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card variant="elevated" className="animate-slide-up">
                <CardHeader>
                  <CardTitle className="text-xl flex items-center gap-2">
                    <Sparkles className="h-5 w-5" />
                    AI Capabilities
                    {hasPremiumFeatures && (
                      <Badge className="bg-gradient-to-r from-purple-600 to-blue-600 text-white text-xs">
                        <Crown className="w-3 h-3 mr-1" />
                        Premium
                      </Badge>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <div className="flex items-start gap-2">
                    <Info className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium mb-1">Research Strategy</p>
                      <p className="text-muted-foreground text-xs">
                        Authoritative research plans and methodologies
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <Info className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium mb-1">Record Analysis</p>
                      <p className="text-muted-foreground text-xs">
                        Expert interpretation of historical documents
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <Info className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium mb-1">Historical Context</p>
                      <p className="text-muted-foreground text-xs">
                        Deep understanding of time periods and events
                      </p>
                    </div>
                  </div>

                  {/* Premium Features */}
                  {hasPremiumFeatures ? (
                    <>
                      <div className="flex items-start gap-2">
                        <Crown className="h-4 w-4 text-purple-600 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="font-medium mb-1">Guided Narratives</p>
                          <p className="text-muted-foreground text-xs">
                            Engaging stories that bring research to life
                          </p>
                        </div>
                      </div>
                      <div className="flex items-start gap-2">
                        <Crown className="h-4 w-4 text-purple-600 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="font-medium mb-1">Trusted Sources</p>
                          <p className="text-muted-foreground text-xs">
                            Direct links to institutional archives and databases
                          </p>
                        </div>
                      </div>
                      <div className="flex items-start gap-2">
                        <Crown className="h-4 w-4 text-purple-600 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="font-medium mb-1">Detailed Timelines</p>
                          <p className="text-muted-foreground text-xs">
                            Chronological narratives for ancestor journeys
                          </p>
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="border-t pt-3 mt-3">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Crown className="h-4 w-4" />
                        <span className="text-xs">
                          Upgrade to Explorer+ for guided narratives, trusted
                          sources, and detailed timelines
                        </span>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full mt-2 hover-lift"
                        onClick={() => (window.location.href = "/subscription")}
                      >
                        <Crown className="h-4 w-4 mr-2" />
                        Upgrade Now
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}

// Rich Text Component for rendering formatted messages
function RichText({ content }: { content: string }) {
  // Simple rich text formatter that handles basic markdown-like syntax
  const formatText = (text: string) => {
    const lines = text.split("\n");

    return lines.map((line, index) => {
      const key = `line-${index}`;

      if (line.trim() === "") {
        return <br key={key} />;
      }

      // Handle premium section headers (remove asterisks and style differently)
      if (
        line.match(
          /^\*\*(Direct Answer|Research Narrative|Trusted Sources|Historical Context)\*\*$/
        )
      ) {
        const headerText = line.replace(/\*\*/g, "");
        const getHeaderIcon = (text: string) => {
          switch (text) {
            case "Direct Answer":
              return <BookOpen className="w-4 h-4" />;
            case "Research Narrative":
              return <Sparkles className="w-4 h-4" />;
            case "Trusted Sources":
              return <Crown className="w-4 h-4" />;
            case "Historical Context":
              return <Clock className="w-4 h-4" />;
            default:
              return <Crown className="w-4 h-4" />;
          }
        };
        return (
          <div key={key} className="mt-6 mb-4 first:mt-3">
            <div className="flex items-center gap-2 mb-2">
              <div className="flex items-center justify-center w-6 h-6 rounded-full bg-gradient-to-r from-purple-100 to-blue-100">
                <span className="text-purple-600">
                  {getHeaderIcon(headerText)}
                </span>
              </div>
              <h3 className="font-bold text-base text-purple-900 dark:text-purple-100">
                {headerText}
              </h3>
            </div>
            <div className="h-px bg-gradient-to-r from-purple-200 via-blue-200 to-transparent rounded" />
          </div>
        );
      }

      // Handle regular headers (remove asterisks)
      if (line.startsWith("### ")) {
        const headerText = line.substring(4).replace(/\*\*/g, "");
        // Special styling for Trusted Sources
        if (headerText === "Trusted Sources") {
          return (
            <div key={key} className="mt-4 mb-3 first:mt-0">
              <div className="flex items-center gap-2 mb-2">
                <div className="flex items-center justify-center w-5 h-5 rounded-full bg-gradient-to-r from-blue-100 to-purple-100">
                  <Crown className="w-3 h-3 text-blue-600" />
                </div>
                <h3 className="font-bold text-base text-blue-900 dark:text-blue-100">
                  {headerText}
                </h3>
              </div>
            </div>
          );
        }
        return (
          <h3
            key={key}
            className="font-semibold text-base mt-3 mb-2 first:mt-0"
          >
            {headerText}
          </h3>
        );
      }

      if (line.startsWith("## ")) {
        const headerText = line.substring(3).replace(/\*\*/g, "");
        return (
          <h2 key={key} className="font-semibold text-lg mt-4 mb-2 first:mt-0">
            {headerText}
          </h2>
        );
      }

      if (line.startsWith("# ")) {
        const headerText = line.substring(2).replace(/\*\*/g, "");
        return (
          <h1 key={key} className="font-bold text-xl mt-4 mb-3 first:mt-0">
            {headerText}
          </h1>
        );
      }

      // Handle lists with better formatting for Trusted Sources
      if (line.match(/^\s*[-*]\s/)) {
        const indent = (line.match(/^\s*/) || [""])[0].length;
        const content = line.replace(/^\s*[-*]\s/, "");
        return (
          <div
            key={key}
            className="flex items-start gap-3 my-2 overflow-hidden"
            style={{ marginLeft: `${indent * 8}px` }}
          >
            <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-2 flex-shrink-0" />
            <div className="leading-relaxed min-w-0 flex-1">
              {formatInlineText(content)}
            </div>
          </div>
        );
      }

      // Handle numbered lists
      if (line.match(/^\s*\d+\.\s/)) {
        const indent = (line.match(/^\s*/) || [""])[0].length;
        const match = line.match(/^\s*(\d+)\.\s(.*)$/);
        if (match) {
          const number = match[1];
          const content = match[2];
          return (
            <div
              key={key}
              className="flex items-start gap-2 my-1"
              style={{ marginLeft: `${indent * 8}px` }}
            >
              <span className="text-xs font-medium text-muted-foreground mt-0.5 min-w-[16px]">
                {number}.
              </span>
              <span className="leading-relaxed">
                {formatInlineText(content)}
              </span>
            </div>
          );
        }
      }

      // Handle regular paragraphs
      return (
        <p key={key} className="leading-relaxed mb-2 last:mb-0">
          {formatInlineText(line)}
        </p>
      );
    });
  };

  // Handle inline formatting with clickable links and markdown
  const formatInlineText = (text: string) => {
    // Parse text for markdown links and other components
    const parts: React.ReactNode[] = [];
    let currentIndex = 0;

    // Find all markdown links [text](url)
    const markdownLinkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
    let match;

    // Reset regex lastIndex
    markdownLinkRegex.lastIndex = 0;

    while ((match = markdownLinkRegex.exec(text)) !== null) {
      const [fullMatch, linkText, url] = match;
      const matchStart = match.index;
      const matchEnd = match.index + fullMatch.length;

      // Add text before the link
      if (matchStart > currentIndex) {
        const beforeText = text.substring(currentIndex, matchStart);
        if (beforeText) {
          parts.push(formatNonLinkText(beforeText, parts.length));
        }
      }

      // Add the markdown link
      parts.push(
        <a
          key={parts.length}
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-200 underline underline-offset-2 hover:underline-offset-4 transition-all font-medium"
          onClick={(e) => {
            e.stopPropagation();
          }}
        >
          <span className="break-words">{linkText}</span>
          <svg
            className="w-3 h-3 opacity-60 flex-shrink-0"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
            />
          </svg>
        </a>
      );

      currentIndex = matchEnd;
    }

    // Add any remaining text
    if (currentIndex < text.length) {
      const remainingText = text.substring(currentIndex);
      if (remainingText) {
        parts.push(formatNonLinkText(remainingText, parts.length));
      }
    }

    return <span className="break-words">{parts}</span>;
  };

  // Helper function to format text that doesn't contain markdown links
  const formatNonLinkText = (text: string, key: number) => {
    // Handle raw URLs
    const urlRegex = /(https?:\/\/[^\s<>"{}|\\^`[\]]+)/g;
    const urlParts = text.split(urlRegex);

    return (
      <span key={key}>
        {urlParts.map((part, index) => {
          if (urlRegex.test(part)) {
            return (
              <a
                key={index}
                href={part}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-200 underline underline-offset-2 hover:underline-offset-4 transition-all break-all"
                onClick={(e) => {
                  e.stopPropagation();
                }}
              >
                <span className="break-words">{part}</span>
                <svg
                  className="w-3 h-3 opacity-60 flex-shrink-0"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                  />
                </svg>
              </a>
            );
          }

          // Format other text (bold, italic, etc.)
          let formatted = part.replace(
            /\*\*(.*?)\*\*/g,
            '<strong class="font-semibold">$1</strong>'
          );
          formatted = formatted.replace(
            /\*(.*?)\*/g,
            '<em class="italic">$1</em>'
          );

          return (
            <span
              key={index}
              className="break-words"
              dangerouslySetInnerHTML={{ __html: formatted }}
            />
          );
        })}
      </span>
    );
  };

  return <div className="rich-text">{formatText(content)}</div>;
}
