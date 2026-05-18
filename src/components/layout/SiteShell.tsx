import { PublicBetaBar } from "@/components/public/PublicBetaBar";
import { Footer } from "./Footer";
import { Header } from "./Header";

type SiteShellProps = {
  children: React.ReactNode;
};

export function SiteShell({ children }: SiteShellProps) {
  return (
    <div className="flex min-h-full flex-col">
      <Header />
      <PublicBetaBar />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}
