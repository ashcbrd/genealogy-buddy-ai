 
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
import { Progress } from "@/components/ui/progress";
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
  FileWarning,
  ArrowLeft,
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { Footer } from "@/components/footer";

interface AnalysisResult {
  id?: string;
  names: Array<{
    text: string;
    type: "person" | "place";
    confidence: number;
    context?: string;
  }>;
  dates: Array<{
    text: string;
    type: "birth" | "death" | "marriage" | "other";
    confidence: number;
    normalizedDate?: string;
    context?: string;
  }>;
  places: Array<{
    text: string;
    confidence: number;
    modernName?: string;
    coordinates?: { lat: number; lng: number };
    context?: string;
  }>;
  relationships: Array<{
    person1: string;
    person2: string;
    type: string;
    confidence: number;
    context?: string;
  }>;
  events: Array<{
    type: string;
    date?: string;
    place?: string;
    people: string[];
    description: string;
    confidence: number;
  }>;
  suggestions: string[];
  documentType?: string;
  language?: string;
  summary?: string;
}

interface SavedDocument {
  id: string;
  filename: string;
  uploadedAt: string;
  analysis?: AnalysisResult;
  notes?: string;
  tags?: string[];
}

export default function DocumentAnalyzerPage() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState("");
  const [progress, setProgress] = useState(0);
  const [activeTab, setActiveTab] = useState("upload");
  const [savedDocuments, setSavedDocuments] = useState<SavedDocument[]>([]);
  const [selectedDocument, setSelectedDocument] =
    useState<SavedDocument | null>(null);
  const [notes, setNotes] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

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

  const analyzeDocument = async () => {
    if (!file) return;
    setIsAnalyzing(true);
    setError("");
    setProgress(0);

    const int = setInterval(() => {
      setProgress((p) => (p >= 90 ? (clearInterval(int), 90) : p + 10));
    }, 450);

    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/tools/document/analyze", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Analysis failed");

      setAnalysis(data.analysis);
      setProgress(100);
      setActiveTab("results");

      toast("Analysis Complete", {
        description: "Your document has been successfully analyzed",
      });

      const newDoc: SavedDocument = {
        id: Date.now().toString(),
        filename: file.name,
        uploadedAt: new Date().toISOString(),
        analysis: data.analysis,
      };
      setSavedDocuments((prev) => [newDoc, ...prev]);
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : "Failed to analyze document";
      setError(msg);
      toast("Analysis Failed", { description: msg });
    } finally {
      setIsAnalyzing(false);
      setProgress(0);
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
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-foreground">
                Document Analyzer
              </h1>
              <p className="text-lg text-muted-foreground mt-1">
                Extract names, dates, places, and relationships from historical
                documents
              </p>
            </div>
          </div>
        </div>

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
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <Card>
                <CardHeader>
                  <CardTitle>Upload Document</CardTitle>
                  <CardDescription>
                    Drop a document to analyze and extract genealogy data.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div
                    {...getRootProps({
                      onClick: (e) => {
                        e.preventDefault();
                        open();
                      },
                    })}
                    className={[
                      "border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors",
                      isDragActive
                        ? "ring-heritage bg-muted/40"
                        : "border-border hover:bg-muted/40",
                    ].join(" ")}
                    aria-label="Document file dropzone"
                  >
                    <input {...getInputProps()} />
                    <div
                      className="mx-auto mb-4 grid place-items-center h-12 w-12 rounded-full"
                      style={{
                        background:
                          "color-mix(in oklab, var(--chart-1) 14%, transparent)",
                      }}
                    >
                      <Upload
                        className="w-6 h-6"
                        style={{ color: "var(--chart-1)" }}
                      />
                    </div>
                    {isDragActive ? (
                      <p>Drop the document here…</p>
                    ) : (
                      <>
                        <p className="mb-2">
                          Drag & drop a document, or click to select
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Formats: PNG/JPG/GIF/TIFF/WEBP or PDF • Max 10MB
                        </p>
                      </>
                    )}
                  </div>

                  {file && (
                    <div className="mt-4 rounded-lg border bg-card p-3">
                      <div className="flex items-center justify-between gap-2">
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate">
                            {file.name}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Size: {formatMB(file.size)}
                          </p>
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            setFile(null);
                            setPreview(null);
                            setAnalysis(null);
                          }}
                        >
                          Remove
                        </Button>
                      </div>
                    </div>
                  )}

                  {fileRejections.length > 0 && (
                    <Alert variant="destructive" className="mt-4">
                      <FileWarning className="h-4 w-4" />
                      <AlertDescription>
                        Unsupported file. Use PNG/JPG/GIF/TIFF/WEBP or PDF under
                        10MB.
                      </AlertDescription>
                    </Alert>
                  )}

                  {error && (
                    <Alert variant="destructive" className="mt-4">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  )}

                  {isAnalyzing && (
                    <div className="mt-4 space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span>Analyzing document…</span>
                        <span>{progress}%</span>
                      </div>
                      <Progress value={progress} className="h-2" />
                    </div>
                  )}

                  <Button
                    className="w-full mt-4"
                    onClick={analyzeDocument}
                    disabled={!file || isAnalyzing}
                    size="lg"
                  >
                    {isAnalyzing ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Analyzing…
                      </>
                    ) : (
                      <>
                        <Sparkles className="mr-2 h-4 w-4" />
                        Analyze Document
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>

              {/* Tips */}
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Tips for Best Results</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {[
                      [
                        "Use high-quality scans",
                        "300 DPI or higher improves OCR accuracy",
                      ],
                      [
                        "Ensure good contrast",
                        "Dark text on light background works best",
                      ],
                      ["Straight alignment", "Avoid skewed or rotated pages"],
                      [
                        "Complete pages",
                        "Include all relevant margins and notes",
                      ],
                    ].map(([h, d], i) => (
                      <div key={i} className="flex items-start gap-2">
                        <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 mt-0.5" />
                        <div>
                          <p className="font-medium">{h}</p>
                          <p className="text-sm text-muted-foreground">{d}</p>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>What We Extract</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <Feature
                      icon={<User className="w-4 h-4" />}
                      text="Names of people and places"
                    />
                    <Feature
                      icon={<Calendar className="w-4 h-4" />}
                      text="Dates (births, deaths, marriages)"
                    />
                    <Feature
                      icon={<MapPin className="w-4 h-4" />}
                      text="Locations and addresses"
                    />
                    <Feature
                      icon={<Users className="w-4 h-4" />}
                      text="Family relationships"
                    />
                    <Feature
                      icon={<FileText className="w-4 h-4" />}
                      text="Document type and context"
                    />
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* Results */}
          <TabsContent value="results" className="mt-6">
            {analysis && (
              <div className="space-y-6">
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
                              text: `Analysis of ${file?.name || "document"}: ${
                                analysis.names.length
                              } names, ${analysis.dates.length} dates, ${
                                analysis.places.length
                              } places.`,
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
                          <Share2 className="h-4 w-4 mr-1" />
                          Share
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
                          <Download className="h-4 w-4 mr-1" />
                          Export
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

                <Card>
                  <CardContent className="p-0">
                    <Tabs defaultValue="people" className="w-full">
                      <TabsList className="w-full justify-start rounded-none border-b">
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
                                      <p className="font-medium">{name.text}</p>
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
                                      Type: {date.type}
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
                                    <p className="font-medium">{place.text}</p>
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
                                        <Calendar className="w-3 h-3" />
                                        {ev.date}
                                      </span>
                                    )}
                                    {ev.place && (
                                      <span className="flex items-center gap-1">
                                        <MapPin className="w-3 h-3" />
                                        {ev.place}
                                      </span>
                                    )}
                                    {ev.people?.length ? (
                                      <span className="flex items-center gap-1">
                                        <Users className="w-3 h-3" />
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
                      onClick={() => {
                        if (!selectedDocument) return;
                        setSavedDocuments((prev) =>
                          prev.map((d) =>
                            d.id === selectedDocument.id
                              ? { ...d, notes, tags }
                              : d
                          )
                        );
                        toast("Notes Saved", {
                          description: "Your notes and tags have been saved",
                        });
                      }}
                    >
                      <Save className="mr-2 h-4 w-4" />
                      Save Notes
                    </Button>
                  </CardContent>
                </Card>
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
                {filteredDocuments.length ? (
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
                            }
                          }}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex items-start gap-3">
                              <FileText className="w-5 h-5 text-primary mt-0.5" />
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
                                        doc.analysis.names.filter(
                                          (n) => n.type === "person"
                                        ).length
                                      }{" "}
                                      people
                                    </span>
                                    <span className="flex items-center gap-1">
                                      <Calendar className="w-3 h-3" />
                                      {doc.analysis.dates.length} dates
                                    </span>
                                    <span className="flex items-center gap-1">
                                      <MapPin className="w-3 h-3" />
                                      {doc.analysis.places.length} places
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
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSavedDocuments((prev) =>
                                    prev.filter((d) => d.id !== doc.id)
                                  );
                                  toast("Document removed", {
                                    description: "Removed from history",
                                  });
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
