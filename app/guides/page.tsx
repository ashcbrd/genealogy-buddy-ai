import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Navigation } from "@/components/ui/navigation";
import { Footer } from "@/components/footer";

export default function GuidesPage() {
  return (
    <div className="min-h-screen bg-background">
      <Navigation variant="landing" />
      <div className="container mx-auto px-4 py-12">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-4xl font-bold mb-4">Research Methodology Guides</h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Professional guides to help you master Genealogy Buddy AI's research tools and apply advanced genealogical methodology in your investigations.
          </p>
        </div>

        {/* Quick Start Section */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold mb-8">Quick Start Guides</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <span className="text-2xl">🚀</span>
                  <span>Getting Started</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4">
                  Complete beginner's guide to setting up your research account and uploading your first genealogical documents.
                </p>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">5 min read</span>
                  <Button variant="link" size="sm" className="p-0">
                    Read Guide →
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <span className="text-2xl">📁</span>
                  <span>File Upload Best Practices</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4">
                  Learn how to prepare and upload genealogical documents for optimal AI analysis results.
                </p>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">3 min read</span>
                  <Button variant="link" size="sm" className="p-0">
                    Read Guide →
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <span className="text-2xl">🎯</span>
                  <span>Understanding AI Results</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4">
                  How to interpret AI analysis results and what to do when corrections are needed.
                </p>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">7 min read</span>
                  <Button variant="link" size="sm" className="p-0">
                    Read Guide →
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Tool-Specific Guides */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold mb-8">Tool-Specific Guides</h2>
          
          <div className="space-y-8">
            {/* Document Analyzer */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center text-white text-xl">
                    📄
                  </div>
                  <span>Document Analyzer</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-6">
                  Master the Document Analyzer to extract valuable genealogy information from historical documents, certificates, and records.
                </p>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div className="p-4 bg-muted/50 rounded-lg">
                    <h4 className="font-semibold mb-2">Basic Document Upload</h4>
                    <p className="text-sm text-muted-foreground">Learn to upload and analyze your first document</p>
                  </div>
                  <div className="p-4 bg-muted/50 rounded-lg">
                    <h4 className="font-semibold mb-2">Handling Poor Quality Scans</h4>
                    <p className="text-sm text-muted-foreground">Tips for analyzing damaged or unclear documents</p>
                  </div>
                  <div className="p-4 bg-muted/50 rounded-lg">
                    <h4 className="font-semibold mb-2">Batch Processing</h4>
                    <p className="text-sm text-muted-foreground">Upload and analyze multiple documents efficiently</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Photo Storyteller */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center text-white text-xl">
                    📸
                  </div>
                  <span>Photo Storyteller</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-6">
                  Transform historical photographs into rich genealogical narratives with AI-powered enhancement and research analysis.
                </p>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div className="p-4 bg-muted/50 rounded-lg">
                    <h4 className="font-semibold mb-2">Photo Enhancement</h4>
                    <p className="text-sm text-muted-foreground">Restore and improve historical research photos</p>
                  </div>
                  <div className="p-4 bg-muted/50 rounded-lg">
                    <h4 className="font-semibold mb-2">Historical Narratives</h4>
                    <p className="text-sm text-muted-foreground">Create research narratives from historical photographs</p>
                  </div>
                  <div className="p-4 bg-muted/50 rounded-lg">
                    <h4 className="font-semibold mb-2">Dating Photos</h4>
                    <p className="text-sm text-muted-foreground">Estimate when historical photos were taken</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* DNA Interpreter */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-purple-500 rounded-lg flex items-center justify-center text-white text-xl">
                    🧬
                  </div>
                  <span>DNA Interpreter</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-6">
                  Understand your DNA results and discover genetic connections to build your family tree.
                </p>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div className="p-4 bg-muted/50 rounded-lg">
                    <h4 className="font-semibold mb-2">Uploading DNA Data</h4>
                    <p className="text-sm text-muted-foreground">Import results from major DNA testing companies</p>
                  </div>
                  <div className="p-4 bg-muted/50 rounded-lg">
                    <h4 className="font-semibold mb-2">Match Analysis</h4>
                    <p className="text-sm text-muted-foreground">Understand relationship predictions and confidence levels</p>
                  </div>
                  <div className="p-4 bg-muted/50 rounded-lg">
                    <h4 className="font-semibold mb-2">Ethnicity Insights</h4>
                    <p className="text-sm text-muted-foreground">Explore your ancestral origins and migrations</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Tree Builder */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-orange-500 rounded-lg flex items-center justify-center text-white text-xl">
                    🌳
                  </div>
                  <span>Tree Builder</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-6">
                  Create comprehensive genealogical research trees automatically using AI analysis from all your research sources.
                </p>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div className="p-4 bg-muted/50 rounded-lg">
                    <h4 className="font-semibold mb-2">Auto Tree Generation</h4>
                    <p className="text-sm text-muted-foreground">Let AI build your genealogical tree from uploaded research sources</p>
                  </div>
                  <div className="p-4 bg-muted/50 rounded-lg">
                    <h4 className="font-semibold mb-2">Manual Research Editing</h4>
                    <p className="text-sm text-muted-foreground">Add, edit, and organize genealogical subjects</p>
                  </div>
                  <div className="p-4 bg-muted/50 rounded-lg">
                    <h4 className="font-semibold mb-2">Exporting Trees</h4>
                    <p className="text-sm text-muted-foreground">Download in multiple formats for sharing</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Research Copilot */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-red-500 rounded-lg flex items-center justify-center text-white text-xl">
                    🔍
                  </div>
                  <span>Research Copilot</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-6">
                  Get AI-powered research assistance to discover new genealogical connections and break through research brick walls.
                </p>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div className="p-4 bg-muted/50 rounded-lg">
                    <h4 className="font-semibold mb-2">Research Strategies</h4>
                    <p className="text-sm text-muted-foreground">Get personalized research recommendations</p>
                  </div>
                  <div className="p-4 bg-muted/50 rounded-lg">
                    <h4 className="font-semibold mb-2">Record Suggestions</h4>
                    <p className="text-sm text-muted-foreground">Discover relevant records and sources</p>
                  </div>
                  <div className="p-4 bg-muted/50 rounded-lg">
                    <h4 className="font-semibold mb-2">Hypothesis Testing</h4>
                    <p className="text-sm text-muted-foreground">Validate genealogy theories with AI analysis</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Advanced Topics */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold mb-8">Advanced Topics</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>🔒 Data Privacy & Security</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4">
                  Understanding how your genealogical research data is protected, encrypted, and managed.
                </p>
                <Button variant="link" size="sm" className="p-0">
                  Read Privacy Guide →
                </Button>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>📊 Managing Large Projects</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4">
                  Strategies for organizing extensive genealogical research projects.
                </p>
                <Button variant="link" size="sm" className="p-0">
                  Read Organization Guide →
                </Button>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>🔄 Data Import/Export</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4">
                  Moving data between genealogy platforms and creating backups.
                </p>
                <Button variant="link" size="sm" className="p-0">
                  Read Import Guide →
                </Button>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>🎯 Research Best Practices</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4">
                  Professional genealogy research techniques and methodologies.
                </p>
                <Button variant="link" size="sm" className="p-0">
                  Read Research Guide →
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Help Section */}
        <div className="bg-muted/20 rounded-lg p-8 text-center">
          <h2 className="text-2xl font-bold mb-4">Need More Help?</h2>
          <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
            Can't find the guide you need? Browse our help center or reach out to our support team for personalized assistance.
          </p>
          <div className="flex justify-center space-x-4">
            <Button asChild>
              <Link href="/help">Visit Help Center</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/contact">Contact Support</Link>
            </Button>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}