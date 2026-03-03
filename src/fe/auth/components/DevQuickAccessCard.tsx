"use client";

import type { DemoRole, DemoUser } from "@/fe/auth/constants/demoUsers";
import styles from "@/fe/auth/styles/LoginPage.module.css";

interface DevQuickAccessCardProps {
  users: DemoUser[];
  loading: boolean;
  loadingEmail: string | null;
  error?: string | null;
  onDevLogin: (email: string, role: DemoRole) => Promise<void> | void;
}

export default function DevQuickAccessCard({
  users,
  loading,
  loadingEmail,
  error,
  onDevLogin,
}: DevQuickAccessCardProps) {
  return (
    <article className={styles.devCard}>
      <h3 className={styles.devTitle}>Quick Demo Access (Dev only)</h3>

      <div className={styles.devBanner}>
        DEV ONLY: Quick Demo Access bypasses CAS. Session expires in 6 hours.
        Do not enable in production.
      </div>

      <div className={styles.devGrid}>
        {users.map((demo) => (
          <button
            key={demo.email}
            type="button"
            className={styles.devButton}
            onClick={() => {
              void onDevLogin(demo.email, demo.role);
            }}
            disabled={loading}
          >
            {loading && loadingEmail === demo.email ? "Signing in..." : demo.label}
          </button>
        ))}
      </div>

      {error ? (
        <p role="alert" className={styles.errorText}>
          {error}
        </p>
      ) : null}
    </article>
  );
}
