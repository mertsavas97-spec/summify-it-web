import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { SiteShell } from "@/components/layout/SiteShell";
import { siteConfig } from "@/lib/site";
import {
  buildOpenGraph,
  buildPageTitle,
  buildTwitterCard,
  SEO_BRAND,
} from "@/lib/seo";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const defaultTitle = "AI document intelligence for PDFs, videos, and decks";

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: {
    default: buildPageTitle(defaultTitle),
    template: `%s | ${SEO_BRAND}`,
  },
  description: siteConfig.description,
  keywords: [
    "document intelligence",
    "PDF summarizer",
    "YouTube transcript AI",
    "PowerPoint summarizer",
    "AI study notes",
  ],
  authors: [{ name: SEO_BRAND }],
  creator: SEO_BRAND,
  openGraph: buildOpenGraph({
    title: defaultTitle,
    description: siteConfig.description,
    path: "/",
  }),
  twitter: buildTwitterCard({
    title: defaultTitle,
    description: siteConfig.description,
  }),
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-[#0e1016] text-zinc-100">
        <SiteShell>{children}</SiteShell>
      </body>
    </html>
  );
}
