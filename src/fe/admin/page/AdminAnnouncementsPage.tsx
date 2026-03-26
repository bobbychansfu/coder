"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import NotificationsNoneOutlinedIcon from "@mui/icons-material/NotificationsNoneOutlined";
import { Box } from "@mui/material";

import {
  adminAnnouncementHistory,
  adminAnnouncementStats,
} from "@/fe/admin/data/announcements";
import SubpageHeader from "@/fe/shared/components/SubpageHeader";
import subpageStyles from "@/fe/shared/styles/SubpageHeader.module.css";
import AnnouncementComposerCard from "@/fe/shared/components/announcements/AnnouncementComposerCard";
import AnnouncementManagementListCard from "@/fe/shared/components/announcements/AnnouncementManagementListCard";
import PageHeader from "@/fe/shared/components/PageHeader";
import StatCard from "@/fe/shared/components/StatCard";
import { ROUTES } from "@/fe/shared/constants/routes";
import styles from "@/fe/admin/styles/AdminAnnouncementsPage.module.css";

export default function AdminAnnouncementsPage() {
  const router = useRouter();
  const [message, setMessage] = useState("");

  const isSendDisabled = useMemo(() => {
    return message.trim().length === 0;
  }, [message]);

  return (
    <Box className={styles.page}>
      <PageHeader
        onBack={() => router.push(ROUTES.admin)}
        backLabel="Back"
        backButtonClassName={subpageStyles.backButton}
      />

      <SubpageHeader
        title="Platform Announcements"
        subtitle="Send and manage platform-wide announcements to all users"
      />

      <Box className={styles.statsGrid}>
        {adminAnnouncementStats.map((stat) => (
          <StatCard
            key={stat.id}
            label={stat.label}
            value={stat.value}
            caption={stat.caption}
            className={styles.statCard}
            headerClassName={styles.statHeader}
            labelClassName={styles.statLabel}
            contentClassName={styles.statContent}
            valueClassName={styles.statValue}
            captionClassName={styles.statCaption}
          />
        ))}
      </Box>

      <AnnouncementComposerCard
        title="Send Platform Announcement"
        description="This message will appear on all users' dashboards"
        headerIcon={NotificationsNoneOutlinedIcon}
        showContestSelect={false}
        messageLabel="Announcement Message"
        messagePlaceholder="e.g., Scheduled maintenance: Platform will be down for maintenance on Sunday from 2:00 AM to 4:00 AM PST."
        message={message}
        onMessageChange={setMessage}
        helperText="This will be visible to all users on their dashboard"
        buttonLabel="Send Announcement"
        disabled={isSendDisabled}
        onSend={() => setMessage("")}
      />

      <AnnouncementManagementListCard
        title="Manage Announcements"
        description="View, edit, and delete platform announcements"
        announcements={adminAnnouncementHistory}
      />
    </Box>
  );
}
