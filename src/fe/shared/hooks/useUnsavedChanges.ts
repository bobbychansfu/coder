"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export function useUnsavedChanges() {
  const [isDirty, setIsDirty] = useState(false);
  const [showDialog, setShowDialog] = useState(false);
  const pendingNavigationRef = useRef<(() => void) | null>(null);
  const originalPushStateRef = useRef<typeof history.pushState | null>(null);

  // Block browser close / refresh
  useEffect(() => {
    if (!isDirty) return;
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [isDirty]);

  // Intercept Next.js / SPA navigation (history.pushState) when dirty
  useEffect(() => {
    if (!isDirty) return;

    const original = window.history.pushState.bind(window.history);
    originalPushStateRef.current = original;

    window.history.pushState = (data: unknown, unused: string, url?: string | URL | null) => {
      // Only intercept actual page navigations (different path)
      const nextPath = url ? new URL(String(url), window.location.href).pathname : window.location.pathname;
      if (nextPath === window.location.pathname) {
        original(data, unused, url);
        return;
      }
      pendingNavigationRef.current = () => original(data, unused, url);
      setTimeout(() => setShowDialog(true), 0);
    };

    return () => {
      if (originalPushStateRef.current) {
        window.history.pushState = originalPushStateRef.current;
        originalPushStateRef.current = null;
      }
    };
  }, [isDirty]);

  const setDirty = useCallback((dirty: boolean) => {
    setIsDirty(dirty);
  }, []);

  const guardNavigation = useCallback(
    (navigate: () => void) => {
      if (!isDirty) {
        navigate();
        return;
      }
      pendingNavigationRef.current = navigate;
      setShowDialog(true);
    },
    [isDirty],
  );

  const confirmLeave = useCallback(() => {
    setShowDialog(false);
    setIsDirty(false);
    // Restore original pushState before executing pending navigation
    if (originalPushStateRef.current) {
      window.history.pushState = originalPushStateRef.current;
      originalPushStateRef.current = null;
    }
    pendingNavigationRef.current?.();
    pendingNavigationRef.current = null;
  }, []);

  const cancelLeave = useCallback(() => {
    setShowDialog(false);
    pendingNavigationRef.current = null;
  }, []);

  return { isDirty, setDirty, showDialog, guardNavigation, confirmLeave, cancelLeave };
}
