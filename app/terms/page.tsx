export default function TermsPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-12 max-w-4xl">
        <h1 className="text-4xl font-bold mb-8 text-center">
          Terms of Service
        </h1>

        <div className="prose max-w-none">
          <p className="text-lg text-muted-foreground mb-8 text-center">
            Last updated: January 2025
          </p>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">Agreement to Terms</h2>
            <p className="text-muted-foreground mb-4">
              Welcome to Genealogy Buddy AI. These Terms of Service ("Terms")
              govern your use of our website, AI-powered genealogy tools, and
              related services (collectively, the "Service") operated by
              Genealogy Buddy AI ("we," "us," or "our").
            </p>
            <p className="text-muted-foreground">
              By accessing or using our Service, you agree to be bound by these
              Terms. If you disagree with any part of these terms, then you may
              not access the Service.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">
              Description of Service
            </h2>
            <p className="text-muted-foreground mb-4">
              Genealogy Buddy AI provides AI-powered genealogy research tools
              including:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-1">
              <li>Document analysis and text extraction</li>
              <li>DNA data interpretation</li>
              <li>Family tree building and expansion</li>
              <li>Historical photo analysis and storytelling</li>
              <li>Research assistance through AI chat</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">
              Account Registration
            </h2>
            <p className="text-muted-foreground mb-4">
              To use our Service, you must:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-1">
              <li>Be at least 13 years of age</li>
              <li>Provide accurate, current, and complete information</li>
              <li>Maintain the security of your account credentials</li>
              <li>Notify us immediately of any unauthorized access</li>
              <li>Be responsible for all activities under your account</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">
              Subscription and Payment
            </h2>
            <h3 className="text-xl font-medium mb-3">Subscription Plans</h3>
            <p className="text-muted-foreground mb-4">
              We offer various subscription tiers with different usage limits
              and features. Current pricing and features are available on our
              pricing page.
            </p>

            <h3 className="text-xl font-medium mb-3">Payment Terms</h3>
            <ul className="list-disc pl-6 text-muted-foreground mb-4 space-y-1">
              <li>Subscriptions are billed monthly or annually in advance</li>
              <li>All payments are processed securely through Stripe</li>
              <li>Prices are subject to change with 30 days notice</li>
              <li>Refunds are available within 30 days of purchase</li>
              <li>Failure to pay may result in service suspension</li>
            </ul>

            <h3 className="text-xl font-medium mb-3">Cancellation</h3>
            <p className="text-muted-foreground">
              You may cancel your subscription at any time through your account
              settings or by contacting support. Cancellation takes effect at
              the end of your current billing period.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">Acceptable Use</h2>
            <p className="text-muted-foreground mb-4">
              You agree to use our Service only for lawful purposes and in
              accordance with these Terms. You may not:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-1">
              <li>
                Upload false, misleading, or copyrighted content without
                permission
              </li>
              <li>Use the Service to violate any laws or regulations</li>
              <li>Attempt to reverse engineer or hack our systems</li>
              <li>Share your account credentials with others</li>
              <li>Use automated tools to access the Service excessively</li>
              <li>Upload malicious content or attempt to introduce viruses</li>
              <li>Harass, abuse, or harm other users</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">
              Intellectual Property
            </h2>
            <h3 className="text-xl font-medium mb-3">Your Content</h3>
            <p className="text-muted-foreground mb-4">
              You retain ownership of all content you upload to our Service,
              including documents, photos, and family information. By uploading
              content, you grant us a license to process, analyze, and store
              your content to provide our services.
            </p>

            <h3 className="text-xl font-medium mb-3">Our Service</h3>
            <p className="text-muted-foreground">
              The Service, including all software, algorithms, and AI models, is
              protected by copyright, trademark, and other intellectual property
              laws. You may not copy, modify, or distribute our Service without
              permission.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">
              AI-Generated Content
            </h2>
            <p className="text-muted-foreground mb-4">
              Our AI tools generate analyses, suggestions, and interpretations
              based on the information you provide. Please note:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-1">
              <li>
                AI-generated content is provided for informational purposes only
              </li>
              <li>
                Results may not always be 100% accurate and should be verified
              </li>
              <li>
                We do not guarantee the historical accuracy of AI
                interpretations
              </li>
              <li>You should independently verify genealogy information</li>
              <li>
                AI suggestions are based on patterns and may contain errors
              </li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">
              Privacy and Data Protection
            </h2>
            <p className="text-muted-foreground">
              Your privacy is important to us. Our collection, use, and
              protection of your personal information is governed by our Privacy
              Policy, which is incorporated into these Terms by reference.
              Please review our Privacy Policy to understand our practices.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">
              Service Availability
            </h2>
            <p className="text-muted-foreground mb-4">
              While we strive to provide reliable service, we cannot guarantee:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-1">
              <li>100% uptime or uninterrupted access</li>
              <li>Error-free operation of all features</li>
              <li>Compatibility with all devices or browsers</li>
              <li>Permanent availability of all features</li>
            </ul>
            <p className="text-muted-foreground mt-4">
              We may modify, suspend, or discontinue any part of our Service
              with or without notice.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">
              Limitation of Liability
            </h2>
            <p className="text-muted-foreground mb-4">
              To the maximum extent permitted by law, Genealogy Buddy AI shall
              not be liable for:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-1">
              <li>Any indirect, incidental, or consequential damages</li>
              <li>Loss of data, profits, or business opportunities</li>
              <li>Damages resulting from use of AI-generated content</li>
              <li>Service interruptions or technical failures</li>
              <li>Actions of third parties or external services</li>
            </ul>
            <p className="text-muted-foreground mt-4">
              Our total liability shall not exceed the amount you paid for the
              Service in the 12 months preceding the claim.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">Disclaimers</h2>
            <p className="text-muted-foreground mb-4">
              THE SERVICE IS PROVIDED "AS IS" WITHOUT WARRANTIES OF ANY KIND. WE
              DISCLAIM ALL WARRANTIES, EXPRESS OR IMPLIED, INCLUDING:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-1">
              <li>
                WARRANTIES OF MERCHANTABILITY OR FITNESS FOR A PARTICULAR
                PURPOSE
              </li>
              <li>ACCURACY OR COMPLETENESS OF AI-GENERATED CONTENT</li>
              <li>UNINTERRUPTED OR ERROR-FREE OPERATION</li>
              <li>SECURITY OR VIRUS-FREE OPERATION</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">Termination</h2>
            <p className="text-muted-foreground mb-4">
              Either party may terminate these Terms at any time:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-1">
              <li>You may delete your account at any time</li>
              <li>We may suspend or terminate accounts for Terms violations</li>
              <li>We may discontinue the Service with reasonable notice</li>
              <li>Upon termination, your access to the Service will cease</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">Governing Law</h2>
            <p className="text-muted-foreground">
              These Terms are governed by the laws of the United States and the
              state in which our company is incorporated, without regard to
              conflict of law principles. Any disputes will be resolved through
              binding arbitration.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">Changes to Terms</h2>
            <p className="text-muted-foreground">
              We may modify these Terms at any time. We will notify users of
              significant changes by email or through the Service. Continued use
              of the Service after changes constitutes acceptance of the new
              Terms.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">Contact Information</h2>
            <p className="text-muted-foreground mb-4">
              If you have questions about these Terms, please contact us:
            </p>
            <ul className="text-muted-foreground space-y-1">
              <li>Email: legal@genealogybuddyai.com</li>
              <li>Support: support@genealogybuddyai.com</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">Severability</h2>
            <p className="text-muted-foreground">
              If any provision of these Terms is found to be unenforceable, the
              remaining provisions will remain in full force and effect. These
              Terms constitute the entire agreement between you and Genealogy
              Buddy AI regarding the Service.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
