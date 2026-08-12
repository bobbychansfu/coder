# Frontend Guide

## Overview

This project uses a Next.js App Router frontend with feature modules under `src/fe`.
The frontend is role-aware and serves student, instructor, and admin experiences from the
same app shell.

## Tech Stack

- Next.js App Router
- React + TypeScript
- MUI + Emotion
- CSS Modules
- tRPC + TanStack Query

## Run Locally

1. Install dependencies:

```bash
npm install
```

2. Start the app:

```bash
npm run dev
```

3. Open:
- `http://localhost:3000`

If pages depend on seeded data, auth mode, or backend routes, also follow the setup in
`docs/guide/backend.md`.

## App Structure

### Route layer

`src/app` contains the App Router structure:

- `src/app/layout.tsx`
  - Global root layout
- `src/app/providers.tsx`
  - Global MUI providers and CSS baseline
- `src/app/theme.ts`
  - Shared MUI theme
- `src/app/(auth)`
  - Public auth pages such as login and signup
- `src/app/(app)`
  - Main authenticated application routes
- `src/app/(app)/instructor`
  - Instructor/admin-only route group
- `src/app/(app)/admin`
  - Admin-only route group
- `src/app/(protected)`
  - Protected shell wrapper used by authenticated areas

### Feature layer

`src/fe` contains feature-oriented frontend code:

- `src/fe/auth`
  - Login/signup UI and dev/CAS access components
- `src/fe/dashboard`
  - Student, instructor, and admin dashboard pages and widgets
- `src/fe/contests`
  - Contest list, contest detail, scoreboard, and contest problem UI
- `src/fe/practice`
  - Practice problem list and practice submission UI
- `src/fe/problems`
  - Problem browsing and create-problem route pages
- `src/fe/profile`
  - Profile and activity views
- `src/fe/instructor`
  - Instructor management, authoring, and research analytics UI
- `src/fe/admin`
  - Admin dashboards, users, contests, settings, and announcements
- `src/fe/shared`
  - Shared layouts, UI primitives, styles, constants, and reusable components

## Current Route Areas

The main frontend route areas are:

- `/login`
- `/signup`
- `/dashboard`
- `/contests`
- `/contests/create`
- `/practice`
- `/practice/[id]`
- `/problems`
- `/problems/create`
- `/profile`
- `/instructor`
- `/instructor/manage-contests`
- `/instructor/create-contest`
- `/instructor/create-problem`
- `/instructor/research-analytics`
- `/admin`
- `/admin/users`
- `/admin/contests`
- `/admin/settings`
- `/admin/announcements`

## Frontend Infrastructure

### App shell and role handling

- `src/app/(app)/layout.tsx`
  - Redirects unauthenticated users to `/login`
  - Wraps the app in the tRPC provider and shared `AppShell`
- `src/app/(app)/instructor/layout.tsx`
  - Restricts instructor routes to `instructor` and `admin`
- `src/app/(app)/admin/layout.tsx`
  - Restricts admin routes to `admin`

### Providers and theme

- `src/app/providers.tsx`
  - Configures MUI `ThemeProvider`, `CssBaseline`, and Next App Router cache provider
- `src/app/theme.ts`
  - Defines the shared light theme and base MUI component overrides

### Data fetching

- `src/lib/trpc/client.ts`
  - Typed frontend tRPC client
- `src/lib/trpc/provider.tsx`
  - Creates the React Query client and tRPC provider
- `src/lib/trpc/types/*`
  - Shared frontend/server payload typing helpers

### Shared UI

Reusable frontend building blocks live under `src/fe/shared`, especially:

- `components/layout`
  - App shell, navbar, management/list layouts
- `components/ui`
  - Tabs, filters, scroll helpers, and smaller UI primitives
- `components/problem`
  - Reusable problem display and editor building blocks
- `styles`
  - Shared CSS modules
- `constants`
  - Shared route, filter, and management constants

## Styling Approach

The app uses:

- MUI for component foundation and theme tokens
- Emotion through MUI integration
- CSS Modules for page- and component-level styling

Most feature-specific styling lives beside the feature in `src/fe/<feature>/styles`.

## Frontend–Backend Boundary

The frontend talks to the backend in two main ways:

- tRPC through `/api/trpc`
  - Used for newer feature-facing data flows
- REST-style Next API routes under `/api/*`
  - Used for auth, student legacy endpoints, judging callbacks, and practice submissions

Useful docs:

- `docs/guide/backend.md`
- `docs/backendAPI.yaml`
- `docs/API Doc.md`

## Practical Starting Points

If you are modifying:

- authentication UI:
  - start in `src/fe/auth`
- practice pages:
  - start in `src/fe/practice`
- contest views:
  - start in `src/fe/contests`
- instructor tools:
  - start in `src/fe/instructor`
- admin pages:
  - start in `src/fe/admin`
- shared layout or navigation:
  - start in `src/fe/shared/components/layout`

## File Map

- App routes: `src/app`
- Feature UI: `src/fe`
- Shared UI system: `src/fe/shared`
- Theme/providers: `src/app/theme.ts`, `src/app/providers.tsx`
- tRPC frontend client: `src/lib/trpc`
- Session/role helpers used by route guards: `src/lib/session.ts`, `src/lib/requireRole.ts`, `src/lib/authz.ts`
