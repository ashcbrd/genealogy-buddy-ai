export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-12 max-w-4xl">
        <h1 className="text-4xl font-bold mb-8 text-center">Privacy Policy</h1>
        
        <div className="prose max-w-none">
          <p className="text-lg text-muted-foreground mb-8 text-center">
            Last updated: January 2025
          </p>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">Introduction</h2>
            <p className="text-muted-foreground mb-4">
              At Genealogy Buddy AI ("we," "our," or "us"), we understand that your family information is deeply personal and private. This Privacy Policy explains how we collect, use, protect, and share your information when you use our genealogy research platform and AI-powered tools.
            </p>
            <p className="text-muted-foreground">
              We are committed to protecting your privacy and being transparent about our data practices. By using our services, you agree to the collection and use of information in accordance with this policy.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">Information We Collect</h2>
            
            <h3 className="text-xl font-medium mb-3">Account Information</h3>
            <ul className="list-disc pl-6 text-muted-foreground mb-4 space-y-1">
              <li>Email address and password for account creation</li>
              <li>Name and profile information you provide</li>
              <li>Subscription and payment information (processed securely by Stripe)</li>
            </ul>

            <h3 className="text-xl font-medium mb-3">Genealogy Data</h3>
            <ul className="list-disc pl-6 text-muted-foreground mb-4 space-y-1">
              <li>Documents you upload (birth certificates, marriage records, etc.)</li>
              <li>Photos and images for analysis</li>
              <li>Family tree information and relationships you create</li>
              <li>DNA data you choose to share for interpretation</li>
              <li>Research questions and chat conversations with our AI</li>
            </ul>

            <h3 className="text-xl font-medium mb-3">Technical Information</h3>
            <ul className="list-disc pl-6 text-muted-foreground space-y-1">
              <li>IP address and location data</li>
              <li>Browser type and version</li>
              <li>Device information and operating system</li>
              <li>Usage patterns and feature interactions</li>
              <li>Log files and error reports</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">How We Use Your Information</h2>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
              <li>Provide and improve our AI-powered genealogy tools</li>
              <li>Process and analyze your documents, photos, and DNA data</li>
              <li>Build and enhance your family trees</li>
              <li>Respond to your research questions through our AI assistant</li>
              <li>Send important service updates and notifications</li>
              <li>Process payments and manage subscriptions</li>
              <li>Ensure platform security and prevent abuse</li>
              <li>Comply with legal obligations</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">Data Security & Protection</h2>
            <p className="text-muted-foreground mb-4">
              We implement industry-standard security measures to protect your personal and family information:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
              <li>End-to-end encryption for data transmission</li>
              <li>Secure cloud storage with access controls</li>
              <li>Regular security audits and monitoring</li>
              <li>Employee access restrictions and training</li>
              <li>Secure backup and disaster recovery procedures</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">Data Sharing & Third Parties</h2>
            <p className="text-muted-foreground mb-4">
              We do not sell your personal information. We may share your data only in these limited circumstances:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
              <li><strong>Service Providers:</strong> Trusted partners who help us operate our platform (Stripe for payments, Supabase for storage, Anthropic for AI processing)</li>
              <li><strong>Legal Requirements:</strong> When required by law or to protect our legal rights</li>
              <li><strong>Business Transfers:</strong> In the event of a merger, acquisition, or sale of assets</li>
              <li><strong>With Your Consent:</strong> When you explicitly authorize us to share your information</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">Your Rights & Controls</h2>
            <p className="text-muted-foreground mb-4">
              You have full control over your genealogy data and account:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
              <li><strong>Access:</strong> Request a copy of your personal data</li>
              <li><strong>Correction:</strong> Update or correct inaccurate information</li>
              <li><strong>Deletion:</strong> Delete your account and associated data</li>
              <li><strong>Portability:</strong> Export your family trees and research data</li>
              <li><strong>Restriction:</strong> Limit how we process your information</li>
              <li><strong>Objection:</strong> Object to certain types of processing</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">Cookies & Tracking</h2>
            <p className="text-muted-foreground mb-4">
              We use cookies and similar technologies to:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-1">
              <li>Keep you logged in to your account</li>
              <li>Remember your preferences and settings</li>
              <li>Analyze usage patterns to improve our service</li>
              <li>Provide personalized experiences</li>
            </ul>
            <p className="text-muted-foreground mt-4">
              You can control cookies through your browser settings, but this may affect some functionality.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">Data Retention</h2>
            <p className="text-muted-foreground mb-4">
              We retain your information for as long as:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-1">
              <li>Your account remains active</li>
              <li>Necessary to provide our services</li>
              <li>Required by law or for legitimate business purposes</li>
            </ul>
            <p className="text-muted-foreground mt-4">
              When you delete your account, we will remove your personal data within 30 days, except where retention is required by law.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">Children's Privacy</h2>
            <p className="text-muted-foreground">
              Our services are not intended for children under 13 years of age. We do not knowingly collect personal information from children under 13. If you believe a child has provided us with personal information, please contact us immediately.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">International Users</h2>
            <p className="text-muted-foreground">
              If you are accessing our services from outside the United States, please note that your information may be transferred to and processed in countries that may have different privacy laws than your country of residence.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">Changes to This Policy</h2>
            <p className="text-muted-foreground">
              We may update this Privacy Policy from time to time. We will notify you of any significant changes by posting the new policy on this page and updating the "Last updated" date. We encourage you to review this policy periodically.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">Contact Us</h2>
            <p className="text-muted-foreground mb-4">
              If you have any questions about this Privacy Policy or our data practices, please contact us:
            </p>
            <ul className="text-muted-foreground space-y-1">
              <li>Email: privacy@genealogybuddyai.com</li>
              <li>Support: support@genealogybuddyai.com</li>
            </ul>
          </section>
        </div>
      </div>
    </div>
  );
}