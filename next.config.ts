import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["unpdf", "mammoth"],
  experimental: {
    serverActions: {
      bodySizeLimit: "12mb",
    },
  },
  async redirects() {
    return [
      {
        source: "/:path*",
        has: [{ type: "host", value: "summify.app" }],
        destination: "https://www.summify.app/:path*",
        permanent: true,
      },
      // Production Vercel alias → canonical www (preview *-git-* hosts stay open)
      {
        source: "/:path*",
        has: [{ type: "host", value: "summify-it-web.vercel.app" }],
        destination: "https://www.summify.app/:path*",
        permanent: true,
      },
      // Consolidate PDF summarizer cannibalization → primary head-term URL
      {
        source: "/pdf-summarizer",
        destination: "/summarize-pdf",
        permanent: true,
      },
      {
        source: "/pdf-summarizer/",
        destination: "/summarize-pdf",
        permanent: true,
      },
    ];
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "X-Frame-Options",
            value: "SAMEORIGIN",
          },
          {
            key: "X-XSS-Protection",
            value: "1; mode=block",
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
