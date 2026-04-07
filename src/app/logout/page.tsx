"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

import styles from "./page.module.css";

export default function LogoutPage() {
  const router = useRouter();

  useEffect(() => {
    let cancelled = false;

    const logout = async () => {
      try {
        await fetch("/api/auth/logout", {
          method: "POST",
          credentials: "include",
        });
      } catch {
        // Ignore logout transport failures and continue navigation.
      } finally {
        if (!cancelled) {
          router.replace("/login");
          router.refresh();
        }
      }
    };

    void logout();

    return () => {
      cancelled = true;
    };
  }, [router]);

  return (
    <div className={styles.container}>
      <p>Logging out...</p>
    </div>
  );
}
