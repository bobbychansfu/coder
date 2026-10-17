import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { formatTimeLeft } from "@/fe/contests/components/CountdownTimer";

interface ContestStartCountdownProps {
  startsAt: string;
}

const REFRESH_RETRY_MS = 5000;

// Counts down to the start, then refreshes the page so the problems appear. If the server
// still says the contest hasn't started (clocks differ slightly), it refreshes again every
// few seconds until this countdown is replaced.
export default function ContestStartCountdown({ startsAt }: ContestStartCountdownProps) {
  const router = useRouter();
  const startTimestamp = new Date(startsAt).getTime();
  const [remainingMs, setRemainingMs] = useState<number | null>(null);
  const lastRefreshAt = useRef(0);

  useEffect(() => {
    const tick = () => {
      const left = startTimestamp - Date.now();
      setRemainingMs(left);

      if (left <= 0 && Date.now() - lastRefreshAt.current >= REFRESH_RETRY_MS) {
        lastRefreshAt.current = Date.now();
        router.refresh();
      }
    };

    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [router, startTimestamp]);

  if (remainingMs === null || Number.isNaN(startTimestamp)) {
    return <span />;
  }

  return <span>{formatTimeLeft(remainingMs)}</span>;
}
