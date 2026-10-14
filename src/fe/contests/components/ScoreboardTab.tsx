import { useEffect, useRef, useState } from "react";
import * as React from "react";
import Link from "next/link";
import { Box, IconButton, Typography } from "@mui/material";
import ChevronLeftRoundedIcon from "@mui/icons-material/ChevronLeftRounded";
import ChevronRightRoundedIcon from "@mui/icons-material/ChevronRightRounded";
import EmojiEventsIcon from "@mui/icons-material/EmojiEvents";
import type { ScoreboardRow } from "@/fe/contests/data/contestDetails";
import styles from "@/fe/contests/styles/ContestDetailPage.module.css";

// Minutes into the contest as h:mm, the way ICPC boards show solve times (12 → "0:12").
function formatSolveTime(minutes: number) {
  return `${Math.floor(minutes / 60)}:${String(minutes % 60).padStart(2, "0")}`;
}

interface ScoreboardTabProps {
  contestId: string;
  rows: ScoreboardRow[];
  problemColumns: string[];
  // The contest's rule; rows only carry it once someone has registered
  scoringRule?: "POINTS" | "ICPC";
}

export default function ScoreboardTab({
  contestId,
  rows,
  problemColumns,
  scoringRule,
}: ScoreboardTabProps) {
  const [displayCount, setDisplayCount] = useState(10);
  const [isLoading, setIsLoading] = useState(false);
  const loadingTimeoutRef = useRef<number | null>(null);
  const tableRef = useRef<HTMLDivElement>(null);
  const [hiddenColumns, setHiddenColumns] = useState({ left: false, right: false });

  const rankIconColor = (rank: number) => {
    if (rank === 1) return "#f59e0b";
    if (rank === 2) return "#94a3b8";
    if (rank === 3) return "#f97316";
    return "#cbd5e1";
  };

  const isIcpc = scoringRule
    ? scoringRule === "ICPC"
    : rows.some((row) => row.scoringRule === "ICPC");
  const displayRows = rows.slice(0, displayCount);
  const hasMore = displayCount < rows.length;

  const updateHiddenColumns = (table: HTMLDivElement) => {
    const left = table.scrollLeft > 0;
    const right = table.scrollLeft + table.clientWidth < table.scrollWidth - 1;
    setHiddenColumns((current) =>
      current.left === left && current.right === right ? current : { left, right },
    );
  };

  // Re-measure on every scroll (including the arrow buttons'), resize, or column change
  useEffect(() => {
    const table = tableRef.current;
    if (!table) return;
    const update = () => updateHiddenColumns(table);
    update();
    table.addEventListener("scroll", update, { passive: true });
    const observer = new ResizeObserver(update);
    observer.observe(table);
    return () => {
      table.removeEventListener("scroll", update);
      observer.disconnect();
    };
  }, [problemColumns.length]);

  const scrollColumns = (direction: 1 | -1) => {
    const table = tableRef.current;
    table?.scrollBy({ left: direction * table.clientWidth * 0.75, behavior: "smooth" });
  };

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

  useEffect(() => {
    return () => {
      if (loadingTimeoutRef.current) {
        window.clearTimeout(loadingTimeoutRef.current);
      }
    };
  }, []);

  return (
    <Box className={styles.scoreboardCard}>
      <Box className={styles.scoreboardHeader}>
        <Typography className={styles.scoreboardTitle}>Contest Standings</Typography>
      </Box>

      {/* Fades and arrows mark hidden columns: macOS hides scrollbars until you scroll */}
      <Box
        className={styles.scoreboardScrollArea}
        data-more-left={hiddenColumns.left}
        data-more-right={hiddenColumns.right}
      >
        {hiddenColumns.left ? (
          <IconButton
            className={`${styles.scoreboardScrollButton} ${styles.scoreboardScrollButtonLeft}`}
            aria-label="Show earlier problems"
            onClick={() => scrollColumns(-1)}
          >
            <ChevronLeftRoundedIcon />
          </IconButton>
        ) : null}
        {hiddenColumns.right ? (
          <IconButton
            className={`${styles.scoreboardScrollButton} ${styles.scoreboardScrollButtonRight}`}
            aria-label="Show more problems"
            onClick={() => scrollColumns(1)}
          >
            <ChevronRightRoundedIcon />
          </IconButton>
        ) : null}
        <Box
          className={styles.scoreboardTable}
          onScroll={handleScroll}
          ref={tableRef}
          // One grid column per problem, however many there are
          style={{ "--problem-count": problemColumns.length } as React.CSSProperties}
        >
          <Box className={`${styles.scoreboardRow} ${styles.scoreboardHeaderRow}`}>
            <span>Rank</span>
            <span>Team / Participant</span>
            <span className={`${styles.centerCell} ${styles.headerCell}`}>Solved</span>
            {isIcpc ? (
              <span className={`${styles.centerCell} ${styles.headerCell}`}>Penalty</span>
            ) : (
              <span className={styles.rightCell}>Score</span>
            )}
            {problemColumns.map((code) => (
              <span key={code} className={`${styles.centerCell} ${styles.headerCell}`}>
                <Link
                  href={`/contests/${contestId}/problems/${code.toLowerCase()}`}
                  className={styles.problemColumnLink}
                >
                  {code}
                </Link>
              </span>
            ))}
          </Box>

          {displayRows.map((row) => {
            const isUserRow = !!row.isCurrentUser;
            return (
              <Box
                key={row.rank}
                className={`${styles.scoreboardRow} ${isUserRow ? styles.userRow : ""}`}
                data-rank={row.rank}
              >
                <Box className={styles.rankCell}>
                  {row.rank <= 3 ? (
                    <EmojiEventsIcon sx={{ fontSize: 16, color: rankIconColor(row.rank) }} />
                  ) : null}
                  <span>{row.rank}</span>
                </Box>
                <span className={styles.participantCell}>
                  <span>{row.name}</span>
                  {row.members ? (
                    <span className={styles.participantMembers}>{row.members.join(", ")}</span>
                  ) : null}
                </span>
                <span className={styles.centerCell}>
                  <span className={styles.solvedBadge}>{row.solved}</span>
                </span>
                <span className={`${isIcpc ? styles.centerCell : styles.rightCell} ${styles.scoreValue}`}>
                  {isIcpc ? row.penalty : row.score}
                </span>
                {problemColumns.map((code) => {
                  const cell = row.problems[code];
                  if (!cell) {
                    return (
                      <span key={code} className={styles.centerCell}>
                        <span className={styles.emptyCell}>—</span>
                      </span>
                    );
                  }

                  if (isIcpc) {
                    // ICPC board notation: "+" solved first try, "+N" solved after N rejected
                    // tries, "-N" N rejected tries without a solve; the solve minute goes below.
                    const attempts = cell.attempts ?? 0;
                    if (!cell.solved) {
                      return (
                        <span key={code} className={styles.centerCell}>
                          <span className={`${styles.scoreBadge} ${styles.scorePenalty}`}>-{attempts}</span>
                        </span>
                      );
                    }
                    const rejected = attempts - 1;
                    return (
                      <span key={code} className={styles.centerCell}>
                        <span
                          className={`${styles.scoreBadge} ${cell.firstSolve ? styles.icpcFirstSolve : styles.icpcSolved}`}
                          title={cell.firstSolve ? "First to solve" : "Solved"}
                        >
                          {rejected > 0 ? `+${rejected}` : "+"}
                        </span>
                        <span className={styles.scoreTime}>{formatSolveTime(cell.minutes ?? 0)}</span>
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
    </Box>
  );
}
