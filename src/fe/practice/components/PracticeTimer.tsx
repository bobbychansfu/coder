"use client";

import { useEffect, useRef, useState } from "react";
import { Box, Button, Typography } from "@mui/material";

const PRACTICE_TIMER_INITIAL_MS = 15 * 60 * 1000;
const PRACTICE_TIMER_INCREMENT_MS = 15 * 60 * 1000;

function formatPracticeTimeRemaining(milliseconds: number) {
  const totalSeconds = Math.max(0, Math.floor(milliseconds / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

export default function PracticeTimer({ problemCode }: { problemCode: string }) {
  const storageKey = `practice-timer:${problemCode}`;
  const canPauseOnUnmountRef = useRef(false);
  const endTimeRef = useRef<number | null>(null);
  const isPageUnloadingRef = useRef(false);
  const nowRef = useRef(0);
  const remainingMsRef = useRef(PRACTICE_TIMER_INITIAL_MS);

  const [timerState, setTimerState] = useState<{
    isStarted: boolean;
    endTime: number | null;
    remainingMs: number;
  }>(() => ({
    isStarted: false,
    endTime: null,
    remainingMs: PRACTICE_TIMER_INITIAL_MS,
  }));
  const [now, setNow] = useState(0);
  const [isTimerStorageReady, setIsTimerStorageReady] = useState(false);

  useEffect(() => {
    const hydrationTimerId = window.setTimeout(() => {
      const currentTime = Date.now();
      setNow(currentTime);
      setIsTimerStorageReady(true);

      const saved = window.localStorage.getItem(storageKey);

      if (!saved) {
        return;
      }

      try {
        const parsed = JSON.parse(saved) as {
          isStarted?: boolean;
          endTime?: number | null;
          remainingMs?: number;
        };

        if (parsed.isStarted && typeof parsed.endTime === "number") {
          setTimerState({
            isStarted: true,
            endTime: parsed.endTime,
            remainingMs: Math.max(0, parsed.endTime - currentTime),
          });
          return;
        }

        if (typeof parsed.remainingMs === "number") {
          setTimerState({
            isStarted: false,
            endTime: null,
            remainingMs: parsed.remainingMs,
          });
        }
      } catch {
        // Ignore invalid persisted timer state and keep the default timer.
      }
    }, 0);

    return () => window.clearTimeout(hydrationTimerId);
  }, [storageKey]);

  const remainingMs =
    timerState.isStarted && timerState.endTime !== null
      ? Math.max(0, timerState.endTime - now)
      : timerState.remainingMs;

  const canExtend = timerState.isStarted && remainingMs <= 5 * 60 * 1000;

  useEffect(() => {
    if (!isTimerStorageReady) {
      return;
    }

    window.localStorage.setItem(
      storageKey,
      JSON.stringify({
        isStarted: timerState.isStarted,
        endTime: timerState.endTime,
        remainingMs: timerState.remainingMs,
      }),
    );
  }, [
    isTimerStorageReady,
    storageKey,
    timerState.isStarted,
    timerState.endTime,
    timerState.remainingMs,
  ]);

  useEffect(() => {
    endTimeRef.current = timerState.endTime;
    nowRef.current = now;
    remainingMsRef.current = remainingMs;
  }, [timerState.endTime, now, remainingMs]);

  useEffect(() => {
    const armPauseOnUnmountId = window.setTimeout(() => {
      canPauseOnUnmountRef.current = true;
    }, 0);
    const markPageUnloading = () => {
      isPageUnloadingRef.current = true;
    };

    window.addEventListener("beforeunload", markPageUnloading);
    window.addEventListener("pagehide", markPageUnloading);

    return () => {
      window.clearTimeout(armPauseOnUnmountId);
      window.removeEventListener("beforeunload", markPageUnloading);
      window.removeEventListener("pagehide", markPageUnloading);

      if (!canPauseOnUnmountRef.current || isPageUnloadingRef.current) {
        return;
      }

      const frozenRemainingMs =
        endTimeRef.current === null
          ? remainingMsRef.current
          : Math.max(0, endTimeRef.current - nowRef.current);

      window.localStorage.setItem(
        storageKey,
        JSON.stringify({
          isStarted: false,
          endTime: null,
          remainingMs: frozenRemainingMs,
        }),
      );
    };
  }, [storageKey]);

  useEffect(() => {
    if (!timerState.isStarted) {
      return;
    }

    const timerId = window.setInterval(() => {
      const currentTime = Date.now();
      setNow(currentTime);

      if (endTimeRef.current !== null && endTimeRef.current - currentTime <= 0) {
        window.clearInterval(timerId);
        setTimerState({
          isStarted: false,
          endTime: null,
          remainingMs: 0,
        });
      }
    }, 1000);

    return () => window.clearInterval(timerId);
  }, [timerState.isStarted]);

  const startTimer = () => {
    const currentTime = Date.now();
    setNow(currentTime);
    setTimerState((currentState) => ({
      isStarted: true,
      endTime: currentTime + currentState.remainingMs,
      remainingMs: currentState.remainingMs,
    }));
  };

  const addFifteenMinutes = () => {
    const currentTime = Date.now();
    setNow(currentTime);
    setTimerState((currentState) => {
      const currentEndTime = currentState.endTime ?? currentTime;

      return {
        isStarted: true,
        endTime: Math.max(currentEndTime, currentTime) + PRACTICE_TIMER_INCREMENT_MS,
        remainingMs: remainingMs + PRACTICE_TIMER_INCREMENT_MS,
      };
    });
  };

  if (!isTimerStorageReady) {
    return (
      <Box display="flex" alignItems="center" gap="8px">
        <Typography fontSize={14} fontWeight={600}>
          Stop Watch: --:--:--
        </Typography>
      </Box>
    );
  }

  return (
    <Box display="flex" alignItems="center" gap="8px">
      <Typography fontSize={14} fontWeight={600}>
        Stop Watch: {formatPracticeTimeRemaining(remainingMs)}
      </Typography>

      {!timerState.isStarted ? (
        <Button size="small" onClick={startTimer}>
          Start
        </Button>
      ) : null}

      {canExtend ? (
        <Button size="small" onClick={addFifteenMinutes}>
          +15 min
        </Button>
      ) : null}
    </Box>
  );
}
