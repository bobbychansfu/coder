# API Services

This folder contains all the API service layer functions for fetching data from the backend.

## 🚀 Quick Start

Currently, the app uses **mock data**. To switch to a real API:

1. Set `USE_MOCK_DATA = false` in `src/fe/shared/services/api.ts`
2. Configure your API URL in environment variables
3. Implement the backend endpoints listed below

## 📁 Service Files

### `api.ts`
Base API configuration and fetch wrapper (located in `src/fe/shared/services/api.ts`).

**Configuration:**
```typescript
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api";
export const USE_MOCK_DATA = true; // ⚠️ Set to false for real API
```

### `statisticsService.ts`
Fetch user statistics (Total Solved, Current Streak, Total XP, Global Rank)

**API Endpoint:** `GET /api/statistics`

**Response Format:**
```typescript
{
  "statistics": [
    {
      "title": "Total Solved",
      "value": "38",
      "subtitle": "+5 this week",
      "icon": "/icons/trophy.svg",
      "subtitleColor": "#00a63e"
    },
    // ... more statistics
  ]
}
```

### `contestsService.ts`
Fetch contests data (past, upcoming, alerts)

**API Endpoints:**
- `GET /api/contests/past` - Past contests
- `GET /api/contests/upcoming` - Upcoming contests
- `GET /api/contests/alert` - Active contest alert

**Response Formats:**

**Past Contests:**
```typescript
{
  "contests": [
    {
      "id": "contest-1",
      "title": "Week 3 Lab Contest",
      "courseCode": "CMPT 120",
      "date": "1/25/2026",
      "participants": 0,
      "difficulty": "Easy",
      "rank": 4,
      "problemsSolved": "5/5",
      "score": "560 pts",
      "timeTaken": "140m"
    }
  ]
}
```

**Upcoming Contests:**
```typescript
{
  "contests": [
    {
      "id": "upcoming-1",
      "title": "Week 3 Lab Contest",
      "courseCode": "CMPT 120",
      "date": "1/25/2026",
      "timeUntil": "2 hours"
    }
  ]
}
```

**Contest Alert:**
```typescript
{
  "alert": {
    "title": "Contest in Progress!",
    "description": "Trees & Graphs Challenge is currently active",
    "isActive": true
  }
}
```

### `badgesService.ts`
Fetch user's recent badges/achievements

**API Endpoint:** `GET /api/badges/recent`

**Response Format:**
```typescript
{
  "badges": [
    {
      "id": "badge-1",
      "icon": "🔥",
      "name": "10-Day Streak",
      "color": "#FF6B35",
      "earnedDate": "2026-01-20"
    }
  ]
}
```

### `weeklyStatsService.ts`
Fetch user's weekly statistics

**API Endpoint:** `GET /api/stats/weekly`

**Response Format:**
```typescript
{
  "stats": [
    {
      "label": "Problems Solved",
      "value": 5
    },
    {
      "label": "XP Earned",
      "value": "+340",
      "isPositive": true
    }
  ]
}
```

## 🔄 Switching from Mock to Real API

### Step 1: Configure Environment
Create `.env.local` in project root:
```bash
NEXT_PUBLIC_API_URL=http://your-backend-url.com/api
```

### Step 2: Update API Configuration
In `src/fe/shared/services/api.ts`:
```typescript
export const USE_MOCK_DATA = false; // Switch to real API
```

### Step 3: Implement Backend Endpoints
Ensure your backend implements all the endpoints listed above with the correct response formats.

### Step 4: Test
```bash
npm run dev
```

Check the browser console for any API errors.

## 🛠️ Usage in Components

### Client Components (with "use client")
```typescript
"use client";

import { getStatistics } from "@/fe/dashboard/services";
import { useEffect, useState } from "react";

export default function MyComponent() {
  const [stats, setStats] = useState([]);

  useEffect(() => {
    getStatistics().then(setStats);
  }, []);

  return <div>{/* render stats */}</div>;
}
```

### Server Components (App Router)
```typescript
import { getStatistics } from "@/fe/dashboard/services";

export default async function MyPage() {
  const stats = await getStatistics();

  return <div>{/* render stats */}</div>;
}
```

## 📝 Adding New Services

1. Create type in `src/fe/shared/types/`
2. Add mock data in `src/fe/dashboard/data/`
3. Create service file in `src/fe/dashboard/services/`
4. Export service in `index.ts`
5. Document the API endpoint in this README

## 🔍 Error Handling

All services use the `apiFetch` wrapper which handles:
- JSON parsing
- HTTP error status codes
- Error messages

Example with error handling:
```typescript
try {
  const data = await getStatistics();
  // Use data
} catch (error) {
  console.error("Failed to fetch statistics:", error);
  // Handle error
}
```

## 🧪 Testing

When `USE_MOCK_DATA = true`, services include a simulated delay (100ms) to mimic real API behavior.
