/* eslint-disable @next/next/no-img-element */
"use client";

import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  FileText,
  Upload,
  Loader2,
  User,
  Calendar,
  MapPin,
  Users,
  AlertCircle,
  Download,
  CheckCircle,
  XCircle,
  Info,
  Save,
  Trash2,
  Search,
  Sparkles,
  History,
  Share2,
  Clock,
  Image,
  ArrowLeft,
  Crown,
  Eye,
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { Footer } from "@/components/footer";
import { UsageInfo } from "@/components/ui/usage-info";
import { ToolUsageIndicator } from "@/components/ui/usage-display";
import { useSimpleAnalysisRefresh } from "@/hooks/use-analysis-with-refresh";
import {
  getToolErrorMessage,
  getFileRejectionMessage,
} from "@/lib/error-handler";
import { useToolAccess, useUserStatus } from "@/hooks/use-user-status";
import {
  useDocumentHistory,
  type SavedDocument,
} from "@/hooks/use-document-history";
import { Switch } from "@/components/ui/switch";

import type { DocumentAnalysisResult } from "@/types";

export default function DocumentAnalyzerPage() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<DocumentAnalysisResult | null>(null);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("upload");
  const [selectedDocument, setSelectedDocument] =
    useState<SavedDocument | null>(null);
  const [notes, setNotes] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Translation states
  const [enableTranslation, setEnableTranslation] = useState(false);
  const [targetLanguage, setTargetLanguage] = useState("English");
  const [sourceLanguage, setSourceLanguage] = useState("auto-detect");

  // Use the document history hook
  const {
    documents: savedDocuments,
    isLoading: documentsLoading,
    error: documentsError,
    deleteDocument,
    refresh: refreshDocuments,
  } = useDocumentHistory();

  const { refreshUsageAfterAnalysis } = useSimpleAnalysisRefresh();
  const { usage } = useToolAccess("documents");
  const { tier } = useUserStatus();
  const isAtUsageLimit = usage && !usage.unlimited && usage.used >= usage.limit;
  const hasNoAccess = usage && usage.limit === 0;
  const shouldUpgrade = isAtUsageLimit || hasNoAccess;

  // Check if translation is available for current subscription tier
  const hasTranslationAccess =
    tier && ["EXPLORER", "RESEARCHER", "PROFESSIONAL", "ADMIN"].includes(tier);
  const translationRequiresUpgrade = !hasTranslationAccess;

  const handleAddTag = () => {
    if (newTag.trim() && !tags.includes(newTag.trim())) {
      setTags((prev) => [...prev, newTag.trim()]);
      setNewTag("");
    }
  };

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (!acceptedFiles.length) return;
    const f = acceptedFiles[0];
    setFile(f);
    setError("");
    setAnalysis(null);
    if (f.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = (e) => setPreview(e.target?.result as string);
      reader.readAsDataURL(f);
    } else {
      setPreview(null);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive, fileRejections, open } =
    useDropzone({
      onDrop,
      accept: {
        "image/*": [".png", ".jpg", ".jpeg", ".gif", ".bmp", ".tiff", ".webp"],
        "application/pdf": [".pdf"],
      },
      maxSize: 10 * 1024 * 1024,
      multiple: false,
      noClick: true,
      noKeyboard: true,
    });

  const handleAnalyzeAction = async () => {
    if (!file) return;

    // If should upgrade, redirect to subscription
    if (shouldUpgrade) {
      window.location.href = "/subscription";
      return;
    }

    setIsAnalyzing(true);
    setError("");

    try {
      const formData = new FormData();
      formData.append("file", file);

      // Add translation options if enabled
      if (enableTranslation) {
        formData.append("enableTranslation", "true");
        formData.append("targetLanguage", targetLanguage);
        if (sourceLanguage !== "auto-detect") {
          formData.append("sourceLanguage", sourceLanguage);
        }
      }

      const res = await fetch("/api/tools/document/analyze", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) {
        const errorMessage = getToolErrorMessage({
          toolType: "document",
          status: res.status,
          error: data.error || new Error("Analysis failed"),
        });
        throw new Error(errorMessage);
      }

      setAnalysis(data.analysis);
      setActiveTab("results");

      // Refresh usage data immediately after successful analysis
      await refreshUsageAfterAnalysis();

      // Refresh document history to show the new analysis
      await refreshDocuments();

      toast("Analysis Complete", {
        description: "Your document has been successfully analyzed",
      });
    } catch (err) {
      const msg = getToolErrorMessage({
        toolType: "document",
        error: err,
      });
      setError(msg);
      toast("Analysis Failed", {
        description:
          msg.length > 100
            ? "Check the error details above for troubleshooting steps"
            : msg,
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const confLabel = (c: number) =>
    c >= 0.8 ? "High" : c >= 0.6 ? "Medium" : "Low";
  const confIcon = (c: number) =>
    c >= 0.8 ? (
      <CheckCircle className="w-4 h-4" />
    ) : c >= 0.6 ? (
      <AlertCircle className="w-4 h-4" />
    ) : (
      <XCircle className="w-4 h-4" />
    );
  const confStyle = (c: number) => {
    if (c >= 0.8)
      return {
        borderColor: "oklch(0.92 0.18 151)",
        background: "oklch(0.98 0.04 151 / .35)",
        color: "oklch(0.37 0.11 151)",
      };
    if (c >= 0.6)
      return {
        borderColor: "oklch(0.94 0.09 83)",
        background: "oklch(0.99 0.02 83 / .45)",
        color: "oklch(0.55 0.11 83)",
      };
    return {
      borderColor: "oklch(0.92 0.13 25)",
      background: "oklch(0.98 0.04 25 / .35)",
      color: "oklch(0.47 0.14 25)",
    };
  };
  const formatMB = (bytes: number) =>
    bytes < 1024 * 1024
      ? `${(bytes / 1024).toFixed(0)} KB`
      : `${(bytes / 1024 / 1024).toFixed(2)} MB`;

  const filteredDocuments = savedDocuments.filter((doc) => {
    const q = searchQuery.toLowerCase();
    const matches =
      doc.filename.toLowerCase().includes(q) ||
      doc.tags?.some((t) => t.toLowerCase().includes(q));
    if (filterType === "analyzed") return matches && !!doc.analysis;
    if (filterType === "pending") return matches && !doc.analysis;
    return matches;
  });

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
              <FileText className="h-3.5 w-3.5" />
              Document Analysis
            </Badge>
          </div>
          <div className="flex items-center gap-4 mb-3">
            <div className="w-12 h-12 bg-blue-500/10 rounded-xl flex items-center justify-center">
              <FileText className="w-6 h-6 text-blue-600" />
            </div>
            <div className="flex-1">
              <h1 className="text-3xl md:text-4xl font-bold text-foreground">
                Document Analyzer
              </h1>
              <p className="text-lg text-muted-foreground mt-1">
                Extract names, dates, places, and relationships from historical
                documents
              </p>
            </div>
            <div className="hidden sm:block">
              <ToolUsageIndicator tool="documents" />
            </div>
          </div>
        </div>

        <UsageInfo tool="documents" />

        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="upload">Upload</TabsTrigger>
            <TabsTrigger value="results" disabled={!analysis}>
              Results
            </TabsTrigger>
            <TabsTrigger value="history">History</TabsTrigger>
          </TabsList>

          {/* Upload */}
          <TabsContent value="upload" className="mt-6">
            <div className="grid gap-8 lg:grid-cols-3">
              {/* Upload Section */}
              <div className="lg:col-span-2 space-y-6">
                <Card variant="elevated" className="animate-slide-up">
                  <CardHeader>
                    <CardTitle className="text-xl">Upload Document</CardTitle>
                    <CardDescription>
                      Upload a historical document to extract genealogy data and
                      family information
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div
                      {...getRootProps({
                        onClick: (e) => {
                          e.preventDefault();
                          open();
                        },
                      })}
                      className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all hover-lift ${
                        isDragActive
                          ? "border-primary bg-primary/5"
                          : preview
                          ? "border-green-500 bg-green-50/50"
                          : "border-border hover:border-primary/50 hover:bg-muted/50"
                      }`}
                      aria-label="Document file dropzone"
                    >
                      <input {...getInputProps()} />
                      <div className="flex flex-col items-center gap-4">
                        {preview ? (
                          <div className="relative w-32 h-32 rounded-lg overflow-hidden">
                            <img
                              src={preview}
                              alt="Document preview"
                              className="w-full h-full object-cover"
                            />
                          </div>
                        ) : (
                          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
                            <Upload className="w-8 h-8 text-primary" />
                          </div>
                        )}
                        {preview ? (
                          <div>
                            <p className="font-medium text-foreground">
                              {file?.name}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {file && (file.size / 1024 / 1024).toFixed(2)} MB
                            </p>
                          </div>
                        ) : (
                          <div>
                            <p className="font-medium text-foreground mb-1">
                              {isDragActive
                                ? "Drop your document here"
                                : "Drag & drop a document here"}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              or click to browse files
                            </p>
                          </div>
                        )}
                      </div>
                    </div>

                    {fileRejections.length > 0 && (
                      <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>
                          <div className="space-y-2">
                            <p className="font-medium">Document Upload Error</p>
                            <p>
                              {getFileRejectionMessage(
                                "document",
                                fileRejections[0].errors[0]
                              )}
                            </p>
                            <p className="text-sm opacity-90">
                              📸 Best results: Use clear photos with visible
                              faces and details, good lighting, and minimal
                              blur.
                            </p>
                          </div>
                        </AlertDescription>
                      </Alert>
                    )}

                    {/* Translation Settings - Premium Feature */}
                    <div className="pt-4 border-t space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <Label
                              htmlFor="enable-translation"
                              className="font-medium"
                            >
                              Document Translation
                            </Label>
                            {translationRequiresUpgrade && (
                              <Badge
                                variant="outline"
                                className="text-xs bg-gradient-to-r from-purple-500/10 to-blue-500/10 border-purple-300"
                              >
                                <Crown className="w-3 h-3 mr-1" />
                                Explorer+
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {translationRequiresUpgrade
                              ? "Upgrade to Explorer plan to translate documents before analysis"
                              : "Translate document to English or any selected language before extracting genealogical data"}
                          </p>
                        </div>
                        <Switch
                          id="enable-translation"
                          checked={enableTranslation}
                          onCheckedChange={(checked) => {
                            if (translationRequiresUpgrade && checked) {
                              // Redirect to subscription page
                              window.location.href = "/subscription";
                              return;
                            }
                            setEnableTranslation(checked);
                          }}
                          disabled={translationRequiresUpgrade}
                        />
                      </div>

                      {enableTranslation && hasTranslationAccess && (
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <Label
                              htmlFor="source-language"
                              className="text-xs font-medium"
                            >
                              Source Language
                            </Label>
                            <Select
                              value={sourceLanguage}
                              onValueChange={setSourceLanguage}
                            >
                              <SelectTrigger className="mt-1">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="auto-detect">
                                  Auto-detect
                                </SelectItem>
                                <SelectItem value="Spanish">Spanish</SelectItem>
                                <SelectItem value="French">French</SelectItem>
                                <SelectItem value="German">German</SelectItem>
                                <SelectItem value="Italian">Italian</SelectItem>
                                <SelectItem value="Portuguese">
                                  Portuguese
                                </SelectItem>
                                <SelectItem value="Latin">Latin</SelectItem>
                                <SelectItem value="Polish">Polish</SelectItem>
                                <SelectItem value="Russian">Russian</SelectItem>
                                <SelectItem value="Czech">Czech</SelectItem>
                                <SelectItem value="Hungarian">
                                  Hungarian
                                </SelectItem>
                                <SelectItem value="Dutch">Dutch</SelectItem>
                                <SelectItem value="Swedish">Swedish</SelectItem>
                                <SelectItem value="Norwegian">
                                  Norwegian
                                </SelectItem>
                                <SelectItem value="Danish">Danish</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <Label
                              htmlFor="target-language"
                              className="text-xs font-medium"
                            >
                              Target Language
                            </Label>
                            <Select
                              value={targetLanguage}
                              onValueChange={setTargetLanguage}
                            >
                              <SelectTrigger className="mt-1">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="English">English</SelectItem>
                                <SelectItem value="Spanish">Spanish</SelectItem>
                                <SelectItem value="French">French</SelectItem>
                                <SelectItem value="German">German</SelectItem>
                                <SelectItem value="Italian">Italian</SelectItem>
                                <SelectItem value="Portuguese">
                                  Portuguese
                                </SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="pt-4 border-t">
                      <Button
                        onClick={handleAnalyzeAction}
                        disabled={!file || isAnalyzing}
                        className="w-full hover-lift"
                        size="lg"
                      >
                        {isAnalyzing ? (
                          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        ) : shouldUpgrade ? (
                          <Crown className="mr-2 h-5 w-5" />
                        ) : (
                          <Sparkles className="mr-2 h-5 w-5" />
                        )}
                        {isAnalyzing
                          ? enableTranslation
                            ? "Translating & Analyzing..."
                            : "Analyzing Document..."
                          : shouldUpgrade
                          ? "Upgrade to Analyze Document"
                          : enableTranslation
                          ? "Translate & Analyze Document"
                          : "Analyze Document"}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Info Section */}
              <div className="space-y-6">
                <Card variant="elevated" className="animate-slide-up">
                  <CardHeader>
                    <CardTitle className="text-xl">Supported Formats</CardTitle>
                    <CardDescription>
                      We support images and PDF documents
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-3">
                      <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
                        <div className="w-8 h-8 bg-blue-500/10 rounded-lg flex items-center justify-center">
                          <FileText className="h-4 w-4 text-blue-600" />
                        </div>
                        <div>
                          <p className="font-medium text-sm">PDF Documents</p>
                          <p className="text-xs text-muted-foreground">
                            Multi-page documents
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
                        <div className="w-8 h-8 bg-green-500/10 rounded-lg flex items-center justify-center">
                          <Image className="h-4 w-4 text-green-600" />
                        </div>
                        <div>
                          <p className="font-medium text-sm">Images</p>
                          <p className="text-xs text-muted-foreground">
                            PNG, JPEG, TIFF, WebP
                          </p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card variant="elevated" className="animate-slide-up">
                  <CardHeader>
                    <CardTitle className="text-xl flex items-center gap-2">
                      <Eye className="h-5 w-5" />
                      What We Extract
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-1 text-sm">
                    <div className="flex items-start gap-2">
                      <User className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="font-medium mb-1">Names & People</p>
                        <p className="text-muted-foreground text-xs">
                          Full names, relationships, and family connections
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <Calendar className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="font-medium mb-1">Dates & Events</p>
                        <p className="text-muted-foreground text-xs">
                          Births, deaths, marriages, and important events
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <MapPin className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="font-medium mb-1">Locations</p>
                        <p className="text-muted-foreground text-xs">
                          Addresses, cities, countries, and place names
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <Users className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="font-medium mb-1">Relationships</p>
                        <p className="text-muted-foreground text-xs">
                          Family connections and genealogical links
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card variant="elevated" className="animate-slide-up">
                  <CardHeader>
                    <CardTitle className="text-xl">
                      Tips for Best Results
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 text-sm">
                    <div className="flex items-start gap-2">
                      <div className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0" />
                      <p className="text-muted-foreground">
                        Use high-quality scans (300 DPI or higher)
                      </p>
                    </div>
                    <div className="flex items-start gap-2">
                      <div className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0" />
                      <p className="text-muted-foreground">
                        Ensure good contrast between text and background
                      </p>
                    </div>
                    <div className="flex items-start gap-2">
                      <div className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0" />
                      <p className="text-muted-foreground">
                        Keep documents straight and avoid rotation
                      </p>
                    </div>
                    <div className="flex items-start gap-2">
                      <div className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0" />
                      <p className="text-muted-foreground">
                        Include all relevant margins and handwritten notes
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* Results */}
          {/* Results */}
          <TabsContent value="results" className="mt-6">
            {analysis && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* LEFT: Analysis Content (2 cols) */}
                <div className="lg:col-span-2 space-y-6">
                  <Card>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle>Analysis Results</CardTitle>
                          <CardDescription>
                            AI-extracted genealogical information
                          </CardDescription>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              const shareData = {
                                title: "Document Analysis Results",
                                text: `Analysis of ${
                                  file?.name || "document"
                                }: ${analysis.names.length} names, ${
                                  analysis.dates.length
                                } dates, ${analysis.places.length} places.`,
                              };
                              if (navigator.share) navigator.share(shareData);
                              else {
                                navigator.clipboard.writeText(shareData.text);
                                toast("Copied to clipboard", {
                                  description: "Analysis summary copied",
                                });
                              }
                            }}
                          >
                            <Share2 className="h-4 w-4 mr-1" /> Share
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              const dataStr = JSON.stringify(analysis, null, 2);
                              const blob = new Blob([dataStr], {
                                type: "application/json",
                              });
                              const url = URL.createObjectURL(blob);
                              const a = document.createElement("a");
                              a.href = url;
                              a.download = `analysis-${Date.now()}.json`;
                              a.click();
                            }}
                          >
                            <Download className="h-4 w-4 mr-1" /> Export
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                  </Card>

                  {analysis.summary && (
                    <Alert>
                      <Info className="h-4 w-4" />
                      <AlertTitle>Document Summary</AlertTitle>
                      <AlertDescription>{analysis.summary}</AlertDescription>
                    </Alert>
                  )}

                  {/* Translation Results - Premium Feature */}
                  {analysis.translation && (
                    <Card>
                      <CardHeader>
                        <div className="flex items-center gap-2">
                          <CardTitle className="flex items-center gap-2">
                            <Crown className="h-5 w-5 text-purple-600" />
                            Translation Results
                          </CardTitle>
                          <Badge
                            variant="outline"
                            className="bg-gradient-to-r from-purple-500/10 to-blue-500/10 border-purple-300"
                          >
                            Premium Feature
                          </Badge>
                        </div>
                        <CardDescription>
                          Document translated from{" "}
                          {analysis.translation.sourceLanguage} to{" "}
                          {analysis.translation.targetLanguage}
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <Tabs defaultValue="translation" className="w-full">
                          <TabsList className="w-full justify-start">
                            <TabsTrigger value="translation">
                              Translation
                            </TabsTrigger>
                            <TabsTrigger value="contextual">
                              Historical Terms
                            </TabsTrigger>
                            <TabsTrigger value="original">
                              Original Text
                            </TabsTrigger>
                          </TabsList>

                          <TabsContent value="translation" className="mt-4">
                            <div className="bg-muted/30 p-4 rounded-lg">
                              <div className="flex items-center justify-between mb-2">
                                <Label className="text-sm font-medium">
                                  Translated Text
                                </Label>
                                <Badge variant="outline">
                                  {Math.round(
                                    analysis.translation.confidence * 100
                                  )}
                                  % confidence
                                </Badge>
                              </div>
                              <p className="text-sm whitespace-pre-wrap">
                                {analysis.translation.translatedText}
                              </p>
                            </div>
                          </TabsContent>

                          <TabsContent value="contextual" className="mt-4">
                            <div className="space-y-3">
                              {analysis.translation.contextualTerms.map(
                                (term, i) => (
                                  <div
                                    key={i}
                                    className="border rounded-lg p-3"
                                  >
                                    <div className="flex items-center justify-between mb-2">
                                      <span className="font-medium">
                                        {term.term}
                                      </span>
                                      <Badge
                                        variant="outline"
                                        className="text-xs"
                                      >
                                        {term.category}
                                      </Badge>
                                    </div>
                                    <p className="text-sm text-muted-foreground">
                                      {term.explanation}
                                    </p>
                                  </div>
                                )
                              )}
                              {analysis.translation.contextualTerms.length ===
                                0 && (
                                <p className="text-center text-muted-foreground py-4">
                                  No historical terms requiring explanation were
                                  found.
                                </p>
                              )}
                            </div>
                          </TabsContent>

                          <TabsContent value="original" className="mt-4">
                            <div className="bg-muted/30 p-4 rounded-lg">
                              <Label className="text-sm font-medium mb-2 block">
                                Original Text
                              </Label>
                              <p className="text-sm whitespace-pre-wrap text-muted-foreground">
                                {analysis.translation.originalText}
                              </p>
                            </div>
                          </TabsContent>
                        </Tabs>
                      </CardContent>
                    </Card>
                  )}

                  {/* Inner tabs for analysis sections (kept as-is) */}
                  <Card>
                    <CardContent className="p-0">
                      <Tabs defaultValue="people" className="w-full">
                        <TabsList className="w-full justify-start rounded-b-none border-b">
                          <TabsTrigger value="people">
                            People (
                            {
                              analysis.names.filter((n) => n.type === "person")
                                .length
                            }
                            )
                          </TabsTrigger>
                          <TabsTrigger value="dates">
                            Dates ({analysis.dates.length})
                          </TabsTrigger>
                          <TabsTrigger value="places">
                            Places ({analysis.places.length})
                          </TabsTrigger>
                          <TabsTrigger value="relationships">
                            Relations ({analysis.relationships.length})
                          </TabsTrigger>
                          <TabsTrigger value="events">
                            Events ({analysis.events?.length || 0})
                          </TabsTrigger>
                        </TabsList>

                        {/* People */}
                        <div className="p-6">
                          <TabsContent value="people" className="mt-0">
                            <div className="grid gap-3">
                              {analysis.names
                                .filter((n) => n.type === "person")
                                .map((name, i) => (
                                  <div
                                    key={i}
                                    className="flex items-center justify-between p-4 border rounded-lg"
                                    style={confStyle(name.confidence)}
                                  >
                                    <div className="flex items-center gap-3">
                                      <User className="w-5 h-5" />
                                      <div>
                                        <p className="font-medium">
                                          {name.text}
                                        </p>
                                        {name.context && (
                                          <p className="text-sm opacity-75">
                                            {name.context}
                                          </p>
                                        )}
                                      </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      {confIcon(name.confidence)}
                                      <Badge variant="outline">
                                        {confLabel(name.confidence)}
                                      </Badge>
                                    </div>
                                  </div>
                                ))}
                            </div>
                          </TabsContent>

                          {/* Dates */}
                          <TabsContent value="dates" className="mt-0">
                            <div className="grid gap-3">
                              {analysis.dates.map((date, i) => (
                                <div
                                  key={i}
                                  className="flex items-center justify-between p-4 border rounded-lg"
                                  style={confStyle(date.confidence)}
                                >
                                  <div className="flex items-center gap-3">
                                    <Calendar className="w-5 h-5" />
                                    <div>
                                      <p className="font-medium">{date.text}</p>
                                      <p className="text-sm opacity-75">
                                        Type: {date.type}{" "}
                                        {date.normalizedDate
                                          ? ` • ${date.normalizedDate}`
                                          : ""}
                                      </p>
                                      {date.context && (
                                        <p className="text-sm opacity-75">
                                          {date.context}
                                        </p>
                                      )}
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    {confIcon(date.confidence)}
                                    <Badge variant="outline">
                                      {confLabel(date.confidence)}
                                    </Badge>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </TabsContent>

                          {/* Places */}
                          <TabsContent value="places" className="mt-0">
                            <div className="grid gap-3">
                              {analysis.places.map((place, i) => (
                                <div
                                  key={i}
                                  className="flex items-center justify-between p-4 border rounded-lg"
                                  style={confStyle(place.confidence)}
                                >
                                  <div className="flex items-center gap-3">
                                    <MapPin className="w-5 h-5" />
                                    <div>
                                      <p className="font-medium">
                                        {place.text}
                                      </p>
                                      {place.modernName && (
                                        <p className="text-sm opacity-75">
                                          Modern: {place.modernName}
                                        </p>
                                      )}
                                      {place.context && (
                                        <p className="text-sm opacity-75">
                                          {place.context}
                                        </p>
                                      )}
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    {confIcon(place.confidence)}
                                    <Badge variant="outline">
                                      {confLabel(place.confidence)}
                                    </Badge>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </TabsContent>

                          {/* Relationships */}
                          <TabsContent value="relationships" className="mt-0">
                            <div className="grid gap-3">
                              {analysis.relationships.map((rel, i) => (
                                <div
                                  key={i}
                                  className="p-4 border rounded-lg"
                                  style={confStyle(rel.confidence)}
                                >
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                      <Users className="w-5 h-5" />
                                      <div>
                                        <p className="font-medium">
                                          {rel.person1} — {rel.person2}
                                        </p>
                                        <p className="text-sm opacity-75">
                                          Relationship: {rel.type}
                                        </p>
                                        {rel.context && (
                                          <p className="text-sm opacity-75">
                                            {rel.context}
                                          </p>
                                        )}
                                      </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      {confIcon(rel.confidence)}
                                      <Badge variant="outline">
                                        {confLabel(rel.confidence)}
                                      </Badge>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </TabsContent>

                          {/* Events */}
                          <TabsContent value="events" className="mt-0">
                            <div className="space-y-4">
                              {analysis.events?.map((ev, i) => (
                                <div key={i} className="relative pl-8">
                                  <div
                                    className="absolute left-0 top-0 w-6 h-6 rounded-full grid place-items-center"
                                    style={{
                                      background: "var(--primary)",
                                      color: "var(--primary-foreground)",
                                    }}
                                  >
                                    <span className="text-xs">{i + 1}</span>
                                  </div>
                                  {i < (analysis.events?.length ?? 0) - 1 && (
                                    <div
                                      className="absolute left-3 top-6 bottom-0 w-0.5"
                                      style={{
                                        background:
                                          "color-mix(in oklab, var(--border) 70%, transparent)",
                                      }}
                                    />
                                  )}
                                  <div className="pb-6">
                                    <div className="flex items-center justify-between mb-1">
                                      <Badge>{ev.type}</Badge>
                                      <div className="flex items-center gap-2">
                                        {confIcon(ev.confidence)}
                                        <Badge variant="outline">
                                          {confLabel(ev.confidence)}
                                        </Badge>
                                      </div>
                                    </div>
                                    <p className="font-medium mb-1">
                                      {ev.description}
                                    </p>
                                    <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
                                      {ev.date && (
                                        <span className="flex items-center gap-1">
                                          <Calendar className="w-3 h-3" />{" "}
                                          {ev.date}
                                        </span>
                                      )}
                                      {ev.place && (
                                        <span className="flex items-center gap-1">
                                          <MapPin className="w-3 h-3" />{" "}
                                          {ev.place}
                                        </span>
                                      )}
                                      {ev.people?.length ? (
                                        <span className="flex items-center gap-1">
                                          <Users className="w-3 h-3" />{" "}
                                          {ev.people.join(", ")}
                                        </span>
                                      ) : null}
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </TabsContent>
                        </div>
                      </Tabs>
                    </CardContent>
                  </Card>

                  {analysis.suggestions.length > 0 && (
                    <Card>
                      <CardHeader>
                        <CardTitle>Research Suggestions</CardTitle>
                        <CardDescription>
                          Next best steps based on your document
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          {analysis.suggestions.map((s: string, i: number) => (
                            <div key={i} className="flex items-start gap-3">
                              <div className="mt-0.5 w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center">
                                <span className="text-xs font-semibold text-primary">
                                  {i + 1}
                                </span>
                              </div>
                              <p className="text-sm">{s}</p>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  <Card>
                    <CardHeader>
                      <CardTitle>Notes & Tags</CardTitle>
                      <CardDescription>
                        Add personal notes and organize with tags
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <Label htmlFor="notes">Notes</Label>
                        <Textarea
                          id="notes"
                          placeholder="Add your research notes here…"
                          value={notes}
                          onChange={(e) => setNotes(e.target.value)}
                          rows={4}
                          className="mt-2"
                        />
                      </div>
                      <div>
                        <Label>Tags</Label>
                        <div className="flex gap-2 mt-2 mb-3">
                          <Input
                            placeholder="Add a tag"
                            value={newTag}
                            onChange={(e) => setNewTag(e.target.value)}
                            onKeyDown={(e) =>
                              e.key === "Enter" &&
                              (e.preventDefault(), handleAddTag())
                            }
                          />
                          <Button onClick={handleAddTag} size="sm">
                            Add Tag
                          </Button>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {tags.map((t) => (
                            <Badge key={t} variant="secondary">
                              {t}
                              <button
                                onClick={() =>
                                  setTags((arr) => arr.filter((x) => x !== t))
                                }
                                className="ml-2 hover:text-destructive"
                              >
                                ×
                              </button>
                            </Badge>
                          ))}
                        </div>
                      </div>
                      <Button
                        disabled
                        title="Notes and tags functionality coming soon"
                      >
                        <Save className="mr-2 h-4 w-4" /> Save Notes (Coming
                        Soon)
                      </Button>
                    </CardContent>
                  </Card>
                </div>

                {/* RIGHT: Original Document Sidebar (1 col) */}
                <div className="lg:col-span-1">
                  <Card className="sticky top-4">
                    <CardHeader>
                      <CardTitle className="text-base">
                        Original Document
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {(preview && file) ||
                      (selectedDocument &&
                        selectedDocument.viewUrl &&
                        !selectedDocument.viewUrl.startsWith(
                          "placeholder://"
                        )) ? (
                        <div className="space-y-4">
                          <div className="relative w-full aspect-[3/4] rounded-lg overflow-hidden border">
                            <img
                              src={selectedDocument?.viewUrl || preview || ""}
                              alt="Document preview"
                              className="w-full h-full object-contain bg-gray-50"
                              onError={(e) => {
                                (e.target as HTMLImageElement).style.display =
                                  "none";
                                const parent = (e.target as HTMLImageElement)
                                  .parentElement;
                                if (parent) {
                                  parent.innerHTML =
                                    '<div class="w-full h-full flex items-center justify-center bg-gray-100"><svg class="w-16 h-16 text-gray-400" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clip-rule="evenodd"></path></svg></div>';
                                }
                              }}
                            />
                          </div>
                          <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">
                                Name:
                              </span>
                              <span className="font-medium truncate ml-2">
                                {selectedDocument?.filename ||
                                  file?.name ||
                                  "Document"}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">
                                Size:
                              </span>
                              <span className="font-medium">
                                {file?.size ? formatMB(file.size) : "Unknown"}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">
                                Type:
                              </span>
                              <span className="font-medium">
                                {(file?.type || "application/pdf")
                                  .split("/")[1]
                                  ?.toUpperCase() || "Document"}
                              </span>
                            </div>
                            {selectedDocument?.viewUrl?.startsWith(
                              "placeholder://"
                            ) && (
                              <div className="flex items-center gap-2 text-xs text-amber-600">
                                <div className="w-2 h-2 bg-amber-500 rounded-full" />
                                Document preview unavailable
                              </div>
                            )}
                          </div>
                        </div>
                      ) : (
                        <div className="w-full aspect-[3/4] rounded-lg border border-dashed border-gray-300 flex items-center justify-center">
                          <div className="text-center text-gray-500">
                            <FileText className="w-12 h-12 mx-auto mb-2" />
                            <p className="text-sm">
                              No document preview available
                            </p>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </div>
            )}
          </TabsContent>

          {/* History */}
          <TabsContent value="history" className="mt-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <CardTitle>Document History</CardTitle>
                    <CardDescription>
                      View and manage previous analyses
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        placeholder="Search documents…"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-9 w-64"
                      />
                    </div>
                    <Select value={filterType} onValueChange={setFilterType}>
                      <SelectTrigger className="w-32">
                        <SelectValue placeholder="Filter" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All</SelectItem>
                        <SelectItem value="analyzed">Analyzed</SelectItem>
                        <SelectItem value="pending">Pending</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardHeader>

              <CardContent>
                {documentsError && (
                  <Alert variant="destructive" className="mb-4">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{documentsError}</AlertDescription>
                  </Alert>
                )}

                {documentsLoading ? (
                  <div className="text-center py-12">
                    <Loader2 className="w-8 h-8 mx-auto animate-spin text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">
                      Loading document history...
                    </p>
                  </div>
                ) : filteredDocuments.length ? (
                  <ScrollArea className="h-[600px]">
                    <div className="space-y-4">
                      {filteredDocuments.map((doc) => (
                        <div
                          key={doc.id}
                          className="p-4 border rounded-lg hover:bg-muted/40 cursor-pointer transition-colors"
                          onClick={() => {
                            setSelectedDocument(doc);
                            if (doc.analysis) {
                              setAnalysis(doc.analysis);
                              setActiveTab("results");
                              // Clear the current file state since we're viewing from history
                              setFile(null);
                              setPreview(null);
                            }
                          }}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex items-start gap-3">
                              <div className="w-16 h-16 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                                {doc.viewUrl &&
                                !doc.viewUrl.startsWith("placeholder://") ? (
                                  // Show document thumbnail/preview if it's an image
                                  <img
                                    src={doc.viewUrl}
                                    alt={doc.filename}
                                    className="w-full h-full object-cover"
                                    onError={(e) => {
                                      // Fall back to file icon if image fails to load
                                      const target =
                                        e.target as HTMLImageElement;
                                      target.style.display = "none";
                                      const parent = target.parentElement;
                                      if (
                                        parent &&
                                        !parent.querySelector(".fallback-icon")
                                      ) {
                                        const fallbackDiv =
                                          document.createElement("div");
                                        fallbackDiv.className =
                                          "w-full h-full flex items-center justify-center fallback-icon";
                                        fallbackDiv.innerHTML =
                                          '<svg class="w-6 h-6 text-gray-400" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clip-rule="evenodd"></path></svg>';
                                        parent.appendChild(fallbackDiv);
                                      }
                                    }}
                                  />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center">
                                    <FileText className="w-6 h-6 text-gray-400" />
                                    {doc.viewUrl?.startsWith(
                                      "placeholder://"
                                    ) && (
                                      <div
                                        className="absolute -bottom-1 -right-1 w-3 h-3 bg-yellow-500 rounded-full"
                                        title="Document not available"
                                      />
                                    )}
                                  </div>
                                )}
                              </div>
                              <div>
                                <p className="font-medium">{doc.filename}</p>
                                <p className="text-sm text-muted-foreground">
                                  Uploaded{" "}
                                  {new Date(
                                    doc.uploadedAt
                                  ).toLocaleDateString()}
                                </p>

                                {doc.analysis && (
                                  <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                                    <span className="flex items-center gap-1">
                                      <User className="w-3 h-3" />
                                      {
                                        doc.analysis.names?.filter(
                                          (n) => n.type === "person"
                                        ).length
                                      }{" "}
                                      people
                                    </span>
                                    <span className="flex items-center gap-1">
                                      <Calendar className="w-3 h-3" />
                                      {doc.analysis.dates?.length} dates
                                    </span>
                                    <span className="flex items-center gap-1">
                                      <MapPin className="w-3 h-3" />
                                      {doc.analysis.places?.length} places
                                    </span>
                                  </div>
                                )}

                                {doc.tags?.length ? (
                                  <div className="flex flex-wrap gap-1 mt-2">
                                    {doc.tags.map((t) => (
                                      <Badge
                                        key={t}
                                        variant="outline"
                                        className="text-xs"
                                      >
                                        {t}
                                      </Badge>
                                    ))}
                                  </div>
                                ) : null}
                              </div>
                            </div>

                            <div className="flex items-center gap-2">
                              {doc.analysis ? (
                                <Badge>
                                  <CheckCircle className="w-3 h-3 mr-1" />
                                  Analyzed
                                </Badge>
                              ) : (
                                <Badge variant="secondary">
                                  <Clock className="w-3 h-3 mr-1" />
                                  Pending
                                </Badge>
                              )}
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={async (e) => {
                                  e.stopPropagation();
                                  const success = await deleteDocument(doc.id);
                                  if (success) {
                                    toast("Document removed", {
                                      description: "Removed from history",
                                    });
                                  } else {
                                    toast("Failed to remove document", {
                                      description: "Please try again",
                                    });
                                  }
                                }}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>

                          {doc.notes && (
                            <div className="mt-3 p-3 rounded-md border bg-card/50">
                              <p className="text-sm">{doc.notes}</p>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                ) : (
                  <div className="text-center py-12">
                    <History className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                    <p className="text-muted-foreground">No documents found</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Upload and analyze documents to see them here
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
      <Footer />
    </div>
  );
}

function Feature({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-primary">{icon}</span>
      <span className="text-sm">{text}</span>
    </div>
  );
}
