"use client";

import ArrowBackOutlinedIcon from "@mui/icons-material/ArrowBackOutlined";
import EmojiEventsOutlinedIcon from "@mui/icons-material/EmojiEventsOutlined";
import LeaderboardOutlinedIcon from "@mui/icons-material/LeaderboardOutlined";
import PublicOutlinedIcon from "@mui/icons-material/PublicOutlined";
import WorkspacePremiumOutlinedIcon from "@mui/icons-material/WorkspacePremiumOutlined";
import Link from "next/link";
import { useEffect, useState } from "react";

import EditProfileDialog, {
  type EditableProfile,
} from "@/fe/profile/components/EditProfileDialog";
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

export default function ProfilePage({
  user,
  profile: profileData,
}: {
  user: CurrentUser;
  profile: ProfileData;
}) {
  const [editableProfile, setEditableProfile] = useState<EditableProfile | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [editOpen, setEditOpen] = useState(false);

  useEffect(() => {
    let active = true;

    const loadProfile = async () => {
      try {
        const response = await fetch("/api/s/profile", {
          credentials: "include",
          cache: "no-store",
        });
        const payload = (await response.json()) as {
          error?: string;
          user?: EditableProfile;
        };

        if (!response.ok || !payload.user) {
          throw new Error(payload.error ?? "Failed to load profile.");
        }

        if (active) {
          setEditableProfile(payload.user);
          setProfileError(null);
        }
      } catch (loadError) {
        if (active) {
          setProfileError(
            loadError instanceof Error ? loadError.message : "Failed to load profile.",
          );
        }
      } finally {
        if (active) setProfileLoading(false);
      }
    };

    void loadProfile();
    return () => {
      active = false;
    };
  }, []);

  const profileName = editableProfile
    ? `${editableProfile.firstName} ${editableProfile.lastName}`.trim()
    : profileLoading
      ? "Loading profile…"
      : "Profile unavailable";
  const initials = editableProfile
    ? `${editableProfile.firstName.charAt(0)}${editableProfile.lastName.charAt(0)}`.toUpperCase() || "?"
    : user.displayName
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0]?.toUpperCase())
        .join("") || "G";
  const stats = [
    { label: "Total Solved", value: profileData.problemsSolved, Icon: EmojiEventsOutlinedIcon },
    { label: "Contests Entered", value: profileData.competitionsParticipated, Icon: PublicOutlinedIcon },
    { label: "Points", value: profileData.points, Icon: LeaderboardOutlinedIcon },
    { label: "Badges Earned", value: profileData.badges.length, Icon: WorkspacePremiumOutlinedIcon },
  ];
  const pointsProgress = Math.min(100, (profileData.points % 1000) / 10);

  return (
    <div className={styles.page}>
      <Link href="/dashboard" className={styles.backLink}>
        <ArrowBackOutlinedIcon className={styles.backIcon} /> Back
      </Link>

      <div className={styles.layout}>
        <div className={styles.sidebar}>
          <section className={`${styles.card} ${styles.profileCard}`}>
            <div className={styles.avatar}>{initials}</div>
            <h2 className={styles.profileName}>
              {user.accountType === "guest" ? user.displayName : profileName}
            </h2>
            <p className={styles.profileEmail}>
              {user.accountType === "guest" ? user.identifier : editableProfile?.email ?? "—"}
            </p>
            {user.accountType !== "guest" && editableProfile?.nickname ? (
              <p className={styles.profileNickname}>@{editableProfile.nickname}</p>
            ) : null}
            {profileError ? <p className={styles.profileError}>{profileError}</p> : null}
            <span className={styles.levelBadge}>{profileData.rank}</span>
            <div className={styles.progressBlock}>
              <div className={styles.progressHeader}>
                <span className={styles.progressLabel}>Points</span>
                <span className={styles.progressValue}>{profileData.points}</span>
              </div>
              <div className={styles.progressTrack}>
                <div className={styles.progressFill} style={{ width: `${pointsProgress}%` }} />
              </div>
              <p className={styles.progressHint}>Earn points by solving problems</p>
            </div>
            <button
              type="button"
              className={styles.primaryButton}
              disabled={!editableProfile || profileLoading}
              onClick={() => setEditOpen(true)}
            >
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
        </div>

        <div className={styles.mainColumn}>
          <section className={styles.card}>
            <div className={styles.cardHeader}>
              <h3 className={styles.cardTitle}>Badges &amp; Achievements</h3>
              <p className={styles.cardSubtitle}>Achievements earned by this account</p>
            </div>
            {profileData.badges.length ? (
              <div className={styles.badgeGrid}>
                {profileData.badges.map((badge) => (
                  <div key={`${badge.title}-${badge.earnedAt}`} className={`${styles.badgeCard} ${styles.badgeCardEarned}`}>
                    <div className={styles.badgeEmoji}>🏆</div>
                    <div className={styles.badgeTitle}>{badge.title}</div>
                    <div className={styles.badgeDescription}>{badge.description}</div>
                    <span className={styles.badgeStatus}>Earned</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className={styles.cardSubtitle}>No badges earned yet.</p>
            )}
          </section>

          <section className={styles.card}>
            <div className={styles.cardHeaderRow}>
              <EmojiEventsOutlinedIcon className={styles.sectionIcon} />
              <h3 className={styles.cardTitle}>Contest History</h3>
            </div>
            {profileData.contests.length ? (
              <div className={styles.contestList}>
                {profileData.contests.map((contest) => (
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
            ) : (
              <p className={styles.cardSubtitle}>No contest history yet.</p>
            )}
          </section>
        </div>
      </div>

      {editableProfile ? (
        <EditProfileDialog
          open={editOpen}
          profile={editableProfile}
          onClose={() => setEditOpen(false)}
          onUpdated={setEditableProfile}
        />
      ) : null}
    </div>
  );
}
