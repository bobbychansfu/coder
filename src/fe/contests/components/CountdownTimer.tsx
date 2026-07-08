import { useState, useEffect } from "react";

interface CountdownTimerProps {
  startsAt?: Date | string | null;
  endsAt?: Date | string | null;
  durationMinutes?: number | null;
  endTime?: Date;
  fallbackLabel?: string;
  endedLabel?: string;
}

function parseTime(value?: Date | string | null) {
  if (!value) {
    return null;
  }

  const timestamp = value instanceof Date ? value.getTime() : new Date(value).getTime();
  return Number.isNaN(timestamp) ? null : timestamp;
}

function resolveEndTime({
  startsAt,
  endsAt,
  durationMinutes,
  endTime,
}: Pick<CountdownTimerProps, "startsAt" | "endsAt" | "durationMinutes" | "endTime">) {
  const explicitEndTime = parseTime(endTime ?? endsAt);

  if (explicitEndTime !== null) {
    return explicitEndTime;
  }

  const startTime = parseTime(startsAt);

  if (startTime !== null && typeof durationMinutes === "number" && durationMinutes > 0) {
    return startTime + durationMinutes * 60_000;
  }

  return null;
}

function getRemainingMs(startTime: number | null, endTime: number, now: number) {
  if (startTime !== null && now < startTime) {
    return Math.max(0, endTime - startTime);
  }

  return Math.max(0, endTime - now);
}

function formatTimeLeft(milliseconds: number) {
  const totalSeconds = Math.max(0, Math.floor(milliseconds / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

export default function CountdownTimer({
  startsAt,
  endsAt,
  durationMinutes,
  endTime: legacyEndTime,
  fallbackLabel = "--:--:--",
  endedLabel = "Contest Ended",
}: CountdownTimerProps) {
  const startTimestamp = parseTime(startsAt);
  const endTimestamp = resolveEndTime({
    startsAt,
    endsAt,
    durationMinutes,
    endTime: legacyEndTime,
  });
  const [timeLeft, setTimeLeft] = useState("");

  useEffect(() => {
    const updateTimer = () => {
      if (endTimestamp === null) {
        setTimeLeft(fallbackLabel);
        return;
      }

      const now = Date.now();
      const distance = getRemainingMs(startTimestamp, endTimestamp, now);

      if (distance <= 0) {
        setTimeLeft(endedLabel);
        return;
      }

      setTimeLeft(formatTimeLeft(distance));
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [endedLabel, endTimestamp, fallbackLabel, startTimestamp]);

  return <span>{timeLeft}</span>;
}
