import { useMemo } from "react";
import { Box, Typography } from "@mui/material";
import AccessTimeOutlinedIcon from "@mui/icons-material/AccessTimeOutlined";
import MemoryOutlinedIcon from "@mui/icons-material/MemoryOutlined";
import TabSwitcher from "@/fe/shared/components/ui/TabSwitcher";
import { SUBMISSION_STATUS_CONFIG } from "@/fe/shared/constants/options";
import type { ProblemDetail } from "@/fe/contests/data/problemDetails";
import styles from "@/fe/contests/styles/ProblemSubmissionPage.module.css";

interface ProblemDetailsProps {
  detail: ProblemDetail;
  tab: string;
  onTabChange: (tab: string) => void;
}

const renderInlineCode = (text: string) => {
  const segments = text.split(/`([^`]+)`/g);
  return segments.map((segment, index) =>
    index % 2 === 1 ? (
      <Box component="span" key={`${segment}-${index}`} className={styles.inlineCode}>
        {segment}
      </Box>
    ) : (
      segment
    ),
  );
};

export default function ProblemDetails({ detail, tab, onTabChange }: ProblemDetailsProps) {
  const tabContent = useMemo(() => {
    if (tab === "submissions") {
      return (
        <Box className={styles.submissionsTable}>
          <Box className={styles.submissionsHeader}>
            <Typography className={styles.submissionsHeaderCell}>Status</Typography>
            <Typography className={styles.submissionsHeaderCell}>Language</Typography>
            <Typography className={styles.submissionsHeaderCell}>Runtime</Typography>
            <Typography className={styles.submissionsHeaderCell}>Memory</Typography>
            <Typography className={styles.submissionsHeaderCell}>Submitted</Typography>
          </Box>
          {detail.submissions.length === 0 ? (
            <Typography className={styles.emptyState}>No submissions yet.</Typography>
          ) : (
            detail.submissions.map((submission) => {
              const config = SUBMISSION_STATUS_CONFIG[submission.status];
              const StatusIcon = config.icon;
              return (
                <Box key={submission.id} className={styles.submissionsRow}>
                  <Box className={styles.submissionStatusCell}>
                    <StatusIcon sx={{ fontSize: 16, color: config.color }} />
                    <Typography className={styles.submissionStatusText} sx={{ color: config.color }}>
                      {config.label}
                    </Typography>
                  </Box>
                  <Typography className={styles.submissionsCell}>{submission.language}</Typography>
                  <Typography className={styles.submissionsCell}>{submission.runtime}</Typography>
                  <Typography className={styles.submissionsCell}>{submission.memory}</Typography>
                  <Typography className={styles.submissionsCellMuted}>{submission.submitted}</Typography>
                </Box>
              );
            })
          )}
        </Box>
      );
    }

    if (tab === "editorial") {
      return (
        <Box display="flex" flexDirection="column" gap="16px">
          <Box display="flex" flexDirection="column" gap="8px">
            <Typography className={styles.sectionTitle}>Solution Approach</Typography>
            <Typography className={styles.paragraph}>{detail.editorial.approach}</Typography>
          </Box>
          <Box display="flex" flexDirection="column" gap="4px">
            <Typography className={styles.editorialHeading}>Time Complexity</Typography>
            <Typography className={styles.paragraph}>{detail.editorial.timeComplexity}</Typography>
          </Box>
          <Box display="flex" flexDirection="column" gap="4px">
            <Typography className={styles.editorialHeading}>Space Complexity</Typography>
            <Typography className={styles.paragraph}>{detail.editorial.spaceComplexity}</Typography>
          </Box>
          <Box className={styles.editorialNote}>
            <Typography className={styles.editorialNoteLabel}>Note:</Typography>
            <Typography className={styles.editorialNoteText}>{detail.editorial.note}</Typography>
          </Box>
        </Box>
      );
    }

    return (
      <Box display="flex" flexDirection="column" gap="24px">
        <Box className={styles.statsRow}>
          <Box className={styles.statItem}>
            <AccessTimeOutlinedIcon fontSize="inherit" />
            <span>Time Limit:</span>
            <span className={styles.statValue}>{detail.timeLimit}</span>
          </Box>
          <Box className={styles.statItem}>
            <MemoryOutlinedIcon fontSize="inherit" />
            <span>Memory:</span>
            <span className={styles.statValue}>{detail.memory}</span>
          </Box>
        </Box>

        <Box display="flex" flexDirection="column" gap="12px">
          <Typography className={styles.sectionTitle}>Problem Statement</Typography>
          {detail.statement.map((paragraph) => (
            <Typography key={paragraph} className={styles.paragraph}>
              {renderInlineCode(paragraph)}
            </Typography>
          ))}
        </Box>

        <Box display="flex" flexDirection="column" gap="12px">
          <Typography className={styles.sectionTitle}>Input Format</Typography>
          <Box component="ul" className={styles.list}>
            {detail.inputFormat.map((item) => (
              <li key={item} className={styles.listItem}>
                {renderInlineCode(item)}
              </li>
            ))}
          </Box>
        </Box>

        <Box display="flex" flexDirection="column" gap="12px">
          <Typography className={styles.sectionTitle}>Output Format</Typography>
          <Box component="ul" className={styles.list}>
            {detail.outputFormat.map((item) => (
              <li key={item} className={styles.listItem}>
                {renderInlineCode(item)}
              </li>
            ))}
          </Box>
        </Box>

        <Box display="flex" flexDirection="column" gap="12px">
          <Typography className={styles.sectionTitle}>Constraints</Typography>
          <Box component="ul" className={styles.list}>
            {detail.constraints.map((item) => (
              <li key={item} className={styles.listItem}>
                {renderInlineCode(item)}
              </li>
            ))}
          </Box>
        </Box>

        <Box display="flex" flexDirection="column" gap="12px">
          <Typography className={styles.sectionTitle}>Example</Typography>
          <Box className={styles.exampleCard}>
            <Typography className={styles.exampleLabel}>Input:</Typography>
            {detail.example.input.map((line) => (
              <Typography key={line} className={styles.exampleText}>
                {line}
              </Typography>
            ))}
            <Typography className={styles.exampleLabel}>Output:</Typography>
            {detail.example.output.map((line) => (
              <Typography key={line} className={styles.exampleText}>
                {line}
              </Typography>
            ))}
            <Typography className={styles.exampleExplanation}>
              Explanation: {renderInlineCode(detail.example.explanation)}
            </Typography>
          </Box>
        </Box>
      </Box>
    );
  }, [detail, tab]);

  return (
    <Box
      className={`${styles.card} ${styles.detailsCard} ${
        tab === "description"
          ? styles.detailsCardLarge
          : tab === "submissions"
            ? styles.detailsCardCompact
            : styles.detailsCardEditorial
      }`}
    >
      <TabSwitcher
        size="sm"
        value={tab}
        onChange={onTabChange}
        options={[
          { value: "description", label: "Description" },
          { value: "submissions", label: "Submissions" },
          { value: "editorial", label: "Editorial" },
        ]}
        ariaLabel="Problem detail tabs"
      />
      {tabContent}
    </Box>
  );
}
