"use client";

import Script from "next/script";
import { usePathname, useSearchParams } from "next/navigation";
import { Suspense, useEffect } from "react";
import { GA_MEASUREMENT_ID, isGaEnabled, trackGaPageView } from "@/lib/analytics/ga";

function GoogleAnalyticsPageView() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (!isGaEnabled()) return;

    const query = searchParams.toString();
    const pagePath = query ? `${pathname}?${query}` : pathname;
    trackGaPageView(pagePath);
  }, [pathname, searchParams]);

  return null;
}

/**
 * Set user context for analytics filtering on the window object.
 * This allows client-side analytics checks to skip internal/admin users.
 */
function AnalyticsContextProvider() {
  useEffect(() => {
    // Try to read user email and admin status from meta tags or data attributes
    // set by the server during SSR (see layout.tsx)
    const userEmailMeta = document.querySelector('meta[name="summify-user-email"]');
    const isAdminMeta = document.querySelector('meta[name="summify-is-admin"]');

    if (userEmailMeta?.getAttribute("content")) {
      window.__summify_user_email = userEmailMeta.getAttribute("content");
    }

    if (isAdminMeta?.getAttribute("content") === "true") {
      window.__summify_is_admin = true;
    }
  }, []);

  return null;
}

/**
 * GA4 — loads only when `NEXT_PUBLIC_GA_MEASUREMENT_ID` is set.
 * Initial script bootstraps gtag; page views fire on App Router navigations.
 */
export function GoogleAnalytics() {
  if (!isGaEnabled()) {
    return null;
  }

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
        strategy="afterInteractive"
      />
      <Script id="summify-google-analytics" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${GA_MEASUREMENT_ID}', { send_page_view: false });
        `}
      </Script>
      <Suspense fallback={null}>
        <AnalyticsContextProvider />
        <GoogleAnalyticsPageView />
      </Suspense>
    </>
  );
}
