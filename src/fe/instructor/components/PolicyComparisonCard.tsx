"use client";

import AccessTimeOutlinedIcon from "@mui/icons-material/AccessTimeOutlined";
import LightbulbOutlineRoundedIcon from "@mui/icons-material/LightbulbOutlineRounded";
import LeaderboardOutlinedIcon from "@mui/icons-material/LeaderboardOutlined";
import { Box, Card, CardContent, Typography } from "@mui/material";
import type { ConditionSummaryPanel, KeyFinding } from "@/fe/instructor/data";
import styles from "@/fe/instructor/styles/ResearchAnalyticsPage.module.css";

interface PolicyComparisonCardProps {
  title: string;
  description: string;
  keyFindingsTitle: string;
  panels: ConditionSummaryPanel[];
  keyFindings: KeyFinding[];
}

export default function PolicyComparisonCard({
  title,
  description,
  keyFindingsTitle,
  panels,
  keyFindings,
}: PolicyComparisonCardProps) {
  return (
    <Card className={`${styles.card} ${styles.policyComparisonCard}`}>
      <CardContent className={styles.cardContent}>
        <Box className={styles.cardTitleRow}>
          <LeaderboardOutlinedIcon className={styles.cardIcon} />
          <Typography className={styles.cardTitle}>{title}</Typography>
        </Box>
        <Typography className={styles.cardDescription}>{description}</Typography>

        <Box className={styles.policyGridLarge}>
          {panels.map((panel) => {
            const isEarly = panel.tone === "early";
            return (
              <Box
                key={panel.id}
                className={isEarly ? styles.policyPanelEarly : styles.policyPanelDelayed}
              >
                <Box className={styles.policyPanelTitleRow}>
                  {isEarly ? (
                    <LightbulbOutlineRoundedIcon className={styles.policyPanelIcon} />
                  ) : (
                    <AccessTimeOutlinedIcon className={styles.policyPanelIcon} />
                  )}
                  <Typography
                    className={
                      isEarly ? styles.policyPanelTitleEarly : styles.policyPanelTitleDelayed
                    }
                  >
                    {panel.title}
                  </Typography>
                </Box>

                <Box className={styles.policyPanelMetrics}>
                  {panel.metrics.map((metric) => (
                    <Box key={`${panel.id}-${metric.label}`} className={styles.policyPanelMetric}>
                      <Typography
                        className={
                          isEarly
                            ? styles.policyPanelMetricLabelEarly
                            : styles.policyPanelMetricLabelDelayed
                        }
                      >
                        {metric.label}
                      </Typography>
                      <Typography
                        className={
                          metric.emphasis === "positive"
                            ? styles.policyPanelValuePositive
                            : metric.emphasis === "accent"
                              ? styles.policyPanelValueAccent
                              : styles.policyPanelValue
                        }
                      >
                        {metric.value}
                      </Typography>
                    </Box>
                  ))}
                </Box>
              </Box>
            );
          })}
        </Box>

        <Box className={styles.keyFindingsBox}>
          <Typography className={styles.keyFindingsTitle}>{keyFindingsTitle}</Typography>
          <Box className={styles.keyFindingsRow}>
            {keyFindings.map((item) => (
              <Box key={item.label} className={styles.keyFindingItem}>
                <Typography className={styles.keyFindingLabel}>{item.label}:</Typography>
                <Typography
                  className={
                    item.tone === "positive" ? styles.keyFindingValuePositive : styles.keyFindingValueInfo
                  }
                >
                  {item.value}
                </Typography>
              </Box>
            ))}
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
}
