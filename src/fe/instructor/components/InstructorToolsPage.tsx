"use client";

import {
  instructorActions,
  overviewStats,
  recentActivity,
} from "../data";
import ActionCard from "./ActionCard";
import OverviewCard from "./OverviewCard";
import ActivityItem from "./ActivityItem";
import styles from "../styles/InstructorToolsPage.module.css";

export default function InstructorToolsPage() {
  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.title}>Instructor Tools</h1>
        <p className={styles.subtitle}>
          Manage your courses, create problems, and track student progress
        </p>
      </header>

      <section className={styles.actionGrid}>
        {instructorActions.map((action) => (
          <ActionCard key={action.id} action={action} />
        ))}
      </section>

      <section className={styles.header}>
        <h2 className={styles.sectionTitle}>Quick Overview</h2>
      </section>

      <section className={styles.overviewGrid}>
        {overviewStats.map((stat) => (
          <OverviewCard key={stat.id} stat={stat} />
        ))}
      </section>

      <section className={styles.header}>
        <h2 className={styles.sectionTitle}>Recent Activity</h2>
      </section>

      <section className={styles.activityList}>
        {recentActivity.map((item) => (
          <ActivityItem key={item.id} item={item} />
        ))}
      </section>
    </div>
  );
}
