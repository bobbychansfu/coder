"use client";

import { ReactNode } from "react";
import { Box } from "@mui/material";
import Navbar from "./Navbar";
import styles from "../../styles/AppShell.module.css";
import type { Role } from "@/lib/authz";

interface AppShellProps {
  children: ReactNode;
  role: Role;
}

export default function AppShell({ children, role }: AppShellProps) {
  return (
    <Box className={styles.container}>
      <Navbar role={role} />
      <Box component="main" className={styles.main}>{children}</Box>
    </Box>
  );
}
