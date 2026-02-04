import { Box, Button, Chip, Typography } from "@mui/material";
import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded";
import styles from "@/fe/shared/styles/PageHeader.module.css";

interface StatusConfig {
  label: string;
  background: string;
  color: string;
}

interface PageHeaderProps {
  title?: string;
  status?: StatusConfig;
  onBack: () => void;
}

export default function PageHeader({ title, status, onBack }: PageHeaderProps) {
  return (
    <>
      <Button
        className={styles.backButton}
        startIcon={<ArrowBackRoundedIcon />}
        onClick={onBack}
        color="inherit"
      >
        Back
      </Button>

      {title && (
        <Box className={styles.headerRow}>
          <Typography className={styles.title}>{title}</Typography>
          {status && (
            <Chip
              className={styles.statusChip}
              label={status.label}
              size="small"
              sx={{
                backgroundColor: status.background,
                color: status.color,
              }}
            />
          )}
        </Box>
      )}
    </>
  );
}
