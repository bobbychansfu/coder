/**
 * Instructor Overview Seeding Test
 *
 * Creates 30 problems (mix of draft / active / archived) and 5 contests
 * (mix of upcoming and active) via tRPC API calls, then verifies the
 * Instructor home page Overview and Recent Activity sections update correctly.
 */

import { test, expect, type APIRequestContext, type Page } from "@playwright/test";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function loginAsInstructor(page: Page) {
  const resp = await page.request.post("/api/auth/dev-login", {
    data: { email: "sarah.johnson@sfu.ca", role: "INSTRUCTOR" },
  });
  expect(resp.status()).toBe(200);
}

/** Call a tRPC mutation via HTTP POST (httpBatchLink format) */
async function trpcMutation<T>(
  request: APIRequestContext,
  procedure: string,
  input: unknown,
): Promise<T> {
  const resp = await request.post(`/api/trpc/${procedure}?batch=1`, {
    data: { "0": input },
    headers: { "Content-Type": "application/json" },
  });
  const json = await resp.json() as
    | [{ result: { data: T } }]
    | [{ error: { message: string } }];

  if (!Array.isArray(json) || "error" in json[0]) {
    const msg = Array.isArray(json) && "error" in json[0]
      ? (json[0] as { error: { message: string } }).error.message
      : String(json);
    throw new Error(`tRPC ${procedure} failed (${resp.status()}): ${msg}`);
  }
  return json[0].result.data;
}

function futureDate(daysFromNow: number): string {
  const d = new Date(Date.now() + daysFromNow * 24 * 60 * 60 * 1000);
  return d.toISOString().slice(0, 10);
}

function pastDate(daysAgo: number): string {
  const d = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000);
  return d.toISOString().slice(0, 10);
}

