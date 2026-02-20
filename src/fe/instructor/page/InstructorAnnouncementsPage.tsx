"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Box } from "@mui/material";

import { ROUTES } from "@/fe/shared/constants/routes";
import ScrollbarHider from "@/fe/shared/components/ui/ScrollbarHider";
import AnnouncementComposerCard from "@/fe/shared/components/announcements/AnnouncementComposerCard";
import PageHeader from "@/fe/shared/components/PageHeader";
import InstructorSubpageHeader from "@/fe/instructor/components/InstructorSubpageHeader";
import {
  instructorAnnouncementHistory,
  instructorContestOptions,
} from "@/fe/instructor/data";
import RecentAnnouncementsCard from "@/fe/instructor/components/RecentAnnouncementsCard";
import subpageStyles from "@/fe/instructor/styles/InstructorSubpageHeader.module.css";
import styles from "@/fe/instructor/styles/InstructorAnnouncementsPage.module.css";

export default function InstructorAnnouncementsPage() {
  const router = useRouter();
  const [selectedContest, setSelectedContest] = useState("");
  const [message, setMessage] = useState("");

  const isSendDisabled = useMemo(() => {
    return selectedContest.trim().length === 0 || message.trim().length === 0;
  }, [selectedContest, message]);

  return (
    <>
      <ScrollbarHider />
      <Box className={styles.page}>
        <PageHeader
          onBack={() => router.push(ROUTES.instructor)}
          backLabel="Back to Instructor Hub"
          backButtonClassName={subpageStyles.backButton}
        />

        <InstructorSubpageHeader
          title="Announcements & Clarifications"
          subtitle="Send announcements to students in specific contests"
        />

        <AnnouncementComposerCard
          title="Send Contest Announcement"
          description="Announcements will appear in the contest clarifications tab"
          contestLabel="Select Contest"
          contestPlaceholder="Choose a contest"
          contestOptions={instructorContestOptions}
          selectedContest={selectedContest}
          onContestChange={setSelectedContest}
          messageLabel="Announcement Message"
          messagePlaceholder="e.g., Reminder: Contest ends in 2 hours. Problem B clarification: You may use any standard library functions."
          message={message}
          onMessageChange={setMessage}
          helperText="This will be visible to all students enrolled in the selected contest"
          buttonLabel="Send Announcement"
          disabled={isSendDisabled}
          onSend={() => {
            // Mock interaction only: reset form after submit.
            setSelectedContest("");
            setMessage("");
          }}
        />

        <RecentAnnouncementsCard
          title="Recent Announcements"
          description="View your previously sent announcements"
          announcements={instructorAnnouncementHistory}
        />
      </Box>
    </>
  );
}
