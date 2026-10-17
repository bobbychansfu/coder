// Application Routes
export const ROUTES = {
  home: "/",
  dashboard: "/dashboard",
  contests: "/contests",
  practice: "/practice",
  instructor: "/instructor",
  instructorManageContests: "/instructor/manage-contests",
  instructorResearchAnalytics: "/instructor/research-analytics",
  instructorCreateProblem: "/instructor/create-problem",
  instructorCreateContest: "/instructor/create-contest",
  admin: "/admin",
  adminContests: "/admin/contests",
  adminAnnouncements: "/admin/announcements",
  adminUsers: "/admin/users",
  adminSettings: "/admin/settings",
  profile: "/profile",
} as const;

export function buildContestRoute(contestId: string) {
  return `${ROUTES.contests}/${contestId}`;
}

export type ContestTab = "problems" | "scoreboard" | "submissions";

export function parseContestTab(value: string | null | undefined): ContestTab {
  return value === "scoreboard" || value === "submissions" ? value : "problems";
}

// Contest menu shared by the contest page and its problem pages, like Codeforces
export function buildContestTabs(contestId: string) {
  return [
    { value: "problems", label: "Problems", href: buildContestRoute(contestId) },
    { value: "scoreboard", label: "Scoreboard", href: `${buildContestRoute(contestId)}?tab=scoreboard` },
    { value: "submissions", label: "Submissions", href: `${buildContestRoute(contestId)}?tab=submissions` },
  ];
}

export function buildContestEditRoute(contestId: string) {
  return `${ROUTES.instructorCreateContest}?contestId=${encodeURIComponent(contestId)}`;
}

// Type-safe route access
export type RouteKey = keyof typeof ROUTES;
