"use client";

import Link from "next/link";
import ArrowBackOutlinedIcon from "@mui/icons-material/ArrowBackOutlined";
import EmojiEventsOutlinedIcon from "@mui/icons-material/EmojiEventsOutlined";
import WhatshotOutlinedIcon from "@mui/icons-material/WhatshotOutlined";
import PublicOutlinedIcon from "@mui/icons-material/PublicOutlined";
import LeaderboardOutlinedIcon from "@mui/icons-material/LeaderboardOutlined";
import WorkspacePremiumOutlinedIcon from "@mui/icons-material/WorkspacePremiumOutlined";
import styles from "@/fe/profile/styles/ProfilePage.module.css";

const stats = [
  {
    label: "Total Solved",
    value: "38",
    Icon: EmojiEventsOutlinedIcon,
  },
  {
    label: "Current Streak",
    value: "12 days",
    Icon: WhatshotOutlinedIcon,
  },
  {
    label: "Global Rank",
    value: "#2,847",
    Icon: PublicOutlinedIcon,
  },
  {
    label: "Contest Rating",
    value: "1,542",
    Icon: LeaderboardOutlinedIcon,
  },
  {
    label: "Badges Earned",
    value: "3 / 6",
    Icon: WorkspacePremiumOutlinedIcon,
  },
];

const difficulties = [
  {
    label: "Easy",
    value: "15 / 25",
    percent: 60,
    tone: "easy",
  },
  {
    label: "Medium",
    value: "18 / 40",
    percent: 45,
    tone: "medium",
  },
  {
    label: "Hard",
    value: "5 / 35",
    percent: 14,
    tone: "hard",
  },
];

const skills = [
  { label: "Arrays", current: 15, total: 20 },
  { label: "Strings", current: 12, total: 18 },
  { label: "Trees", current: 8, total: 15 },
  { label: "Graphs", current: 6, total: 12 },
  { label: "Dynamic Programming", current: 5, total: 20 },
  { label: "Sorting", current: 10, total: 12 },
];

const badges = [
  {
    emoji: "🔥",
    title: "10-Day Streak",
    description: "Solved problems for 10 consecutive days",
    earned: true,
  },
  {
    emoji: "⚡",
    title: "Speed Solver",
    description: "Solved 5 problems in under 10 minutes",
    earned: true,
  },
  {
    emoji: "🌳",
    title: "Tree Master",
    description: "Solved 10 tree problems",
    earned: true,
  },
  {
    emoji: "🎯",
    title: "Perfect Score",
    description: "Got 100% in a contest",
    earned: false,
  },
  {
    emoji: "💯",
    title: "100 Problems",
    description: "Solved 100 problems total",
    earned: false,
  },
  {
    emoji: "🏆",
    title: "Contest Winner",
    description: "Won first place in a contest",
    earned: false,
  },
];

const contests = [
  {
    title: "Trees & Graphs Challenge",
    solved: "Solved: 4/6",
    score: "Score: 720",
    date: "Jan 23, 2026",
    rank: "Rank #23",
    highlight: true,
  },
  {
    title: "Arrays and Strings Basics",
    solved: "Solved: 3/4",
    score: "Score: 280",
    date: "Jan 18, 2026",
    rank: "Rank #45",
    highlight: false,
  },
];

