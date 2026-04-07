"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import styles from "@/fe/auth/styles/LoginPage.module.css";

interface SignupPageProps {
  showDevSignup: boolean;
}

interface SignupFormState {
  name: string;
  computingId: string;
  email: string;
  studentNumber: string;
}

const INITIAL_FORM_STATE: SignupFormState = {
  name: "",
  computingId: "",
  email: "",
  studentNumber: "",
};

function validateForm(form: SignupFormState): string | null {
  if (!form.name.trim()) {
    return "Name is required.";
  }

  if (!form.computingId.trim()) {
    return "Computing ID is required.";
  }

  if (!form.email.trim()) {
    return "Email is required.";
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
    return "Enter a valid email address.";
  }

  return null;
}

export default function SignupPage({ showDevSignup }: SignupPageProps) {
  const router = useRouter();
  const [form, setForm] = useState(INITIAL_FORM_STATE);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const updateField = (field: keyof SignupFormState, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!showDevSignup) {
      return;
    }

    const validationError = validateForm(form);
    if (validationError) {
      setError(validationError);
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch("/api/auth/dev-signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(form),
      });

      const payload = (await response.json().catch(() => null)) as { message?: string } | null;

      if (!response.ok) {
        setError(payload?.message ?? "Dev signup failed.");
        return;
      }

      router.push("/dashboard");
      router.refresh();
    } catch {
      setError("Dev signup failed.");
    } finally {
      setIsSubmitting(false);
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

        <article className={styles.card}>
          <h2 className={styles.cardTitle}>Create Account</h2>
          {showDevSignup ? (
            <>
              <p className={styles.cardDescription}>
                DEV ONLY: Create a student account and sign in immediately.
              </p>
              <form className={styles.form} onSubmit={(event) => void handleSubmit(event)}>
                <label className={styles.field}>
                  <span className={styles.fieldLabel}>Name</span>
                  <input
                    className={styles.fieldInput}
                    value={form.name}
                    onChange={(event) => updateField("name", event.target.value)}
                    autoComplete="name"
                  />
                </label>
                <label className={styles.field}>
                  <span className={styles.fieldLabel}>Computing ID</span>
                  <input
                    className={styles.fieldInput}
                    value={form.computingId}
                    onChange={(event) => updateField("computingId", event.target.value)}
                    autoCapitalize="none"
                    autoCorrect="off"
                  />
                </label>
                <label className={styles.field}>
                  <span className={styles.fieldLabel}>Email</span>
                  <input
                    className={styles.fieldInput}
                    type="email"
                    value={form.email}
                    onChange={(event) => updateField("email", event.target.value)}
                    autoComplete="email"
                  />
                </label>
                <label className={styles.field}>
                  <span className={styles.fieldLabel}>Student Number (Optional)</span>
                  <input
                    className={styles.fieldInput}
                    value={form.studentNumber}
                    onChange={(event) => updateField("studentNumber", event.target.value)}
                    autoComplete="off"
                  />
                </label>
                <button type="submit" className={styles.casButton} disabled={isSubmitting}>
                  {isSubmitting ? "Creating account..." : "Create Dev Account"}
                </button>
              </form>
            </>
          ) : (
            <>
              <p className={styles.cardDescription}>
                Self-service signup is not enabled in this environment. Use the login page to sign
                in through the configured authentication provider.
              </p>
              <Link href="/login" className={styles.secondaryLink}>
                Back to Login
              </Link>
            </>
          )}

          {error ? (
            <p role="alert" className={styles.errorText}>
              {error}
            </p>
          ) : null}

          <p className={styles.hint}>
            Already have access?{" "}
            <Link href="/login" className={styles.inlineLink}>
              Sign in
            </Link>
          </p>
        </article>
      </section>
    </main>
  );
}
