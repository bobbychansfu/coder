"use client";

import { ReactNode } from "react";
import { Box } from "@mui/material";
import Navbar from "./Navbar";
import styles from "../../styles/AppShell.module.css";

interface AppShellProps {
  children: ReactNode;
}

export default function AppShell({ children }: AppShellProps) {
  return (
    <Box className={styles.container}>
      <Navbar />
      <Box component="main" className={styles.main}>{children}</Box>
    </Box>
  );
}
