"use client";

import MonitorHeartOutlinedIcon from "@mui/icons-material/MonitorHeartOutlined";
import DashboardWidget from "@/fe/dashboard/components/DashboardWidget";
import type { AdminDashboardSnapshot } from "@/lib/types/adminDashboard";
import styles from "@/fe/dashboard/styles/AdminHealthSnapshotWidget.module.css";

interface AdminHealthSnapshotWidgetProps {
  snapshots: AdminDashboardSnapshot[];
}

export default function AdminHealthSnapshotWidget({
  snapshots,
}: AdminHealthSnapshotWidgetProps) {
  return (
    <DashboardWidget title="System Snapshot" icon={MonitorHeartOutlinedIcon}>
      <div className={styles.snapshotList}>
        {snapshots.length === 0 && (
          <div className={styles.emptyState}>No admin metrics snapshot available yet.</div>
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
