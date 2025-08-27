import "./globals.css";
import type { Metadata } from "next";
import { Providers } from "@/components/providers";
import { Toaster } from "@/components/ui/sonner";

export const metadata: Metadata = {
  title: "Genealogy Buddy AI",
  description:
    "Uncover your family history with Genealogy Buddy AI. Analyze DNA, interpret documents, tell photo stories, and build your family tree with an intelligent genealogy research assistant.",
  keywords: [
    "genealogy AI",
    "family tree builder",
    "ancestry research",
    "DNA analysis genealogy",
    "document analyzer",
    "photo storyteller",
    "AI genealogy tools",
    "family history research",
    "ancestry AI assistant",
    "genealogy research copilot",
  ],
  openGraph: {
    title:
      "Genealogy Buddy AI | Discover Your Family History with Smart Genealogy Tools",
    description:
      "Your intelligent genealogy companion: build family trees, analyze DNA, interpret historical documents, and reveal family stories through AI.",
    url: "https://genealogybuddy.vercel.app",
    siteName: "Genealogy Buddy AI",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Genealogy Buddy AI - Family History Research",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Genealogy Buddy AI | Family Tree & Ancestry Research Assistant",
    description:
      "Discover family history with AI-powered genealogy tools: DNA interpreter, document analyzer, photo storyteller, and more.",
    images: ["/og-image.png"],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning>
        <Providers>{children}</Providers>
        <Toaster />
      </body>
    </html>
  );
}
