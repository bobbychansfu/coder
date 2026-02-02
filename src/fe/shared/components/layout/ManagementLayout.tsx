"use client";

import React, { ReactNode } from "react";
import type { SvgIconComponent } from "@mui/icons-material";
import type { ActivityItemData, StatCardData, ToolCardData } from "@/fe/shared/types/common";
import styles from "../../styles/ManagementLayout.module.css";
import ScrollbarHider from "@/fe/shared/components/ui/ScrollbarHider";
import ToolCard from "@/fe/shared/components/ToolCard";
import StatCard from "@/fe/shared/components/StatCard";
import ActivityFeedItem from "@/fe/shared/components/ActivityFeedItem";
import StatisticsSection from "@/fe/dashboard/components/StatisticsSection";

interface ManagementLayoutProps {
  title: string;
  subtitle: string;
  headerIcon: SvgIconComponent;
  headerIconColor?: "red" | "blue" | "green"; // Default is red in CSS
  
  actions: ToolCardData[];
  stats: StatCardData[];
  activity: ActivityItemData[];
  
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
            return (
              <ToolCard
                key={action.id}
                title={action.title}
                description={action.description}
                icon={action.icon}
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
              return (
                <StatCard
                  key={stat.id}
                  label={stat.label}
                  value={stat.value}
                  caption={stat.caption}
                  icon={stat.icon}
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
               return (
                <ActivityFeedItem
                  key={item.id}
                  description={item.description}
                  timestamp={item.timestamp}
                  icon={item.icon}
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
