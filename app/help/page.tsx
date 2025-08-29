import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Navigation } from "@/components/ui/navigation";
import { Footer } from "@/components/footer";

export default function HelpPage() {
  return (
    <div className="min-h-screen bg-background">
      <Navigation variant="landing" />
      <div className="container mx-auto px-4 py-12">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-4xl font-bold mb-4">Research Help Center</h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Find answers to research questions and learn how to maximize Genealogy Buddy AI's professional research capabilities.
          </p>
        </div>

        {/* Quick Actions */}
        <div className="grid md:grid-cols-3 gap-6 mb-16">
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="text-center">📚 User Guides</CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <p className="text-muted-foreground mb-4">
                Step-by-step tutorials for all our research tools
              </p>
              <Button asChild variant="outline" className="w-full">
                <Link href="/guides">Browse Guides</Link>
              </Button>
            </CardContent>
          </Card>
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="text-center">💬 Community</CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <p className="text-muted-foreground mb-4">
                Connect with other professional genealogy researchers
              </p>
              <Button asChild variant="outline" className="w-full">
                <Link href="/community">Join Community</Link>
              </Button>
            </CardContent>
          </Card>
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="text-center">📞 Contact Support</CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <p className="text-muted-foreground mb-4">
                Get personalized help from our team
              </p>
              <Button asChild variant="outline" className="w-full">
                <Link href="/contact">Contact Us</Link>
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Getting Started */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold mb-8">Getting Started</h2>
          <div className="grid md:grid-cols-2 gap-8">
            <Card>
              <CardHeader>
                <CardTitle>🚀 Quick Start Guide</CardTitle>
              </CardHeader>
              <CardContent>
                <ol className="space-y-3 text-muted-foreground">
                  <li className="flex items-start space-x-3">
                    <span className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">1</span>
                    <span>Create your account and complete your profile</span>
                  </li>
                  <li className="flex items-start space-x-3">
                    <span className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">2</span>
                    <span>Upload your first research document or historical photo</span>
                  </li>
                  <li className="flex items-start space-x-3">
                    <span className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">3</span>
                    <span>Let our AI analyze and extract genealogical data</span>
                  </li>
                  <li className="flex items-start space-x-3">
                    <span className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">4</span>
                    <span>Start building your research tree</span>
                  </li>
                </ol>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>🛠️ Our Tools</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="border-l-4 border-primary pl-4">
                    <h4 className="font-semibold">Document Analyzer</h4>
                    <p className="text-sm text-muted-foreground">Extract genealogical data, dates, and relationships from historical documents</p>
                  </div>
                  <div className="border-l-4 border-primary pl-4">
                    <h4 className="font-semibold">Photo Storyteller</h4>
                    <p className="text-sm text-muted-foreground">Enhance and analyze historical photographs for research purposes</p>
                  </div>
                  <div className="border-l-4 border-primary pl-4">
                    <h4 className="font-semibold">DNA Interpreter</h4>
                    <p className="text-sm text-muted-foreground">Understand your DNA results and find connections</p>
                  </div>
                  <div className="border-l-4 border-primary pl-4">
                    <h4 className="font-semibold">Tree Builder</h4>
                    <p className="text-sm text-muted-foreground">Create comprehensive genealogical research trees automatically</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Popular Topics */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold mb-8">Popular Help Topics</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card>
              <CardContent className="p-6">
                <h3 className="font-semibold mb-2">How to upload documents?</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Learn about supported file formats and best practices for document uploads.
                </p>
                <Button variant="link" size="sm" className="p-0">
                  Read More →
                </Button>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <h3 className="font-semibold mb-2">Understanding AI accuracy</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  How our AI works and what to do if results need correction.
                </p>
                <Button variant="link" size="sm" className="p-0">
                  Read More →
                </Button>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <h3 className="font-semibold mb-2">Exporting family trees</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Download your genealogical research tree in various formats for sharing or backup.
                </p>
                <Button variant="link" size="sm" className="p-0">
                  Read More →
                </Button>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <h3 className="font-semibold mb-2">Privacy and data security</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  How we protect your genealogical research data and information.
                </p>
                <Button variant="link" size="sm" className="p-0">
                  Read More →
                </Button>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <h3 className="font-semibold mb-2">Subscription and billing</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Manage your subscription, view usage, and billing information.
                </p>
                <Button variant="link" size="sm" className="p-0">
                  Read More →
                </Button>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <h3 className="font-semibold mb-2">Troubleshooting errors</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Common issues and their solutions to keep you researching.
                </p>
                <Button variant="link" size="sm" className="p-0">
                  Read More →
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Contact Section */}
        <div className="bg-muted/20 rounded-lg p-8 text-center">
          <h2 className="text-2xl font-bold mb-4">Still need help?</h2>
          <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
            Can't find what you're looking for? Our support team is here to help you with any questions about Genealogy Buddy AI.
          </p>
          <div className="flex justify-center space-x-4">
            <Button asChild>
              <Link href="/contact">Contact Support</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/community">Join Community</Link>
            </Button>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}