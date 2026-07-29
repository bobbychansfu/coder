"use client";

import { ReactNode } from "react";
import { Box } from "@mui/material";
import Navbar from "./Navbar";
import styles from "../../styles/AppShell.module.css";
import type { CurrentUser } from "@/lib/session";

interface AppShellProps {
  children: ReactNode;
  user: CurrentUser;
}

export default function AppShell({ children, user }: AppShellProps) {
  return (
    <Box className={styles.container}>
      <Navbar user={user} />
      <Box component="main" className={styles.main}>{children}</Box>
    </Box>
  );
}
