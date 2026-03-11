import GroupsOutlinedIcon from "@mui/icons-material/GroupsOutlined";
import WorkspacePremiumOutlinedIcon from "@mui/icons-material/WorkspacePremiumOutlined";
import type { Badge } from "@/fe/shared/types/badge";
import type { Statistic } from "@/fe/shared/types/statistics";
import type { WeeklyStat } from "@/fe/shared/types/weeklyStats";

interface MetadataBadge {
  code: string;
  name: string;
  earned: boolean;
}

interface StudentMetadataPayload {
  role: "student";
  cards: {
    totalSolved: number;
    participationContests: number;
    totalScore: number;
    rankParticipationNumber: number | null;
    rankPointsNumber: number | null;
  };
  participation: {
    base: number;
    bonus: number;
    total: number;
    active_days_7d: number;
    activity_7d: {
      logins_7d: number;
      submissions_7d: number;
      login_streak_days?: number;
    };
  };
  weekly: {
    problems_solved_7d: number;
    contests_participated_7d: number;
    submissions_7d: number;
    points_7d: number;
    active_days_7d: number;
    time_spent_minutes_7d: number;
  };
  badges: {
    earned: MetadataBadge[];
  };
}

export interface DashboardMetadataView {
  statistics: Statistic[];
  weeklyStats: WeeklyStat[];
  badges: Badge[];
}

const DASHBOARD_METADATA_EVENT = "dashboard:metadata-refresh";

const BADGE_VISUALS: Record<string, Pick<Badge, "icon" | "color">> = {
  "first-submission": { icon: "🚀", color: "#2563eb" },
  "first-accepted": { icon: "✅", color: "#059669" },
  "active-learner": { icon: "🧠", color: "#7c3aed" },
  "consistent-week": { icon: "📅", color: "#0891b2" },
  "login-streak-3": { icon: "☀️", color: "#f59e0b" },
  "login-streak-7": { icon: "🔥", color: "#ea580c" },
  "submission-sprinter": { icon: "✍️", color: "#2563eb" },
  "submission-marathon": { icon: "🏃", color: "#0f766e" },
  "problem-solver-10": { icon: "🌱", color: "#16a34a" },
  "problem-solver-25": { icon: "🌿", color: "#15803d" },
  "problem-solver-50": { icon: "🌳", color: "#15803d" },
  "contest-regular": { icon: "🏁", color: "#dc2626" },
  "contest-veteran": { icon: "🏆", color: "#b91c1c" },
  "point-collector": { icon: "⚡", color: "#ca8a04" },
  "elite-scorer": { icon: "💎", color: "#7c3aed" },
};

export const EMPTY_DASHBOARD_METADATA: DashboardMetadataView = {
  statistics: [
    { title: "Total Solved", value: "0", subtitle: "0 active days in 7d", icon: "/icons/trophy.svg", variant: "success" },
    { title: "Participation", value: "0 contests", subtitle: "+0 activity bonus", icon: GroupsOutlinedIcon, variant: "neutral", tone: "info" },
    { title: "Total score", value: "0", subtitle: "0 submissions in 7d", icon: WorkspacePremiumOutlinedIcon, variant: "neutral", tone: "highlight" },
    { title: "Global Rank", value: "-", subtitle: "Points rank - · 0d streak", icon: "/icons/target.svg", variant: "success" },
  ],
  weeklyStats: [
    { label: "Problems Solved", value: 0 },
    { label: "Contests Participated", value: 0 },
    { label: "Score Earned", value: "+0" },
    { label: "Time Spent", value: "0.0h" },
  ],
  badges: [],
};

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isStudentMetadataPayload(value: unknown): value is StudentMetadataPayload {
  if (!isObject(value) || value.role !== "student") {
    return false;
  }

  return isObject(value.cards) && isObject(value.participation) && isObject(value.badges);
}

