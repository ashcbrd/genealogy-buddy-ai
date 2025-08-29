"use client";

import { useState, useCallback } from "react";
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
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Languages,
  Upload,
  Loader2,
  FileText,
  ArrowLeft,
  Info,
  Crown,
  CheckCircle,
  User,
  Calendar,
  MapPin,
  Users,
  Camera,
  Lightbulb,
  BookOpen,
  History,
  Search,
  Trash2,
  Clock,
  RefreshCw,
} from "lucide-react";
import Link from "next/link";
import type { TranslationResult, TranslationFormData } from "@/types";
import { UsageInfo } from "@/components/ui/usage-info";
import { ToolUsageIndicator } from "@/components/ui/usage-display";
import { useSimpleAnalysisRefresh } from "@/hooks/use-analysis-with-refresh";
import { getToolErrorMessage } from "@/lib/error-handler";
import { useToolAccess } from "@/hooks/use-user-status";
import {
  useTranslationHistory,
  type SavedTranslation,
} from "@/hooks/use-translation-history";
import { Navigation } from "@/components/ui/navigation";
import { Footer } from "@/components/footer";
import { toast } from "sonner";

const SUPPORTED_LANGUAGES = [
  { code: "en", name: "English" },
  { code: "es", name: "Spanish" },
  { code: "fr", name: "French" },
  { code: "de", name: "German" },
  { code: "it", name: "Italian" },
  { code: "pt", name: "Portuguese" },
  { code: "nl", name: "Dutch" },
  { code: "pl", name: "Polish" },
  { code: "ru", name: "Russian" },
  { code: "cs", name: "Czech" },
  { code: "hu", name: "Hungarian" },
  { code: "sv", name: "Swedish" },
  { code: "da", name: "Danish" },
  { code: "no", name: "Norwegian" },
  { code: "la", name: "Latin" },
];

