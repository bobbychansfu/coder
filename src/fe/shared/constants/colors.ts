// Brand Colors
export const COLORS = {
  brand: {
    primary: "#E03E3E",
    primaryHover: "#EF4444",
    secondary: "#FF6B35",
  },

  // UI Colors
  text: {
    primary: "#1a1a1a",
    secondary: "#4a5565",
    tertiary: "#6B7280",
  },

  // Status Colors
  status: {
    success: "#00A63E",
    warning: "#FF8C00",
    error: "#E03E3E",
    info: "#3B82F6",
  },

  // Background Colors
  background: {
    page: "#FAFAFA",
    card: "#FFFFFF",
    alert: "#FFF4E6",
  },

  // Difficulty Colors
  difficulty: {
    easy: "#00A63E",
    medium: "#FF8C00",
    hard: "#E03E3E",
  },
} as const;

// Type-safe color access
export type ColorKey = keyof typeof COLORS;
export type BrandColorKey = keyof typeof COLORS.brand;
export type StatusColorKey = keyof typeof COLORS.status;
