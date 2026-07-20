"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";
import VisibilityOffOutlinedIcon from "@mui/icons-material/VisibilityOffOutlined";
import styles from "@/fe/auth/styles/LoginPage.module.css";

export default function GuestLoginPage({ enabled }: { enabled: boolean }) {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!enabled || submitting) return;

    setSubmitting(true);
    setError(null);
    try {
      const response = await fetch("/api/auth/guest-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ username, password }),
      });
      const payload = (await response.json().catch(() => null)) as { message?: string } | null;
      if (!response.ok) {
        setError(payload?.message ?? "Guest login failed.");
        return;
      }
      router.push("/dashboard");
      router.refresh();
    } catch {
      setError("Guest login failed.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className={styles.page}>
      <section className={styles.container}>
        <div className={styles.brandIcon} aria-hidden>{"</>"}</div>
        <h1 className={styles.brandTitle}>cs-coder</h1>
        <p className={styles.brandSubtitle}>Competitive Programming Platform</p>

        <article className={styles.card}>
          <h2 className={styles.cardTitle}>Guest Login</h2>
          <p className={styles.cardDescription}>
            Sign in with the guest username and password provided by an administrator.
          </p>
          {enabled ? (
            <form className={styles.form} onSubmit={(event) => void handleSubmit(event)}>
              <label className={styles.field}>
                <span className={styles.fieldLabel}>Username</span>
                <input
                  className={styles.fieldInput}
                  value={username}
                  onChange={(event) => setUsername(event.target.value)}
                  autoComplete="username"
                  required
                />
              </label>
              <label className={styles.field}>
                <span className={styles.fieldLabel}>Password</span>
                <div className={styles.passwordInputWrap}>
                  <input
                    className={`${styles.fieldInput} ${styles.passwordInput}`}
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    autoComplete="current-password"
                    required
                  />
                  <button
                    type="button"
                    className={styles.passwordToggle}
                    onClick={() => setShowPassword((visible) => !visible)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    aria-pressed={showPassword}
                  >
                    {showPassword ? <VisibilityOffOutlinedIcon /> : <VisibilityOutlinedIcon />}
                  </button>
                </div>
              </label>
              <button type="submit" className={styles.casButton} disabled={submitting}>
                {submitting ? "Signing in..." : "Sign in as Guest"}
              </button>
            </form>
          ) : (
            <p className={styles.errorText}>Guest login is not enabled in this environment.</p>
          )}
          {error ? <p role="alert" className={styles.errorText}>{error}</p> : null}
          <Link href="/login" className={styles.secondaryLink}>Back to SFU Login</Link>
        </article>
      </section>
    </main>
  );
}