async function requestMetadata(
  method: "GET" | "POST",
  body?: Record<string, unknown>,
): Promise<StudentMetadataPayload | null> {
  const response = await fetch("/api/auth/metadata", {
    method,
    cache: "no-store",
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    return null;
  }

  const payload = (await response.json()) as unknown;
  return isStudentMetadataPayload(payload) ? payload : null;
}

function mapStatistics(payload: StudentMetadataPayload): Statistic[] {
  const participationRank = payload.cards.rankParticipationNumber;
  const pointsRank = payload.cards.rankPointsNumber;
  const loginStreakDays = payload.participation.activity_7d.login_streak_days ?? 0;

  return [
    {
      title: "Total Solved",
      value: String(payload.cards.totalSolved),
      subtitle: `${payload.participation.active_days_7d} active days in 7d`,
      icon: "/icons/trophy.svg",
      variant: "success",
    },
    {
      title: "Participation",
      value: `${payload.cards.participationContests} contests`,
      subtitle: `+${payload.participation.bonus} activity bonus`,
      icon: GroupsOutlinedIcon,
      variant: "neutral",
      tone: "info",
    },
    {
      title: "Total score",
      value: payload.cards.totalScore.toLocaleString(),
      subtitle: `${payload.participation.activity_7d.submissions_7d} submissions in 7d`,
      icon: WorkspacePremiumOutlinedIcon,
      variant: "neutral",
      tone: "highlight",
    },
    {
      title: "Global Rank",
      value: participationRank ? `#${participationRank}` : "-",
      subtitle: pointsRank ? `Points rank #${pointsRank} · ${loginStreakDays}d streak` : undefined,
      icon: "/icons/target.svg",
      variant: "success",
    },
  ];
}

function mapWeeklyStats(payload: StudentMetadataPayload): WeeklyStat[] {
  const hours = (payload.weekly.time_spent_minutes_7d / 60).toFixed(1);

  return [
    { label: "Problems Solved", value: payload.weekly.problems_solved_7d },
    { label: "Contests Participated", value: payload.weekly.contests_participated_7d },
    { label: "Score Earned", value: `+${payload.weekly.points_7d}`, isPositive: payload.weekly.points_7d > 0 },
    { label: "Time Spent", value: `${hours}h` },
  ];
}

function mapBadges(payload: StudentMetadataPayload): Badge[] {
  return payload.badges.earned.slice(0, 3).map((badge) => {
    const visuals = BADGE_VISUALS[badge.code] ?? { icon: "🏅", color: "#475467" };
    return {
      id: badge.code,
      name: badge.name,
      icon: visuals.icon,
      color: visuals.color,
    };
  });
}

function mapDashboardMetadata(payload: StudentMetadataPayload): DashboardMetadataView {
  return {
    statistics: mapStatistics(payload),
    weeklyStats: mapWeeklyStats(payload),
    badges: mapBadges(payload),
  };
}

export async function loadDashboardMetadata(): Promise<DashboardMetadataView | null> {
  const payload = await requestMetadata("GET");
  return payload ? mapDashboardMetadata(payload) : null;
}

export function subscribeDashboardMetadataRefresh(refresh: () => void): () => void {
  const onFocus = () => void refresh();
  const onVisible = () => {
    if (document.visibilityState === "visible") {
      void refresh();
    }
  };
  const onCustomRefresh = () => void refresh();
  const intervalId = window.setInterval(() => void refresh(), 15000);

  window.addEventListener("focus", onFocus);
  document.addEventListener("visibilitychange", onVisible);
  window.addEventListener(DASHBOARD_METADATA_EVENT, onCustomRefresh);

  return () => {
    window.clearInterval(intervalId);
    window.removeEventListener("focus", onFocus);
    document.removeEventListener("visibilitychange", onVisible);
    window.removeEventListener(DASHBOARD_METADATA_EVENT, onCustomRefresh);
  };
}

export function notifyDashboardMetadataRefresh(): void {
  if (typeof window === "undefined") {
    return;
  }

  window.dispatchEvent(new Event(DASHBOARD_METADATA_EVENT));
}
