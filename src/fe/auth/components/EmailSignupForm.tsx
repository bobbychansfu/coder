"use client";

import { useState } from "react";
import styles from "@/fe/auth/styles/LoginPage.module.css";

interface EmailSignupFormState {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
}

const INITIAL_FORM_STATE: EmailSignupFormState = {
  firstName: "",
  lastName: "",
  email: "",
  password: "",
};

const MIN_PASSWORD_LENGTH = 8;

function validateForm(form: EmailSignupFormState): string | null {
  if (!form.firstName.trim()) return "First name is required.";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) return "Enter a valid email address.";
  if (form.password.length < MIN_PASSWORD_LENGTH) {
    return `Use at least ${MIN_PASSWORD_LENGTH} characters for your password.`;
  }
  return null;
}

// Self-service sign-up for students outside SFU; the new account is signed in immediately.
export default function EmailSignupForm() {
  const [form, setForm] = useState(INITIAL_FORM_STATE);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const updateField = (field: keyof EmailSignupFormState, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isSubmitting) return;

    const validationError = validateForm(form);
    if (validationError) {
      setError(validationError);
      return;
    }

    setIsSubmitting(true);
    setError(null);
    try {
      const response = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(form),
      });
      const payload = (await response.json().catch(() => null)) as { message?: string } | null;
      if (!response.ok) {
        setError(payload?.message ?? "Sign-up failed.");
        return;
      }
      window.location.assign("/dashboard");
    } catch {
      setError("Sign-up failed.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <p className={styles.cardDescription}>
        Students outside SFU can create an account with their email. SFU students: use the SFU
        login instead.
      </p>
      <form className={styles.form} onSubmit={(event) => void handleSubmit(event)} noValidate>
        <label className={styles.field}>
          <span className={styles.fieldLabel}>First name</span>
          <input
            className={styles.fieldInput}
            value={form.firstName}
            onChange={(event) => updateField("firstName", event.target.value)}
            autoComplete="given-name"
            maxLength={50}
          />
        </label>
        <label className={styles.field}>
          <span className={styles.fieldLabel}>Last name (optional)</span>
          <input
            className={styles.fieldInput}
            value={form.lastName}
            onChange={(event) => updateField("lastName", event.target.value)}
            autoComplete="family-name"
            maxLength={50}
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
            autoCapitalize="none"
            maxLength={254}
          />
        </label>
        <label className={styles.field}>
          <span className={styles.fieldLabel}>Password (at least {MIN_PASSWORD_LENGTH} characters)</span>
          <input
            className={styles.fieldInput}
            type="password"
            value={form.password}
            onChange={(event) => updateField("password", event.target.value)}
            autoComplete="new-password"
            maxLength={128}
          />
        </label>
        <button type="submit" className={styles.casButton} disabled={isSubmitting}>
          {isSubmitting ? "Creating account..." : "Create account"}
        </button>
      </form>
      {error ? (
        <p role="alert" className={styles.errorText}>
          {error}
        </p>
      ) : null}
    </>
  );
}
