"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";

export function SignOutButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleSignOut() {
    setLoading(true);
    const supabase = createClient();
    await supabase.auth.signOut();
    router.refresh();
    router.push("/");
    setLoading(false);
  }

  return (
    <Button type="button" variant="secondary" size="sm" disabled={loading} onClick={handleSignOut}>
      {loading ? "Signing out…" : "Sign out"}
    </Button>
  );
}
