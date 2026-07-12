import { useEffect, useRef, useState } from "react";
import { Typography } from "@mui/material";
import CountdownTimer from "@/fe/contests/components/CountdownTimer";
import type { ContestDetailStatus } from "@/fe/contests/data/contestDetails";
import styles from "@/fe/contests/styles/ProblemSubmissionPage.module.css";

export type TimeLeftAlertThreshold = 15 | 5;

const TIME_LEFT_ALERT_THRESHOLDS: TimeLeftAlertThreshold[] = [5, 15];
const TIME_LEFT_ALERT_AUTO_CLOSE_MS = 30_000;
const TIME_LEFT_ALERT_REENTRY_WINDOW_MINUTES = 1;

export function ContestTimer({
  startsAt,
  endsAt,
  durationMinutes,
}: {
  startsAt?: string | null;
  endsAt?: string | null;
  durationMinutes?: number | null;
}) {
  return (
    <Typography
      component="span"
      fontSize={14}
      fontWeight={600}
      sx={{ display: "inline-flex", alignItems: "center", whiteSpace: "nowrap" }}
    >
      Time left:{" "}
      <CountdownTimer
        startsAt={startsAt}
        endsAt={endsAt}
        durationMinutes={durationMinutes}
      />
    </Typography>
  );
}

function parseContestTimestamp(value?: string | null) {
  if (!value) {
    return null;
  }

  const timestamp = new Date(value).getTime();
  return Number.isNaN(timestamp) ? null : timestamp;
}

export function resolveContestEndTimestamp({
  startsAt,
  endsAt,
  durationMinutes,
}: {
  startsAt?: string | null;
  endsAt?: string | null;
  durationMinutes?: number | null;
}) {
  const explicitEndTime = parseContestTimestamp(endsAt);

  if (explicitEndTime !== null) {
    return explicitEndTime;
  }

  const startTime = parseContestTimestamp(startsAt);

  if (startTime !== null && typeof durationMinutes === "number" && durationMinutes > 0) {
    return startTime + durationMinutes * 60_000;
  }

  return null;
}

function getContestRemainingMsForAlert({
  startsAt,
  endsAt,
  durationMinutes,
}: {
  startsAt?: string | null;
  endsAt?: string | null;
  durationMinutes?: number | null;
}) {
  const now = Date.now();
  const startTime = parseContestTimestamp(startsAt);
  const endTime = resolveContestEndTimestamp({ startsAt, endsAt, durationMinutes });

  if (endTime === null || (startTime !== null && now < startTime)) {
    return null;
  }

  return Math.max(0, endTime - now);
}

function isWithinTimeLeftAlertWindow(
  remainingMinutes: number,
  threshold: TimeLeftAlertThreshold,
) {
  return (
    remainingMinutes <= threshold &&
    remainingMinutes >= threshold - TIME_LEFT_ALERT_REENTRY_WINDOW_MINUTES
  );
}

function hasFutureTimeLeftAlertWindow(
  remainingMinutes: number,
  shownTimeLeftAlerts: Partial<Record<TimeLeftAlertThreshold, boolean>>,
) {
  return TIME_LEFT_ALERT_THRESHOLDS.some(
    (threshold) =>
      !shownTimeLeftAlerts[threshold] &&
      remainingMinutes >= threshold - TIME_LEFT_ALERT_REENTRY_WINDOW_MINUTES,
  );
}

function getInitialShownTimeLeftAlerts({
  startsAt,
  endsAt,
  durationMinutes,
}: {
  startsAt?: string | null;
  endsAt?: string | null;
  durationMinutes?: number | null;
}) {
  const remainingMs = getContestRemainingMsForAlert({ startsAt, endsAt, durationMinutes });

  if (remainingMs === null) {
    return {};
  }

  const remainingMinutes = remainingMs / 60_000;
  const initialShown: Partial<Record<TimeLeftAlertThreshold, boolean>> = {};
  const nextThreshold = TIME_LEFT_ALERT_THRESHOLDS.find(
    (threshold) => isWithinTimeLeftAlertWindow(remainingMinutes, threshold),
  );

  if (!nextThreshold) {
    return initialShown;
  }

  TIME_LEFT_ALERT_THRESHOLDS.forEach((threshold) => {
    if (threshold > nextThreshold) {
      initialShown[threshold] = true;
    }
  });

  return initialShown;
}

