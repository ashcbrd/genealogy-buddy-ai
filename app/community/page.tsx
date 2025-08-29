import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Navigation } from "@/components/ui/navigation";
import { Footer } from "@/components/footer";

export default function CommunityPage() {
  return (
    <div className="min-h-screen bg-background">
      <Navigation variant="landing" />
      <div className="container mx-auto px-4 py-12">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-4xl font-bold mb-4">Research Community</h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Connect with professional genealogists and serious researchers. Share methodologies, collaborate on complex cases, and advance genealogical research standards together.
          </p>
        </div>

        {/* Community Stats */}
        <div className="grid md:grid-cols-4 gap-6 mb-16">
          <Card className="text-center">
            <CardContent className="p-6">
              <div className="text-3xl font-bold mb-2">Coming Soon</div>
              <div className="text-muted-foreground">Community Launch</div>
            </CardContent>
          </Card>
          <Card className="text-center">
            <CardContent className="p-6">
              <div className="text-3xl font-bold mb-2">Discord</div>
              <div className="text-muted-foreground">Join Our Server</div>
            </CardContent>
          </Card>
          <Card className="text-center">
            <CardContent className="p-6">
              <div className="text-3xl font-bold mb-2">24/7</div>
              <div className="text-muted-foreground">Community Support</div>
            </CardContent>
          </Card>
          <Card className="text-center">
            <CardContent className="p-6">
              <div className="text-3xl font-bold mb-2">Free</div>
              <div className="text-muted-foreground">Always Free to Join</div>
            </CardContent>
          </Card>
        </div>

        {/* Join Community */}
        <div className="bg-muted/20 rounded-lg p-8 mb-16 text-center">
          <h2 className="text-2xl font-bold mb-4">Join Our Community</h2>
          <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
            Join our professional research community on Discord and Reddit. Collaborate on challenging cases, share advanced methodologies, and exchange expert insights with experienced genealogists.
          </p>
          <div className="flex justify-center space-x-4">
            <Button className="flex items-center space-x-2">
              <span>💬</span>
              <span>Join Research Community</span>
            </Button>
            <Button variant="outline" className="flex items-center space-x-2">
              <span>🔍</span>
              <span>Professional Forum</span>
            </Button>
          </div>
        </div>

        {/* Community Features */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold mb-8">Community Features</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <span className="text-2xl">❓</span>
                  <span>Professional Consultation</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4">
                  Complex research challenges? Consult with professional genealogists and experienced researchers for expert guidance.
                </p>
                <Badge variant="secondary">24/7 Support</Badge>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <span className="text-2xl">📖</span>
                  <span>Case Studies</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4">
                  Share research breakthroughs, complex case solutions, and methodological insights with the community.
                </p>
                <Badge variant="secondary">Weekly Highlights</Badge>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <span className="text-2xl">🎓</span>
                  <span>Professional Development</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4">
                  Access advanced tutorials, research methodology sessions, and professional development resources.
                </p>
                <Badge variant="secondary">Free Access</Badge>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <span className="text-2xl">🔗</span>
                  <span>DNA Matches</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4">
                  Connect with DNA matches in the community and collaborate on shared family lines.
                </p>
                <Badge variant="secondary">Secure Connections</Badge>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <span className="text-2xl">📅</span>
                  <span>Virtual Events</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4">
                  Join monthly genealogy meetups, expert presentations, and collaborative research sessions.
                </p>
                <Badge variant="secondary">Monthly Events</Badge>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <span className="text-2xl">🏆</span>
                  <span>Recognition Program</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4">
                  Earn badges and recognition for helping others, sharing stories, and active participation.
                </p>
                <Badge variant="secondary">Achievement System</Badge>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Popular Discussions */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold mb-8">Popular Discussions</h2>
          <div className="space-y-4">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="font-semibold mb-2">Welcome to Genealogy Buddy AI Community!</h3>
                    <p className="text-sm text-muted-foreground">Started by Team • Pinned • Launch announcement</p>
                  </div>
                  <Badge variant="outline">Hot Topic</Badge>
                </div>
                <p className="text-muted-foreground text-sm">
                  Join our growing community of genealogy enthusiasts! Share your family discoveries, get research help, and connect with fellow family historians.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="font-semibold mb-2">Getting Started: Your First Family Tree</h3>
                    <p className="text-sm text-muted-foreground">Started by ResearchGuide • Helpful guide • Launch week</p>
                  </div>
                  <Badge variant="outline">Success Story</Badge>
                </div>
                <p className="text-muted-foreground text-sm">
                  New to genealogy research? Start here! Learn how to build your first family tree and make the most of our AI-powered tools.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="font-semibold mb-2">Community Guidelines & Best Practices</h3>
                    <p className="text-sm text-muted-foreground">Started by Moderator • Essential reading • Community rules</p>
                  </div>
                  <Badge variant="outline">Document Help</Badge>
                </div>
                <p className="text-muted-foreground text-sm">
                  Learn how to get the best help from our community, share discoveries responsibly, and contribute to a supportive research environment.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Community Guidelines */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold mb-8">Community Guidelines</h2>
          <div className="grid md:grid-cols-2 gap-8">
            <Card>
              <CardHeader>
                <CardTitle>✅ Do's</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3 text-muted-foreground">
                  <li className="flex items-start space-x-2">
                    <span className="text-green-500">•</span>
                    <span>Be respectful and supportive of all members</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <span className="text-green-500">•</span>
                    <span>Share knowledge and help others with their research</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <span className="text-green-500">•</span>
                    <span>Protect privacy - ask before sharing others' information</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <span className="text-green-500">•</span>
                    <span>Use appropriate channels for different types of discussions</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <span className="text-green-500">•</span>
                    <span>Cite sources and provide context for your research</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>❌ Don'ts</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3 text-muted-foreground">
                  <li className="flex items-start space-x-2">
                    <span className="text-red-500">•</span>
                    <span>Share personal information about living individuals</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <span className="text-red-500">•</span>
                    <span>Post spam, advertisements, or off-topic content</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <span className="text-red-500">•</span>
                    <span>Engage in arguments or disrespectful behavior</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <span className="text-red-500">•</span>
                    <span>Share copyrighted materials without permission</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <span className="text-red-500">•</span>
                    <span>Make unsubstantiated claims about family connections</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Get Started */}
        <div className="bg-primary/10 rounded-lg p-8 text-center">
          <h2 className="text-2xl font-bold mb-4">Join the Professional Research Community</h2>
          <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
            Connect with professional genealogists, certified researchers, and serious practitioners advancing the field of genealogical investigation.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Button size="lg" className="flex items-center space-x-2">
              <span>💬</span>
              <span>Join Discord Community</span>
            </Button>
            <Button size="lg" variant="outline" className="flex items-center space-x-2">
              <span>📧</span>
              <span>Subscribe to Newsletter</span>
            </Button>
          </div>
          <p className="text-sm text-muted-foreground mt-4">
            Have questions? <Link href="/contact" className="text-primary hover:underline">Contact our community team</Link>
          </p>
        </div>
      </div>
      <Footer />
    </div>
  );
}