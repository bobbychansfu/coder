import {
  StatisticsSection,
  ContestAlert,
  PastContests,
  UpcomingContests,
  ThisWeek,
  RecentBadges,
  mockContestAlert,
} from "@/fe/dashboard";
import styles from "./page.module.css";

export default function Home() {
  return (
    <div className={styles.container}>
      {/* Main Content */}
      <div className={styles.mainContent}>
        {/* Statistics Section */}
        <StatisticsSection />

        {/* Contest Alert */}
        {mockContestAlert.isActive && (
          <ContestAlert
            title={mockContestAlert.title}
            description={mockContestAlert.description}
          />
        )}

        {/* Past Contests */}
        <PastContests />
      </div>

      {/* Sidebar */}
      <div className={styles.sidebar}>
        <UpcomingContests />
        <ThisWeek />
        <RecentBadges />
      </div>
    </div>
  );
}
