import GroupsOutlinedIcon from "@mui/icons-material/GroupsOutlined";
import WorkspacePremiumOutlinedIcon from "@mui/icons-material/WorkspacePremiumOutlined";
import { Statistic } from "@/fe/shared/types/statistics";

export const mockStatistics: Statistic[] = [
  {
    title: "Total Solved",
    value: "38",
    subtitle: "+5 this week",
    icon: "/icons/trophy.svg",
    variant: "success",
  },
  {
    title: "Participation",
    value: "24 contests",
    subtitle: "Keep it up!",
    icon: GroupsOutlinedIcon,
    variant: "neutral",
    tone: "info",
  },
  {
    title: "Total score",
    value: "8,450",
    icon: WorkspacePremiumOutlinedIcon,
    variant: "neutral",
    tone: "highlight",
  },
  {
    title: "Global Rank",
    value: "#2,847",
    subtitle: "↑ 124 this month",
    icon: "/icons/target.svg",
    variant: "success",
  },
];
