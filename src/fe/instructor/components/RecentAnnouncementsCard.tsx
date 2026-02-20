"use client";

import AccessTimeOutlinedIcon from "@mui/icons-material/AccessTimeOutlined";
import ChatBubbleOutlineRoundedIcon from "@mui/icons-material/ChatBubbleOutlineRounded";
import CheckCircleOutlineRoundedIcon from "@mui/icons-material/CheckCircleOutlineRounded";
import { Box, Card, CardContent, Typography } from "@mui/material";
import type { InstructorAnnouncementRecord } from "@/fe/instructor/data";
import styles from "@/fe/instructor/styles/RecentAnnouncementsCard.module.css";

interface RecentAnnouncementsCardProps {
  title: string;
  description: string;
  announcements: InstructorAnnouncementRecord[];
}

export default function RecentAnnouncementsCard({
  title,
  description,
  announcements,
}: RecentAnnouncementsCardProps) {
  return (
    <Card className={styles.card} elevation={0}>
      <Box className={styles.cardHeader}>
        <Box className={styles.cardTitleRow}>
          <ChatBubbleOutlineRoundedIcon className={styles.cardHeaderIcon} />
          <Typography className={styles.cardTitle}>{title}</Typography>
        </Box>
        <Typography className={styles.cardDescription}>{description}</Typography>
      </Box>

      <CardContent className={styles.listContent}>
        {announcements.map((item) => (
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
  );
}
