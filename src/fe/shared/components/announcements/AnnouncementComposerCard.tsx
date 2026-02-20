"use client";

import CampaignOutlinedIcon from "@mui/icons-material/CampaignOutlined";
import KeyboardArrowDownRoundedIcon from "@mui/icons-material/KeyboardArrowDownRounded";
import SendRoundedIcon from "@mui/icons-material/SendRounded";
import {
  Box,
  Button,
  Card,
  CardContent,
  MenuItem,
  TextField,
  Typography,
} from "@mui/material";
import styles from "@/fe/shared/styles/AnnouncementComposerCard.module.css";

interface AnnouncementComposerCardProps {
  title: string;
  description: string;
  contestLabel: string;
  contestPlaceholder: string;
  contestOptions: string[];
  selectedContest: string;
  onContestChange: (value: string) => void;
  messageLabel: string;
  messagePlaceholder: string;
  message: string;
  onMessageChange: (value: string) => void;
  helperText: string;
  buttonLabel: string;
  onSend: () => void;
  disabled?: boolean;
}

export default function AnnouncementComposerCard({
  title,
  description,
  contestLabel,
  contestPlaceholder,
  contestOptions,
  selectedContest,
  onContestChange,
  messageLabel,
  messagePlaceholder,
  message,
  onMessageChange,
  helperText,
  buttonLabel,
  onSend,
  disabled = false,
}: AnnouncementComposerCardProps) {
  return (
    <Card className={styles.card} elevation={0}>
      <Box className={styles.cardHeader}>
        <Box className={styles.cardTitleRow}>
          <CampaignOutlinedIcon className={styles.cardHeaderIcon} />
          <Typography className={styles.cardTitle}>{title}</Typography>
        </Box>
        <Typography className={styles.cardDescription}>{description}</Typography>
      </Box>

      <CardContent className={styles.cardBody}>
        <Box className={styles.fieldGroup}>
          <Typography className={styles.fieldLabel}>{contestLabel}</Typography>
          <TextField
            select
            size="small"
            fullWidth
            value={selectedContest}
            onChange={(event) => onContestChange(event.target.value)}
            className={styles.selectField}
            SelectProps={{
              displayEmpty: true,
              IconComponent: KeyboardArrowDownRoundedIcon,
            }}
          >
            <MenuItem value="" disabled>
              {contestPlaceholder}
            </MenuItem>
            {contestOptions.map((contest) => (
              <MenuItem key={contest} value={contest}>
                {contest}
              </MenuItem>
            ))}
          </TextField>
        </Box>

        <Box className={styles.fieldGroup}>
          <Typography className={styles.fieldLabel}>{messageLabel}</Typography>
          <TextField
            multiline
            minRows={4}
            maxRows={4}
            fullWidth
            value={message}
            onChange={(event) => onMessageChange(event.target.value)}
            className={styles.messageField}
            placeholder={messagePlaceholder}
          />
          <Typography className={styles.helperText}>{helperText}</Typography>
        </Box>

        <Button
          className={styles.sendButton}
          startIcon={<SendRoundedIcon className={styles.sendIcon} />}
          disabled={disabled}
          onClick={onSend}
        >
          {buttonLabel}
        </Button>
      </CardContent>
    </Card>
  );
}
