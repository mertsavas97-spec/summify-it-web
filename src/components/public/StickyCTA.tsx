"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/Button";
import { trackProductEventV2Client } from "@/lib/analytics/trackProductEventV2Client";

export function StickyCTA() {
  const [isVisible, setIsVisible] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      // Show after scrolling past hero (roughly 600px)
      setIsVisible(window.scrollY > 600);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  if (!isVisible) return null;

  return (
    <>
      {/* Mobile Sticky Bottom Bar */}
      {isMobile && (
        <div className="fixed bottom-0 left-0 right-0 z-50 px-4 py-3 bg-zinc-950/95 backdrop-blur-sm border-t border-white/[0.06] shadow-[0_-10px_30px_-10px_rgba(0,0,0,0.5)] animate-slide-up" role="region" aria-label="Primary action">
          <Button
            href="/upload"
            size="lg"
            className="w-full shadow-lg shadow-violet-500/30"
            onClick={() =>
              trackProductEventV2Client("landing_cta_clicked", {
                metadata: { placement: "mobile_sticky_cta", target: "/upload" },
              })
            }
          >
            Summarize for free
          </Button>
        </div>
      )}

      {/* Desktop Sticky Top-Right CTA */}
      {!isMobile && (
        <div className="fixed top-4 right-4 z-50 animate-fade-in" role="region" aria-label="Primary action">
          <Button
            href="/upload"
            size="md"
            className="shadow-lg shadow-violet-500/30 whitespace-nowrap"
            onClick={() =>
              trackProductEventV2Client("landing_cta_clicked", {
                metadata: { placement: "desktop_sticky_cta", target: "/upload" },
              })
            }
          >
            Summarize for free
          </Button>
        </div>
      )}
    </>
  );
}