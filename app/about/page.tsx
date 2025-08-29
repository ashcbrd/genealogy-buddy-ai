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
            Your friendly AI research companion, helping families discover their amazing stories together through advanced genealogy research and analysis.
          </p>
        </div>

        {/* Mission Section */}
        <div className="mb-16">
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl text-center">Our Mission</CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <p className="text-lg text-muted-foreground max-w-4xl mx-auto">
                We believe every family has incredible stories waiting to be discovered. Our mission is to make genealogy research accessible, enjoyable, and meaningful for everyone by combining the power of artificial intelligence with the passion of family history exploration.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Story Section */}
        <div className="grid md:grid-cols-2 gap-12 mb-16">
          <div>
            <h2 className="text-3xl font-bold mb-6">Our Story</h2>
            <div className="space-y-4 text-muted-foreground">
              <p>
                Genealogy Buddy AI was born from a simple observation: family history research is fascinating but often overwhelming. Traditional genealogy tools require extensive knowledge and countless hours of manual work.
              </p>
              <p>
                We envisioned a different approach - one where artificial intelligence could handle the heavy lifting while preserving the joy and personal connection of discovering your family's past.
              </p>
              <p>
                Today, we're proud to offer a suite of AI-powered tools that transform documents, photos, DNA data, and scattered information into meaningful family stories and comprehensive family trees.
              </p>
            </div>
          </div>
          <div>
            <h2 className="text-3xl font-bold mb-6">What Makes Us Different</h2>
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center text-primary-foreground text-sm font-bold mt-1">
                  ✓
                </div>
                <div>
                  <h3 className="font-semibold mb-1">AI-Powered Analysis</h3>
                  <p className="text-muted-foreground text-sm">Advanced AI understands genealogy context and relationships</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center text-primary-foreground text-sm font-bold mt-1">
                  ✓
                </div>
                <div>
                  <h3 className="font-semibold mb-1">User-Friendly Interface</h3>
                  <p className="text-muted-foreground text-sm">Intuitive design that anyone can use, regardless of tech experience</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center text-primary-foreground text-sm font-bold mt-1">
                  ✓
                </div>
                <div>
                  <h3 className="font-semibold mb-1">Comprehensive Tools</h3>
                  <p className="text-muted-foreground text-sm">Everything you need in one platform - documents, photos, DNA, trees</p>
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
          <h2 className="text-3xl font-bold text-center mb-8">Our Values</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <Card>
              <CardHeader>
                <CardTitle className="text-center">🏠 Family First</CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <p className="text-muted-foreground">
                  Every feature we build is designed to bring families closer together and celebrate their unique heritage.
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
                <CardTitle className="text-center">💡 Innovation</CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <p className="text-muted-foreground">
                  We continuously evolve our AI capabilities to provide more accurate and insightful genealogy research.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Team Section */}
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold mb-8">Built with ❤️ for Genealogy Enthusiasts</h2>
          <p className="text-lg text-muted-foreground mb-8 max-w-3xl mx-auto">
            Our team combines expertise in artificial intelligence, genealogy research, and user experience design to create tools that make family history research both powerful and accessible.
          </p>
          <div className="flex justify-center space-x-4">
            <Button asChild>
              <Link href="/tools">Try Our Tools</Link>
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
              <div className="text-3xl font-bold mb-2">10,000+</div>
              <div className="text-muted-foreground">Documents Analyzed</div>
            </div>
            <div>
              <div className="text-3xl font-bold mb-2">5,000+</div>
              <div className="text-muted-foreground">Family Trees Built</div>
            </div>
            <div>
              <div className="text-3xl font-bold mb-2">1,000+</div>
              <div className="text-muted-foreground">Photos Enhanced</div>
            </div>
            <div>
              <div className="text-3xl font-bold mb-2">95%</div>
              <div className="text-muted-foreground">User Satisfaction</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}