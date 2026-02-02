import { Box } from "@mui/material";
import CalendarTodayOutlinedIcon from "@mui/icons-material/CalendarTodayOutlined";
import ScheduleOutlinedIcon from "@mui/icons-material/ScheduleOutlined";
import EmojiEventsOutlinedIcon from "@mui/icons-material/EmojiEventsOutlined";
import PeopleOutlineOutlinedIcon from "@mui/icons-material/PeopleOutlineOutlined";
import StatCard from "@/fe/shared/components/StatCard";
import CountdownTimer from "@/fe/contests/components/CountdownTimer";
import type { ContestDetail } from "@/fe/contests/data/contestDetails";
import styles from "@/fe/contests/styles/ContestDetailPage.module.css";

interface ContestDataHubProps {
  contest: ContestDetail;
}

export default function ContestDataHub({ contest }: ContestDataHubProps) {
  const getContestEndTime = () => {
    const startTime = new Date(contest.startTime);
    const durationMatch = contest.duration.match(/(\d+)/);
    const hours = durationMatch ? parseInt(durationMatch[1]) : 2;
    return new Date(startTime.getTime() + hours * 60 * 60 * 1000);
  };

  return (
    <Box className={styles.statsGrid}>
      <StatCard
        label="Start Time"
        value={
          <span className={styles.infoValueRow}>
            <CalendarTodayOutlinedIcon className={styles.infoIcon} fontSize="inherit" />
            <span>{contest.startTime}</span>
          </span>
        }
        className={styles.infoCard}
        headerClassName={styles.infoHeader}
        labelClassName={styles.infoLabel}
        contentClassName={styles.infoContent}
        valueClassName={styles.infoValue}
      />
      <StatCard
        label={contest.status === "in progress" ? "Time Remaining" : "Duration"}
        value={
          <span className={styles.infoValueRow}>
            <ScheduleOutlinedIcon className={styles.infoIcon} fontSize="inherit" />
            {contest.status === "in progress" ? (
              <CountdownTimer endTime={getContestEndTime()} />
            ) : (
              <span>{contest.duration}</span>
            )}
          </span>
        }
        className={styles.infoCard}
        headerClassName={styles.infoHeader}
        labelClassName={styles.infoLabel}
        contentClassName={styles.infoContent}
        valueClassName={styles.infoValue}
      />
      <StatCard
        label="Problems"
        value={
          <span className={styles.infoValueRow}>
            <EmojiEventsOutlinedIcon className={styles.infoIcon} fontSize="inherit" />
            <span>{contest.problemsCount} problems</span>
          </span>
        }
        className={styles.infoCard}
        headerClassName={styles.infoHeader}
        labelClassName={styles.infoLabel}
        contentClassName={styles.infoContent}
        valueClassName={styles.infoValue}
      />
      <StatCard
        label="Participants"
        value={
          <span className={styles.infoValueRow}>
            <PeopleOutlineOutlinedIcon className={styles.infoIcon} fontSize="inherit" />
            <span>{contest.participantsLabel}</span>
          </span>
        }
        className={styles.infoCard}
        headerClassName={styles.infoHeader}
        labelClassName={styles.infoLabel}
        contentClassName={styles.infoContent}
        valueClassName={styles.infoValue}
      />
    </Box>
  );
}
