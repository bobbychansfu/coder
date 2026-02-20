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
  backLabel?: string;
  backButtonClassName?: string;
  headerClassName?: string;
  titleClassName?: string;
  statusChipClassName?: string;
}

export default function PageHeader({
  title,
  status,
  onBack,
  backLabel = "Back",
  backButtonClassName,
  headerClassName,
  titleClassName,
  statusChipClassName,
}: PageHeaderProps) {
  const backButtonClasses = [styles.backButton, backButtonClassName].filter(Boolean).join(" ");
  const headerClasses = [styles.headerRow, headerClassName].filter(Boolean).join(" ");
  const titleClasses = [styles.title, titleClassName].filter(Boolean).join(" ");
  const statusChipClasses = [styles.statusChip, statusChipClassName].filter(Boolean).join(" ");

  return (
    <>
      <Button
        className={backButtonClasses}
        startIcon={<ArrowBackRoundedIcon />}
        onClick={onBack}
        color="inherit"
      >
        {backLabel}
      </Button>

      {title && (
        <Box className={headerClasses}>
          <Typography className={titleClasses}>{title}</Typography>
          {status && (
            <Chip
              className={statusChipClasses}
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
