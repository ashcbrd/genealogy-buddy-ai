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
              AI-Powered Family Research
            </Badge>

            <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight text-foreground">
              Your AI Research
              <span className="block text-primary">Buddy Awaits</span>
            </h1>

            <p className="text-xl md:text-2xl text-muted-foreground mb-8 max-w-3xl mx-auto leading-relaxed">
              Meet your new genealogy companion! We'll help you uncover family stories, 
              analyze documents, and build your family tree together. It's like having 
              an expert researcher by your side, 24/7.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-16">
              <Button size="lg" className="hover-lift animate-scale-in" asChild>
                <Link href="/register">
                  Meet Your Buddy - Free!
                  <ArrowRight className="ml-2 w-4 h-4" />
                </Link>
              </Button>
              <Button
                variant="outline"
                size="lg"
                className="hover-lift animate-scale-in"
                asChild
              >
                <Link href="/tools">Try Tools Now</Link>
              </Button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-2xl mx-auto mb-20">
              <div className="text-center animate-slide-up">
                <div className="text-3xl font-bold text-primary mb-2">250K+</div>
                <div className="text-sm text-muted-foreground">
                  Documents Analyzed
                </div>
              </div>
              <div
                className="text-center animate-slide-up"
                style={{ animationDelay: "0.1s" }}
              >
                <div className="text-3xl font-bold text-primary mb-2">75K+</div>
                <div className="text-sm text-muted-foreground">
                  Family Trees Built
                </div>
              </div>
              <div
                className="text-center animate-slide-up"
                style={{ animationDelay: "0.2s" }}
              >
                <div className="text-3xl font-bold text-primary mb-2">45K+</div>
                <div className="text-sm text-muted-foreground">
                  Research Sessions
                </div>
              </div>
              <div
                className="text-center animate-slide-up"
                style={{ animationDelay: "0.3s" }}
              >
                <div className="text-3xl font-bold text-primary mb-2">25K+</div>
                <div className="text-sm text-muted-foreground">Happy Families</div>
              </div>
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="py-20">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4 text-foreground">
              Your Buddy's Superpowers
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Think of our AI as your research buddy — always ready to analyze, suggest, 
              and guide you through your family history journey. It's highly accurate at 
              spotting details and patterns, but because genealogy requires careful confirmation, 
              we recommend using its insights as trusted leads, then validating them with official records.
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
                <CardTitle>Document Detective</CardTitle>
                <CardDescription>
                  Your buddy reads old handwriting better than most humans!
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Upload birth certificates, marriage records, or any family document. 
                  Your AI buddy will carefully extract names, dates, locations, and 
                  relationships, even from faded or difficult handwriting.
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
                <CardTitle>DNA Story Teller</CardTitle>
                <CardDescription>
                  Let your buddy translate your DNA into fascinating stories
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Share your DNA results and watch as your buddy reveals your ancestors' 
                  migration journeys, explains complex genetic connections, and helps 
                  you understand what those percentages really mean for your family story.
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
                <CardTitle>Photo Time Machine</CardTitle>
                <CardDescription>
                  Your buddy brings old family photos back to life
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Show your buddy those mysterious old family photos! It'll estimate when 
                  they were taken, describe the clothing and setting, and even create 
                  beautiful stories about what life might have been like for your ancestors.
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
                <CardTitle>Tree Growing Assistant</CardTitle>
                <CardDescription>
                  Your buddy helps your family tree flourish with smart suggestions
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Start with what you know, and let your buddy suggest missing pieces! 
                  It'll spot potential relatives, fill in timeline gaps, and help you 
                  build a comprehensive family tree that tells your complete story.
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
                <CardTitle>Research Coach</CardTitle>
                <CardDescription>
                  Chat with your buddy whenever you hit a research roadblock
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Stuck on a tricky ancestor? Just ask! Your buddy loves solving genealogy 
                  puzzles and will suggest research strategies, recommend records to check, 
                  and help you think through challenging family mysteries.
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
                <CardTitle>Family Network Hub</CardTitle>
                <CardDescription>
                  Your buddy helps you connect with fellow family researchers
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  The best genealogy discoveries happen when families work together! 
                  Your buddy helps you share findings, collaborate on research, and 
                  connect with cousins working on the same family lines.
                </p>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Testimonials */}
        <section className="py-20 bg-muted/30 rounded-3xl my-20">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4 text-foreground">
              Love Letters to Our Buddy
            </h2>
            <p className="text-xl text-muted-foreground">
              See how Genealogy Buddy AI is helping families discover their amazing stories
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
                  &quot;My research buddy helped me find relatives I never knew existed! 
                  It read my great-grandmother&apos;s marriage certificate like magic - 
                  even I couldn&apos;t make out that handwriting!&quot;
                </p>
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center text-primary-foreground mr-3">
                    S
                  </div>
                  <div>
                    <div className="font-semibold text-sm">Sarah Johnson</div>
                    <div className="text-xs text-muted-foreground">
                      Found 12 new cousins
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
                  &quot;I was stuck on my 3rd great-grandfather for YEARS. My buddy 
                  suggested a connection I never would have found - and it was spot on! 
                  Saved me months of hunting through records.&quot;
                </p>
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white mr-3">
                    M
                  </div>
                  <div>
                    <div className="font-semibold text-sm">Michael Chen</div>
                    <div className="text-xs text-muted-foreground">
                      Traced back to 1820s
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
                  &quot;I uploaded this mysterious old photo from my abuela&apos;s attic. 
                  My buddy told me it was from the 1940s, identified the clothing style, 
                  and even wrote a beautiful story about what life was like then!&quot;
                </p>
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center text-white mr-3">
                    E
                  </div>
                  <div>
                    <div className="font-semibold text-sm">Emily Rodriguez</div>
                    <div className="text-xs text-muted-foreground">
                      Brought 47 photos to life
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
              Join 25,000+ families who&apos;ve discovered incredible stories with their 
              AI research companion. Your buddy is waiting to help you uncover yours!
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" className="hover-lift" asChild>
                <Link href="/register">
                  Meet Your Buddy - Free!
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