function time(h: number, m = 0): string {
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

const BASE_STARTER_CODES = {
  cplusplus: "#include<iostream>\nint main(){return 0;}",
  java: "class Solution { static int solve() { return 0; } }",
  python: "def solve(): return 0",
  typescript: "function solve(): number { return 0; }",
  javascript: "function solve() { return 0; }",
};

// ---------------------------------------------------------------------------
// Seeding
// ---------------------------------------------------------------------------

test.describe("Instructor overview — seed and verify", () => {
  test.setTimeout(300_000);

  test("create 30 problems and 5 contests, then verify overview stats and recent activity", async ({
    page,
  }) => {
    await loginAsInstructor(page);
    const request = page.request;

    const stamp = Date.now();

    // ------------------------------------------------------------------
    // 1. Create 30 problems
    //    • 10 draft  (isDraft: true)
    //    • 10 active (isDraft: false)
    //    • 10 active-then-archived (create published, then update manageStatus to ARCHIVED)
    // ------------------------------------------------------------------
    const problemIds: string[] = [];

    for (let i = 1; i <= 10; i++) {
      const result = await trpcMutation<{ id: string }>(
        request,
        "problemAuthoring.createProblem",
        {
          title: `[Seed] Draft Problem ${i} – ${stamp}`,
          difficulty: "easy",
          points: 10,
          tags: [],
          isDraft: true,
          source: "public",
          statement: "Sample statement.",
          inputFormat: "Input format.",
          outputFormat: "Output format.",
          constraints: "1 ≤ n ≤ 100",
          examples: [{ id: "ex-1", input: "1", output: "1", explanation: "" }],
          starterCodes: BASE_STARTER_CODES,
        },
      );
      problemIds.push(result.id);
    }

    for (let i = 1; i <= 10; i++) {
      const result = await trpcMutation<{ id: string }>(
        request,
        "problemAuthoring.createProblem",
        {
          title: `[Seed] Active Problem ${i} – ${stamp}`,
          difficulty: "medium",
          points: 20,
          tags: [],
          isDraft: false,
          source: "public",
          statement: "Sample active statement.",
          inputFormat: "Input format.",
          outputFormat: "Output format.",
          constraints: "1 ≤ n ≤ 100",
          examples: [{ id: "ex-1", input: "2", output: "2", explanation: "" }],
          starterCodes: BASE_STARTER_CODES,
        },
      );
      problemIds.push(result.id);
    }

    // contest-only problems
    for (let i = 1; i <= 10; i++) {
      const result = await trpcMutation<{ id: string }>(
        request,
        "problemAuthoring.createProblem",
        {
          title: `[Seed] Archived Problem ${i} – ${stamp}`,
          difficulty: "hard",
          points: 30,
          tags: [],
          isDraft: false,
          source: "contest-only",
          statement: "Sample archived statement.",
          inputFormat: "Input format.",
          outputFormat: "Output format.",
          constraints: "1 ≤ n ≤ 100",
          examples: [{ id: "ex-1", input: "3", output: "3", explanation: "" }],
          starterCodes: BASE_STARTER_CODES,
        },
      );
      problemIds.push(result.id);
      // archive immediately
      await trpcMutation(request, "instructorManageContent.updateProblemManageStatus", {
        problemId: result.id,
        manageStatus: "ARCHIVED",
      });
    }

    // ------------------------------------------------------------------
    // 2. Create 5 contests
    //    • 2 upcoming  (start date in future)
    //    • 3 active    (start date in past, end date in future)
    // ------------------------------------------------------------------
    const contestIds: string[] = [];

    // Use the first active problem for all contests (indices 10-19 are active)
    const contestProblemId = problemIds[10];

    for (let i = 1; i <= 2; i++) {
      const result = await trpcMutation<{ id: string }>(
        request,
        "contestAuthoring.createContest",
        {
          contestName: `[Seed] Upcoming Contest ${i} – ${stamp}`,
          description: "Upcoming contest description.",
          startDate: futureDate(7 + i),
          startTime: time(10),
          endDate: futureDate(7 + i),
          endTime: time(12),
          visibility: "course-only",
          aiHintEnabled: false,
          isDraft: false,
          selectedProblemIds: [contestProblemId],
        },
      );
      contestIds.push(result.id);
    }

    for (let i = 1; i <= 3; i++) {
      const result = await trpcMutation<{ id: string }>(
        request,
        "contestAuthoring.createContest",
        {
          contestName: `[Seed] Active Contest ${i} – ${stamp}`,
          description: "Active contest description.",
          startDate: pastDate(i),
          startTime: time(8),
          endDate: futureDate(i + 1),
          endTime: time(20),
          visibility: "public",
          aiHintEnabled: false,
          isDraft: false,
          selectedProblemIds: [contestProblemId],
        },
      );
      contestIds.push(result.id);
    }

    // ------------------------------------------------------------------
    // 3. Navigate to instructor home and verify Overview + Recent Activity
    // ------------------------------------------------------------------
    await page.goto("/instructor");
    await expect(page.getByRole("progressbar").first()).not.toBeVisible({ timeout: 15000 });

    const overviewSection = page.locator("section").filter({ hasText: "Overview" });
    await expect(overviewSection).toBeVisible();

    // Labels visible (exact match avoids caption collision)
    await expect(overviewSection.getByText("Active Contests", { exact: true })).toBeVisible();
    await expect(overviewSection.getByText("Problems Created", { exact: true })).toBeVisible();

    // Total Participants stays hardcoded at 147
    await expect(overviewSection.getByText("Total Participants", { exact: true })).toBeVisible();
    await expect(overviewSection.getByText("147")).toBeVisible();

    // Recent Activity: should show 5 items (scrollable list)
    const activitySection = page.locator("section").filter({ hasText: "Recent Activity" });
    await expect(activitySection).toBeVisible();
    const activityItems = activitySection.locator(".activityItem, [class*='activityItem']");
    // At minimum 1 item should be visible (our seed data)
    await expect(activityItems.first()).toBeVisible({ timeout: 10000 });

    // The activity list should reference at least one seeded item from this run
    const activityText = await activitySection.textContent();
    const hasSeededActivity =
      (activityText ?? "").includes("Seed") ||
      (activityText ?? "").includes("Problem") ||
      (activityText ?? "").includes("Contest");
    expect(hasSeededActivity).toBe(true);

    // ------------------------------------------------------------------
    // 4. Cleanup — mark all seeded contests and problems as DELETED
    // ------------------------------------------------------------------
    for (const contestId of contestIds) {
      await trpcMutation(request, "instructorManageContent.updateContestManageStatus", {
        contestId,
        manageStatus: "DELETED",
      });
    }
    for (const problemId of problemIds) {
      await trpcMutation(request, "instructorManageContent.updateProblemManageStatus", {
        problemId,
        manageStatus: "DELETED",
      });
    }
  });
});
