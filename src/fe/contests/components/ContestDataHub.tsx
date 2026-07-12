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
  const stats = [
    {
      label: "Start Time",
      icon: CalendarTodayOutlinedIcon,
      value: contest.startTime,
    },
    {
      label: "Time Left",
      icon: ScheduleOutlinedIcon,
      content: (
        <CountdownTimer
          startsAt={contest.startTimeISO ?? contest.startTime}
          durationMinutes={contest.durationMinutes}
          endedLabel="Contest Ended"
        />
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
