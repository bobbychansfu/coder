"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

import styles from "./page.module.css";

export default function LogoutPage() {
  const router = useRouter();

  useEffect(() => {
    // TODO: Clear auth tokens, session, etc.
    // For now, just redirect to login
    router.push("/login");
  }, [router]);

  return (
    <div className={styles.container}>
      <p>Logging out...</p>
    </div>
  );
}
