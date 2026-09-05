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
      // Apex → www for pages only. Never redirect `/api/*`.
      // Polar (and similar providers) treat HTTP 3xx as webhook delivery failures
      // and do not follow redirects — a common Vercel www/non-www footgun.
      {
        source: "/:path((?!api/).*)*",
        has: [{ type: "host", value: "summify.app" }],
        destination: "https://www.summify.app/:path*",
        permanent: true,
      },
      // Production Vercel alias → canonical www (preview *-git-* hosts stay open)
      {
        source: "/:path((?!api/).*)*",
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
      // Consolidate YouTube summarizer cannibalization → primary format landing
      {
        source: "/video-summarizer",
        destination: "/summarize-youtube-video",
        permanent: true,
      },
      {
        source: "/video-summarizer/",
        destination: "/summarize-youtube-video",
        permanent: true,
      },
      {
        source: "/youtube-video-summarizer",
        destination: "/summarize-youtube-video",
        permanent: true,
      },
      {
        source: "/youtube-video-summarizer/",
        destination: "/summarize-youtube-video",
        permanent: true,
      },
      // Ahrefs crawl: missing / unpublished blog posts → closest live pages
      {
        source: "/blog/active-recall-vs-rereading",
        destination: "/blog/audio-learning-vs-rereading",
        permanent: true,
      },
      {
        source: "/blog/active-recall-vs-rereading/",
        destination: "/blog/audio-learning-vs-rereading",
        permanent: true,
      },
      {
        source: "/blog/how-adhd-students-study-with-ai",
        destination: "/adhd-study-tool",
        permanent: true,
      },
      {
        source: "/blog/how-adhd-students-study-with-ai/",
        destination: "/adhd-study-tool",
        permanent: true,
      },
      {
        source: "/blog/best-notebooklm-alternatives",
        destination: "/compare/notebooklm",
        permanent: true,
      },
      {
        source: "/blog/best-notebooklm-alternatives/",
        destination: "/compare/notebooklm",
        permanent: true,
      },
      {
        source: "/blog/notebooklm-vs-summify",
        destination: "/compare/notebooklm",
        permanent: true,
      },
      {
        source: "/blog/notebooklm-vs-summify/",
        destination: "/compare/notebooklm",
        permanent: true,
      },
      {
        source: "/blog/how-to-read-research-papers-faster-with-ai",
        destination: "/research-paper-study-tool",
        permanent: true,
      },
      {
        source: "/blog/how-to-read-research-papers-faster-with-ai/",
        destination: "/research-paper-study-tool",
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
