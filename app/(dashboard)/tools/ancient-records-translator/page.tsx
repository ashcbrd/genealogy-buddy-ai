"use client";

import { useState } from "react";
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
} from "lucide-react";
import Link from "next/link";
import type { TranslationResult, TranslationFormData } from "@/types";
import { UsageInfo } from "@/components/ui/usage-info";
import { ToolUsageIndicator } from "@/components/ui/usage-display";
import { useSimpleAnalysisRefresh } from "@/hooks/use-analysis-with-refresh";
import { getToolErrorMessage } from "@/lib/error-handler";
import { useToolAccess } from "@/hooks/use-user-status";

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
  const [activeTab, setActiveTab] = useState<"image" | "text">("image");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>("");
  const [result, setResult] = useState<TranslationResult | null>(null);
  const [error, setError] = useState("");

  const { refreshUsageAfterAnalysis } = useSimpleAnalysisRefresh();
  const { usage, canUse } = useToolAccess("translations");
  const isAtUsageLimit = usage && !usage.unlimited && usage.used >= usage.limit;
  const hasNoAccess = !canUse;
  const shouldUpgrade = isAtUsageLimit || hasNoAccess;

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

      if (activeTab === "image" && selectedImage) {
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
      } else if (activeTab === "text" && formData.textInput.trim()) {
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
      await refreshUsageAfterAnalysis();
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
              <Languages className="h-3.5 w-3.5" />
              Ancient Records Translator
            </Badge>
          </div>
          <div className="flex items-center gap-4 mb-3">
            <div className="w-12 h-12 bg-blue-500/10 rounded-xl flex items-center justify-center">
              <Languages className="w-6 h-6 text-blue-600" />
            </div>
            <div className="flex-1">
              <h1 className="text-3xl md:text-4xl font-bold text-foreground">
                Ancient Records Translator & Contextualizer
              </h1>
              <p className="text-lg text-muted-foreground mt-1">
                OCR transcription, translation, and genealogical fact extraction
                from historical documents
              </p>
            </div>
            <div className="hidden sm:block">
              <ToolUsageIndicator tool="translations" />
            </div>
          </div>
        </div>

        <UsageInfo tool="translations" />

        {error && (
          <Alert variant="destructive" className="mb-6 animate-slide-up">
            <Info className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="grid gap-8 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            {/* Input Section */}
            <Card variant="elevated" className="animate-slide-up">
              <CardHeader>
                <CardTitle className="text-xl">Input Document</CardTitle>
                <CardDescription>
                  Upload an image or paste text from historical records
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs
                  value={activeTab}
                  onValueChange={(v) => setActiveTab(v as "image" | "text")}
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
              </CardContent>
            </Card>

            {/* Translation Settings */}
            <Card variant="elevated" className="animate-slide-up">
              <CardHeader>
                <CardTitle className="text-xl">Translation Settings</CardTitle>
                <CardDescription>
                  Configure language and analysis options
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
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
                    <Label htmlFor="targetLanguage">Target Language</Label>
                    <Select
                      value={formData.targetLanguage}
                      onValueChange={(value) =>
                        setFormData({ ...formData, targetLanguage: value })
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
                        setFormData({ ...formData, extractFacts: !!checked })
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
                        setFormData({ ...formData, contextualHelp: !!checked })
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
                    className="w-full hover-lift"
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
              </CardContent>
            </Card>
          </div>

          {/* Results Section */}
          <div className="space-y-6">
            {result ? (
              <>
                {/* Translation Results */}
                <Card variant="elevated" className="animate-slide-up">
                  <CardHeader>
                    <CardTitle className="text-xl flex items-center gap-2">
                      <Languages className="h-5 w-5" />
                      Translation
                    </CardTitle>
                    <CardDescription>
                      {result.sourceLanguage} → {result.targetLanguage}
                      <Badge variant="outline" className="ml-2">
                        {Math.round(result.confidence * 100)}% confidence
                      </Badge>
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">
                        Original Text
                      </Label>
                      <div className="p-3 bg-muted/30 rounded-lg text-sm">
                        {result.originalText}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Translation</Label>
                      <div className="p-3 bg-primary/5 border border-primary/20 rounded-lg">
                        {result.translatedText}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Contextual Terms */}
                {result.contextualTerms &&
                  result.contextualTerms.length > 0 && (
                    <Card variant="elevated" className="animate-slide-up">
                      <CardHeader>
                        <CardTitle className="text-xl flex items-center gap-2">
                          <BookOpen className="h-5 w-5" />
                          Historical Context
                        </CardTitle>
                        <CardDescription>
                          Explanations for historical, legal, and religious
                          terms
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          {result.contextualTerms.map((term, index) => (
                            <div key={index} className="p-3 border rounded-lg">
                              <div className="flex items-center gap-2 mb-2">
                                <Badge variant="secondary">
                                  {term.category}
                                </Badge>
                                <span className="font-medium">{term.term}</span>
                              </div>
                              <p className="text-sm text-muted-foreground">
                                {term.explanation}
                              </p>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}

                {/* Genealogical Facts */}
                {result.genealogicalFacts && (
                  <Card variant="elevated" className="animate-slide-up">
                    <CardHeader>
                      <CardTitle className="text-xl flex items-center gap-2">
                        <Users className="h-5 w-5" />
                        Extracted Facts
                      </CardTitle>
                      <CardDescription>
                        Structured genealogical information
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {result.genealogicalFacts.names.length > 0 && (
                        <div className="space-y-2">
                          <Label className="text-sm font-medium flex items-center gap-2">
                            <User className="h-4 w-4" />
                            Names
                          </Label>
                          <div className="space-y-2">
                            {result.genealogicalFacts.names.map(
                              (name, index) => (
                                <div
                                  key={index}
                                  className="p-2 bg-muted/30 rounded text-sm"
                                >
                                  <span className="font-medium">
                                    {name.text}
                                  </span>
                                  <Badge
                                    variant="outline"
                                    className="ml-2 text-xs"
                                  >
                                    {name.type}
                                  </Badge>
                                  {name.context && (
                                    <p className="text-xs text-muted-foreground mt-1">
                                      {name.context}
                                    </p>
                                  )}
                                </div>
                              )
                            )}
                          </div>
                        </div>
                      )}

                      {result.genealogicalFacts.dates.length > 0 && (
                        <div className="space-y-2">
                          <Label className="text-sm font-medium flex items-center gap-2">
                            <Calendar className="h-4 w-4" />
                            Dates
                          </Label>
                          <div className="space-y-2">
                            {result.genealogicalFacts.dates.map(
                              (date, index) => (
                                <div
                                  key={index}
                                  className="p-2 bg-muted/30 rounded text-sm"
                                >
                                  <span className="font-medium">
                                    {date.text}
                                  </span>
                                  <Badge
                                    variant="outline"
                                    className="ml-2 text-xs"
                                  >
                                    {date.type}
                                  </Badge>
                                  {date.context && (
                                    <p className="text-xs text-muted-foreground mt-1">
                                      {date.context}
                                    </p>
                                  )}
                                </div>
                              )
                            )}
                          </div>
                        </div>
                      )}

                      {result.genealogicalFacts.places.length > 0 && (
                        <div className="space-y-2">
                          <Label className="text-sm font-medium flex items-center gap-2">
                            <MapPin className="h-4 w-4" />
                            Places
                          </Label>
                          <div className="space-y-2">
                            {result.genealogicalFacts.places.map(
                              (place, index) => (
                                <div
                                  key={index}
                                  className="p-2 bg-muted/30 rounded text-sm"
                                >
                                  <span className="font-medium">
                                    {place.text}
                                  </span>
                                  {place.modernName && (
                                    <span className="text-muted-foreground ml-2">
                                      ({place.modernName})
                                    </span>
                                  )}
                                  {place.context && (
                                    <p className="text-xs text-muted-foreground mt-1">
                                      {place.context}
                                    </p>
                                  )}
                                </div>
                              )
                            )}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}

                {/* Suggestions */}
                {result.suggestions && result.suggestions.length > 0 && (
                  <Card variant="elevated" className="animate-slide-up">
                    <CardHeader>
                      <CardTitle className="text-xl">
                        Research Suggestions
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-2">
                        {result.suggestions.map((suggestion, index) => (
                          <li
                            key={index}
                            className="flex items-start gap-2 text-sm"
                          >
                            <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                            {suggestion}
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                )}
              </>
            ) : (
              <Card variant="elevated" className="animate-slide-up">
                <CardHeader>
                  <CardTitle className="text-xl">Results</CardTitle>
                  <CardDescription>
                    Translation and analysis results will appear here
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8">
                    <Languages className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">
                      Upload a document or enter text to begin translation
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
