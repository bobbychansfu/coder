"use client";

import AccessTimeRoundedIcon from "@mui/icons-material/AccessTimeRounded";
import AutorenewRoundedIcon from "@mui/icons-material/AutorenewRounded";
import CheckCircleOutlineRoundedIcon from "@mui/icons-material/CheckCircleOutlineRounded";
import PendingActionsRoundedIcon from "@mui/icons-material/PendingActionsRounded";
import WarningAmberRoundedIcon from "@mui/icons-material/WarningAmberRounded";
import { Box, Typography } from "@mui/material";
import type { InstructorAnalysisData } from "@/lib/types/instructorAnalysis";
import styles from "@/fe/instructor/styles/ResearchAnalyticsPage.module.css";

interface InstructorAnalysisSnapshotCardProps {
  contestTitle: string;
  contestDateLabel: string;
  contestStatusLabel: string;
  snapshot: InstructorAnalysisData["snapshot"];
}

function SnapshotIcon({ status }: { status: InstructorAnalysisData["snapshot"]["status"] }) {
  if (status === "DONE") {
    return <CheckCircleOutlineRoundedIcon className={styles.snapshotToneSuccess} />;
  }

  if (status === "FAILED") {
    return <WarningAmberRoundedIcon className={styles.snapshotToneDanger} />;
  }

  if (status === "RUNNING") {
    return <AutorenewRoundedIcon className={styles.snapshotToneInfo} />;
  }

  if (status === "QUEUED") {
    return <PendingActionsRoundedIcon className={styles.snapshotToneMuted} />;
  }

  return <AccessTimeRoundedIcon className={styles.snapshotToneMuted} />;
}

export default function InstructorAnalysisSnapshotCard({
  contestTitle,
  contestDateLabel,
  contestStatusLabel,
  snapshot,
}: InstructorAnalysisSnapshotCardProps) {
  return (
    <Box className={styles.card}>
      <Box className={styles.cardHeader}>
        <Box>
          <Typography className={styles.cardEyebrow}>Snapshot Status</Typography>
          <Typography className={styles.cardTitle}>{contestTitle}</Typography>
          <Typography className={styles.cardDescription}>{contestDateLabel}</Typography>
        </Box>
        <Box className={styles.snapshotStatusBadge}>
          <SnapshotIcon status={snapshot.status} />
          <Typography className={styles.snapshotStatusText}>{snapshot.statusLabel}</Typography>
        </Box>
      </Box>

      <Box className={styles.snapshotMetaGrid}>
        <Box className={styles.snapshotMetaItem}>
          <Typography className={styles.snapshotMetaLabel}>Requested View</Typography>
          <Typography className={styles.snapshotMetaValue}>
            {snapshot.requestedPreferenceLabel}
          </Typography>
        </Box>
        <Box className={styles.snapshotMetaItem}>
          <Typography className={styles.snapshotMetaLabel}>Resolved Snapshot</Typography>
          <Typography className={styles.snapshotMetaValue}>{snapshot.resolvedTypeLabel}</Typography>
        </Box>
        <Box className={styles.snapshotMetaItem}>
          <Typography className={styles.snapshotMetaLabel}>Contest Status</Typography>
          <Typography className={styles.snapshotMetaValue}>{contestStatusLabel}</Typography>
        </Box>
        <Box className={styles.snapshotMetaItem}>
          <Typography className={styles.snapshotMetaLabel}>Snapshot Watermark</Typography>
          <Typography className={styles.snapshotMetaValue}>{snapshot.watermarkLabel}</Typography>
        </Box>
        <Box className={styles.snapshotMetaItem}>
          <Typography className={styles.snapshotMetaLabel}>Last Compute</Typography>
          <Typography className={styles.snapshotMetaValue}>{snapshot.computedAtLabel}</Typography>
        </Box>
      </Box>

      <Box className={styles.snapshotMessageBox}>
        <Typography className={styles.snapshotMessage}>{snapshot.message}</Typography>
      </Box>
    </Box>
  );
}
