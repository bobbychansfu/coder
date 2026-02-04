import { useEffect, useRef, useState } from "react";
import * as React from "react";
import { Box, Button, Typography } from "@mui/material";
import EmojiEventsIcon from "@mui/icons-material/EmojiEvents";
import LaunchOutlinedIcon from "@mui/icons-material/LaunchOutlined";
import type { ScoreboardRow } from "@/fe/contests/data/contestDetails";
import styles from "@/fe/contests/styles/ContestDetailPage.module.css";

interface ScoreboardTabProps {
  rows: ScoreboardRow[];
  problemColumns: string[];
}

export default function ScoreboardTab({ rows, problemColumns }: ScoreboardTabProps) {
  const [displayCount, setDisplayCount] = useState(10);
  const [isLoading, setIsLoading] = useState(false);
  const [highlightUser, setHighlightUser] = useState(false);
  const [pendingScrollRank, setPendingScrollRank] = useState<number | null>(null);
  const tableRef = React.useRef<HTMLDivElement>(null);
  const loadingTimeoutRef = useRef<number | null>(null);
  const highlightTimeoutRef = useRef<number | null>(null);

  const rankIconColor = (rank: number) => {
    if (rank === 1) return "#f59e0b";
    if (rank === 2) return "#94a3b8";
    if (rank === 3) return "#f97316";
    return "#cbd5e1";
  };

  const displayRows = rows.slice(0, displayCount);
  const hasMore = displayCount < rows.length;
  const userRank = rows.findIndex((row) => row.name.includes("(You)")) + 1;

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const target = e.currentTarget;
    const scrollPosition = target.scrollTop + target.clientHeight;
    const scrollHeight = target.scrollHeight;

    if (scrollPosition >= scrollHeight - 50 && hasMore && !isLoading) {
      setIsLoading(true);
      if (loadingTimeoutRef.current) {
        window.clearTimeout(loadingTimeoutRef.current);
      }
      loadingTimeoutRef.current = window.setTimeout(() => {
        setDisplayCount((prev) => Math.min(prev + 10, rows.length));
        setIsLoading(false);
      }, 500);
    }
  };

  const scrollToMyRank = () => {
    if (userRank > 0) {
      if (userRank > displayCount) {
        setDisplayCount(userRank);
      }

      setHighlightUser(true);
      setPendingScrollRank(userRank);

      if (highlightTimeoutRef.current) {
        window.clearTimeout(highlightTimeoutRef.current);
      }
      highlightTimeoutRef.current = window.setTimeout(() => {
        setHighlightUser(false);
      }, 4000);
    }
  };

  useEffect(() => {
    if (!pendingScrollRank || !tableRef.current) return;
    const rowElement = tableRef.current.querySelector(`[data-rank="${pendingScrollRank}"]`);
    if (!rowElement) return;
    const rowTop = (rowElement as HTMLElement).offsetTop;
    tableRef.current.scrollTo({
      top: rowTop - 100,
      behavior: "smooth",
    });
    setPendingScrollRank(null);
  }, [pendingScrollRank, displayCount]);

  useEffect(() => {
    return () => {
      if (loadingTimeoutRef.current) {
        window.clearTimeout(loadingTimeoutRef.current);
      }
      if (highlightTimeoutRef.current) {
        window.clearTimeout(highlightTimeoutRef.current);
      }
    };
  }, []);

  return (
    <Box className={styles.scoreboardCard}>
      <Box className={styles.scoreboardHeader}>
        <Typography className={styles.scoreboardTitle}>Contest Standings</Typography>
        <Button
          variant="outlined"
          size="small"
          startIcon={<LaunchOutlinedIcon />}
          className={styles.scoreboardButton}
          sx={{ borderColor: "rgba(0, 0, 0, 0.1)", color: "#0a0a0a" }}
          onClick={scrollToMyRank}
        >
          Find My Rank
        </Button>
      </Box>

      <Box className={styles.scoreboardTable} onScroll={handleScroll} ref={tableRef}>
        <Box className={`${styles.scoreboardRow} ${styles.scoreboardHeaderRow}`}>
          <span>Rank</span>
          <span>Participant</span>
          <span className={`${styles.centerCell} ${styles.headerCell}`}>Solved</span>
          <span className={styles.rightCell}>Score</span>
          {problemColumns.map((code) => (
            <span key={code} className={`${styles.centerCell} ${styles.headerCell}`}>
              {code}
            </span>
          ))}
        </Box>

        {displayRows.map((row) => {
          const isUserRow = row.name.includes("(You)");
          return (
            <Box
              key={row.rank}
              className={`${styles.scoreboardRow} ${isUserRow ? styles.userRow : ""} ${isUserRow && highlightUser ? styles.userRowHighlighted : ""}`}
              data-rank={row.rank}
            >
              <Box className={styles.rankCell}>
                {row.rank <= 3 ? (
                  <EmojiEventsIcon sx={{ fontSize: 16, color: rankIconColor(row.rank) }} />
                ) : null}
                <span>{row.rank}</span>
              </Box>
              <span className={styles.participantCell}>{row.name}</span>
              <span className={styles.centerCell}>
                <span className={styles.solvedBadge}>{row.solved}</span>
              </span>
              <span className={`${styles.rightCell} ${styles.scoreValue}`}>{row.score}</span>
              {problemColumns.map((code) => {
                const cell = row.problems[code];
                if (!cell) {
                  return (
                    <span key={code} className={styles.centerCell}>
                      <span className={styles.emptyCell}>—</span>
                    </span>
                  );
                }

                if (typeof cell.penalty === "number") {
                  return (
                    <span key={code} className={styles.centerCell}>
                      <span className={`${styles.scoreBadge} ${styles.scorePenalty}`}>
                        {cell.penalty}
                      </span>
                    </span>
                  );
                }

                return (
                  <span key={code} className={styles.centerCell}>
                    <span className={styles.scoreBadge}>{cell.points}</span>
                    {cell.time ? <span className={styles.scoreTime}>{cell.time}</span> : null}
                  </span>
                );
              })}
            </Box>
          );
        })}
        {isLoading && (
          <Box className={styles.loadingIndicator}>
            <Typography variant="body2" color="textSecondary">
              Loading more...
            </Typography>
          </Box>
        )}
      </Box>
    </Box>
  );
}
