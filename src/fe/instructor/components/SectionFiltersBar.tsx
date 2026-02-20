"use client";

import KeyboardArrowDownRoundedIcon from "@mui/icons-material/KeyboardArrowDownRounded";
import { Box, FormControl, MenuItem, Select, Typography } from "@mui/material";
import type { ReactNode } from "react";
import type { FilterOption } from "@/fe/instructor/data";
import styles from "@/fe/instructor/styles/ResearchAnalyticsPage.module.css";

interface SectionFilterField {
  id: string;
  label: string;
  value: string;
  options: FilterOption[];
  onChange: (value: string) => void;
  icon?: ReactNode;
}

interface SectionFiltersBarProps {
  fields: SectionFilterField[];
}

export default function SectionFiltersBar({ fields }: SectionFiltersBarProps) {
  return (
    <Box className={styles.sectionFiltersBar}>
      <Box className={styles.sectionFiltersGrid}>
        {fields.map((field) => (
          <Box key={field.id} className={styles.sectionFilterField}>
            <Box className={styles.sectionFilterLabelRow}>
              {field.icon}
              <Typography className={styles.sectionFilterLabel}>{field.label}</Typography>
            </Box>
            <FormControl size="small" fullWidth>
              <Select
                value={field.value}
                onChange={(event) => field.onChange(event.target.value)}
                IconComponent={KeyboardArrowDownRoundedIcon}
                className={styles.sectionSelectInput}
              >
                {field.options.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
        ))}
      </Box>
    </Box>
  );
}
