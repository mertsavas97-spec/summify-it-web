import type { Metadata } from "next";
import { headers } from "next/headers";
import Script from "next/script";
import { Geist, Geist_Mono } from "next/font/google";

import { Analytics } from "@vercel/analytics/react";
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
import { getOptionalUser } from "@/lib/auth";
import { getProfile } from "@/lib/supabase/profile";

import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const defaultTitle = "Summify — Free AI Summarizer";
const defaultDescription =
  "Summarize PDFs, PowerPoint, YouTube, and web articles with AI — then study with flashcards, quizzes, and optional audio lessons.";

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
      "AI summarizer",
      "PDF summarizer",
      "summarize PDF",
      "PowerPoint summarizer",
      "YouTube summarizer",
      "document summarizer",
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

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Fetch user data to set analytics context on window object (client-side)
  let userEmail: string | null = null;
  const isAdmin = false; // TODO: determine from profile if user has admin role

  try {
    const user = await getOptionalUser().catch(() => null);
    if (user?.email) {
      userEmail = user.email;
      // Try to determine if user is admin (for now, we'll skip this check)
      // In the future, you can check the user's profile for an admin role
      if (user.id) {
        await getProfile(user.id).catch(() => null);
        // Check if user has admin role (if your profile schema has this)
        // isAdmin = profile?.role === 'admin';
      }
    }
  } catch {
    // Silently fail - if we can't get user data, analytics will still work
  }

  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <head>
        {/* Set user context for client-side analytics filtering */}
        {userEmail && <meta name="summify-user-email" content={userEmail} />}
        {isAdmin && <meta name="summify-is-admin" content="true" />}
      </head>
      <body className="min-h-full bg-background text-foreground transition-colors">
        <meta name="apple-itunes-app" content="app-id=6770321706" />
        <GoogleAnalytics />
        <Analytics />

        <Script
          src="https://analytics.ahrefs.com/analytics.js"
          data-key="MunjXVn2ZCqghekj3PbVfA"
          strategy="afterInteractive"
        />

        <Script id="meta-pixel" strategy="afterInteractive">
          {`
            !function(f,b,e,v,n,t,s)
            {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
            n.callMethod.apply(n,arguments):n.queue.push(arguments)};
            if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
            n.queue=[];t=b.createElement(e);t.async=!0;
            t.src=v;s=b.getElementsByTagName(e)[0];
            s.parentNode.insertBefore(t,s)}(window, document,'script',
            'https://connect.facebook.net/en_US/fbevents.js');
            fbq('init', '955354854044257');
            fbq('track', 'PageView');
          `}
        </Script>

        <noscript>
          <img
            height="1"
            width="1"
            style={{ display: "none" }}
            src="https://www.facebook.com/tr?id=955354854044257&ev=PageView&noscript=1"
            alt=""
          />
        </noscript>

        <JsonLd data={globalLayoutJsonLd()} />
        <SiteShell>{children}</SiteShell>
      </body>
    </html>
  );
}
