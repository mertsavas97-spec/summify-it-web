"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/Button";

type DeleteAnalysisButtonProps = {
  analysisId: string;
  redirectTo?: string;
  size?: "sm" | "md";
  className?: string;
};

export function DeleteAnalysisButton({
  analysisId,
  redirectTo = "/dashboard",
  size = "sm",
  className = "",
}: DeleteAnalysisButtonProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleDelete() {
    setLoading(true);
    try {
      const res = await fetch(`/api/analyses/${analysisId}`, { method: "DELETE" });
      if (!res.ok) {
        setLoading(false);
        return;
      }
      router.refresh();
      router.push(redirectTo);
    } catch {
      setLoading(false);
    }
  }

  return (
    <Button
      type="button"
      variant="ghost"
      size={size}
      className={`text-zinc-500 hover:text-red-400/90 ${className}`}
      disabled={loading}
      onClick={handleDelete}
    >
      {loading ? "Deleting…" : "Delete"}
    </Button>
  );
}