export function useContestTimeLeftAlert({
  contestStatus,
  contestStartsAt,
  contestEndsAt,
  contestDurationMinutes,
}: {
  contestStatus?: ContestDetailStatus;
  contestStartsAt?: string | null;
  contestEndsAt?: string | null;
  contestDurationMinutes?: number | null;
}) {
  const [activeTimeLeftAlert, setActiveTimeLeftAlert] =
    useState<TimeLeftAlertThreshold | null>(null);
  const shownTimeLeftAlertsRef = useRef<Partial<Record<TimeLeftAlertThreshold, boolean>>>(
    getInitialShownTimeLeftAlerts({
      startsAt: contestStartsAt,
      endsAt: contestEndsAt,
      durationMinutes: contestDurationMinutes,
    }),
  );

  useEffect(() => {
    if (contestStatus === "closed") {
      return;
    }

    let intervalId: number | null = null;

    const updateTimeLeftAlert = () => {
      const remainingMs = getContestRemainingMsForAlert({
        startsAt: contestStartsAt,
        endsAt: contestEndsAt,
        durationMinutes: contestDurationMinutes,
      });

      if (remainingMs === null) {
        return true;
      }

      const remainingMinutes = remainingMs / 60_000;
      const nextThreshold = TIME_LEFT_ALERT_THRESHOLDS.find(
        (threshold) =>
          isWithinTimeLeftAlertWindow(remainingMinutes, threshold) &&
          !shownTimeLeftAlertsRef.current[threshold],
      );

      if (nextThreshold) {
        shownTimeLeftAlertsRef.current[nextThreshold] = true;
        setActiveTimeLeftAlert(nextThreshold);
      }

      const shouldKeepChecking = hasFutureTimeLeftAlertWindow(
        remainingMinutes,
        shownTimeLeftAlertsRef.current,
      );

      if (!shouldKeepChecking && intervalId !== null) {
        window.clearInterval(intervalId);
      }

      return shouldKeepChecking;
    };

    if (updateTimeLeftAlert()) {
      intervalId = window.setInterval(updateTimeLeftAlert, 1000);
    }

    return () => {
      if (intervalId !== null) {
        window.clearInterval(intervalId);
      }
    };
  }, [
    contestDurationMinutes,
    contestEndsAt,
    contestStartsAt,
    contestStatus,
  ]);

  useEffect(() => {
    if (activeTimeLeftAlert === null) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setActiveTimeLeftAlert(null);
    }, TIME_LEFT_ALERT_AUTO_CLOSE_MS);

    return () => window.clearTimeout(timeoutId);
  }, [activeTimeLeftAlert]);

  return {
    activeTimeLeftAlert,
    closeTimeLeftAlert: () => setActiveTimeLeftAlert(null),
  };
}

export function ContestTimeLeftPopup({
  threshold,
  onClose,
}: {
  threshold: TimeLeftAlertThreshold;
  onClose: () => void;
}) {
  return (
    <div
      className={styles.timeLeftPopupDialog}
      role="alert"
      aria-live="assertive"
      style={{
        position: "fixed",
        top: "90px",
        left: "50%",
        transform: "translateX(-50%)",
        zIndex: 1300,
        minWidth: "280px",
        maxWidth: "min(420px, calc(100vw - 48px))",
        padding: "8px 34px 8px 24px",
        border: "2px solid #ef4444",
        borderRadius: "8px",
        backgroundColor: "#ffffff",
        color: "#7f1d1d",
        boxShadow: "0 10px 28px rgba(127, 29, 29, 0.18)",
        fontFamily: "Inter, sans-serif",
      }}
    >
      <button
        type="button"
        className={styles.timeLeftPopupClose}
        style={{
          position: "absolute",
          top: "8px",
          right: "8px",
          width: "22px",
          height: "22px",
          border: 0,
          borderRadius: "6px",
          backgroundColor: "transparent",
          color: "#991b1b",
          cursor: "pointer",
          fontFamily: "Inter, sans-serif",
          fontSize: "11px",
          fontWeight: 800,
          lineHeight: 1,
        }}
        onClick={onClose}
        aria-label="Close time left alert"
      >
        X
      </button>
      <div
        className={styles.timeLeftPopupMessage}
        style={{ display: "flex", flexDirection: "column", gap: "1px", textAlign: "center" }}
      >
        <div
          id="time-left-alert-title"
          className={styles.timeLeftPopupTitle}
          style={{ fontSize: "17px", fontWeight: 800, lineHeight: "22px" }}
        >
          {threshold} minutes left
        </div>
        <div
          className={styles.timeLeftPopupSubtitle}
          style={{ fontSize: "12px", fontWeight: 600, lineHeight: "17px" }}
        >
          will turn to practice mode after contest
        </div>
      </div>
    </div>
  );
}
