import Link from "next/link";

export function Footer() {
  return (
    <footer className="bg-muted/20 border-t border-border/50 py-12 mt-20">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <Link href="/" className="flex items-center space-x-3 mb-4">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-primary-foreground text-lg font-bold">
                🧬
              </div>
              <span className="text-xl font-bold text-foreground">
                Genealogy Buddy AI
              </span>
            </Link>
            <p className="text-muted-foreground text-sm">
              Professional AI-powered research platform for genealogists and 
              researchers conducting advanced historical investigations.
            </p>
          </div>

          <div>
            <h4 className="font-semibold mb-4 text-foreground">Research Tools</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <Link
                  href="/tools/document-analyzer"
                  className="hover:text-foreground transition-colors"
                >
                  Document Analysis
                </Link>
              </li>
              <li>
                <Link
                  href="/tools/dna-interpreter"
                  className="hover:text-foreground transition-colors"
                >
                  Genetic Analysis
                </Link>
              </li>
              <li>
                <Link
                  href="/tools/photo-storyteller"
                  className="hover:text-foreground transition-colors"
                >
                  Historical Photo Analysis
                </Link>
              </li>
              <li>
                <Link
                  href="/tools/ancient-records-translator"
                  className="hover:text-foreground transition-colors"
                >
                  Ancient Records Translator
                </Link>
              </li>
              <li>
                <Link
                  href="/tools/research-copilot"
                  className="hover:text-foreground transition-colors"
                >
                  Research Assistant
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-4 text-foreground">Company</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <Link
                  href="/about"
                  className="hover:text-foreground transition-colors"
                >
                  About
                </Link>
              </li>
              <li>
                <Link
                  href="/privacy"
                  className="hover:text-foreground transition-colors"
                >
                  Privacy
                </Link>
              </li>
              <li>
                <Link
                  href="/terms"
                  className="hover:text-foreground transition-colors"
                >
                  Terms
                </Link>
              </li>
              <li>
                <Link
                  href="/contact"
                  className="hover:text-foreground transition-colors"
                >
                  Contact
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-4 text-foreground">Research Support</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <Link
                  href="/help"
                  className="hover:text-foreground transition-colors"
                >
                  Research Help
                </Link>
              </li>
              <li>
                <Link
                  href="/guides"
                  className="hover:text-foreground transition-colors"
                >
                  Methodology Guides
                </Link>
              </li>
              <li>
                <Link
                  href="/community"
                  className="hover:text-foreground transition-colors"
                >
                  Research Community
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-border/50 mt-8 pt-8 text-center">
          <p className="text-muted-foreground text-sm">
            © 2025 Genealogy Buddy AI. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
