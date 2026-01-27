# Mock Data

This folder contains all mock data used during development. When you're ready to connect to a real backend API, simply switch the configuration in the services layer.

## 📁 Data Files

### `statistics.ts`
User statistics displayed in the dashboard statistics cards.

**Data Structure:**
```typescript
{
  title: string;        // "Total Solved"
  value: string;        // "38"
  subtitle: string;     // "+5 this week"
  icon: string;         // "/icons/trophy.svg"
  subtitleColor?: string; // "#00a63e"
}
```

### `contests.ts`
Contest data including past contests, upcoming contests, and alerts.

**Past Contest Structure:**
```typescript
{
  id: string;           // "contest-1"
  title: string;        // "Week 3 Lab Contest"
  courseCode: string;   // "CMPT 120"
  date: string;         // "1/25/2026"
  participants: number; // 0
  difficulty: "Easy" | "Medium" | "Hard";
  rank: number;         // 4
  problemsSolved: string; // "5/5"
  score: string;        // "560 pts"
  timeTaken: string;    // "140m"
}
```

**Upcoming Contest Structure:**
```typescript
{
  id: string;         // "upcoming-1"
  title: string;      // "Week 3 Lab Contest"
  courseCode: string; // "CMPT 120"
  date: string;       // "1/25/2026"
  timeUntil: string;  // "2 hours"
}
```

**Contest Alert Structure:**
```typescript
{
  title: string;       // "Contest in Progress!"
  description: string; // "Trees & Graphs Challenge is currently active"
  isActive: boolean;   // true
}
```

### `badges.ts`
User badges and achievements.

**Data Structure:**
```typescript
{
  id: string;        // "badge-1"
  icon: string;      // "🔥"
  name: string;      // "10-Day Streak"
  color: string;     // "#FF6B35"
  earnedDate?: string; // "2026-01-20"
}
```

### `weeklyStats.ts`
User's weekly statistics.

**Data Structure:**
```typescript
{
  label: string;          // "Problems Solved"
  value: string | number; // 5 or "+340"
  isPositive?: boolean;   // true (for green color)
}
```

## 🔄 How to Modify Mock Data

1. Open the relevant data file (e.g., `statistics.ts`)
2. Modify the exported array/object
3. Save the file - changes will be reflected immediately in development

**Example:**
```typescript
// statistics.ts
export const mockStatistics: Statistic[] = [
  {
    title: "Total Solved",
    value: "50", // Changed from 38 to 50
    subtitle: "+10 this week", // Changed from +5 to +10
    icon: "/icons/trophy.svg",
    subtitleColor: "#00a63e",
  },
  // ... more stats
];
```

## 🔌 Connecting to Real API

When your backend is ready:

1. **Keep the mock data** - It serves as a reference for the data structure
2. **Update service configuration** in `src/fe/shared/services/api.ts`:
   ```typescript
   export const USE_MOCK_DATA = false;
   ```
3. **Configure API URL** in `.env.local`:
   ```bash
   NEXT_PUBLIC_API_URL=http://your-backend-url.com/api
   ```

The services layer will automatically switch from using these mock files to fetching from your API.

## 📝 Adding New Mock Data

1. Create a new file (e.g., `newFeature.ts`)
2. Define and export the data:
   ```typescript
   import { NewFeature } from "../types";

   export const mockNewFeature: NewFeature[] = [
     // ... your data
   ];
   ```
3. Export in `index.ts`:
   ```typescript
   export * from "./newFeature";
   ```
4. Create corresponding service in `src/fe/dashboard/services/`

## 🎯 Best Practices

1. **Use TypeScript types** - Import types from `../types` for type safety
2. **Realistic data** - Use realistic values that represent actual use cases
3. **Variety** - Include different scenarios (empty states, max values, etc.)
4. **IDs** - Always include unique IDs for list items
5. **Consistency** - Match the format expected by your API

## 📊 Current Mock Data Summary

| Data File | Records | Used By |
|-----------|---------|---------|
| statistics.ts | 4 items | StatisticsSection |
| contests.ts | 3 past, 1 upcoming, 1 alert | PastContests, UpcomingContests, ContestAlert |
| badges.ts | 3 badges | RecentBadges |
| weeklyStats.ts | 4 stats | ThisWeek |
