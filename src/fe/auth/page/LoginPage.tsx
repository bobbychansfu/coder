"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import CasLoginCard from "@/fe/auth/components/CasLoginCard";
import DevQuickAccessCard from "@/fe/auth/components/DevQuickAccessCard";
import { demoUsers, type DemoRole } from "@/fe/auth/constants/demoUsers";
import styles from "@/fe/auth/styles/LoginPage.module.css";

interface LoginPageProps {
  showDevQuickAccess: boolean;
}

export default function LoginPage({ showDevQuickAccess }: LoginPageProps) {
  return (
    <Suspense fallback={<LoginPageView showDevQuickAccess={showDevQuickAccess} />}>
      <LoginPageContent showDevQuickAccess={showDevQuickAccess} />
    </Suspense>
  );
}

interface LoginPageViewProps {
  showDevQuickAccess: boolean;
  isLoading?: boolean;
  loadingEmail?: string | null;
  casError?: string | null;
  devError?: string | null;
  onCasLogin?: () => Promise<void> | void;
  onDevLogin?: (email: string, role: DemoRole) => Promise<void> | void;
}

function LoginPageView({
  showDevQuickAccess,
  isLoading = false,
  loadingEmail = null,
  casError = null,
  devError = null,
  onCasLogin = () => undefined,
  onDevLogin = () => undefined,
}: LoginPageViewProps) {
  return (
    <main className={styles.page}>
      <section className={styles.container}>
        <div className={styles.brandIcon} aria-hidden>
          {"</>"}
        </div>
        <h1 className={styles.brandTitle}>cs-coder</h1>
        <p className={styles.brandSubtitle}>Competitive Programming Platform</p>

        <CasLoginCard onCasLogin={onCasLogin} loading={isLoading && loadingEmail === null} error={casError} />

        {showDevQuickAccess ? (
          <DevQuickAccessCard
            users={demoUsers}
            loading={isLoading}
            loadingEmail={loadingEmail}
            error={devError}
            onDevLogin={onDevLogin}
          />
        ) : null}
      </section>
    </main>
  );
}

function LoginPageContent({ showDevQuickAccess }: LoginPageProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);
  const [loadingEmail, setLoadingEmail] = useState<string | null>(null);
  const [casError, setCasError] = useState<string | null>(null);
  const [devError, setDevError] = useState<string | null>(null);
  const casErrorCode = searchParams.get("error");

  useEffect(() => {
    if (!casErrorCode) {
      return;
    }

    if (casErrorCode === "missing_ticket") {
      setCasError("CAS did not return a ticket. Please try again.");
      return;
    }

    if (casErrorCode === "cas_denied") {
      setCasError("CAS authentication failed. Please try again.");
      return;
    }

    if (casErrorCode === "cas_backend_unreachable") {
      setCasError("CAS backend is unreachable. Please try again later.");
      return;
    }

    if (casErrorCode === "cas_config_missing") {
      setCasError("CAS is not configured in environment variables.");
    }
  }, [casErrorCode]);

  const handleCasLogin = async () => {
    setIsLoading(true);
    setLoadingEmail(null);
    setCasError(null);
    setDevError(null);

    try {
      const response = await fetch("/api/auth/cas/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ next: searchParams.get("next") || "/dashboard" }),
      });

      const data = (await response.json().catch(() => null)) as
        | { message?: string; redirectUrl?: string }
        | null;

      if (response.ok && data?.redirectUrl) {
        window.location.assign(data.redirectUrl);
        return;
      }

      setCasError(data?.message || "CAS login is not configured yet.");
    } catch {
      setCasError("CAS login failed.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDevLogin = async (email: string, role: DemoRole) => {
    setIsLoading(true);
    setLoadingEmail(email);
    setDevError(null);
    setCasError(null);

    try {
      const response = await fetch("/api/auth/dev-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email, role }),
      });

      if (response.ok) {
        router.push("/dashboard");
        return;
      }

      if (response.status === 401 || response.status === 403) {
        setDevError("No access");
        return;
      }

      setDevError("Dev login failed");
    } catch {
      setDevError("Dev login failed");
    } finally {
      setIsLoading(false);
      setLoadingEmail(null);
    }
  };

  return (
    <LoginPageView
      showDevQuickAccess={showDevQuickAccess}
      isLoading={isLoading}
      loadingEmail={loadingEmail}
      casError={casError}
      devError={devError}
      onCasLogin={handleCasLogin}
      onDevLogin={handleDevLogin}
    />
  );
}
