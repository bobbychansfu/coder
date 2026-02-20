"use client";

import CalendarMonthOutlinedIcon from "@mui/icons-material/CalendarMonthOutlined";
import EmojiEventsOutlinedIcon from "@mui/icons-material/EmojiEventsOutlined";
import KeyboardArrowDownRoundedIcon from "@mui/icons-material/KeyboardArrowDownRounded";
import LayersOutlinedIcon from "@mui/icons-material/LayersOutlined";
import PersonAddAltOutlinedIcon from "@mui/icons-material/PersonAddAltOutlined";
import ScienceOutlinedIcon from "@mui/icons-material/ScienceOutlined";
import FilterAltOutlinedIcon from "@mui/icons-material/FilterAltOutlined";
import { Box, Card, CardContent, FormControl, MenuItem, Select, Typography } from "@mui/material";
import type { FilterOption } from "@/fe/instructor/data";
import styles from "@/fe/instructor/styles/ResearchAnalyticsPage.module.css";

interface ResearchFiltersCardProps {
  title: string;
  contestLabel: string;
  dateRangeLabel: string;
  conditionLabel: string;
  policyLabel: string;
  consentLabel: string;
  contestOptions: FilterOption[];
  dateRangeOptions: FilterOption[];
  conditionOptions: FilterOption[];
  policyOptions: FilterOption[];
  consentOptions: FilterOption[];
  contest: string;
  dateRange: string;
  condition: string;
  policy: string;
  consent: string;
  onContestChange: (value: string) => void;
  onDateRangeChange: (value: string) => void;
  onConditionChange: (value: string) => void;
  onPolicyChange: (value: string) => void;
  onConsentChange: (value: string) => void;
}

export default function ResearchFiltersCard({
  title,
  contestLabel,
  dateRangeLabel,
  conditionLabel,
  policyLabel,
  consentLabel,
  contestOptions,
  dateRangeOptions,
  conditionOptions,
  policyOptions,
  consentOptions,
  contest,
  dateRange,
  condition,
  policy,
  consent,
  onContestChange,
  onDateRangeChange,
  onConditionChange,
  onPolicyChange,
  onConsentChange,
}: ResearchFiltersCardProps) {
  return (
    <Card className={`${styles.card} ${styles.filterCard}`}>
      <CardContent className={styles.cardContent}>
        <Box className={styles.cardTitleRow}>
          <FilterAltOutlinedIcon className={styles.cardIcon} />
          <Typography className={styles.cardTitleLarge}>{title}</Typography>
        </Box>

        <Box className={styles.filtersGrid}>
          <Box className={styles.filterField}>
            <Box className={styles.filterLabelRow}>
              <EmojiEventsOutlinedIcon className={styles.filterLabelIcon} />
              <Typography className={styles.filterLabel}>{contestLabel}</Typography>
            </Box>
            <FormControl size="small" fullWidth>
              <Select
                value={contest}
                onChange={(e) => onContestChange(e.target.value)}
                IconComponent={KeyboardArrowDownRoundedIcon}
                className={styles.selectInput}
              >
                {contestOptions.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>

          <Box className={styles.filterField}>
            <Box className={styles.filterLabelRow}>
              <CalendarMonthOutlinedIcon className={styles.filterLabelIcon} />
              <Typography className={styles.filterLabel}>{dateRangeLabel}</Typography>
            </Box>
            <FormControl size="small" fullWidth>
              <Select
                value={dateRange}
                onChange={(e) => onDateRangeChange(e.target.value)}
                IconComponent={KeyboardArrowDownRoundedIcon}
                className={styles.selectInput}
              >
                {dateRangeOptions.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>

          <Box className={styles.filterField}>
            <Box className={styles.filterLabelRow}>
              <ScienceOutlinedIcon className={styles.filterLabelIcon} />
              <Typography className={styles.filterLabel}>{conditionLabel}</Typography>
            </Box>
            <FormControl size="small" fullWidth>
              <Select
                value={condition}
                onChange={(e) => onConditionChange(e.target.value)}
                IconComponent={KeyboardArrowDownRoundedIcon}
                className={styles.selectInput}
              >
                {conditionOptions.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>

          <Box className={styles.filterField}>
            <Box className={styles.filterLabelRow}>
              <LayersOutlinedIcon className={styles.filterLabelIcon} />
              <Typography className={styles.filterLabel}>{policyLabel}</Typography>
            </Box>
            <FormControl size="small" fullWidth>
              <Select
                value={policy}
                onChange={(e) => onPolicyChange(e.target.value)}
                IconComponent={KeyboardArrowDownRoundedIcon}
                className={styles.selectInput}
              >
                {policyOptions.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>

          <Box className={styles.filterField}>
            <Box className={styles.filterLabelRow}>
              <PersonAddAltOutlinedIcon className={styles.filterLabelIcon} />
              <Typography className={styles.filterLabel}>{consentLabel}</Typography>
            </Box>
            <FormControl size="small" fullWidth>
              <Select
                value={consent}
                onChange={(e) => onConsentChange(e.target.value)}
                IconComponent={KeyboardArrowDownRoundedIcon}
                className={styles.selectInput}
              >
                {consentOptions.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
}
