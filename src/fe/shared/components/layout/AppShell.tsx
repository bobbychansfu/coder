"use client";

import { ReactNode } from "react";
import Navbar from "./Navbar";
import styles from "../../styles/AppShell.module.css";

interface AppShellProps {
  children: ReactNode;
}

export default function AppShell({ children }: AppShellProps) {
  return (
    <div className={styles.container}>
      <Navbar />
      <main className={styles.main}>{children}</main>
    </div>
  );
}
