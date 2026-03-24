"use client";

import type { GroupComparisonMetricRow } from "@/fe/instructor/data/researchAnalytics";
import PolicyComparisonCard from "@/fe/instructor/components/PolicyComparisonCard";
import SectionFiltersBar, { type SectionFilterField } from "@/fe/instructor/components/SectionFiltersBar";

interface ComparisonAnalyticsSectionProps {
  title: string;
  leftLabel: string;
  rightLabel: string;
  rows: GroupComparisonMetricRow[];
  fields: SectionFilterField[];
}

export default function ComparisonAnalyticsSection({
  title,
  leftLabel,
  rightLabel,
  rows,
  fields,
}: ComparisonAnalyticsSectionProps) {
  return (
    <PolicyComparisonCard
      title={title}
      description=""
      leftLabel={leftLabel}
      rightLabel={rightLabel}
      rows={rows}
      filters={<SectionFiltersBar fields={fields} />}
    />
  );
}
