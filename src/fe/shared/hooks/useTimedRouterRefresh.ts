"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export function useTimedRouterRefresh(enabled: boolean, intervalMs = 30_000) {
  const router = useRouter();

  useEffect(() => {
    if (!enabled) {
      return;
    }

    const intervalId = window.setInterval(() => {
      if (document.visibilityState === "visible") {
        router.refresh();
      }
    }, intervalMs);

    return () => window.clearInterval(intervalId);
  }, [enabled, intervalMs, router]);
}
