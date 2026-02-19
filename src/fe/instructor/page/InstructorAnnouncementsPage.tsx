"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Box,
  Button,
  Card,
  CardContent,
  MenuItem,
  TextField,
  Typography,
} from "@mui/material";
import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded";
import CampaignOutlinedIcon from "@mui/icons-material/CampaignOutlined";
import ChatBubbleOutlineRoundedIcon from "@mui/icons-material/ChatBubbleOutlineRounded";
import KeyboardArrowDownRoundedIcon from "@mui/icons-material/KeyboardArrowDownRounded";
import SendRoundedIcon from "@mui/icons-material/SendRounded";
import CheckCircleOutlineRoundedIcon from "@mui/icons-material/CheckCircleOutlineRounded";
import AccessTimeOutlinedIcon from "@mui/icons-material/AccessTimeOutlined";

import { ROUTES } from "@/fe/shared/constants/routes";
import ScrollbarHider from "@/fe/shared/components/ui/ScrollbarHider";
import {
  instructorAnnouncementHistory,
  instructorContestOptions,
} from "@/fe/instructor/data";
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
        <Button
          className={styles.backButton}
          startIcon={<ArrowBackRoundedIcon className={styles.backIcon} />}
          onClick={() => router.push(ROUTES.instructor)}
          color="inherit"
        >
          Back to Instructor Hub
        </Button>

        <header className={styles.header}>
          <Typography className={styles.title}>
            Announcements & Clarifications
          </Typography>
          <Typography className={styles.subtitle}>
            Send announcements to students in specific contests
          </Typography>
        </header>

        <Card className={styles.card} elevation={0}>
          <Box className={styles.cardHeader}>
            <Box className={styles.cardTitleRow}>
              <CampaignOutlinedIcon className={styles.cardHeaderIcon} />
              <Typography className={styles.cardTitle}>
                Send Contest Announcement
              </Typography>
            </Box>
            <Typography className={styles.cardDescription}>
              Announcements will appear in the contest clarifications tab
            </Typography>
          </Box>

          <CardContent className={styles.cardBody}>
            <Box className={styles.fieldGroup}>
              <Typography className={styles.fieldLabel}>Select Contest</Typography>
              <TextField
                select
                size="small"
                fullWidth
                value={selectedContest}
                onChange={(event) => setSelectedContest(event.target.value)}
                className={styles.selectField}
                SelectProps={{
                  displayEmpty: true,
                  IconComponent: KeyboardArrowDownRoundedIcon,
                }}
              >
                <MenuItem value="" disabled>
                  Choose a contest
                </MenuItem>
                {instructorContestOptions.map((contest) => (
                  <MenuItem key={contest} value={contest}>
                    {contest}
                  </MenuItem>
                ))}
              </TextField>
            </Box>

            <Box className={styles.fieldGroup}>
              <Typography className={styles.fieldLabel}>
                Announcement Message
              </Typography>
              <TextField
                multiline
                minRows={4}
                maxRows={4}
                fullWidth
                value={message}
                onChange={(event) => setMessage(event.target.value)}
                className={styles.messageField}
                placeholder="e.g., Reminder: Contest ends in 2 hours. Problem B clarification: You may use any standard library functions."
              />
              <Typography className={styles.helperText}>
                This will be visible to all students enrolled in the selected contest
              </Typography>
            </Box>

            <Button
              className={styles.sendButton}
              startIcon={<SendRoundedIcon className={styles.sendIcon} />}
              disabled={isSendDisabled}
              onClick={() => {
                // Mock interaction only: reset form after submit.
                setSelectedContest("");
                setMessage("");
              }}
            >
              Send Announcement
            </Button>
          </CardContent>
        </Card>

        <Card className={styles.card} elevation={0}>
          <Box className={styles.cardHeader}>
            <Box className={styles.cardTitleRow}>
              <ChatBubbleOutlineRoundedIcon className={styles.cardHeaderIcon} />
              <Typography className={styles.cardTitle}>Recent Announcements</Typography>
            </Box>
            <Typography className={styles.cardDescription}>
              View your previously sent announcements
            </Typography>
          </Box>

          <CardContent className={styles.listContent}>
            {instructorAnnouncementHistory.map((item) => (
              <Box key={item.id} className={styles.announcementItem}>
                <Box className={styles.itemMainRow}>
                  <Box className={styles.itemText}>
                    <Typography className={styles.itemContest}>{item.contest}</Typography>
                    <Typography className={styles.itemMessage}>{item.message}</Typography>
                  </Box>

                  <Box className={styles.sentBadge}>
                    <CheckCircleOutlineRoundedIcon className={styles.sentBadgeIcon} />
                    <Typography className={styles.sentBadgeText}>Sent</Typography>
                  </Box>
                </Box>

                <Box className={styles.itemMetaRow}>
                  <Box className={styles.itemMetaInline}>
                    <AccessTimeOutlinedIcon className={styles.metaIcon} />
                    <Typography className={styles.metaText}>{item.timeAgo}</Typography>
                  </Box>
                  <Typography className={styles.metaText}>{item.views} views</Typography>
                </Box>
              </Box>
            ))}
          </CardContent>
        </Card>
      </Box>
    </>
  );
}
