export type AdminQuickActionTone = "user" | "settings" | "backup";

export interface AdminQuickAction {
  id: string;
  label: string;
  tone: AdminQuickActionTone;
}

export const adminQuickActions: AdminQuickAction[] = [
  { id: "add-user", label: "Add New User", tone: "user" },
  { id: "system-config", label: "System Config", tone: "settings" },
  { id: "run-backup", label: "Run Backup", tone: "backup" },
];
