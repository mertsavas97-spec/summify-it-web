import { GlobalGhostSessionClaim } from "@/components/auth/GlobalGhostSessionClaim";
import { AnnouncementBanner } from "@/components/growth/AnnouncementBanner";
import { HomeProOfferBar } from "@/components/public/HomeProOfferBar";
import { Footer } from "./Footer";
import { Header } from "./Header";

type SiteShellProps = {
  children: React.ReactNode;
};

export function SiteShell({ children }: SiteShellProps) {
  return (
    <div className="flex min-h-dvh flex-col">
      <GlobalGhostSessionClaim />
      <Header />
      <HomeProOfferBar />
      <AnnouncementBanner />
      <main className="min-w-0 flex-1 overflow-x-hidden">{children}</main>
      <Footer />
    </div>
  );
}
