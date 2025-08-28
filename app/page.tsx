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
              AI for Genealogy & Family History
            </Badge>

            <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight text-foreground">
              Break Through Your
              <span className="block text-primary">Genealogy Brick Walls</span>
            </h1>

            <p className="text-xl md:text-2xl text-muted-foreground mb-8 max-w-3xl mx-auto leading-relaxed">
              No more squinting at 19th-century script. No more dead ends. Your
              AI research companion reads tough records, spots hidden
              connections, and turns scattered clues into share-worthy family
              stories.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-16">
              <Button size="lg" className="hover-lift animate-scale-in" asChild>
                <Link href="/register">
                  Break Through My Brick Wall — Free
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
                  250K+
                </div>
                <div className="text-sm text-muted-foreground">
                  Historical Pages Deciphered
                </div>
              </div>
              <div
                className="text-center animate-slide-up"
                style={{ animationDelay: "0.1s" }}
              >
                <div className="text-3xl font-bold text-primary mb-2">75K+</div>
                <div className="text-sm text-muted-foreground">
                  Family Lines Connected
                </div>
              </div>
              <div
                className="text-center animate-slide-up"
                style={{ animationDelay: "0.2s" }}
              >
                <div className="text-3xl font-bold text-primary mb-2">45K+</div>
                <div className="text-sm text-muted-foreground">
                  Guided Research Sessions
                </div>
              </div>
              <div
                className="text-center animate-slide-up"
                style={{ animationDelay: "0.3s" }}
              >
                <div className="text-3xl font-bold text-primary mb-2">25K+</div>
                <div className="text-sm text-muted-foreground">
                  Families Finding Answers
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="py-20">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4 text-foreground">
              6 Ways We Tackle Your Toughest Research Problems
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Every family historian hits the same snags: unreadable records,
              missing links, and photos with no names. Our AI doesn’t just{" "}
              <em>help</em>—it changes how you research. What once took months
              now takes minutes.
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
              Breakthroughs from Real Family Historians
            </h2>
            <p className="text-xl text-muted-foreground">
              Researchers and hobbyists are smashing brick walls and uncovering
              stories they thought were lost forever.
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
                  &quot;I stared at my great-grandmother’s marriage record for 3
                  years. This read the script in seconds and surfaced relatives
                  I never knew existed. Total breakthrough.&quot;
                </p>
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center text-primary-foreground mr-3">
                    S
                  </div>
                  <div>
                    <div className="font-semibold text-sm">Sarah Johnson</div>
                    <div className="text-xs text-muted-foreground">
                      Found a new branch
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
                  &quot;I’d been stuck on my 3rd great-grandfather. The
                  suggested connection lined up across time and place—saved me
                  months of digging.&quot;
                </p>
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white mr-3">
                    M
                  </div>
                  <div>
                    <div className="font-semibold text-sm">Michael Chen</div>
                    <div className="text-xs text-muted-foreground">
                      Traced to the 1820s
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
                  &quot;I uploaded a mystery photo from my abuela’s attic. It
                  dated the image, explained the clothing, and wrote the context
                  of that era. The picture finally has a story.&quot;
                </p>
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center text-white mr-3">
                    E
                  </div>
                  <div>
                    <div className="font-semibold text-sm">Emily Rodriguez</div>
                    <div className="text-xs text-muted-foreground">
                      47 photos identified
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
              Ready to Meet Your Research Buddy?
            </h2>
            <p className="text-xl text-muted-foreground mb-8">
              Join thousands of family historians turning clues into confident
              conclusions—with an AI partner built for genealogy.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" className="hover-lift" asChild>
                <Link href="/register">
                  Meet Your Buddy — Free
                  <ArrowRight className="ml-2 w-4 h-4" />
                </Link>
              </Button>
              <Button
                variant="outline"
                size="lg"
                className="hover-lift"
                asChild
              >
                <Link href="/login">Welcome Back</Link>
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
