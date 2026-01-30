"use client";

import type { ReactNode } from "react";
import ScrollbarHider from "../ui/ScrollbarHider";
import styles from "../../styles/ListPageLayout.module.css";

interface ListPageLayoutProps {
  title: string;
  actionLabel: string;
  sidebar: ReactNode;
  children: ReactNode;
}

export default function ListPageLayout({
  title,
  actionLabel,
  sidebar,
  children,
}: ListPageLayoutProps) {
  return (
    <>
      <ScrollbarHider />
      <section className={styles.page}>
        <header className={styles.header}>
          <h1 className={styles.title}>{title}</h1>
          <button className={styles.actionButton} type="button">
            {actionLabel}
          </button>
        </header>
        <div className={styles.content}>
          <aside className={`${styles.sidebar} scrollbar-hidden`}>
            {sidebar}
          </aside>
          <div className={styles.main}>{children}</div>
        </div>
      </section>
    </>
  );
}
