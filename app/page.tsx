import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Navigation } from "@/components/ui/navigation";
import Link from "next/link";
import {
  FileText,
  Dna,
  TreePine,
  Camera,
  MessageCircle,
  Users,
  Star,
  ArrowRight,
  Sparkles,
} from "lucide-react";
import { Footer } from "@/components/footer";

export default function Home() {
  return (
    <div className="min-h-screen bg-background">
      <Navigation variant="landing" />

      <div className="container mx-auto px-4">
        {/* Hero Section */}
        <section className="py-20 text-center animate-fade-in">
          <div className="max-w-4xl mx-auto">
            <Badge variant="clean" className="mb-6 animate-bounce-gentle">
              <Sparkles className="w-4 h-4 mr-2" />
              AI for Genealogy Research
            </Badge>

            <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight text-foreground">
              Advanced AI Tools for
              <span className="block text-primary">Genealogy Research</span>
            </h1>

            <p className="text-xl md:text-2xl text-muted-foreground mb-8 max-w-3xl mx-auto leading-relaxed">
              Decode handwritten records, analyze DNA data, interpret historical photos, and build comprehensive research trees. Professional-grade genealogy research tools powered by advanced AI.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-16">
              <Button size="lg" className="hover-lift animate-scale-in" asChild>
                <Link href="/register">
                  Start Researching — Free
                  <ArrowRight className="ml-2 w-4 h-4" />
                </Link>
              </Button>
              <Button
                variant="outline"
                size="lg"
                className="hover-lift animate-scale-in"
                asChild
              >
                <Link href="/login">Sign In</Link>
              </Button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-2xl mx-auto mb-20">
              <div className="text-center animate-slide-up">
                <div className="text-3xl font-bold text-primary mb-2">
                  50+
                </div>
                <div className="text-sm text-muted-foreground">
                  Research Document Types
                </div>
              </div>
              <div
                className="text-center animate-slide-up"
                style={{ animationDelay: "0.1s" }}
              >
                <div className="text-3xl font-bold text-primary mb-2">5</div>
                <div className="text-sm text-muted-foreground">
                  Research Tools
                </div>
              </div>
              <div
                className="text-center animate-slide-up"
                style={{ animationDelay: "0.2s" }}
              >
                <div className="text-3xl font-bold text-primary mb-2">24/7</div>
                <div className="text-sm text-muted-foreground">
                  Research Support
                </div>
              </div>
              <div
                className="text-center animate-slide-up"
                style={{ animationDelay: "0.3s" }}
              >
                <div className="text-3xl font-bold text-primary mb-2">100%</div>
                <div className="text-sm text-muted-foreground">
                  Privacy Protected
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="py-20">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4 text-foreground">
              Professional Research Tools for Genealogists
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Professional genealogy research requires precision, expertise, and the right tools. Our AI-powered platform delivers advanced analysis capabilities that transform how researchers approach historical documentation and data interpretation.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {/* Feature Cards */}
            <Card
              variant="elevated"
              hover="lift"
              className="text-center animate-slide-up"
            >
              <CardHeader>
                <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center text-primary text-2xl mb-4 mx-auto">
                  <FileText className="w-8 h-8" />
                </div>
                <CardTitle>Decipher Impossible Handwriting</CardTitle>
                <CardDescription>
                  Read church, civil, and immigration records with confidence
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Faded ink? Flourished script? Our AI teases out names, dates,
                  places, and relationships—even when the page looks hopeless.
                </p>
              </CardContent>
            </Card>

            <Card
              variant="elevated"
              hover="lift"
              className="text-center animate-slide-up"
              style={{ animationDelay: "0.1s" }}
            >
              <CardHeader>
                <div className="w-16 h-16 bg-blue-500/10 rounded-2xl flex items-center justify-center text-blue-600 text-2xl mb-4 mx-auto">
                  <Dna className="w-8 h-8" />
                </div>
                <CardTitle>Make Sense of Your DNA</CardTitle>
                <CardDescription>
                  From percentages to people—and the stories between them
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Turn match lists into likely relationships, migration paths,
                  and research leads you can actually follow.
                </p>
              </CardContent>
            </Card>

            <Card
              variant="elevated"
              hover="lift"
              className="text-center animate-slide-up"
              style={{ animationDelay: "0.2s" }}
            >
              <CardHeader>
                <div className="w-16 h-16 bg-green-500/10 rounded-2xl flex items-center justify-center text-green-600 text-2xl mb-4 mx-auto">
                  <Camera className="w-8 h-8" />
                </div>
                <CardTitle>Date & Decode Old Photos</CardTitle>
                <CardDescription>
                  Identify eras, occasions, and context at a glance
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Analyze clothing, backdrops, and artifacts to narrow time and
                  place—then add narrative that brings each image to life.
                </p>
              </CardContent>
            </Card>

            <Card
              variant="elevated"
              hover="lift"
              className="text-center animate-slide-up"
              style={{ animationDelay: "0.3s" }}
            >
              <CardHeader>
                <div className="w-16 h-16 bg-purple-500/10 rounded-2xl flex items-center justify-center text-purple-600 text-2xl mb-4 mx-auto">
                  <TreePine className="w-8 h-8" />
                </div>
                <CardTitle>Suggest Connections That Stick</CardTitle>
                <CardDescription>
                  Map people, places, and timelines—without the guesswork
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Spot patterns across records and locations, surface variant
                  spellings, and connect the dots you’ve been missing.
                </p>
              </CardContent>
            </Card>

            <Card
              variant="elevated"
              hover="lift"
              className="text-center animate-slide-up"
              style={{ animationDelay: "0.4s" }}
            >
              <CardHeader>
                <div className="w-16 h-16 bg-orange-500/10 rounded-2xl flex items-center justify-center text-orange-600 text-2xl mb-4 mx-auto">
                  <MessageCircle className="w-8 h-8" />
                </div>
                <CardTitle>Your Research Strategist</CardTitle>
                <CardDescription>
                  Step-by-step plans for any brick-wall ancestor
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Get prioritized next steps: alternate sources, locality-based
                  strategies, and wildcard tactics that open new paths.
                </p>
              </CardContent>
            </Card>

            <Card
              variant="elevated"
              hover="lift"
              className="text-center animate-slide-up"
              style={{ animationDelay: "0.5s" }}
            >
              <CardHeader>
                <div className="w-16 h-16 bg-cyan-500/10 rounded-2xl flex items-center justify-center text-cyan-600 text-2xl mb-4 mx-auto">
                  <Users className="w-8 h-8" />
                </div>
                <CardTitle>Collaborate Like a Pro</CardTitle>
                <CardDescription>
                  Compare notes, share sources, and build together
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Stop duplicating effort. Work with cousins and research
                  partners to confirm findings and accelerate discoveries.
                </p>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Testimonials */}
        <section className="py-20 bg-muted/30 rounded-3xl my-20">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4 text-foreground">
              Researcher Feedback from Beta Testing
            </h2>
            <p className="text-xl text-muted-foreground">
              Professional genealogists and researchers share their experience with our advanced AI research platform.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card variant="clean" className="animate-scale-in">
              <CardContent className="pt-6">
                <div className="flex items-center mb-4">
                  <div className="flex text-yellow-500">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-current" />
                    ))}
                  </div>
                </div>
                <p className="text-sm text-muted-foreground mb-4">
                  &quot;The document analysis capabilities are impressive. It accurately extracted genealogical data from complex handwritten records that I'd struggled with for months.&quot;
                </p>
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center text-primary-foreground mr-3">
                    S
                  </div>
                  <div>
                    <div className="font-semibold text-sm">Sarah J.</div>
                    <div className="text-xs text-muted-foreground">
                      Professional Genealogist
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card
              variant="clean"
              className="animate-scale-in"
              style={{ animationDelay: "0.1s" }}
            >
              <CardContent className="pt-6">
                <div className="flex items-center mb-4">
                  <div className="flex text-yellow-500">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-current" />
                    ))}
                  </div>
                </div>
                <p className="text-sm text-muted-foreground mb-4">
                  &quot;The AI research algorithms provide well-supported hypotheses for lineage connections. The confidence scoring helps me prioritize which leads to investigate further.&quot;
                </p>
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white mr-3">
                    M
                  </div>
                  <div>
                    <div className="font-semibold text-sm">Michael C.</div>
                    <div className="text-xs text-muted-foreground">
                      Research Specialist
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card
              variant="clean"
              className="animate-scale-in"
              style={{ animationDelay: "0.2s" }}
            >
              <CardContent className="pt-6">
                <div className="flex items-center mb-4">
                  <div className="flex text-yellow-500">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-current" />
                    ))}
                  </div>
                </div>
                <p className="text-sm text-muted-foreground mb-4">
                  &quot;The historical photo analysis provides detailed contextual information and dating estimates that significantly enhance my research documentation and evidence evaluation.&quot;
                </p>
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center text-white mr-3">
                    E
                  </div>
                  <div>
                    <div className="font-semibold text-sm">Emily R.</div>
                    <div className="text-xs text-muted-foreground">
                      Independent Researcher
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 text-center">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-4xl md:text-5xl font-bold mb-6 text-foreground">
              Advanced Genealogy Research Tools
            </h2>
            <p className="text-xl text-muted-foreground mb-8">
              Join professional genealogists and researchers using AI-powered tools to analyze historical documents, interpret data, and conduct thorough genealogical investigations.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" className="hover-lift" asChild>
                <Link href="/register">
                  Start Research Tools — Free
                  <ArrowRight className="ml-2 w-4 h-4" />
                </Link>
              </Button>
              <Button
                variant="outline"
                size="lg"
                className="hover-lift"
                asChild
              >
                <Link href="/login">Researcher Sign In</Link>
              </Button>
            </div>
          </div>
        </section>
      </div>

      {/* Footer */}
      <Footer />
    </div>
  );
}
