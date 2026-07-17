"use client";

import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { ClaimGhostSessionOnAuth } from "@/components/auth/ClaimGhostSessionOnAuth";
import { createClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/env";

const supabaseConfigured = isSupabaseConfigured();

/**
 * Runs ghost-session claim on any authenticated page so login return paths
 * (e.g. OAuth callback → `/`) still recover guest analyses.
 */
export function GlobalGhostSessionClaim() {
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(!supabaseConfigured);

  useEffect(() => {
    if (!supabaseConfigured) return;

    const supabase = createClient();

    void supabase.auth.getUser().then(({ data }) => {
      setUser(data.user ?? null);
      setReady(true);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (!ready || !user) return null;

  return <ClaimGhostSessionOnAuth />;
}
