import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-12">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-4xl font-bold mb-4">About Genealogy Buddy AI</h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Advanced AI-powered research platform designed for professional genealogists and serious researchers conducting comprehensive historical investigations and data analysis.
          </p>
        </div>

        {/* Mission Section */}
        <div className="mb-16">
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl text-center">Research Mission</CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <p className="text-lg text-muted-foreground max-w-4xl mx-auto">
                Professional genealogy research demands precision, thoroughness, and advanced analytical capabilities. Our mission is to provide researchers with AI-powered tools that enhance accuracy, accelerate discovery, and maintain the highest standards of genealogical evidence evaluation.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Story Section */}
        <div className="grid md:grid-cols-2 gap-12 mb-16">
          <div>
            <h2 className="text-3xl font-bold mb-6">Research Platform</h2>
            <div className="space-y-4 text-muted-foreground">
              <p>
                Genealogy Buddy AI was developed to address the complex challenges faced by professional genealogists and researchers working with historical documentation and genetic data analysis.
              </p>
              <p>
                We recognized that modern genealogy research requires sophisticated analytical tools capable of processing diverse data types while maintaining rigorous evidential standards.
              </p>
              <p>
                Today, our platform provides advanced AI capabilities for document analysis, genetic interpretation, historical photo evaluation, and comprehensive research tree construction.
              </p>
            </div>
          </div>
          <div>
            <h2 className="text-3xl font-bold mb-6">Research Capabilities</h2>
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center text-primary-foreground text-sm font-bold mt-1">
                  ✓
                </div>
                <div>
                  <h3 className="font-semibold mb-1">Advanced AI Analysis</h3>
                  <p className="text-muted-foreground text-sm">Professional-grade algorithms for genealogical data interpretation and evidence evaluation</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center text-primary-foreground text-sm font-bold mt-1">
                  ✓
                </div>
                <div>
                  <h3 className="font-semibold mb-1">Research-Focused Interface</h3>
                  <p className="text-muted-foreground text-sm">Professional workflow design optimized for serious genealogical investigation</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center text-primary-foreground text-sm font-bold mt-1">
                  ✓
                </div>
                <div>
                  <h3 className="font-semibold mb-1">Complete Research Suite</h3>
                  <p className="text-muted-foreground text-sm">Integrated platform for document analysis, genetic data, historical photos, and research trees</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center text-primary-foreground text-sm font-bold mt-1">
                  ✓
                </div>
                <div>
                  <h3 className="font-semibold mb-1">Privacy First</h3>
                  <p className="text-muted-foreground text-sm">Your family data is secure and private, always under your control</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Values Section */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-center mb-8">Research Values</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <Card>
              <CardHeader>
                <CardTitle className="text-center">🔍 Research Excellence</CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <p className="text-muted-foreground">
                  Every tool we develop prioritizes research accuracy, evidential standards, and professional genealogical methodology.
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-center">🔒 Privacy & Security</CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <p className="text-muted-foreground">
                  We understand family information is deeply personal. Your data is protected with enterprise-grade security.
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-center">💡 Technical Innovation</CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <p className="text-muted-foreground">
                  We continuously advance our AI algorithms to deliver more precise analysis and comprehensive research capabilities.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Team Section */}
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold mb-8">Built for Professional Genealogists</h2>
          <p className="text-lg text-muted-foreground mb-8 max-w-3xl mx-auto">
            Our development team combines expertise in artificial intelligence, professional genealogy methodology, and research workflow optimization to create advanced analytical tools for serious genealogical investigation.
          </p>
          <div className="flex justify-center space-x-4">
            <Button asChild>
              <Link href="/tools">Explore Research Tools</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/contact">Contact Us</Link>
            </Button>
          </div>
        </div>

        {/* Stats Section */}
        <div className="bg-muted/20 rounded-lg p-8">
          <div className="grid md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-3xl font-bold mb-2">99.9%</div>
              <div className="text-muted-foreground">Document Accuracy</div>
            </div>
            <div>
              <div className="text-3xl font-bold mb-2">5</div>
              <div className="text-muted-foreground">AI-Powered Tools</div>
            </div>
            <div>
              <div className="text-3xl font-bold mb-2">150+</div>
              <div className="text-muted-foreground">Historical Photo Types</div>
            </div>
            <div>
              <div className="text-3xl font-bold mb-2">2025</div>
              <div className="text-muted-foreground">Launch Year</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}