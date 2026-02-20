export interface AdminSystemToggleSetting {
  id: string;
  label: string;
  description: string;
  enabled: boolean;
}

export interface AdminSystemSettingsData {
  contestSettingsTitle: string;
  contestSettingsDescription: string;
  securityTitle: string;
  securityDescription: string;
  sessionTimeoutLabel: string;
  sessionTimeoutMinutes: number;
  securityNote: string;
  toggles: AdminSystemToggleSetting[];
}

export const adminSystemSettingsData: AdminSystemSettingsData = {
  contestSettingsTitle: "Contest Settings",
  contestSettingsDescription: "Default contest and problem settings",
  securityTitle: "Security & Access",
  securityDescription: "Platform security and access controls",
  sessionTimeoutLabel: "Session Timeout (minutes)",
  sessionTimeoutMinutes: 120,
  securityNote:
    "Students authenticate through SFU FAS with MFA. Only admins can manually add instructors, TAs, and other admins.",
  toggles: [
    {
      id: "contest-reminders",
      label: "Contest Reminders",
      description: "Remind users about upcoming contests",
      enabled: true,
    },
    {
      id: "enable-leaderboard",
      label: "Enable Leaderboard",
      description: "Show public leaderboards for contests",
      enabled: true,
    },
    {
      id: "allow-practice-after-contest",
      label: "Allow Practice After Contest",
      description: "Let students practice problems after contest ends",
      enabled: true,
    },
  ],
};
