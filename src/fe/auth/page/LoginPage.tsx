"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import CasLoginCard from "@/fe/auth/components/CasLoginCard";
import DevQuickAccessCard from "@/fe/auth/components/DevQuickAccessCard";
import { demoUsers, type DemoRole } from "@/fe/auth/constants/demoUsers";
import styles from "@/fe/auth/styles/LoginPage.module.css";

interface LoginPageProps {
  showDevQuickAccess: boolean;
}

export default function LoginPage({ showDevQuickAccess }: LoginPageProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [loadingEmail, setLoadingEmail] = useState<string | null>(null);
  const [casError, setCasError] = useState<string | null>(null);
  const [devError, setDevError] = useState<string | null>(null);

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
      });

      const data = (await response.json().catch(() => null)) as
        | { message?: string; redirectUrl?: string }
        | null;

      if (response.ok && data?.redirectUrl) {
        router.push(data.redirectUrl);
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
    <main className={styles.page}>
      <section className={styles.container}>
        <div className={styles.brandIcon} aria-hidden>
          {"</>"}
        </div>
        <h1 className={styles.brandTitle}>cs-coder</h1>
        <p className={styles.brandSubtitle}>Competitive Programming Platform</p>

        <CasLoginCard
          onCasLogin={handleCasLogin}
          loading={isLoading && loadingEmail === null}
          error={casError}
        />

        {showDevQuickAccess ? (
          <DevQuickAccessCard
            users={demoUsers}
            loading={isLoading}
            loadingEmail={loadingEmail}
            error={devError}
            onDevLogin={handleDevLogin}
          />
        ) : null}
      </section>
    </main>
  );
}