export default function ProfilePage() {
  return (
    <div className={styles.page}>
      <Link href="/" className={styles.backLink}>
        <ArrowBackOutlinedIcon className={styles.backIcon} />
        Back
      </Link>

      <div className={styles.layout}>
        <div className={styles.sidebar}>
          <section className={`${styles.card} ${styles.profileCard}`}>
            <div className={styles.avatar}>AC</div>
            <h2 className={styles.profileName}>Alex Chen</h2>
            <p className={styles.profileEmail}>alex.chen@sfu.ca</p>
            <span className={styles.levelBadge}>Level 14</span>

            <div className={styles.progressBlock}>
              <div className={styles.progressHeader}>
                <span className={styles.progressLabel}>XP Progress</span>
                <span className={styles.progressValue}>8,450 / 10,000</span>
              </div>
              <div className={styles.progressTrack}>
                <div
                  className={styles.progressFill}
                  style={{ width: "84.5%" }}
                />
              </div>
              <p className={styles.progressHint}>1,550 XP to Level 15</p>
            </div>

            <button type="button" className={styles.primaryButton}>
              Edit Profile
            </button>
          </section>

          <section className={styles.card}>
            <h3 className={styles.cardTitle}>Statistics</h3>
            <div className={styles.statList}>
              {stats.map(({ label, value, Icon }) => (
                <div key={label} className={styles.statRow}>
                  <div className={styles.statLabel}>
                    <Icon className={styles.statIcon} />
                    <span>{label}</span>
                  </div>
                  <span className={styles.statValue}>{value}</span>
                </div>
              ))}
            </div>
          </section>

          <section className={styles.card}>
            <h3 className={styles.cardTitle}>Problems by Difficulty</h3>
            <div className={styles.difficultyList}>
              {difficulties.map((item) => (
                <div key={item.label} className={styles.difficultyRow}>
                  <div className={styles.difficultyHeader}>
                    <span
                      className={`${styles.difficultyLabel} ${
                        styles[item.tone]
                      }`}
                    >
                      {item.label}
                    </span>
                    <span className={styles.difficultyValue}>{item.value}</span>
                  </div>
                  <div className={styles.progressTrack}>
                    <div
                      className={styles.progressFill}
                      style={{ width: `${item.percent}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>

        <div className={styles.mainColumn}>
          <section className={styles.card}>
            <div className={styles.cardHeader}>
              <h3 className={styles.cardTitle}>Skills Progress</h3>
              <p className={styles.cardSubtitle}>
                Track your progress across different problem categories
              </p>
            </div>
            <div className={styles.skillList}>
              {skills.map((skill) => {
                const percent = Math.round((skill.current / skill.total) * 100);
                return (
                  <div key={skill.label} className={styles.skillRow}>
                    <div className={styles.skillHeader}>
                      <span className={styles.skillLabel}>{skill.label}</span>
                      <span className={styles.skillValue}>
                        {skill.current} / {skill.total}
                      </span>
                    </div>
                    <div className={styles.progressTrack}>
                      <div
                        className={styles.progressFill}
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          <section className={styles.card}>
            <div className={styles.cardHeader}>
              <h3 className={styles.cardTitle}>Badges & Achievements</h3>
              <p className={styles.cardSubtitle}>
                Collect badges by completing challenges
              </p>
            </div>
            <div className={styles.badgeGrid}>
              {badges.map((badge) => (
                <div
                  key={badge.title}
                  className={`${styles.badgeCard} ${
                    badge.earned ? styles.badgeCardEarned : styles.badgeCardLocked
                  }`}
                >
                  <div className={styles.badgeEmoji}>{badge.emoji}</div>
                  <div className={styles.badgeTitle}>{badge.title}</div>
                  <div className={styles.badgeDescription}>
                    {badge.description}
                  </div>
                  {badge.earned ? (
                    <span className={styles.badgeStatus}>Earned</span>
                  ) : null}
                </div>
              ))}
            </div>
          </section>

          <section className={styles.card}>
            <div className={styles.cardHeaderRow}>
              <EmojiEventsOutlinedIcon className={styles.sectionIcon} />
              <h3 className={styles.cardTitle}>Contest History</h3>
            </div>
            <div className={styles.contestList}>
              {contests.map((contest) => (
                <div key={contest.title} className={styles.contestItem}>
                  <div className={styles.contestHeader}>
                    <span className={styles.contestTitle}>{contest.title}</span>
                    <span
                      className={`${styles.contestBadge} ${
                        contest.highlight
                          ? styles.contestBadgePrimary
                          : styles.contestBadgeMuted
                      }`}
                    >
                      {contest.rank}
                    </span>
                  </div>
                  <div className={styles.contestMeta}>
                    <span>{contest.solved}</span>
                    <span>{contest.score}</span>
                    <span>{contest.date}</span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
