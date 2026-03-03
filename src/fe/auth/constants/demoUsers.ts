export type DemoRole = "INSTRUCTOR" | "TA" | "STUDENT" | "ADMIN";

export interface DemoUser {
  label: string;
  email: string;
  role: DemoRole;
  computingId: string;
}

export const demoUsers: DemoUser[] = [
  {
    label: "Demo Instructor",
    email: "sarah.johnson@sfu.ca",
    role: "INSTRUCTOR",
    computingId: "sjohnson",
  },
  {
    label: "Demo TA",
    email: "dev.patel@sfu.ca",
    role: "TA",
    computingId: "dpatel",
  },
  {
    label: "Demo Student",
    email: "amy.01@sfu.ca",
    role: "STUDENT",
    computingId: "student01",
  },
  {
    label: "Demo Admin",
    email: "admin@sfu.ca",
    role: "ADMIN",
    computingId: "admin",
  },
];
