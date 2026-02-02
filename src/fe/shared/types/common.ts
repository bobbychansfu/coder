import type { SvgIconComponent } from "@mui/icons-material";

/**
 * Common tone types used across admin, instructor, and dashboard sections
 */
export type ToneType =
  | "success"
  | "danger"
  | "warning"
  | "info"
  | "purple"
  | "highlight"
  | "neutral";

/**
 * Accent types for highlighting specific text elements
 */
export type AccentType = "positive" | "neutral";

/**
 * Tool/Action card data structure
 * Used in admin tool hub and instructor actions sections
 */
export interface ToolCardData {
  id: string;
  title: string;
  description: string;
  tone: ToneType;
  icon?: SvgIconComponent;
}

/**
 * Statistics/Overview card data structure
 * Used in admin overview, instructor overview, and dashboard statistics
 */
export interface StatCardData {
  id: string;
  label: string;
  value: string;
  caption: string;
  tone: string;
  icon?: SvgIconComponent;
  valueAccent?: AccentType;
  captionAccent?: AccentType;
}

/**
 * Activity feed item data structure
 * Used in admin and instructor recent activity sections
 */
export interface ActivityItemData {
  id: string;
  description: string;
  timestamp: string;
  tone: ToneType;
  icon?: SvgIconComponent;
}
