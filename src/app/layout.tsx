import type { Metadata } from "next";
import { headers } from "next/headers";
import Script from "next/script";
import { Geist, Geist_Mono } from "next/font/google";

import { GoogleAnalytics } from "@/components/analytics/GoogleAnalytics";
import { SiteShell } from "@/components/layout/SiteShell";
import { JsonLd } from "@/components/seo/JsonLd";

import { siteConfig } from "@/lib/site";
import { globalLayoutJsonLd } from "@/lib/schema";

import {
  buildOpenGraph,
  buildPageTitle,
  buildCanonicalUrl,
  buildTwitterCard,
  SEO_BRAND,
} from "@/lib/seo";
import { isIndexableHost, resolveRequestHost } from "@/lib/seo-host";

import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const defaultTitle = "Summify — AI Summary & Learn";
const defaultDescription =
  "Turn PDFs, YouTube videos, audio, and web articles into AI summaries, learn cards, audio lessons, and study podcasts.";

export async function generateMetadata(): Promise<Metadata> {
  const h = await headers();
  const hostname = resolveRequestHost({
    host: h.get("host"),
    forwardedHost: h.get("x-forwarded-host"),
  });
  const indexable = isIndexableHost(hostname);

  return {
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
    alternates: {
      canonical: buildCanonicalUrl("/"),
    },

    openGraph: buildOpenGraph({
      title: defaultTitle,
      description: defaultDescription,
      path: "/",
    }),

    twitter: buildTwitterCard({
      title: defaultTitle,
      description: defaultDescription,
    }),

    robots: indexable
      ? {
          index: true,
          follow: true,
          googleBot: {
            index: true,
            follow: true,
            "max-image-preview": "large",
            "max-snippet": -1,
          },
        }
      : {
          index: false,
          follow: false,
          googleBot: {
            index: false,
            follow: false,
            "max-image-preview": "none",
            "max-snippet": 0,
          },
        },
  };
}

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
        <meta name="apple-itunes-app" content="app-id=6770321706" />
        <GoogleAnalytics />

        <Script
          src="https://analytics.ahrefs.com/analytics.js"
          data-key="MunjXVn2ZCqghekj3PbVfA"
          strategy="afterInteractive"
        />

        <JsonLd data={globalLayoutJsonLd()} />

        <SiteShell>{children}</SiteShell>
      </body>
    </html>
  );
}
