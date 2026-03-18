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

// Type-safe route access
export type RouteKey = keyof typeof ROUTES;
