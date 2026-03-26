"use client";

import PsychologyAltOutlinedIcon from "@mui/icons-material/PsychologyAltOutlined";
import DashboardWidget from "@/fe/dashboard/components/DashboardWidget";
import type { InstructorDashboardSnapshot } from "@/lib/types/instructorDashboard";
import styles from "@/fe/dashboard/styles/InstructorMetricsSnapshotWidget.module.css";

interface InstructorMetricsSnapshotWidgetProps {
  snapshots: InstructorDashboardSnapshot[];
}

export default function InstructorMetricsSnapshotWidget({
  snapshots,
}: InstructorMetricsSnapshotWidgetProps) {
  return (
    <DashboardWidget title="Metrics Snapshot" icon={PsychologyAltOutlinedIcon}>
      <div className={styles.snapshotList}>
        {snapshots.length === 0 && (
          <div className={styles.emptyState}>No metrics snapshot available yet.</div>
        )}
        {snapshots.map((snapshot) => (
          <article key={snapshot.id} className={styles.snapshotCard}>
            <p className={styles.snapshotLabel}>{snapshot.label}</p>
            <p className={styles.snapshotValue}>{snapshot.value}</p>
            <p className={styles.snapshotCaption}>{snapshot.caption}</p>
          </article>
        ))}
      </div>
    </DashboardWidget>
  );
}
