"use client";

import { useRouter } from "next/navigation";
import NotificationsNoneOutlinedIcon from "@mui/icons-material/NotificationsNoneOutlined";
import BarChartOutlinedIcon from "@mui/icons-material/BarChartOutlined";
import CreateOutlinedIcon from "@mui/icons-material/CreateOutlined";
import EmojiEventsOutlinedIcon from "@mui/icons-material/EmojiEventsOutlined";
import GroupOutlinedIcon from "@mui/icons-material/GroupOutlined";
import FactCheckOutlinedIcon from "@mui/icons-material/FactCheckOutlined";
import DescriptionOutlinedIcon from "@mui/icons-material/DescriptionOutlined";
import TrendingUpOutlinedIcon from "@mui/icons-material/TrendingUpOutlined";
import GroupAddOutlinedIcon from "@mui/icons-material/GroupAddOutlined";
import type { SvgIconComponent } from "@mui/icons-material";

import type { ActivityItemData, StatCardData, ToolCardData } from "@/fe/shared/types/common";
import { ROUTES } from "@/fe/shared/constants/routes";
import {
  instructorActions,
  overviewStats,
  recentActivity,
  type InstructorActionTone,
  type OverviewTone,
  type ActivityTone,
} from "@/fe/instructor/data";
import styles from "@/fe/instructor/styles/InstructorPage.module.css";

// Icon mappings for instructor action cards
const actionIconMap: Record<InstructorActionTone, SvgIconComponent> = {
  success: NotificationsNoneOutlinedIcon,
  info: BarChartOutlinedIcon,
  purple: CreateOutlinedIcon,
  warning: EmojiEventsOutlinedIcon,
};

// Icon mappings for instructor overview cards
const overviewIconMap: Record<OverviewTone, SvgIconComponent> = {
  contests: EmojiEventsOutlinedIcon,
  participants: GroupOutlinedIcon,
  problems: FactCheckOutlinedIcon,
};

// Icon mappings for instructor activity items
const activityIconMap: Record<ActivityTone, SvgIconComponent> = {
  success: DescriptionOutlinedIcon,
  info: TrendingUpOutlinedIcon,
  highlight: GroupAddOutlinedIcon,
};

export default function InstructorPage() {
  const router = useRouter();

  const actions: ToolCardData[] = instructorActions.map((action) => ({
    id: action.id,
    title: action.title,
    description: action.description,
    tone: action.tone,
    icon: actionIconMap[action.tone],
    onClick:
      action.id === "announcements"
        ? () => router.push(ROUTES.instructorAnnouncements)
        : action.id === "research-analytics"
          ? () => router.push(ROUTES.instructorResearchAnalytics)
          : action.id === "create-problem"
            ? () => router.push(ROUTES.instructorCreateProblem)
            : action.id === "create-contest"
              ? () => router.push(ROUTES.instructorCreateContest)
        : undefined,
  }));

  const stats: StatCardData[] = overviewStats.map((stat) => ({
    id: stat.id,
    label: stat.label,
    value: stat.value,
    caption: stat.caption,
    tone: stat.tone,
    icon: overviewIconMap[stat.tone],
  }));

  const activity: ActivityItemData[] = recentActivity.map((item) => ({
    id: item.id,
    description: item.description,
    timestamp: item.timestamp,
    tone: item.tone,
    icon: activityIconMap[item.tone],
  }));

  const actionRouteMap: Record<string, string> = {
    announcements: ROUTES.instructorAnnouncements,
    "research-analytics": ROUTES.instructorResearchAnalytics,
    "create-problem": ROUTES.instructorCreateProblem,
    "create-contest": ROUTES.instructorCreateContest,
  };

  return (
    <div className={styles.page} data-node-id="165:708">
      <div className={styles.content} data-node-id="165:710">
        <header className={styles.header}>
          <h1 className={styles.title}>Instructor Tools</h1>
          <p className={styles.subtitle}>
            Manage your courses, create problems, and track student progress
          </p>
        </header>

        <section className={styles.actionGrid}>
          {actions.map((action) => (
            <button
              key={action.id}
              type="button"
              className={styles.actionCard}
              onClick={() => {
                const route = actionRouteMap[action.id];
                if (route) {
                  router.push(route);
                }
              }}
            >
              <div className={styles.actionHeader}>
                <h2 className={styles.actionTitle}>{action.title}</h2>
                {action.icon ? (
                  <div className={styles.actionIcon} data-tone={action.tone}>
                    <action.icon className={styles.actionIconGlyph} fontSize="inherit" />
                  </div>
                ) : null}
              </div>
              <p className={styles.actionDescription}>{action.description}</p>
            </button>
          ))}
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Quick Overview</h2>
          <div className={styles.statsGrid}>
            {stats.map((stat) => (
              <article key={stat.id} className={styles.statCard}>
                <div className={styles.statHeader}>
                  <p className={styles.statLabel}>{stat.label}</p>
                  {stat.icon ? (
                    <stat.icon className={styles.statIcon} fontSize="inherit" />
                  ) : null}
                </div>
                <div className={styles.statContent}>
                  <p className={styles.statValue}>{stat.value}</p>
                  <p className={styles.statCaption}>{stat.caption}</p>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Recent Activity</h2>
          <div className={styles.activityList}>
            {activity.map((item) => (
              <div key={item.id} className={styles.activityItem}>
                {item.icon ? (
                  <div className={styles.activityIcon} data-tone={item.tone}>
                    <item.icon className={styles.activityIconGlyph} fontSize="inherit" />
                  </div>
                ) : null}
                <div className={styles.activityText}>
                  <p className={styles.activityDescription}>{item.description}</p>
                  <p className={styles.activityTimestamp}>{item.timestamp}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
