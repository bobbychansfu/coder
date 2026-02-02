"use client";

import React, { ReactNode } from "react";
import type { SvgIconComponent } from "@mui/icons-material";
import type { AccentType, ToneType } from "@/fe/shared/types/common";
import styles from "../../styles/ManagementLayout.module.css";
import ScrollbarHider from "@/fe/shared/components/ui/ScrollbarHider";
import ToolCard from "@/fe/shared/components/ToolCard";
import StatCard from "@/fe/shared/components/StatCard";
import ActivityFeedItem from "@/fe/shared/components/ActivityFeedItem";
import StatisticsSection from "@/fe/dashboard/components/StatisticsSection";

// --- Types ---
export interface DashboardAction {
  id: string;
  title: string;
  description: string;
  tone: ToneType;
  icon?: SvgIconComponent;
}

export interface DashboardStat {
  id: string;
  label: string;
  value: string;
  caption?: string;
  tone: string;
  valueAccent?: AccentType;
  captionAccent?: AccentType;
  icon?: SvgIconComponent;
}

export interface DashboardActivity {
  id: string;
  description: string;
  timestamp: string;
  tone: ToneType;
  icon?: SvgIconComponent;
}

interface ManagementLayoutProps {
  title: string;
  subtitle: string;
  headerIcon: SvgIconComponent;
  headerIconColor?: "red" | "blue" | "green"; // Default is red in CSS
  
  actions: DashboardAction[];
  stats: DashboardStat[];
  activity: DashboardActivity[];
  
  // Icon mappers (optional, if data items don't have icons directly)
  actionIconMap?: Record<string, SvgIconComponent>;
  statIconMap?: Record<string, SvgIconComponent>;
  activityIconMap?: Record<string, SvgIconComponent>;

  children?: ReactNode; // For extra sections like Quick Actions
}

export default function ManagementLayout({
  title,
  subtitle,
  headerIcon: HeaderIcon,
  headerIconColor,
  actions,
  stats,
  activity,
  actionIconMap,
  statIconMap,
  activityIconMap,
  children,
}: ManagementLayoutProps) {
  return (
    <>
      <ScrollbarHider />
      <div className={styles.page}>
        <header className={styles.header}>
          <div className={styles.headerRow}>
            <HeaderIcon
              className={styles.headerIcon}
              data-color={headerIconColor}
              fontSize="inherit"
            />
            <h1 className={styles.title}>{title}</h1>
          </div>
          <p className={styles.subtitle}>{subtitle}</p>
        </header>

        <StatisticsSection
          className={styles.toolHubSection}
          gridClassName={styles.actionFlex}
        >
          {actions.map((action) => {
            const Icon = action.icon || (actionIconMap ? actionIconMap[action.tone] : undefined);
            return (
              <ToolCard
                key={action.id}
                title={action.title}
                description={action.description}
                icon={Icon}
                tone={action.tone}
                className={styles.actionCard}
                headerClassName={styles.actionHeader}
                titleClassName={styles.actionTitle}
                iconClassName={styles.actionIcon}
                iconGlyphClassName={styles.actionIconGlyph}
                descriptionClassName={styles.actionDescription}
              />
            );
          })}
        </StatisticsSection>

        <section className={styles.sectionBlock}>
          <h2 className={styles.sectionTitle}>Overview</h2>
          <div className={styles.overviewGrid}>
            {stats.map((stat) => {
              const Icon = stat.icon || (statIconMap ? statIconMap[stat.tone] : undefined);
              return (
                <StatCard
                  key={stat.id}
                  label={stat.label}
                  value={stat.value}
                  caption={stat.caption}
                  icon={Icon}
                  tone={stat.tone}
                  valueAccent={stat.valueAccent}
                  captionAccent={stat.captionAccent}
                  className={styles.overviewCard}
                  headerClassName={styles.overviewHeader}
                  labelClassName={styles.overviewLabel}
                  iconClassName={styles.overviewIcon}
                  contentClassName={styles.overviewContent}
                  valueClassName={styles.overviewValue}
                  captionClassName={styles.overviewCaption}
                  valueAccentClassName={styles.overviewValuePositive}
                  captionAccentClassName={styles.overviewCaptionPositive}
                />
              );
            })}
          </div>
        </section>

        <section className={styles.sectionBlock}>
          <h2 className={styles.sectionTitle}>Recent Activity</h2>
          <div className={styles.activityList}>
            {activity.map((item) => {
               const Icon = item.icon || (activityIconMap ? activityIconMap[item.tone] : undefined);
               return (
                <ActivityFeedItem
                  key={item.id}
                  description={item.description}
                  timestamp={item.timestamp}
                  icon={Icon}
                  tone={item.tone}
                  className={styles.activityItem}
                  iconClassName={styles.activityIcon}
                  iconGlyphClassName={styles.activityIconGlyph}
                  textClassName={styles.activityText}
                  descriptionClassName={styles.activityDescription}
                  timestampClassName={styles.activityTimestamp}
                />
              );
            })}
          </div>
        </section>

        {children}
      </div>
    </>
  );
}