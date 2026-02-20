"use client";

import GppGoodOutlinedIcon from "@mui/icons-material/GppGoodOutlined";
import { Box, Card, CardContent, Chip, Typography } from "@mui/material";
import type { CoverageRow, IntegrityRow } from "@/fe/instructor/data";
import styles from "@/fe/instructor/styles/ResearchAnalyticsPage.module.css";

interface DataQualityHealthCardProps {
  title: string;
  description: string;
  integrityTitle: string;
  coverageTitle: string;
  goodLabel: string;
  reviewLabel: string;
  integrityRows: IntegrityRow[];
  coverageRows: CoverageRow[];
}

export default function DataQualityHealthCard({
  title,
  description,
  integrityTitle,
  coverageTitle,
  goodLabel,
  reviewLabel,
  integrityRows,
  coverageRows,
}: DataQualityHealthCardProps) {
  return (
    <Card className={styles.card}>
      <CardContent className={styles.cardContent}>
        <Box className={styles.cardTitleRow}>
          <GppGoodOutlinedIcon className={styles.cardIcon} />
          <Typography className={styles.cardTitle}>{title}</Typography>
        </Box>
        <Typography className={styles.cardDescription}>{description}</Typography>

        <Box className={styles.qualityGrid}>
          <Box className={styles.qualitySection}>
            <Typography className={styles.qualityTitle}>{integrityTitle}</Typography>
            <Box className={styles.qualityList}>
              {integrityRows.map((item) => (
                <Box key={item.label} className={styles.qualityRowMuted}>
                  <Typography className={styles.qualityLabel}>{item.label}</Typography>
                  <Chip size="small" label={item.value} className={styles.qualityBadge} />
                </Box>
              ))}
            </Box>
          </Box>

          <Box className={styles.qualitySection}>
            <Typography className={styles.qualityTitle}>{coverageTitle}</Typography>
            <Box className={styles.qualityList}>
              {coverageRows.map((item) => (
                <Box key={item.contest} className={styles.qualityRowMuted}>
                  <Typography className={styles.qualityLabel}>{item.contest}</Typography>
                  <Box className={styles.coverageMeta}>
                    <Typography className={styles.coverageValue}>{item.value}</Typography>
                    <Chip
                      size="small"
                      label={item.status === "good" ? goodLabel : reviewLabel}
                      className={
                        item.status === "good" ? styles.coverageGoodBadge : styles.coverageReviewBadge
                      }
                    />
                  </Box>
                </Box>
              ))}
            </Box>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
}
