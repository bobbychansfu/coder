"use client";

import EmojiEventsOutlinedIcon from "@mui/icons-material/EmojiEventsOutlined";
import TableViewOutlinedIcon from "@mui/icons-material/TableViewOutlined";
import { Box, Card, CardContent, Chip, Typography } from "@mui/material";
import { PieChart } from "@mui/x-charts/PieChart";
import type { ContestLiftRow, ProblemRow } from "@/fe/instructor/data";
import styles from "@/fe/instructor/styles/ResearchAnalyticsPage.module.css";

interface ProblemAnalysisCardProps {
  variant: "problem" | "contest";
  title: string;
  description: string;
  problemRows?: ProblemRow[];
  contestRows?: ContestLiftRow[];
}

export default function ProblemAnalysisCard({
  variant,
  title,
  description,
  problemRows = [],
  contestRows = [],
}: ProblemAnalysisCardProps) {
  const isContest = variant === "contest";
  const parseSignedPercent = (value: string) => {
    const matched = value.match(/-?\d+(?:\.\d+)?/);
    return matched ? Number.parseFloat(matched[0]) : 0;
  };
  const parseSignedTimeMinutes = (value: string) => {
    const matched = value.match(/(-?)(\d+)m(?:\s*(\d+)s)?/i);

    if (!matched) {
      return 0;
    }

    const sign = matched[1] === "-" ? -1 : 1;
    const minutes = Number.parseInt(matched[2], 10);
    const seconds = matched[3] ? Number.parseInt(matched[3], 10) : 0;
    return sign * (minutes + seconds / 60);
  };
  const getAverageAbsolute = (values: number[]) => {
    if (values.length === 0) {
      return 0;
    }

    return values.reduce((total, current) => total + Math.abs(current), 0) / values.length;
  };

  const contestMetricData = [
    {
      id: 0,
      label: "Solve Lift",
      value: Number.parseFloat(
        getAverageAbsolute(contestRows.map((row) => parseSignedPercent(row.solveDelta))).toFixed(1),
      ),
      color: "#155dfc",
    },
    {
      id: 1,
      label: "Time Reduction",
      value: Number.parseFloat(
        getAverageAbsolute(contestRows.map((row) => parseSignedTimeMinutes(row.timeDelta))).toFixed(1),
      ),
      color: "#00a63e",
    },
    {
      id: 2,
      label: "Hint Lift",
      value: Number.parseFloat(
        getAverageAbsolute(contestRows.map((row) => parseSignedPercent(row.hintDelta))).toFixed(1),
      ),
      color: "#9810fa",
    },
  ];

  const problemMetricData = [
    {
      id: 0,
      label: "Solve Delta",
      value: Number.parseFloat(
        getAverageAbsolute(problemRows.map((row) => parseSignedPercent(row.solveDelta))).toFixed(1),
      ),
      color: "#155dfc",
    },
    {
      id: 1,
      label: "Hint-Time Delta",
      value: Number.parseFloat(
        getAverageAbsolute(problemRows.map((row) => parseSignedTimeMinutes(row.hintDelta))).toFixed(1),
      ),
      color: "#00a63e",
    },
  ];
  const pieData = isContest ? contestMetricData : problemMetricData;
  const hasPieData = pieData.some((metric) => metric.value > 0);
  const safePieData = hasPieData
    ? pieData
    : [{ id: 0, label: "No Data", value: 1, color: "#d1d5dc" }];
  const analysisListClassName = [
    styles.analysisList,
    isContest ? "" : styles.analysisListScrollable,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <Card className={styles.card}>
      <CardContent className={styles.cardContent}>
        <Box className={styles.cardTitleRow}>
          {isContest ? (
            <EmojiEventsOutlinedIcon className={styles.cardIcon} />
          ) : (
            <TableViewOutlinedIcon className={styles.cardIcon} />
          )}
          <Typography className={styles.cardTitle}>{title}</Typography>
        </Box>
        <Typography className={styles.cardDescription}>{description}</Typography>

        <Box className={styles.analysisChartGrid}>
          <Box className={styles.analysisPieWrap}>
            <Typography className={styles.analysisPieTitle}>A/B Difference Composition</Typography>
            <PieChart
              series={[
                {
                  data: safePieData,
                  innerRadius: 58,
                  outerRadius: 104,
                  paddingAngle: 3,
                  cornerRadius: 5,
                  arcLabel: "value",
                  arcLabelMinAngle: 18,
                },
              ]}
              slotProps={{
                legend: {
                  direction: "vertical",
                  position: { vertical: "middle", horizontal: "end" },
                },
              }}
              margin={{ top: 8, right: 130, bottom: 8, left: 8 }}
              height={260}
            />
          </Box>

          <Box className={analysisListClassName}>
            {(isContest ? contestRows : problemRows).map((row) => (
              <Box
                key={isContest ? (row as ContestLiftRow).contest : (row as ProblemRow).problem}
                className={styles.analysisListItem}
              >
                {isContest ? (
                  <>
                    <Typography className={styles.analysisItemTitle}>
                      {(row as ContestLiftRow).contest}
                    </Typography>
                    <Box className={styles.analysisChipRow}>
                      <Chip
                        size="small"
                        label={`Solve ${(
                          row as ContestLiftRow
                        ).solveDelta}`}
                        className={`${styles.deltaPositiveChip} ${styles.analysisMetricChip}`}
                      />
                      <Chip
                        size="small"
                        label={`Time ${(row as ContestLiftRow).timeDelta}`}
                        className={`${styles.deltaOutlineChip} ${styles.analysisMetricChip}`}
                      />
                      <Chip
                        size="small"
                        label={`Hint ${(row as ContestLiftRow).hintDelta}`}
                        className={`${styles.deltaOutlineChip} ${styles.analysisMetricChip}`}
                      />
                    </Box>
                  </>
                ) : (
                  <>
                    <Box className={styles.analysisProblemTitleRow}>
                      <Typography className={styles.analysisItemTitle}>
                        {(row as ProblemRow).problem}
                      </Typography>
                      <Chip
                        size="small"
                        label={(row as ProblemRow).difficulty}
                        className={
                          (row as ProblemRow).difficulty === "easy"
                            ? styles.easyChip
                            : (row as ProblemRow).difficulty === "medium"
                              ? styles.mediumChip
                              : styles.hardChip
                        }
                      />
                    </Box>
                    <Box className={styles.analysisChipRow}>
                      <Chip
                        size="small"
                        label={`Solve ${(row as ProblemRow).solveDelta}`}
                        className={`${styles.deltaPositiveChip} ${styles.analysisMetricChip}`}
                      />
                      <Chip
                        size="small"
                        label={`Hint ${(row as ProblemRow).hintDelta}`}
                        className={`${styles.deltaOutlineChip} ${styles.analysisMetricChip}`}
                      />
                    </Box>
                  </>
                )}
              </Box>
            ))}
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
}
