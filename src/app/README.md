# App Router Structure

This project uses Next.js App Router with route groups for better organization.

## 📁 Folder Structure

```
src/app/
├── (app)/              # Main application routes (uses AppShell layout)
│   ├── page.tsx        # Dashboard / Home (/)
│   ├── page.module.css
│   ├── contests/
│   │   └── page.tsx    # /contests
│   ├── practice/
│   │   └── page.tsx    # /practice
│   ├── instructor/
│   │   └── page.tsx    # /instructor
│   ├── admin/
│   │   └── page.tsx    # /admin
│   └── profile/
│       └── page.tsx    # /profile
├── (auth)/             # Authentication routes (uses auth layout)
│   ├── layout.tsx      # Auth-specific layout
│   ├── login/
│   │   └── page.tsx    # /login
│   └── signup/
│       └── page.tsx    # /signup
├── api/                # API routes
│   └── hello/
│       └── route.ts    # GET /api/hello
├── logout/
│   └── page.tsx        # /logout
├── layout.tsx          # Root layout (applies to all routes)
├── globals.css         # Global styles
└── providers.tsx       # React providers (Material-UI, etc.)
```

## 🎯 Route Groups

Route groups `(folder)` organize routes without affecting the URL structure.

### (app) Route Group
Contains main application pages that use the AppShell layout (Navbar + content area).

**Routes:**
- `/` - Dashboard
- `/contests` - Contests page
- `/practice` - Practice page
- `/instructor` - Instructor page
- `/admin` - Admin page
- `/profile` - Profile page

### (auth) Route Group
Contains authentication pages with a minimal centered layout.

**Routes:**
- `/login` - Login page
- `/signup` - Signup page

### Other Routes
- `/logout` - Logout handler (redirects to login)

## 🔌 API Routes

API routes are in the `api/` folder and follow the route handler pattern.

**Example:**
```typescript
// src/app/api/hello/route.ts
export async function GET() {
  return NextResponse.json({ message: "Hello" });
}
```

Access at: `http://localhost:3000/api/hello`

## 📄 Page Structure

### Regular Page (with AppShell)
```typescript
import { AppShell } from "@/fe/shared";

export default function MyPage() {
  return (
    <AppShell>
      <div>{/* Your content */}</div>
    </AppShell>
  );
}
```

### Auth Page (minimal layout)
```typescript
export default function LoginPage() {
  return <div>{/* Login form */}</div>;
}
```

## 🚀 Adding New Pages

### 1. Add a new page in (app) route group
```bash
mkdir src/app/(app)/my-page
touch src/app/(app)/my-page/page.tsx
```

```typescript
import { AppShell } from "@/fe/shared";

export default function MyPage() {
  return (
    <AppShell>
      <h1>My Page</h1>
    </AppShell>
  );
}
```

Access at: `/my-page`

### 2. Add a new API endpoint
```bash
mkdir src/app/api/my-endpoint
touch src/app/api/my-endpoint/route.ts
```

```typescript
import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({ data: "Hello" });
}
```

Access at: `/api/my-endpoint`

## 📝 Layouts

### Root Layout (`layout.tsx`)
- Applies to all routes
- Contains HTML structure, fonts, and providers
- Wraps the entire app

### Auth Layout (`(auth)/layout.tsx`)
- Applies only to auth routes (/login, /signup)
- Simple centered layout
- Overrides default layout for auth pages

### AppShell (component)
- Not a layout file, but a reusable component
- Contains Navbar and main content wrapper
- Used in (app) route group pages

## 🔍 Route Resolution

| URL | File Path | Layout |
|-----|-----------|--------|
| `/` | `(app)/page.tsx` | Root + AppShell |
| `/contests` | `(app)/contests/page.tsx` | Root + AppShell |
| `/login` | `(auth)/login/page.tsx` | Root + Auth |
| `/api/hello` | `api/hello/route.ts` | N/A |
| `/logout` | `logout/page.tsx` | Root only |

## 🎨 Styling

- **CSS Modules** - Component styles in `src/fe/shared/styles/` and feature folders like `src/fe/dashboard/styles/`
- **Global CSS** - App-wide styles in `globals.css`
- **Tailwind** - Available if needed, but prefer CSS modules

## 📚 Best Practices

1. **Use route groups** for logical organization without URL nesting
2. **Keep pages simple** - Extract complex logic to components
3. **Use AppShell** for consistent layout across main app pages
4. **Server components by default** - Only add "use client" when needed
5. **Co-locate styles** - Use CSS modules for component-specific styles

## 🧪 Testing Routes

Start dev server:
```bash
npm run dev
```

Visit routes:
- http://localhost:3000 (Dashboard)
- http://localhost:3000/contests
- http://localhost:3000/login
- http://localhost:3000/api/hello
