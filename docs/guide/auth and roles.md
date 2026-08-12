# Auth And Roles
**Current authentication modes, session flow, and role behavior**

---

## Table of Contents
1. [Overview](#1-overview)
2. [Current Auth Modes](#2-current-auth-modes)
3. [Session Model](#3-session-model)
4. [Auth Endpoints](#4-auth-endpoints)
5. [How User Resolution Works](#5-how-user-resolution-works)
6. [Route Protection](#6-route-protection)
7. [Roles](#7-roles)
8. [Current Permission Model](#8-current-permission-model)
9. [Common Flows](#9-common-flows)
10. [Current Caveats](#10-current-caveats)

---

## 1) Overview

The project currently supports two main authentication modes:

- `dev`
- `cas`

The auth system is centered around:

- a signed session cookie
- `getCurrentUser()` in `src/lib/session.ts`
- role normalization in `src/lib/authz.ts`

Current high-level behavior:

- dev mode supports quick demo login and self-service student signup
- CAS mode redirects to SFU CAS and can validate tickets directly with SFU
- optional guest login uses administrator-created, expiring local credentials
- most of the app expects normalized roles:
  - `student`
  - `instructor`
  - `admin`

---

## 2) Current Auth Modes

### 2.1 Dev mode

Enabled by:

- `AUTH_MODE="dev"`
- `NEXT_PUBLIC_AUTH_MODE="dev"`

Behavior:

- login page shows the dev quick-access card
- signup page allows self-service student account creation
- the backend signs its own session cookie using `DEV_AUTH_COOKIE_SECRET`

Main routes:

- `POST /api/auth/dev-login`
- `POST /api/auth/dev-signup`

### 2.2 CAS mode

Enabled by:

- `AUTH_MODE="cas"`
- `NEXT_PUBLIC_AUTH_MODE="cas"`

Behavior:

- login page uses CAS login
- the browser is redirected to SFU CAS
- when `CAS_VALIDATE_URL` is configured, the Next app validates the returned ticket directly with SFU
- the Next app provisions new CAS users as students and signs its own CAS session cookie
- session validation comes from the backend /me endpoint rather than local dev token verification
- an external authentication backend remains available as a fallback when direct validation is not configured

Main routes:

- `GET /api/auth/cas/login`
- `POST /api/auth/cas/login`
- `GET /api/auth/cas/callback`

### 2.3 Guest login

Enabled independently of the main auth mode by:

- `GUEST_LOGIN_ENABLED="true"`
- `GUEST_AUTH_COOKIE_SECRET`

Behavior:

- an administrator creates a guest account through `/api/admin/guest-users`
- the guest signs in with a local username and password through `/api/auth/guest-login`
- disabled or expired credentials are rejected
- the app stores the database role as `GUEST` but exposes the session's effective application role as `student`
- successful guest sessions last 6 hours

Main route:

- `POST /api/auth/guest-login`

---

## 3) Session Model

### 3.1 Cookie name

The app uses:

- `SESSION_COOKIE_NAME`

Default:

- `session`

### 3.2 Dev-mode session

In dev mode:

- `POST /api/auth/dev-login` or `POST /api/auth/dev-signup` sets the cookie
- the cookie value is a locally signed dev auth token
- the token is verified by `verifyDevSessionToken(...)`

Current TTL:

- 6 hours

### 3.3 CAS-mode session

In CAS mode:

- the callback route validates the CAS ticket directly with SFU when `CAS_VALIDATE_URL` is set
- the login and validation requests use the same fixed `CAS_SERVICE_URL`
- the desired post-login path is kept in a short-lived HttpOnly cookie instead of the CAS service URL
- if successful, the app creates a signed local session using `CAS_AUTH_COOKIE_SECRET`
- later user resolution verifies that signed session locally
- if direct validation is not configured, the callback can instead use the external auth backend and
  forward its `set-cookie` header

### 3.4 Guest session

When guest login is enabled:

- `POST /api/auth/guest-login` validates the local credential and expiry
- the backend signs the session using `GUEST_AUTH_COOKIE_SECRET`
- the session identifies the account as a guest while granting the student-facing application role
- expired guest users are removed when an administrator lists guest accounts

### 3.5 Logout

`POST /api/auth/logout`

Behavior:

- clears the session cookie by setting it empty with `maxAge: 0`

---

## 4) Auth Endpoints

### 4.1 Dev auth

#### `POST /api/auth/dev-login`

Purpose:

- sign in as one of the configured demo accounts

Input:

- `email`
- `role`

Current behavior:

- only works when `AUTH_MODE === "dev"`
- validates against `demoUsers`
- writes a signed session cookie

#### `POST /api/auth/dev-signup`

Purpose:

- create a new student account locally and sign in immediately

Input:

- `name`
- `computingId`
- `email`
- `studentNumber` (optional)

Current behavior:

- only works when `AUTH_MODE === "dev"`
- always creates a `STUDENT` user
- writes a signed session cookie

### 4.2 CAS auth

#### `GET /api/auth/cas/login`

Purpose:

- redirect-based CAS login start

#### `POST /api/auth/cas/login`

Purpose:

- JSON mode CAS login start
- returns a redirect URL the frontend can navigate to

#### `GET /api/auth/cas/callback`

Purpose:

- receive the CAS ticket
- validate it directly against `CAS_VALIDATE_URL`, passing both `ticket` and the exact `service`
- read the SFU computing ID from the successful CAS XML response
- preserve an existing database user's role or create a new `STUDENT` user automatically
- create the signed local CAS session cookie
- fall back to the configured external auth backend only when direct validation is not configured

### 4.3 Logout

#### `POST /api/auth/logout`

Purpose:

- clear the current session cookie

### 4.4 Guest auth and administration

#### `POST /api/auth/guest-login`

Purpose:

- authenticate an enabled, unexpired guest credential

Input:

- `username`
- `password`

#### `GET /api/admin/guest-users`

Purpose:

- let an administrator list current guest accounts and remove expired records

#### `POST /api/admin/guest-users`

Purpose:

- let an administrator create a guest account with an optional expiry

Input:

- `username`
- `firstName` (optional)
- `lastName` (optional)
- `password`
- `expiresAt` (optional)

---

## 5) How User Resolution Works

The main server-side entry point is:

- `getCurrentUser()` in `src/lib/session.ts`

### 5.1 Dev mode resolution

If all of these are true:

- `AUTH_MODE === "dev"`
- session cookie exists
- `DEV_AUTH_COOKIE_SECRET` exists

then the app:

- verifies the dev token locally
- returns:
  - `computingId`
  - normalized role

No backend `/me` request is needed in that case.

### 5.2 CAS resolution

When all of these are true:

- `AUTH_MODE === "cas"`
- the session cookie exists
- `CAS_AUTH_COOKIE_SECRET` exists

the app verifies the locally signed CAS session and resolves the associated database user. No `/me`
request is needed for this direct-validation flow.

During the first successful CAS callback, the app uses the SFU computing ID to find a user by
`computingId` or `<computingId>@sfu.ca`. If none exists, it creates a user with the `STUDENT` role.
Existing roles are preserved.

### 5.3 External-backend fallback

If local guest, dev, and CAS session verification do not resolve a user:

- the app forwards all cookies to `AUTH_BACKEND_BASE_URL + AUTH_ME_PATH`
- expects a JSON payload containing:
  - computing ID
  - role

Accepted computing-id keys:

- `computingId`
- `computing_id`
- `computingID`
- `username`

Accepted role output:

- anything that normalizes to:
  - `student`
  - `instructor`
  - `admin`

If normalization fails, the user is treated as unauthenticated.

---

## 6) Route Protection

### 6.1 Middleware protection

Global route protection is applied in:

- `middleware.ts`
- `src/middlewares/authGuard.ts`

Protected route prefixes:

- `/dashboard/:path*`
- `/contests/:path*`
- `/practice/:path*`
- `/instructor/:path*`
- `/admin/:path*`

Current middleware rule:

- if a non-empty session cookie exists, the request is allowed through
- otherwise the user is redirected to `/login?next=...`

Important note:

- middleware only checks for the **presence** of a cookie, not whether it is valid
- deeper role/user validation still happens later in server code

### 6.2 Server-side role checks

Actual authorization is enforced by:

- `getCurrentUser()`
- `can(role)` from `src/lib/authz.ts`
- route-specific checks in REST handlers and tRPC routers

So:

- middleware is the first gate
- server code is the real trust boundary

---

## 7) Roles

### 7.1 Roles in the database

Database enum `UserRole` contains:

- `ADMIN`
- `INSTRUCTOR`
- `TA`
- `STUDENT`
- `GUEST`

### 7.2 Roles in app authorization

The current app authorization layer only normalizes:

- `student`
- `instructor`
- `admin`

That means:

- `TA` exists in the database schema
- but `TA` is not currently part of the active normalized role model in `src/lib/authz.ts`

### 7.3 Demo roles

Current dev quick access provides demo users for:

- instructor
- student
- admin

There is no current dev quick-access TA user.

---

## 8) Current Permission Model

The main permission helper is:

- `can(role)`

### 8.1 Student

Visible areas:

- dashboard
- contests
- practice

Not visible:

- instructor area
- admin area

Not allowed:

- contest management
- problem creation
- view-all-submissions management actions

### 8.2 Instructor

Visible areas:

- dashboard
- contests
- practice
- instructor area

Allowed:

- create contests
- manage contests
- view all submissions in instructor-managed contexts
- create/manage problems

Not allowed:

- admin area

### 8.3 Admin

Visible areas:

- dashboard
- contests
- practice
- instructor area
- admin area

Allowed:

- all current instructor-level actions
- admin-only area access

---

## 9) Common Flows

### 9.1 Dev quick login

1. User opens `/login`
2. UI shows demo accounts when `NEXT_PUBLIC_AUTH_MODE === "dev"`
3. Frontend calls `POST /api/auth/dev-login`
4. Backend validates the chosen demo user
5. Backend sets the signed session cookie
6. User is redirected to `/dashboard`

### 9.2 Dev signup

1. User opens `/signup`
2. UI is only enabled when `NEXT_PUBLIC_AUTH_MODE === "dev"`
3. Frontend calls `POST /api/auth/dev-signup`
4. Backend creates a new `STUDENT` user
5. Backend sets the signed session cookie
6. User is redirected to `/dashboard`

### 9.3 CAS login

1. User opens `/login`
2. Frontend calls `POST /api/auth/cas/login`
3. Backend returns a CAS redirect URL
4. Browser goes to CAS
5. CAS returns to `/api/auth/cas/callback`
6. Callback sends the ticket and the same fixed service URL to SFU's validation endpoint
7. Callback reads the computing ID returned by SFU CAS
8. The app finds or automatically provisions the database user
9. The app sets a signed local CAS session cookie
10. Later requests verify that session locally and redirect the user to the requested page

### 9.4 Guest login

1. An administrator creates a credential through `POST /api/admin/guest-users`
2. The guest enters the assigned username and password
3. Frontend calls `POST /api/auth/guest-login`
4. Backend verifies that guest login is enabled and the credential is active and unexpired
5. The app sets a signed local guest session cookie
6. Server-side user resolution maps the account to the student-facing application role

### 9.5 Logout

1. Frontend calls `POST /api/auth/logout`
2. Session cookie is cleared
3. protected routes require login again

---

## 10) Current Caveats

- `TA` is present in the schema but not currently normalized by the app auth layer
- middleware only checks whether the session cookie exists, not whether it is valid
- dev signup only creates student users
- dev login only allows the predefined demo accounts
- deployed CAS mode should set `CAS_SERVICE_URL` to the exact HTTPS callback registered with SFU
- direct CAS mode requires `CAS_LOGIN_BASE_URL`, `CAS_VALIDATE_URL`, `CAS_SERVICE_URL`, and
  `CAS_AUTH_COOKIE_SECRET`
- CAS automatically provisions unknown SFU computing IDs as `STUDENT`; an administrator must change
  the role later when instructor or admin access is required
- the auth backend must accept `ticket` and `service` query parameters and return a session
  `Set-Cookie` only when using the external-backend fallback
- if the backend `/me` payload uses an unexpected role value, the app will treat the user as unauthenticated
- some older env flags such as `ALLOW_TA_*` exist in `.env`, but the main active role/permission code currently centers on `student`, `instructor`, and `admin`
