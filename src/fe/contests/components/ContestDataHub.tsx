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
    const baseStart = contest.startTimeISO ? new Date(contest.startTimeISO) : new Date(contest.startTime);
    const startTime = Number.isNaN(baseStart.getTime()) ? new Date() : baseStart;
    const durationText = contest.duration.toLowerCase();
    const durationRegex = /(\d+(?:\.\d+)?)\s*(hour|hours|hr|hrs|minute|minutes|min|mins)/g;
    let match: RegExpExecArray | null = null;
    let totalMinutes = 0;

    while ((match = durationRegex.exec(durationText))) {
      const value = Number(match[1]);
      const unit = match[2];
      if (Number.isNaN(value)) continue;
      totalMinutes += unit.startsWith("hour") || unit.startsWith("hr") ? value * 60 : value;
    }

    if (!totalMinutes) {
      const fallback = Number(durationText.match(/(\d+(?:\.\d+)?)/)?.[1]);
      totalMinutes = Number.isNaN(fallback) ? 120 : fallback * 60;
    }

    return new Date(startTime.getTime() + totalMinutes * 60 * 1000);
  };

  const stats = [
    {
      label: "Start Time",
      icon: CalendarTodayOutlinedIcon,
      value: contest.startTime,
    },
    {
      label: contest.status === "in progress" ? "Time Remaining" : "Duration",
      icon: ScheduleOutlinedIcon,
      content:
        contest.status === "in progress" ? (
          <CountdownTimer endTime={getContestEndTime()} />
        ) : (
          <span>{contest.duration}</span>
        ),
    },
    {
      label: "Problems",
      icon: EmojiEventsOutlinedIcon,
      value: `${contest.problemsCount} problems`,
    },
    {
      label: "Participants",
      icon: PeopleOutlineOutlinedIcon,
      value: contest.participantsLabel,
    },
  ];

  return (
    <Box className={styles.statsGrid}>
      {stats.map((stat, index) => {
        const Icon = stat.icon;
        return (
          <StatCard
            key={stat.label || index}
            label={stat.label}
            value={
              <span className={styles.infoValueRow}>
                <Icon className={styles.infoIcon} fontSize="inherit" />
                {stat.content || <span>{stat.value}</span>}
              </span>
            }
            className={styles.infoCard}
            headerClassName={styles.infoHeader}
            labelClassName={styles.infoLabel}
            contentClassName={styles.infoContent}
            valueClassName={styles.infoValue}
          />
        );
      })}
    </Box>
  );
}
