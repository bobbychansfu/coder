import { Box, Button, Typography } from "@mui/material";
import type { ClarificationItem } from "@/fe/contests/data/contestDetails";
import styles from "@/fe/contests/styles/ContestDetailPage.module.css";

interface ClarificationsTabProps {
  clarifications: ClarificationItem[];
}

export default function ClarificationsTab({ clarifications }: ClarificationsTabProps) {
  return (
    <Box className={styles.clarificationsCard}>
      <Box className={styles.clarificationsHeader}>
        <Typography className={styles.clarificationsTitle}>Contest Clarifications</Typography>
        <Button
          variant="contained"
          className={styles.askButton}
          sx={{
            backgroundColor: "#dc2626",
            "&:hover": { backgroundColor: "#ef4444" },
          }}
        >
          Ask Question
        </Button>
      </Box>

      <Box className={styles.clarificationsList}>
        {clarifications.map((item) => (
          <Box
            key={item.question}
            className={`${styles.clarificationItem} ${
              item.status === "answered"
                ? styles.clarificationAnswered
                : styles.clarificationPending
            }`}
          >
            <Box className={styles.clarificationRow}>
              <Typography className={styles.clarificationQuestion}>
                {item.question}
              </Typography>
              <span
                className={`${styles.clarificationBadge} ${
                  item.status === "answered"
                    ? styles.badgeAnswered
                    : styles.badgePending
                }`}
              >
                {item.status === "answered" ? "Answered" : "Pending"}
              </span>
            </Box>
            {item.response ? (
              <Typography className={styles.clarificationResponse}>
                <strong>Response:</strong> {item.response}
              </Typography>
            ) : null}
            <Typography className={styles.clarificationTime}>
              {item.timeAgo}
            </Typography>
          </Box>
        ))}
      </Box>
    </Box>
  );
}
