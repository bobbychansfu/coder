export type ForbiddenMode = "redirect" | "toast";

function isBrowser(): boolean {
  return typeof window !== "undefined";
}

export function getCurrentPath(): string {
  if (!isBrowser()) {
    return "/";
  }

  return `${window.location.pathname}${window.location.search}`;
}

export function redirectToLogin(nextPath?: string): void {
  if (!isBrowser()) {
    return;
  }

  const next = nextPath ?? getCurrentPath();
  window.location.assign(`/login?next=${encodeURIComponent(next)}`);
}

export function redirectToForbidden(): void {
  if (!isBrowser()) {
    return;
  }

  window.location.assign("/403");
}

export function handleForbidden(options?: {
  mode?: ForbiddenMode;
  onToast?: (message: string) => void;
}): void {
  const mode = options?.mode ?? "redirect";

  if (mode === "redirect") {
    redirectToForbidden();
    return;
  }

  options?.onToast?.("No access");
}
