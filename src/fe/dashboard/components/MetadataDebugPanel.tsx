"use client";

import { useMemo, useState } from "react";
import styles from "@/fe/dashboard/styles/MetadataDebugPanel.module.css";

type JsonValue = Record<string, unknown>;

interface RequestState {
  loading: boolean;
  error: string | null;
}

function pretty(value: unknown): string {
  return JSON.stringify(value, null, 2);
}

export default function MetadataDebugPanel() {
  const isEnabled = useMemo(() => process.env.NEXT_PUBLIC_AUTH_MODE === "dev", []);
  const [payload, setPayload] = useState<JsonValue | null>(null);
  const [state, setState] = useState<RequestState>({ loading: false, error: null });

  async function loadMetadata(): Promise<void> {
    setState({ loading: true, error: null });
    try {
      const response = await fetch("/api/auth/metadata", {
        method: "GET",
        cache: "no-store",
      });
      const json = (await response.json()) as JsonValue;
      if (!response.ok) {
        setState({
          loading: false,
          error: typeof json.error === "string" ? json.error : `Request failed: ${response.status}`,
        });
        setPayload(json);
        return;
      }
      setPayload(json);
      setState({ loading: false, error: null });
    } catch (error) {
      setState({
        loading: false,
        error: error instanceof Error ? error.message : "Unknown request error",
      });
    }
  }

  async function triggerMetadata(trigger: "login" | "submission"): Promise<void> {
    setState({ loading: true, error: null });
    try {
      const response = await fetch("/api/auth/metadata", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          trigger,
          cid: "demo-contest",
          pid: "demo-problem",
          sid: `${Date.now()}`,
        }),
      });
      const json = (await response.json()) as JsonValue;
      if (!response.ok) {
        setState({
          loading: false,
          error: typeof json.error === "string" ? json.error : `Request failed: ${response.status}`,
        });
        setPayload(json);
        return;
      }
      setPayload(json);
      setState({ loading: false, error: null });
    } catch (error) {
      setState({
        loading: false,
        error: error instanceof Error ? error.message : "Unknown request error",
      });
    }
  }

  if (!isEnabled) {
    return null;
  }

  return (
    <section className={styles.panel}>
      <div className={styles.header}>
        <h3 className={styles.title}>Metadata Debug Panel</h3>
        <p className={styles.hint}>Use this panel to verify gamification updates in real time.</p>
      </div>

      <div className={styles.actions}>
        <button type="button" className={styles.button} onClick={() => void loadMetadata()}>
          Refresh
        </button>
        <button
          type="button"
          className={styles.button}
          onClick={() => void triggerMetadata("login")}
        >
          Trigger Login
        </button>
        <button
          type="button"
          className={styles.button}
          onClick={() => void triggerMetadata("submission")}
        >
          Trigger Submission
        </button>
      </div>

      <div className={styles.statusRow}>
        {state.loading && <span className={styles.loading}>Loading...</span>}
        {state.error && <span className={styles.error}>{state.error}</span>}
      </div>

      <pre className={styles.output}>{payload ? pretty(payload) : "No metadata loaded yet."}</pre>
    </section>
  );
}
