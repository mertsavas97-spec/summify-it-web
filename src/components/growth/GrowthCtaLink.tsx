"use client";

import Link from "next/link";
import { trackEvent } from "@/lib/analytics/events";

type GrowthCtaLinkProps = {
  href: string;
  children: React.ReactNode;
  surface: string;
  label?: string;
  className?: string;
};

export function GrowthCtaLink({
  href,
  children,
  surface,
  label,
  className,
}: GrowthCtaLinkProps) {
  return (
    <Link
      href={href}
      className={className}
      onClick={() =>
        trackEvent("guide_cta_clicked", {
          surface,
          href,
          label: label ?? (typeof children === "string" ? children : undefined),
        })
      }
    >
      {children}
    </Link>
  );
}
