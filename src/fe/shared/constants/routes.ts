// Application Routes
export const ROUTES = {
  home: "/",
  dashboard: "/",
  contests: "/contests",
  practice: "/practice",
  instructor: "/instructor",
  instructorAnnouncements: "/instructor/announcements",
  instructorResearchAnalytics: "/instructor/research-analytics",
  instructorCreateProblem: "/instructor/create-problem",
  instructorCreateContest: "/instructor/create-contest",
  admin: "/admin",
  profile: "/profile",
} as const;

// Type-safe route access
export type RouteKey = keyof typeof ROUTES;
