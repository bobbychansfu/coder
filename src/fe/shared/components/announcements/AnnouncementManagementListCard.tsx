"use client";

import AccessTimeOutlinedIcon from "@mui/icons-material/AccessTimeOutlined";
import ChatBubbleOutlineRoundedIcon from "@mui/icons-material/ChatBubbleOutlineRounded";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import { Box, Button, Card, CardContent, Chip, Typography } from "@mui/material";

import styles from "@/fe/shared/styles/AnnouncementManagementListCard.module.css";

export interface ManagedAnnouncementItem {
  id: string;
  status: "active" | "inactive";
  author: string;
  message: string;
  timeAgo: string;
  views: number;
}

interface AnnouncementManagementListCardProps {
  title: string;
  description: string;
  announcements: ManagedAnnouncementItem[];
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
}

export default function AnnouncementManagementListCard({
  title,
  description,
  announcements,
  onEdit,
  onDelete,
}: AnnouncementManagementListCardProps) {
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
        {announcements.map((item) => {
          const isActive = item.status === "active";

          return (
            <Box key={item.id} className={styles.announcementItem}>
              <Box className={styles.itemTopRow}>
                <Box className={styles.itemMain}>
                  <Box className={styles.itemMetaTop}>
                    <Chip
                      size="small"
                      label={isActive ? "Active" : "Inactive"}
                      className={isActive ? styles.activeBadge : styles.inactiveBadge}
                    />
                    <Typography className={styles.authorText}>{item.author}</Typography>
                  </Box>

                  <Typography className={styles.messageText}>{item.message}</Typography>

                  <Box className={styles.itemMetaBottom}>
                    <Box className={styles.inlineMeta}>
                      <AccessTimeOutlinedIcon className={styles.metaIcon} />
                      <Typography className={styles.metaText}>{item.timeAgo}</Typography>
                    </Box>
                    <Typography className={styles.metaText}>{`${item.views.toLocaleString()} views`}</Typography>
                  </Box>
                </Box>

                <Box className={styles.itemActions}>
                  <Button
                    className={styles.iconButton}
                    onClick={() => onEdit?.(item.id)}
                    aria-label={`Edit announcement ${item.id}`}
                  >
                    <EditOutlinedIcon className={styles.editIcon} />
                  </Button>
                  <Button
                    className={styles.iconButton}
                    onClick={() => onDelete?.(item.id)}
                    aria-label={`Delete announcement ${item.id}`}
                  >
                    <DeleteOutlineRoundedIcon className={styles.deleteIcon} />
                  </Button>
                </Box>
              </Box>
            </Box>
          );
        })}
      </CardContent>
    </Card>
  );
}
