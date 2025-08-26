"use client";

import { useState, useRef, useEffect } from "react";
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
} from "lucide-react";
import Link from "next/link";
import { Footer } from "@/components/footer";

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
  "How do I verify family stories and legends?",
  "What DNA test is best for genealogy research?",
];

export default function ResearchCopilotPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      role: "assistant",
      content:
        "Hello! I'm your AI genealogy research assistant. I can help you with research strategies, record interpretation, historical context, and methodology. What would you like to explore today?",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    if (scrollAreaRef.current) {
      const scrollContainer = scrollAreaRef.current.querySelector(
        "[data-radix-scroll-area-viewport]"
      );
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight;
      }
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

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
      const res = await fetch("/api/tools/research", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: userMessage.content }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to get response");

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: data.response,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send message");
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const selectExample = (question: string) => {
    setInput(question);
  };

  const clearChat = () => {
    setMessages([
      {
        id: "1",
        role: "assistant",
        content:
          "Hello! I'm your AI genealogy research assistant. I can help you with research strategies, record interpretation, historical context, and methodology. What would you like to explore today?",
        timestamp: new Date(),
      },
    ]);
    setError("");
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-6 md:py-8 max-w-7xl">
        {/* Header */}
        <div className="mb-8 animate-fade-in">
          <div className="flex items-center gap-4 mb-4">
            <Button variant="outline" size="sm" className="hover-lift" asChild>
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
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-foreground">
                Research Copilot
              </h1>
              <p className="text-lg text-muted-foreground mt-1">
                Get expert guidance for your genealogy research journey
              </p>
            </div>
          </div>
        </div>

        {error && (
          <Alert className="mb-6 animate-slide-up">
            <Info className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="grid gap-8 lg:grid-cols-4">
          {/* Chat Section */}
          <div className="lg:col-span-3">
            <Card
              variant="elevated"
              className="h-[600px] flex flex-col animate-slide-up"
            >
              <CardHeader className="flex-shrink-0">
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
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={clearChat}
                    className="hover-lift"
                  >
                    Clear Chat
                  </Button>
                </div>
              </CardHeader>

              {/* Messages */}
              <CardContent className="flex-1 flex flex-col p-0">
                <ScrollArea className="flex-1 px-6" ref={scrollAreaRef}>
                  <div className="space-y-6 py-4">
                    {messages.map((message) => (
                      <div
                        key={message.id}
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
                              <User className="w-4 h-4" />
                            )}
                          </AvatarFallback>
                        </Avatar>
                        <div
                          className={`max-w-[80%] rounded-lg px-4 py-3 ${
                            message.role === "user"
                              ? "bg-primary text-primary-foreground ml-12"
                              : "bg-muted/50 text-foreground mr-12"
                          }`}
                        >
                          <div className="text-sm whitespace-pre-wrap">
                            {message.content}
                          </div>
                          <div className="text-xs opacity-70 mt-2">
                            {message.timestamp.toLocaleTimeString()}
                          </div>
                        </div>
                      </div>
                    ))}

                    {isLoading && (
                      <div className="flex items-start gap-3">
                        <Avatar className="w-8 h-8">
                          <AvatarFallback className="bg-primary/10 text-primary">
                            <Bot className="w-4 h-4" />
                          </AvatarFallback>
                        </Avatar>
                        <div className="bg-muted/50 rounded-lg px-4 py-3">
                          <div className="flex items-center gap-2">
                            <Loader2 className="w-4 h-4 animate-spin" />
                            <span className="text-sm text-muted-foreground">
                              Thinking...
                            </span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </ScrollArea>

                {/* Input */}
                <div className="border-t p-4">
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
                      onClick={sendMessage}
                      disabled={!input.trim() || isLoading}
                      className="hover-lift"
                    >
                      {isLoading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Send className="h-4 w-4" />
                      )}
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
                      Don&apos;t overlook local historical societies and libraries
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
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex items-start gap-2">
                  <Info className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium mb-1">Research Strategy</p>
                    <p className="text-muted-foreground text-xs">
                      Get personalized research plans and methodologies
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <Info className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium mb-1">Record Analysis</p>
                    <p className="text-muted-foreground text-xs">
                      Help interpreting historical documents and records
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <Info className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium mb-1">Historical Context</p>
                    <p className="text-muted-foreground text-xs">
                      Understanding time periods and historical events
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <Info className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium mb-1">Source Guidance</p>
                    <p className="text-muted-foreground text-xs">
                      Recommendations for databases and archives
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
