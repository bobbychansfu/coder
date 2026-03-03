import Link from "next/link";

export default function ForbiddenPage() {
  return (
    <main
      style={{
        minHeight: "100vh",
        display: "grid",
        placeItems: "center",
        padding: "24px",
      }}
    >
      <section style={{ textAlign: "center", maxWidth: "480px" }}>
        <h1 style={{ marginBottom: "12px" }}>403 Forbidden</h1>
        <p style={{ marginBottom: "20px" }}>
          You do not have permission to access this page.
        </p>
        <Link href="/dashboard">Go to Dashboard</Link>
      </section>
    </main>
  );
}
