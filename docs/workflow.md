# Workflow Guide

## Branching and Workflow
Consistent branch names and a clear branching flow make it easy to understand what is being built, why it exists, and how it fits into the release plan. Use the workflow and conventions below for every branch you push.

### Workflow (Student Model)
Each student creates a base branch from `main`, then creates feature sub-branches from their base. Feature branches run student CI and an AI code review before merging back into the student base; the student base opens a weekly PR to `main`. The weekly PR runs strict CI and an AI code review, then peer developers review; a tech lead or release manager merges.

Branch example:
`Spring-2026/students/bobby123`

```
flowchart TD
    A[main branch (protected)] -->|create student base| B[Spring-2026/students/bobby123]

    B -->|create sub-branch| C1[feature/auth-signin-signup]
    B -->|create sub-branch| C2[chore/update-eslint]
    B -->|create sub-branch| C3[fix/login-redirect]

    C1 -->|commit & push| D1[Student CI (lint / format / unit tests)]
    C2 -->|commit & push| D2[Student CI (lint / format / unit tests)]
    C3 -->|commit & push| D3[Student CI (lint / format / unit tests)]

    D1 --> E1[AI Code Review (student)]
    D2 --> E2[AI Code Review (student)]
    D3 --> E3[AI Code Review (student)]

    E1 -->|merge| B
    E2 -->|merge| B
    E3 -->|merge| B

    B -->|weekly PR| E[PR to main]

    E --> F[Strict CI (build / tests / coverage)]
    F --> G[AI Code Review]

    G --> H[Review Output: summary, blocking issues, risk areas, test coverage, style & conventions, weekly score]

    H -->|peer review| I[Team Review (devs / tech lead)]
    I -->|approve| J[Tech Lead / Release Manager Merge]
    J --> A
```

### Branch Naming Convention
#### Branch Types (core 10)
Type | Use when...
--- | ---
feat | Adding a new feature or user-facing capability
fix | Correcting a bug or regression
docs | Authoring or updating documentation only
style | Formatting-only changes (no code logic impact)
refactor | Restructuring code without changing behavior
test | Adding or updating automated tests only
build | Build system or dependency changes
ci | Continuous integration pipeline adjustments
chore | Maintenance tasks that do not affect production code
revert | Reverting prior commits or branches

These ten mirror the conventional commit types and give teammates an immediate hint about the intention behind the branch.

#### Naming Pattern
General format:
`<type>/<release>-<scope>-<focus>`

- `<type>`: One of the core types above (or `task` for integration/milestone work)
- `<release>`: Target version or initiative (2.0, v1.5, q3, etc.)
- `<scope>`: Product area, feature set, or subsystem (ui-shell, settings, auth, etc.)
- `<focus>`: What is changing (sidenav, profile, account, etc.). Use hyphenated, lower-case words.

This structure keeps branch lists sortable, descriptive, and future-proof.

#### Examples
- `feat/2.0-ui-shell-sidenav` (UI shell side navigation feature for release 2.0)
- `refactor/2.0-routing-and-pages-structure` (navigation/page structure cleanup for release 2.0)

#### Quick Checklist
- Start with an approved type (or `task` for release aggregators)
- Include the release or initiative identifier immediately after the slash (or hyphen for `task`)
- Use short, hyphenated descriptors; skip spaces, camelCase, or punctuation
- Keep the name descriptive but concise - aim for 3-5 segments
- Avoid uppercase letters so Git tooling and scripts stay predictable

## Commits
- Keep commits small and focused; avoid mixing unrelated changes
- Use a clear message format: `<type>: <short summary>`
- Match the commit type to the branch type when possible
- Push updates regularly so reviewers can follow progress

Examples:
- `feat: add auth flow validation`
- `fix: handle login redirect edge case`
- `chore: update lint rules`

## Pull Requests
### Requirements
- Keep PRs focused; avoid mixing unrelated changes
- Frontend PRs must include before/after screenshots for UI changes
- Limit changes to 20 files per PR; split larger work into smaller PRs
- Call out any risk, migration, or rollout considerations

### Frontend PR Template
```
## Summary
Briefly describe the change and scope.

## Files Changed (<= 20)
List key components/features touched (e.g., `cash-asset/*`, `components/area-chart.tsx`).

## Features Added
List user-facing features added or updated.

## Components
List key UI components added/updated.

## Data
List data files (fixtures, mocks, enums, etc.).

## Data & Utilities
List shared data helpers, services, or utilities.

## Styles
List CSS modules or style files updated.

## UI Changes (screenshots, frontend only)
- Before:
- After:

## QA
How was it tested (device/browser/resolution)?
```

### Backend PR Template
```
## Summary
Briefly describe the change and scope.

## Files Changed (<= 20)
List key services/modules (e.g., `services/billing`, `api/v1/payments`).

## APIs
Endpoints changed (method + path).

## QA
How was it tested (unit/integration/manual)?
```

### Example PRs (this repo)
- PR #1: sub-branch -> student base (`feat/1.0-auth-flow-cleanup` -> `Spring-2026/students/bobby123`)
- PR #2: student base -> main (`Spring-2026/students/bobby123` -> `main`)
- These example branches are for reference only; do not merge them.

## Releases
Describe tagging and release process here.
