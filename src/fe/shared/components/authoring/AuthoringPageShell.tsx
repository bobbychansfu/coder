import type { ReactNode } from "react";
import { Box } from "@mui/material";

import PageHeader from "@/fe/shared/components/PageHeader";
import SubpageHeader from "@/fe/shared/components/SubpageHeader";
import styles from "@/fe/shared/styles/AuthoringPageShell.module.css";

interface AuthoringPageShellProps {
  onBack: () => void;
  backLabel?: string;
  title: string;
  subtitle: string;
  actions?: ReactNode;
  main: ReactNode;
  sidebar?: ReactNode;
  backButtonClassName?: string;
  pageClassName?: string;
  contentGridClassName?: string;
  mainColumnClassName?: string;
  sidebarClassName?: string;
}

export default function AuthoringPageShell({
  onBack,
  backLabel = "Back",
  title,
  subtitle,
  actions,
  main,
  sidebar,
  backButtonClassName,
  pageClassName,
  contentGridClassName,
  mainColumnClassName,
  sidebarClassName,
}: AuthoringPageShellProps) {
  const pageClasses = [styles.page, pageClassName].filter(Boolean).join(" ");
  const contentGridClasses = [styles.contentGrid, contentGridClassName]
    .filter(Boolean)
    .join(" ");
  const mainColumnClasses = [styles.mainColumn, mainColumnClassName]
    .filter(Boolean)
    .join(" ");
  const sidebarClasses = [styles.sidebar, sidebarClassName].filter(Boolean).join(" ");

  return (
    <Box className={pageClasses}>
      <PageHeader
        onBack={onBack}
        backLabel={backLabel}
        backButtonClassName={backButtonClassName}
      />

      <SubpageHeader title={title} subtitle={subtitle} actions={actions} />

      <Box className={contentGridClasses}>
        <Box className={mainColumnClasses}>{main}</Box>
        {sidebar ? <Box className={sidebarClasses}>{sidebar}</Box> : null}
      </Box>
    </Box>
  );
}