export default function AncientRecordsTranslatorPage() {
  const [currentTab, setCurrentTab] = useState("upload");
  const [activeInputTab, setActiveInputTab] = useState<"image" | "text">(
    "image"
  );
  const [activeResultTab, setActiveResultTab] = useState("translation");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>("");
  const [result, setResult] = useState<TranslationResult | null>(null);
  const [error, setError] = useState("");
  const [selectedTranslation, setSelectedTranslation] =
    useState<SavedTranslation | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const { refreshUsageAfterAnalysis } = useSimpleAnalysisRefresh();
  const { usage, canUse } = useToolAccess("translations");
  const isAtUsageLimit = usage && !usage.unlimited && usage.used >= usage.limit;
  const hasNoAccess = !canUse;
  const shouldUpgrade = isAtUsageLimit || hasNoAccess;

  // Use the translation history hook
  const {
    translations: savedTranslations,
    isLoading: translationsLoading,
    error: translationsError,
    deleteTranslation,
    refresh: refreshTranslations,
  } = useTranslationHistory();

  const [formData, setFormData] = useState<TranslationFormData>({
    textInput: "",
    targetLanguage: "en",
    extractFacts: true,
    contextualHelp: true,
    sourceLanguage: "",
  });

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedImage(file);
      const reader = new FileReader();
      reader.onload = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAnalysis = async () => {
    if (shouldUpgrade) {
      window.location.href = "/subscription";
      return;
    }

    setIsAnalyzing(true);
    setError("");
    setResult(null);

    try {
      let requestData: any = {
        targetLanguage: formData.targetLanguage,
        sourceLanguage: formData.sourceLanguage || undefined,
        extractFacts: formData.extractFacts,
        contextualHelp: formData.contextualHelp,
      };

      if (activeInputTab === "image" && selectedImage) {
        // Convert image to base64
        const base64 = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onload = () => {
            const base64String = (reader.result as string).split(",")[1];
            resolve(base64String);
          };
          reader.readAsDataURL(selectedImage);
        });
        requestData.imageData = base64;
      } else if (activeInputTab === "text" && formData.textInput.trim()) {
        requestData.textInput = formData.textInput.trim();
      } else {
        throw new Error("Please provide either an image or text input.");
      }

      const res = await fetch("/api/tools/ancient-records-translator", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestData),
      });

      const data = await res.json();
      if (!res.ok) {
        const errorMessage = getToolErrorMessage({
          toolType: "translation",
          operation: "translation and analysis",
          status: res.status,
          error: data.error || new Error("Failed to translate record"),
        });
        throw new Error(errorMessage);
      }

      setResult(data.translation);
      setCurrentTab("results");
      setActiveResultTab("translation");
      await refreshUsageAfterAnalysis();

      // Refresh translation history to show the new analysis
      await refreshTranslations();

      toast.success("Translation Complete", {
        description: "Document has been successfully translated and analyzed.",
      });
    } catch (error) {
      const errorMessage = getToolErrorMessage({
        toolType: "translation",
        operation: "translation and analysis",
        error,
      });
      setError(errorMessage);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const filteredTranslations = savedTranslations.filter((translation) => {
    const q = searchQuery.toLowerCase();
    const matches =
      translation.originalText.toLowerCase().includes(q) ||
      translation.translatedText.toLowerCase().includes(q) ||
      translation.sourceLanguage.toLowerCase().includes(q) ||
      translation.targetLanguage.toLowerCase().includes(q);
    return matches;
  });

  return (
    <div className="min-h-screen bg-background">
      <Navigation variant="dashboard" />

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
              <Camera className="h-3.5 w-3.5" />
              Photo Analysis
            </Badge>
          </div>
          <div className="flex items-center gap-4 mb-3">
            <div className="w-12 h-12 bg-green-500/10 rounded-xl flex items-center justify-center">
              <Languages className="w-6 h-6 text-green-600" />
            </div>
            <div className="flex-1">
              <h1 className="text-3xl md:text-4xl font-bold text-foreground">
                Ancient Records Translator
              </h1>
              <p className="text-lg text-muted-foreground mt-1">
                OCR transcription, translation, and genealogical fact extraction
                from historical documents
              </p>
            </div>
            <div className="hidden sm:block">
              <ToolUsageIndicator tool="photos" />
            </div>
          </div>
        </div>

        <UsageInfo tool="translations" />

        {error && (
          <Alert variant="destructive" className="mb-6">
            <Info className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Three Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Main Content Area - Middle (Upload/Results/History) */}
          <div className="lg:col-span-2 lg:order-2">
            <Tabs value={currentTab} onValueChange={setCurrentTab}>
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="upload">Upload</TabsTrigger>
                <TabsTrigger
                  value="results"
                  disabled={!result && !selectedTranslation}
                >
                  Results
                </TabsTrigger>
                <TabsTrigger value="history">History</TabsTrigger>
              </TabsList>

              {/* Upload Tab */}
              <TabsContent value="upload" className="mt-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Input Document</CardTitle>
                    <CardDescription>
                      Upload an image or paste text from historical records
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Tabs
                      value={activeInputTab}
                      onValueChange={(v) =>
                        setActiveInputTab(v as "image" | "text")
                      }
                    >
                      <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="image" className="gap-2">
                          <Camera className="h-4 w-4" />
                          Image Upload
                        </TabsTrigger>
                        <TabsTrigger value="text" className="gap-2">
                          <FileText className="h-4 w-4" />
                          Text Input
                        </TabsTrigger>
                      </TabsList>

                      <TabsContent value="image" className="space-y-4 mt-6">
                        <div className="border-2 border-dashed border-border/50 rounded-lg p-8 text-center hover:border-primary/50 transition-colors">
                          {imagePreview ? (
                            <div className="space-y-4">
                              <img
                                src={imagePreview}
                                alt="Selected document"
                                className="max-w-full max-h-64 mx-auto rounded-lg shadow-sm"
                              />
                              <p className="text-sm text-muted-foreground">
                                {selectedImage?.name}
                              </p>
                            </div>
                          ) : (
                            <div className="space-y-4">
                              <Upload className="h-12 w-12 text-muted-foreground mx-auto" />
                              <div>
                                <p className="text-lg font-medium">
                                  Upload Historical Document
                                </p>
                                <p className="text-sm text-muted-foreground">
                                  JPG, PNG, or PDF files supported
                                </p>
                              </div>
                            </div>
                          )}
                          <Input
                            type="file"
                            accept="image/*"
                            onChange={handleImageSelect}
                            className="mt-4"
                          />
                        </div>
                      </TabsContent>

                      <TabsContent value="text" className="space-y-4 mt-6">
                        <div className="space-y-2">
                          <Label htmlFor="textInput">
                            Historical Document Text
                          </Label>
                          <Textarea
                            id="textInput"
                            value={formData.textInput}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                textInput: e.target.value,
                              })
                            }
                            placeholder="Paste or type the historical document text here..."
                            className="min-h-32"
                          />
                        </div>
                      </TabsContent>
                    </Tabs>

                    {/* Translation Settings */}
                    <div className="mt-6 space-y-6">
                      <div className="grid gap-4 sm:grid-cols-2">
                        <div className="space-y-2">
                          <Label htmlFor="sourceLanguage">
                            Source Language (Optional)
                          </Label>
                          <Select
                            value={formData.sourceLanguage || "auto"}
                            onValueChange={(value) =>
                              setFormData({
                                ...formData,
                                sourceLanguage: value === "auto" ? "" : value,
                              })
                            }
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Auto-detect" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="auto">Auto-detect</SelectItem>
                              {SUPPORTED_LANGUAGES.map((lang) => (
                                <SelectItem key={lang.code} value={lang.code}>
                                  {lang.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="targetLanguage">
                            Target Language
                          </Label>
                          <Select
                            value={formData.targetLanguage}
                            onValueChange={(value) =>
                              setFormData({
                                ...formData,
                                targetLanguage: value,
                              })
                            }
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {SUPPORTED_LANGUAGES.map((lang) => (
                                <SelectItem key={lang.code} value={lang.code}>
                                  {lang.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="extractFacts"
                            checked={formData.extractFacts}
                            onCheckedChange={(checked) =>
                              setFormData({
                                ...formData,
                                extractFacts: !!checked,
                              })
                            }
                          />
                          <Label
                            htmlFor="extractFacts"
                            className="flex items-center gap-2"
                          >
                            <Users className="h-4 w-4" />
                            Extract genealogical facts (names, dates, places,
                            relationships)
                          </Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="contextualHelp"
                            checked={formData.contextualHelp}
                            onCheckedChange={(checked) =>
                              setFormData({
                                ...formData,
                                contextualHelp: !!checked,
                              })
                            }
                          />
                          <Label
                            htmlFor="contextualHelp"
                            className="flex items-center gap-2"
                          >
                            <Lightbulb className="h-4 w-4" />
                            Provide contextual explanations for historical terms
                          </Label>
                        </div>
                      </div>

                      <div className="pt-4 border-t">
                        <Button
                          onClick={handleAnalysis}
                          className="w-full"
                          disabled={
                            isAnalyzing ||
                            (!selectedImage && !formData.textInput.trim())
                          }
                        >
                          {isAnalyzing ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Translating & Analyzing...
                            </>
                          ) : shouldUpgrade ? (
                            <>
                              <Crown className="mr-2 h-4 w-4" />
                              Upgrade to Translate
                            </>
                          ) : (
                            <>
                              <Languages className="mr-2 h-4 w-4" />
                              Translate & Analyze
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Results Tab */}
              <TabsContent value="results" className="mt-6">
                {(result || selectedTranslation) && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Languages className="w-5 h-5" />
                        Translation Results
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <Tabs
                        value={activeResultTab}
                        onValueChange={setActiveResultTab}
                      >
                        <TabsList className="grid w-full grid-cols-3">
                          <TabsTrigger value="translation">
                            Translation
                          </TabsTrigger>
                          <TabsTrigger value="facts">Facts</TabsTrigger>
                          <TabsTrigger value="context">Context</TabsTrigger>
                        </TabsList>

                        <TabsContent value="translation" className="mt-6">
                          <div className="space-y-6">
                            {(result || selectedTranslation?.analysis) && (
                              <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                  <div className="text-sm text-muted-foreground">
                                    {
                                      (result || selectedTranslation?.analysis)
                                        ?.sourceLanguage
                                    }{" "}
                                    →{" "}
                                    {
                                      (result || selectedTranslation?.analysis)
                                        ?.targetLanguage
                                    }
                                  </div>
                                  <Badge variant="outline">
                                    {Math.round(
                                      ((result || selectedTranslation?.analysis)
                                        ?.confidence || 0) * 100
                                    )}
                                    % confidence
                                  </Badge>
                                </div>

                                <div className="space-y-4">
                                  <div className="space-y-2">
                                    <Label className="text-sm font-medium">
                                      Original Text
                                    </Label>
                                    <div className="p-3 bg-muted/30 rounded-lg text-sm">
                                      {
                                        (
                                          result ||
                                          selectedTranslation?.analysis
                                        )?.originalText
                                      }
                                    </div>
                                  </div>

                                  <div className="space-y-2">
                                    <Label className="text-sm font-medium">
                                      Translation
                                    </Label>
                                    <div className="p-3 bg-primary/5 border border-primary/20 rounded-lg">
                                      {
                                        (
                                          result ||
                                          selectedTranslation?.analysis
                                        )?.translatedText
                                      }
                                    </div>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        </TabsContent>

                        <TabsContent value="facts" className="mt-6">
                          <ScrollArea className="h-[600px]">
                            <div className="space-y-4">
                              {result?.genealogicalFacts ||
                              selectedTranslation?.analysis
                                ?.genealogicalFacts ? (
                                <>
                                  {/* Names */}
                                  {((result?.genealogicalFacts?.names?.length ??
                                    0) > 0 ||
                                    (selectedTranslation?.analysis
                                      ?.genealogicalFacts?.names?.length ?? 0) >
                                      0) && (
                                    <div className="space-y-3">
                                      <Label className="text-sm font-medium flex items-center gap-2">
                                        <User className="h-4 w-4" />
                                        Names (
                                        {
                                          (
                                            result?.genealogicalFacts?.names ||
                                            selectedTranslation?.analysis
                                              ?.genealogicalFacts?.names
                                          )?.length
                                        }
                                        )
                                      </Label>
                                      <div className="space-y-2">
                                        {(
                                          result?.genealogicalFacts?.names ||
                                          selectedTranslation?.analysis
                                            ?.genealogicalFacts?.names
                                        )?.map((name, index) => (
                                          <div
                                            key={index}
                                            className="p-3 bg-muted/30 rounded-lg"
                                          >
                                            <div className="flex items-center justify-between mb-2">
                                              <span className="font-medium">
                                                {name.text}
                                              </span>
                                              <Badge
                                                variant="outline"
                                                className="text-xs"
                                              >
                                                {name.type}
                                              </Badge>
                                            </div>
                                            {name.context && (
                                              <p className="text-xs text-muted-foreground">
                                                {name.context}
                                              </p>
                                            )}
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  )}

                                  {/* Dates */}
                                  {((result?.genealogicalFacts?.dates?.length ??
                                    0) > 0 ||
                                    (selectedTranslation?.analysis
                                      ?.genealogicalFacts?.dates?.length ?? 0) >
                                      0) && (
                                    <div className="space-y-3">
                                      <Label className="text-sm font-medium flex items-center gap-2">
                                        <Calendar className="h-4 w-4" />
                                        Dates (
                                        {
                                          (
                                            result?.genealogicalFacts?.dates ||
                                            selectedTranslation?.analysis
                                              ?.genealogicalFacts?.dates
                                          )?.length
                                        }
                                        )
                                      </Label>
                                      <div className="space-y-2">
                                        {(
                                          result?.genealogicalFacts?.dates ||
                                          selectedTranslation?.analysis
                                            ?.genealogicalFacts?.dates
                                        )?.map((date, index) => (
                                          <div
                                            key={index}
                                            className="p-3 bg-muted/30 rounded-lg"
                                          >
                                            <div className="flex items-center justify-between mb-2">
                                              <span className="font-medium">
                                                {date.text}
                                              </span>
                                              <Badge
                                                variant="outline"
                                                className="text-xs"
                                              >
                                                {date.type}
                                              </Badge>
                                            </div>
                                            {date.context && (
                                              <p className="text-xs text-muted-foreground">
                                                {date.context}
                                              </p>
                                            )}
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  )}

                                  {/* Places */}
                                  {((result?.genealogicalFacts?.places
                                    ?.length ?? 0) > 0 ||
                                    (selectedTranslation?.analysis
                                      ?.genealogicalFacts?.places?.length ??
                                      0) > 0) && (
                                    <div className="space-y-3">
                                      <Label className="text-sm font-medium flex items-center gap-2">
                                        <MapPin className="h-4 w-4" />
                                        Places (
                                        {
                                          (
                                            result?.genealogicalFacts?.places ||
                                            selectedTranslation?.analysis
                                              ?.genealogicalFacts?.places
                                          )?.length
                                        }
                                        )
                                      </Label>
                                      <div className="space-y-2">
                                        {(
                                          result?.genealogicalFacts?.places ||
                                          selectedTranslation?.analysis
                                            ?.genealogicalFacts?.places
                                        )?.map((place, index) => (
                                          <div
                                            key={index}
                                            className="p-3 bg-muted/30 rounded-lg"
                                          >
                                            <div className="mb-2">
                                              <span className="font-medium">
                                                {place.text}
                                              </span>
                                              {place.modernName && (
                                                <span className="text-muted-foreground ml-2">
                                                  ({place.modernName})
                                                </span>
                                              )}
                                            </div>
                                            {place.context && (
                                              <p className="text-xs text-muted-foreground">
                                                {place.context}
                                              </p>
                                            )}
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  )}

                                  {/* Relationships */}
                                  {((result?.genealogicalFacts?.relationships
                                    ?.length ?? 0) > 0 ||
                                    (selectedTranslation?.analysis
                                      ?.genealogicalFacts?.relationships
                                      ?.length ?? 0) > 0) && (
                                    <div className="space-y-3">
                                      <Label className="text-sm font-medium flex items-center gap-2">
                                        <Users className="h-4 w-4" />
                                        Relationships (
                                        {
                                          (
                                            result?.genealogicalFacts
                                              ?.relationships ||
                                            selectedTranslation?.analysis
                                              ?.genealogicalFacts?.relationships
                                          )?.length
                                        }
                                        )
                                      </Label>
                                      <div className="space-y-2">
                                        {(
                                          result?.genealogicalFacts
                                            ?.relationships ||
                                          selectedTranslation?.analysis
                                            ?.genealogicalFacts?.relationships
                                        )?.map((rel, index) => (
                                          <div
                                            key={index}
                                            className="p-3 bg-muted/30 rounded-lg"
                                          >
                                            <div className="flex items-center justify-between mb-2">
                                              <span className="font-medium">
                                                {rel.person1} ↔ {rel.person2}
                                              </span>
                                              <Badge
                                                variant="outline"
                                                className="text-xs"
                                              >
                                                {rel.type}
                                              </Badge>
                                            </div>
                                            {rel.context && (
                                              <p className="text-xs text-muted-foreground">
                                                {rel.context}
                                              </p>
                                            )}
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  )}
                                </>
                              ) : (
                                <div className="text-center py-12">
                                  <Users className="h-12 h-12 mx-auto text-muted-foreground mb-4" />
                                  <p className="text-muted-foreground">
                                    No genealogical facts extracted
                                  </p>
                                  <p className="text-sm text-muted-foreground mt-1">
                                    Try enabling fact extraction in the upload
                                    settings
                                  </p>
                                </div>
                              )}
                            </div>
                          </ScrollArea>
                        </TabsContent>

                        <TabsContent value="context" className="mt-6">
                          <ScrollArea className="h-[600px]">
                            <div className="space-y-4">
                              {(result?.contextualTerms?.length ?? 0) > 0 ||
                              (selectedTranslation?.analysis?.contextualTerms
                                ?.length ?? 0) > 0 ? (
                                <>
                                  <div className="flex items-center gap-2 mb-4">
                                    <BookOpen className="h-5 w-5" />
                                    <Label className="text-sm font-medium">
                                      Historical Context (
                                      {
                                        (
                                          result?.contextualTerms ||
                                          selectedTranslation?.analysis
                                            ?.contextualTerms
                                        )?.length
                                      }{" "}
                                      terms)
                                    </Label>
                                  </div>

                                  <div className="space-y-3">
                                    {(
                                      result?.contextualTerms ||
                                      selectedTranslation?.analysis
                                        ?.contextualTerms
                                    )?.map((term, index) => (
                                      <div
                                        key={index}
                                        className="p-4 border rounded-lg"
                                      >
                                        <div className="flex items-center gap-2 mb-3">
                                          <Badge
                                            variant={
                                              term.category === "historical"
                                                ? "default"
                                                : term.category === "legal"
                                                ? "destructive"
                                                : term.category === "religious"
                                                ? "secondary"
                                                : "outline"
                                            }
                                          >
                                            {term.category}
                                          </Badge>
                                          <span className="font-medium">
                                            {term.term}
                                          </span>
                                        </div>
                                        <p className="text-sm text-muted-foreground leading-relaxed">
                                          {term.explanation}
                                        </p>
                                      </div>
                                    ))}
                                  </div>
                                </>
                              ) : (
                                <div className="text-center py-12">
                                  <BookOpen className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                                  <p className="text-muted-foreground">
                                    No contextual terms found
                                  </p>
                                  <p className="text-sm text-muted-foreground mt-1">
                                    Try enabling contextual help in the upload
                                    settings
                                  </p>
                                </div>
                              )}

                              {/* Research Suggestions */}
                              {((result?.suggestions?.length ?? 0) > 0 ||
                                (selectedTranslation?.analysis?.suggestions
                                  ?.length ?? 0) > 0) && (
                                <div className="mt-8 pt-6 border-t">
                                  <div className="flex items-center gap-2 mb-4">
                                    <Lightbulb className="h-5 w-5" />
                                    <Label className="text-sm font-medium">
                                      Research Suggestions
                                    </Label>
                                  </div>

                                  <ul className="space-y-3">
                                    {(
                                      result?.suggestions ||
                                      selectedTranslation?.analysis?.suggestions
                                    )?.map((suggestion, index) => (
                                      <li
                                        key={index}
                                        className="flex items-start gap-3 text-sm"
                                      >
                                        <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                                        <span className="leading-relaxed">
                                          {suggestion}
                                        </span>
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              )}
                            </div>
                          </ScrollArea>
                        </TabsContent>
                      </Tabs>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              {/* History Tab */}
              <TabsContent value="history" className="mt-6">
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle>Translation History</CardTitle>
                        <CardDescription>
                          View and manage previous translations
                        </CardDescription>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => refreshTranslations()}
                      >
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Refresh
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="mb-4">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                          placeholder="Search translations..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="pl-9"
                        />
                      </div>
                    </div>

                    {translationsLoading ? (
                      <div className="text-center py-12">
                        <Loader2 className="w-8 h-8 mx-auto animate-spin text-muted-foreground mb-4" />
                        <p className="text-muted-foreground">
                          Loading translation history...
                        </p>
                      </div>
                    ) : filteredTranslations.length ? (
                      <ScrollArea className="h-[600px]">
                        <div className="space-y-4">
                          {filteredTranslations.map((translation) => (
                            <div
                              key={translation.id}
                              className="flex items-start gap-4 p-4 border rounded-lg hover:bg-muted/40 cursor-pointer transition-colors"
                              onClick={() => {
                                setSelectedTranslation(translation);
                                setResult(translation.analysis || null);
                                setCurrentTab("results");
                                setActiveResultTab("translation");
                              }}
                            >
                              <div className="w-16 h-16 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                                {translation.type === "image" ? (
                                  <div className="w-full h-full flex items-center justify-center">
                                    <FileText className="w-6 h-6 text-gray-400" />
                                  </div>
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center">
                                    <FileText className="w-6 h-6 text-gray-400" />
                                  </div>
                                )}
                              </div>

                              <div className="flex-1 min-w-0">
                                <div className="flex items-start justify-between">
                                  <div>
                                    <p className="font-medium text-sm truncate">
                                      {translation.sourceLanguage} →{" "}
                                      {translation.targetLanguage}
                                    </p>
                                    <p className="text-sm text-muted-foreground truncate">
                                      {translation.originalText.length > 100
                                        ? `${translation.originalText.substring(
                                            0,
                                            100
                                          )}...`
                                        : translation.originalText}
                                    </p>
                                    <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                                      <span className="flex items-center gap-1">
                                        <Clock className="w-3 h-3" />
                                        {new Date(
                                          translation.uploadedAt
                                        ).toLocaleDateString()}
                                      </span>
                                      <Badge
                                        variant="outline"
                                        className="text-xs"
                                      >
                                        {Math.round(
                                          translation.confidence * 100
                                        )}
                                        % confidence
                                      </Badge>
                                    </div>
                                  </div>

                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={async (e) => {
                                      e.stopPropagation();
                                      const success = await deleteTranslation(
                                        translation.id
                                      );
                                      if (success) {
                                        toast.success("Translation removed", {
                                          description: "Removed from history",
                                        });
                                      }
                                    }}
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </ScrollArea>
                    ) : (
                      <div className="text-center py-12">
                        <History className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                        <p className="text-muted-foreground">
                          {searchQuery
                            ? "No translations match your search criteria."
                            : "No translations yet"}
                        </p>
                        {!searchQuery && (
                          <p className="text-sm text-muted-foreground mt-1">
                            Upload and translate documents to see them here
                          </p>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>

          {/* Original Document Preview - Right Column */}
          <div className="lg:col-span-1 lg:order-3">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Original Document</CardTitle>
              </CardHeader>
              <CardContent>
                {imagePreview ||
                (selectedTranslation?.type === "image" &&
                  selectedTranslation?.viewUrl) ? (
                  <div className="space-y-4">
                    <div className="relative w-full aspect-[3/4] rounded-lg overflow-hidden border">
                      <img
                        src={selectedTranslation?.viewUrl || imagePreview || ""}
                        alt="Document preview"
                        className="w-full h-full object-contain bg-gray-50"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.style.display = "none";
                          const parent = target.parentElement;
                          if (
                            parent &&
                            !parent.querySelector(".fallback-doc-icon")
                          ) {
                            const fallbackDiv = document.createElement("div");
                            fallbackDiv.className =
                              "w-full h-full flex items-center justify-center bg-gray-50 fallback-doc-icon";
                            fallbackDiv.innerHTML =
                              '<svg class="w-12 h-12 text-gray-400" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clip-rule="evenodd"></path></svg>';
                            parent.appendChild(fallbackDiv);
                          }
                        }}
                      />
                    </div>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Name:</span>
                        <span className="font-medium truncate ml-2">
                          {selectedTranslation?.filename ||
                            selectedImage?.name ||
                            "Document"}
                        </span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="w-full aspect-[3/4] rounded-lg border border-dashed border-gray-300 flex items-center justify-center">
                    <div className="text-center text-gray-500">
                      <FileText className="w-12 h-12 mx-auto mb-2" />
                      <p className="text-sm">No document preview available</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
