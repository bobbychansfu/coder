"use client";

import Link from "next/link";
import styles from "@/fe/auth/styles/LoginPage.module.css";

interface CasLoginCardProps {
  onCasLogin: () => Promise<void> | void;
  loading: boolean;
  showGuestLogin: boolean;
  showSignup: boolean;
  error?: string | null;
}

export default function CasLoginCard({
  onCasLogin,
  loading,
  showGuestLogin,
  showSignup,
  error,
}: CasLoginCardProps) {
  return (
    <article className={styles.card}>
      <h2 className={styles.cardTitle}>Welcome</h2>
      <p className={styles.cardDescription}>
        Sign in with your SFU Computing Science account
      </p>

      <div className={styles.securityNotice}>
        Secure authentication via SFU FAS with MFA
      </div>

      <button
        type="button"
        className={styles.casButton}
        onClick={() => {
          void onCasLogin();
        }}
        disabled={loading}
      >
        {loading ? "Redirecting..." : "Login with SFU FAS"}
      </button>

      <p className={styles.hint}>
        You will be redirected to SFU&apos;s authentication portal
      </p>

      {showSignup ? (
        <>
          <Link href="/guest-login" className={styles.secondaryLink}>
            Not at SFU? Sign in with email
          </Link>
          <p className={styles.hint}>
            New here?{" "}
            <Link href="/signup" className={styles.inlineLink}>
              Create an account
            </Link>
          </p>
        </>
      ) : showGuestLogin ? (
        <Link href="/guest-login" className={styles.secondaryLink}>
          Sign in with a guest account
        </Link>
      ) : null}

      {error ? (
        <p role="alert" className={styles.errorText}>
          {error}
        </p>
      ) : null}
    </article>
  );
}
