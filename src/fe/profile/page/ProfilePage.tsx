"use client";

import Link from "next/link";
import ArrowBackOutlinedIcon from "@mui/icons-material/ArrowBackOutlined";
import EmojiEventsOutlinedIcon from "@mui/icons-material/EmojiEventsOutlined";
import PublicOutlinedIcon from "@mui/icons-material/PublicOutlined";
import LeaderboardOutlinedIcon from "@mui/icons-material/LeaderboardOutlined";
import WorkspacePremiumOutlinedIcon from "@mui/icons-material/WorkspacePremiumOutlined";
import styles from "@/fe/profile/styles/ProfilePage.module.css";
import type { CurrentUser } from "@/lib/session";

export interface ProfileData {
  points: number;
  problemsSolved: number;
  competitionsParticipated: number;
  rank: string;
  badges: Array<{ title: string; description: string; earnedAt: string }>;
  contests: Array<{ title: string; date: string; rank: number | null }>;
}

export default function ProfilePage({ user, profile }: { user: CurrentUser; profile: ProfileData }) {
  const initials =
    user.displayName
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join("") || "G";
  const stats = [
    { label: "Total Solved", value: profile.problemsSolved, Icon: EmojiEventsOutlinedIcon },
    { label: "Contests Entered", value: profile.competitionsParticipated, Icon: PublicOutlinedIcon },
    { label: "Points", value: profile.points, Icon: LeaderboardOutlinedIcon },
    { label: "Badges Earned", value: profile.badges.length, Icon: WorkspacePremiumOutlinedIcon },
  ];
  const pointsProgress = Math.min(100, (profile.points % 1000) / 10);

  return (
    <div className={styles.page}>
      <Link href="/dashboard" className={styles.backLink}>
        <ArrowBackOutlinedIcon className={styles.backIcon} /> Back
      </Link>

      <div className={styles.layout}>
        <div className={styles.sidebar}>
          <section className={`${styles.card} ${styles.profileCard}`}>
            <div className={styles.avatar}>{initials}</div>
            <h2 className={styles.profileName}>{user.displayName}</h2>
            <p className={styles.profileEmail}>
              Email: {user.accountType === "guest" ? "" : user.identifier}
            </p>
            <span className={styles.levelBadge}>{profile.rank}</span>
            <div className={styles.progressBlock}>
              <div className={styles.progressHeader}>
                <span className={styles.progressLabel}>Points</span>
                <span className={styles.progressValue}>{profile.points}</span>
              </div>
              <div className={styles.progressTrack}>
                <div className={styles.progressFill} style={{ width: `${pointsProgress}%` }} />
              </div>
              <p className={styles.progressHint}>Earn points by solving problems</p>
            </div>
          </section>

          <section className={styles.card}>
            <h3 className={styles.cardTitle}>Statistics</h3>
            <div className={styles.statList}>
              {stats.map(({ label, value, Icon }) => (
                <div key={label} className={styles.statRow}>
                  <div className={styles.statLabel}><Icon className={styles.statIcon} /><span>{label}</span></div>
                  <span className={styles.statValue}>{value}</span>
                </div>
              ))}
            </div>
          </section>
        </div>

        <div className={styles.mainColumn}>
          <section className={styles.card}>
            <div className={styles.cardHeader}>
              <h3 className={styles.cardTitle}>Badges & Achievements</h3>
              <p className={styles.cardSubtitle}>Achievements earned by this account</p>
            </div>
            {profile.badges.length ? (
              <div className={styles.badgeGrid}>
                {profile.badges.map((badge) => (
                  <div key={`${badge.title}-${badge.earnedAt}`} className={`${styles.badgeCard} ${styles.badgeCardEarned}`}>
                    <div className={styles.badgeEmoji}>🏆</div>
                    <div className={styles.badgeTitle}>{badge.title}</div>
                    <div className={styles.badgeDescription}>{badge.description}</div>
                    <span className={styles.badgeStatus}>Earned</span>
                  </div>
                ))}
              </div>
            ) : <p className={styles.cardSubtitle}>No badges earned yet.</p>}
          </section>

          <section className={styles.card}>
            <div className={styles.cardHeaderRow}>
              <EmojiEventsOutlinedIcon className={styles.sectionIcon} />
              <h3 className={styles.cardTitle}>Contest History</h3>
            </div>
            {profile.contests.length ? (
              <div className={styles.contestList}>
                {profile.contests.map((contest) => (
                  <div key={`${contest.title}-${contest.date}`} className={styles.contestItem}>
                    <div className={styles.contestHeader}>
                      <span className={styles.contestTitle}>{contest.title}</span>
                      <span className={`${styles.contestBadge} ${styles.contestBadgeMuted}`}>
                        {contest.rank ? `Rank #${contest.rank}` : "Unranked"}
                      </span>
                    </div>
                    <div className={styles.contestMeta}>
                      <span>{new Date(contest.date).toLocaleDateString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : <p className={styles.cardSubtitle}>No contest history yet.</p>}
          </section>
        </div>
      </div>
    </div>
  );
}
