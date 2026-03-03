import Link from "next/link";
import styles from "./page.module.css";

export default function ForbiddenPage() {
  return (
    <main className={styles.main}>
      <section className={styles.section}>
        <h1 className={styles.title}>403 Forbidden</h1>
        <p className={styles.description}>
          You do not have permission to access this page.
        </p>
        <Link href="/dashboard">Go to Dashboard</Link>
      </section>
    </main>
  );
}
