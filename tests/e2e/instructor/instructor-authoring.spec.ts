import { test, expect, type Locator, type Page } from "@playwright/test";

type ManageTab = "problems" | "contests";

const manageSearchPlaceholder: Record<ManageTab, string> = {
  problems: "Search problems...",
  contests: "Search contests...",
};

const starterCodeByLanguage = [
  {
    label: /^TypeScript$/,
    code: "export function solve(nums: number[]): number {\n  return 0;\n}\n",
  },
  {
    label: /^JavaScript$/,
    code: "function solve(nums) {\n  return 0;\n}\n\nmodule.exports = { solve };\n",
  },
  {
    label: /^Python$/,
    code: "def solve(nums):\n    return 0\n",
  },
  {
    label: /^Java$/,
    code: "class Solution {\n  static int solve(int[] nums) {\n    return 0;\n  }\n}\n",
  },
  {
    label: /^C\+\+$/,
    code: "#include <vector>\n\nint solve(std::vector<int> nums) {\n  return 0;\n}\n",
  },
] as const;

function uniqueName(prefix: string) {
  return `${prefix} ${Date.now()} ${Math.random().toString(36).slice(2, 7)}`;
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function formatDateInput(value: Date) {
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, "0");
  const day = String(value.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function formatTimeInput(value: Date) {
  const hours = String(value.getHours()).padStart(2, "0");
  const minutes = String(value.getMinutes()).padStart(2, "0");

  return `${hours}:${minutes}`;
}

function getFutureContestSchedule() {
  const start = new Date(Date.now() + 24 * 60 * 60 * 1000);
  start.setHours(10, 0, 0, 0);
  const end = new Date(start.getTime() + 60 * 60 * 1000);

  return {
    startDate: formatDateInput(start),
    startTime: formatTimeInput(start),
    endDate: formatDateInput(end),
    endTime: formatTimeInput(end),
  };
}

async function loginAsInstructor(page: Page) {
  const response = await page.request.post("/api/auth/dev-login", {
    data: { email: "sarah.johnson@sfu.ca", role: "INSTRUCTOR" },
  });
  expect(response.status()).toBe(200);
}

async function waitForLoadingDone(page: Page) {
  await expect(page.getByRole("progressbar").first()).not.toBeVisible({ timeout: 15000 });
}

async function openManageTab(page: Page, tab: ManageTab) {
  await page.getByRole("tab", { name: new RegExp(tab, "i") }).click();
  await waitForLoadingDone(page);
}

async function searchManageList(page: Page, tab: ManageTab, query: string) {
  const input = page.getByPlaceholder(manageSearchPlaceholder[tab]);
  await input.fill(query);
  await expect(input).toHaveValue(query);
}

function manageRow(page: Page, title: string) {
  return page.getByRole("row").filter({ hasText: title }).first();
}

async function expectManageStatus(page: Page, title: string, status: string) {
  const row = manageRow(page, title);
  await expect(row).toBeVisible({ timeout: 10000 });
  await expect(row.getByText(new RegExp(`^${escapeRegExp(status)}$`, "i"))).toBeVisible({
    timeout: 10000,
  });
}

async function openRowActionMenu(page: Page, title: string) {
  await page
    .getByRole("button", {
      name: new RegExp(`^Open actions for ${escapeRegExp(title)}$`, "i"),
    })
    .click();
  await expect(page.getByRole("menu")).toBeVisible({ timeout: 3000 });
}

async function clickRowAction(page: Page, itemTitle: string, actionLabel: string) {
  await openRowActionMenu(page, itemTitle);
  await page.getByRole("menuitem", { name: new RegExp(actionLabel, "i") }).click();
}

async function confirmDelete(page: Page) {
  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible({ timeout: 5000 });
  await dialog.getByRole("button", { name: /^Delete$/i }).click();
  await expect(dialog).not.toBeVisible({ timeout: 10000 });
}

async function expectMenuItemDisabled(item: Locator) {
  await expect(item).toHaveAttribute("aria-disabled", "true");
}

async function applyStatusFilter(page: Page, label: string) {
  await page.getByRole("button", { name: new RegExp(`^${escapeRegExp(label)}$`, "i") }).click();
}

async function fillStarterCodes(page: Page) {
  for (const starterCode of starterCodeByLanguage) {
    await page.locator("button").filter({ hasText: starterCode.label }).first().click();
    await page.locator("textarea:visible").first().fill(starterCode.code);
  }
}

async function openInstructorDashboard(page: Page) {
  await page.goto("/instructor");
  await expect(page.getByRole("heading", { name: "Instructor Tools" })).toBeVisible({
    timeout: 10000,
  });
  await expect(page.getByRole("heading", { name: "Overview" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Recent Activity" })).toBeVisible();
}

async function getOverviewValue(page: Page, label: string) {
  const card = page
    .getByText(label, { exact: true })
    .locator("xpath=ancestor::div[@data-tone]")
    .first();
  const value = card.locator("p").nth(1);

  await expect(value).not.toHaveText("—", { timeout: 10000 });

  return Number.parseInt(((await value.textContent()) ?? "0").trim(), 10);
}

async function expectOverviewValue(page: Page, label: string, expected: number) {
  await expect
    .poll(async () => getOverviewValue(page, label), { timeout: 10000 })
    .toBe(expected);
}

async function createProblemDraft(page: Page, title: string) {
  await page.goto("/instructor/create-problem");
  await waitForLoadingDone(page);
  await page.getByPlaceholder("e.g., Two Sum").fill(title);
  await page.getByRole("button", { name: /save draft/i }).click();

  await expect(page).toHaveURL(/manage-contests/, { timeout: 10000 });
  await waitForLoadingDone(page);
  await openManageTab(page, "problems");
  await searchManageList(page, "problems", title);
  await expectManageStatus(page, title, "draft");
}

// ---------------------------------------------------------------------------
// Problem authoring
// ---------------------------------------------------------------------------

test.describe("Problem authoring", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsInstructor(page);
  });

  test("navigates to create problem page", async ({ page }) => {
    await page.goto("/instructor/create-problem");
    await waitForLoadingDone(page);
    await expect(page.getByRole("tab", { name: /metadata/i })).toBeVisible({ timeout: 8000 });
  });

  test("Save Draft saves problem and redirects to manage page", async ({ page }) => {
    await page.goto("/instructor/create-problem");
    await waitForLoadingDone(page);

    await page.getByPlaceholder("e.g., Two Sum").fill("E2E Draft Problem");

    await page.getByRole("button", { name: /save draft/i }).click();
    await expect(page).toHaveURL(/manage-contests/, { timeout: 10000 });
  });

  test("Preview button opens and closes dialog", async ({ page }) => {
    await page.goto("/instructor/create-problem");
    await waitForLoadingDone(page);

    await page.getByPlaceholder("e.g., Two Sum").fill("Preview Test Problem");
    await page.getByRole("button", { name: /preview/i }).click();

    await expect(page.getByRole("dialog")).toBeVisible({ timeout: 5000 });
    await page.keyboard.press("Escape");
    await expect(page.getByRole("dialog")).not.toBeVisible({ timeout: 3000 });
  });

  test("step tabs navigate: Metadata → Statement → Examples → Starter Code", async ({ page }) => {
    await page.goto("/instructor/create-problem");
    await waitForLoadingDone(page);

    await page.getByRole("button", { name: /next: statement/i }).click();
    await expect(page.getByRole("tab", { name: /statement/i })).toBeVisible({ timeout: 5000 });

    await page.getByRole("button", { name: /next: example/i }).click();
    await expect(page.getByRole("tab", { name: /example/i })).toBeVisible({ timeout: 5000 });

    await page.getByRole("button", { name: /next: starter/i }).click();
    await expect(page.getByRole("tab", { name: /starter/i })).toBeVisible({ timeout: 5000 });
  });

  test("base language selector switches active code editor tab to Java", async ({ page }) => {
    await page.goto("/instructor/create-problem");
    await waitForLoadingDone(page);

    await page.getByRole("button", { name: /next: statement/i }).click();
    await page.getByRole("button", { name: /next: example/i }).click();
    await page.getByRole("button", { name: /next: starter/i }).click();

    await page.getByRole("combobox").last().click();
    await page.getByRole("option", { name: "Java", exact: true }).click();

    const javaTab = page.locator("button").filter({ hasText: /^Java$/ }).first();
    await expect(javaTab).toHaveClass(/codeTabActive/, { timeout: 3000 });
  });

  test("Publish validates title is required", async ({ page }) => {
    await page.goto("/instructor/create-problem");
    await waitForLoadingDone(page);

    await page.getByRole("button", { name: /publish/i }).first().click();
    await expect(page.getByText(/required/i).first()).toBeVisible({ timeout: 3000 });
  });

  test("full create → save draft → edit → update flow for a problem", async ({ page }) => {
    const title = uniqueName("E2E Problem");

    await page.goto("/instructor/create-problem");
    await waitForLoadingDone(page);
    await page.getByPlaceholder("e.g., Two Sum").fill(title);
    await page.getByRole("button", { name: /save draft/i }).click();

    await expect(page).toHaveURL(/manage-contests/, { timeout: 10000 });
    await waitForLoadingDone(page);
    await expect(page.getByText(title)).toBeVisible({ timeout: 10000 });

    await clickRowAction(page, title, "edit");
    await expect(page).toHaveURL(/create-problem.*problemId=/, { timeout: 8000 });
    await waitForLoadingDone(page);
    await expect(page.getByPlaceholder("e.g., Two Sum")).toHaveValue(title, { timeout: 6000 });

    const updated = `${title} UPDATED`;
    await page.getByPlaceholder("e.g., Two Sum").fill(updated);
    await page.getByRole("button", { name: /save draft/i }).click();

    await expect(page).toHaveURL(/manage-contests/, { timeout: 10000 });
    await waitForLoadingDone(page);
    await expect(page.getByText(updated)).toBeVisible({ timeout: 8000 });
  });
});

// ---------------------------------------------------------------------------
// Contest authoring
// ---------------------------------------------------------------------------

test.describe("Contest authoring", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsInstructor(page);
  });

  test("navigates to create contest page", async ({ page }) => {
    await page.goto("/instructor/create-contest");
    await waitForLoadingDone(page);
    await expect(page.getByRole("button", { name: /save draft/i })).toBeVisible({ timeout: 8000 });
  });

  test("Save Draft saves contest and redirects to manage page", async ({ page }) => {
    const name = uniqueName("E2E Draft Contest");
    await page.goto("/instructor/create-contest");
    await waitForLoadingDone(page);

    await page.getByPlaceholder("e.g., Week 5 Lab Contest").fill(name);
    await page.getByRole("button", { name: /save draft/i }).click();

    await expect(page).toHaveURL(/manage-contests/, { timeout: 10000 });
    await waitForLoadingDone(page);
    await openManageTab(page, "contests");
    await expect(page.getByText(name)).toBeVisible({ timeout: 8000 });
  });

  test("Preview button opens and closes dialog", async ({ page }) => {
    await page.goto("/instructor/create-contest");
    await waitForLoadingDone(page);

    await page.getByPlaceholder("e.g., Week 5 Lab Contest").fill("Preview Contest");
    await page.getByRole("button", { name: /preview/i }).click();

    await expect(page.getByRole("dialog")).toBeVisible({ timeout: 5000 });
    await page.keyboard.press("Escape");
    await expect(page.getByRole("dialog")).not.toBeVisible({ timeout: 3000 });
  });

  test("Publish validates contest name is required", async ({ page }) => {
    await page.goto("/instructor/create-contest");
    await waitForLoadingDone(page);

    await page.getByRole("button", { name: /publish|create contest/i }).first().click();
    await expect(page.getByText(/required/i).first()).toBeVisible({ timeout: 3000 });
  });

  test("Back button navigates away from create contest", async ({ page }) => {
    await page.goto("/instructor/create-contest");
    await waitForLoadingDone(page);

    await page.getByRole("button", { name: /back/i }).first().click();
    await expect(page).not.toHaveURL(/create-contest/, { timeout: 5000 });
  });

  test("full create → save draft → edit → update flow for a contest", async ({ page }) => {
    const name = uniqueName("E2E Contest");

    await page.goto("/instructor/create-contest");
    await waitForLoadingDone(page);
    await page.getByPlaceholder("e.g., Week 5 Lab Contest").fill(name);
    await page.getByRole("button", { name: /save draft/i }).click();

    await expect(page).toHaveURL(/manage-contests/, { timeout: 10000 });
    await waitForLoadingDone(page);

    await openManageTab(page, "contests");
    await expect(page.getByText(name)).toBeVisible({ timeout: 8000 });

    await clickRowAction(page, name, "edit");
    await expect(page).toHaveURL(/create-contest.*contestId=/, { timeout: 8000 });
    await waitForLoadingDone(page);
    await expect(page.getByPlaceholder("e.g., Week 5 Lab Contest")).toHaveValue(name, {
      timeout: 6000,
    });

    const updated = `${name} UPDATED`;
    await page.getByPlaceholder("e.g., Week 5 Lab Contest").fill(updated);
    await page.getByRole("button", { name: /save draft/i }).click();

    await expect(page).toHaveURL(/manage-contests/, { timeout: 10000 });
    await waitForLoadingDone(page);
    await openManageTab(page, "contests");
    await expect(page.getByText(updated)).toBeVisible({ timeout: 8000 });
  });
});

// ---------------------------------------------------------------------------
// Manage page
// ---------------------------------------------------------------------------

test.describe("Manage page", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsInstructor(page);
  });

  test("shows Problems and Contests tabs", async ({ page }) => {
    await page.goto("/instructor/manage-contests");
    await waitForLoadingDone(page);
    await expect(page.getByRole("tab", { name: /problems/i })).toBeVisible();
    await expect(page.getByRole("tab", { name: /contests/i })).toBeVisible();
  });

  test("can switch between Problems and Contests tabs", async ({ page }) => {
    await page.goto("/instructor/manage-contests");
    await waitForLoadingDone(page);

    await openManageTab(page, "contests");
    await expect(page.getByRole("columnheader", { name: "Schedule" })).toBeVisible({
      timeout: 5000,
    });

    await openManageTab(page, "problems");
    await expect(page.getByRole("columnheader", { name: "Difficulty" })).toBeVisible({
      timeout: 5000,
    });
  });

  test("Delete option is present in problem row actions", async ({ page }) => {
    await page.goto("/instructor/manage-contests");
    await waitForLoadingDone(page);

    const rows = page.getByRole("row");
    if ((await rows.count()) > 1) {
      await rows.nth(1).getByRole("button").last().click();
      await expect(page.getByRole("menu")).toBeVisible({ timeout: 3000 });
      await expect(page.getByRole("menuitem", { name: /delete/i })).toBeVisible();
      await page.keyboard.press("Escape");
    }
  });

  test("problem lifecycle covers create, edit, publish, archive, delete, filters, and action states", async ({
    page,
  }) => {
    test.setTimeout(120_000);

    const draftTitle = uniqueName("E2E Lifecycle Problem");
    const publishedTitle = `${draftTitle} ACTIVE`;

    await createProblemDraft(page, draftTitle);

    await applyStatusFilter(page, "Draft");
    await expectManageStatus(page, draftTitle, "draft");
    await applyStatusFilter(page, "All");

    await clickRowAction(page, draftTitle, "edit");
    await expect(page).toHaveURL(/create-problem.*problemId=/, { timeout: 10000 });
    await waitForLoadingDone(page);

    await page.getByPlaceholder("e.g., Two Sum").fill(publishedTitle);
    await page.getByRole("button", { name: /next: statement/i }).click();

    await page.getByPlaceholder("Describe the problem clearly...").fill(
      "Return the sum of the provided numbers.",
    );
    await page.getByPlaceholder("Describe the input format...").fill(
      "The first line contains n. The second line contains n integers.",
    );
    await page.getByPlaceholder("Describe the output format...").fill(
      "Print the sum of the integers.",
    );
    await page.getByPlaceholder("e.g., 1 ≤ n ≤ 10^5").fill("1 <= n <= 1000");
    await page.getByRole("button", { name: /next: examples/i }).click();

    await page.getByPlaceholder("4 9\n2 7 11 15").fill("3\n1 2 3");
    await page.getByPlaceholder("0 1").fill("6");
    await page.getByPlaceholder("Explain why this output is correct...").fill(
      "1 + 2 + 3 = 6.",
    );
    await page.getByRole("button", { name: /next: starter code/i }).click();

    await fillStarterCodes(page);
    await page.getByRole("button", { name: /save changes/i }).first().click();

    await expect(page).toHaveURL(/manage-contests/, { timeout: 10000 });
    await waitForLoadingDone(page);
    await openManageTab(page, "problems");
    await searchManageList(page, "problems", publishedTitle);
    await expectManageStatus(page, publishedTitle, "active");

    await applyStatusFilter(page, "Active");
    await expectManageStatus(page, publishedTitle, "active");
    await applyStatusFilter(page, "All");

    await clickRowAction(page, publishedTitle, "archive");
    await expectManageStatus(page, publishedTitle, "archived");

    await applyStatusFilter(page, "Archived");
    await expectManageStatus(page, publishedTitle, "archived");
    await applyStatusFilter(page, "All");

    await openRowActionMenu(page, publishedTitle);
    await expectMenuItemDisabled(page.getByRole("menuitem", { name: /edit problem/i }));
    await expectMenuItemDisabled(page.getByRole("menuitem", { name: /^Archive$/i }));
    await page.keyboard.press("Escape");

    await clickRowAction(page, publishedTitle, "delete");
    await confirmDelete(page);
    await expectManageStatus(page, publishedTitle, "deleted");

    await applyStatusFilter(page, "Deleted");
    await expectManageStatus(page, publishedTitle, "deleted");

    await openRowActionMenu(page, publishedTitle);
    await expectMenuItemDisabled(page.getByRole("menuitem", { name: /edit problem/i }));
    await expectMenuItemDisabled(page.getByRole("menuitem", { name: /^Archive$/i }));
    await expectMenuItemDisabled(page.getByRole("menuitem", { name: /^Delete$/i }));
  });

  test("contest lifecycle covers create, edit, publish, archive, delete, filters, and action states", async ({
    page,
  }) => {
    test.setTimeout(120_000);

    const helperProblemTitle = uniqueName("E2E Contest Helper Problem");
    const draftContestTitle = uniqueName("E2E Lifecycle Contest");
    const publishedContestTitle = `${draftContestTitle} UPCOMING`;
    const schedule = getFutureContestSchedule();

    await createProblemDraft(page, helperProblemTitle);

    await page.goto("/instructor/create-contest");
    await waitForLoadingDone(page);
    await page.getByPlaceholder("e.g., Week 5 Lab Contest").fill(draftContestTitle);
    await page.getByRole("button", { name: /save draft/i }).click();

    await expect(page).toHaveURL(/manage-contests/, { timeout: 10000 });
    await waitForLoadingDone(page);
    await openManageTab(page, "contests");
    await searchManageList(page, "contests", draftContestTitle);
    await expectManageStatus(page, draftContestTitle, "draft");

    await applyStatusFilter(page, "Draft");
    await expectManageStatus(page, draftContestTitle, "draft");
    await applyStatusFilter(page, "All");

    await clickRowAction(page, draftContestTitle, "edit");
    await expect(page).toHaveURL(/create-contest.*contestId=/, { timeout: 10000 });
    await waitForLoadingDone(page);

    await page.getByPlaceholder("e.g., Week 5 Lab Contest").fill(publishedContestTitle);
    await page.locator('input[type="date"]').first().fill(schedule.startDate);
    await page.locator('input[type="time"]').first().fill(schedule.startTime);
    await page.locator('input[type="date"]').nth(1).fill(schedule.endDate);
    await page.locator('input[type="time"]').nth(1).fill(schedule.endTime);

    await page.getByRole("button", { name: /add problems/i }).click();
    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible({ timeout: 5000 });
    await dialog.getByRole("button", { name: new RegExp(escapeRegExp(helperProblemTitle), "i") }).click();
    await dialog.getByRole("button", { name: /done \(/i }).click();

    await expect(dialog).not.toBeVisible({ timeout: 5000 });
    await expect(page.getByRole("button", { name: new RegExp(`^Remove ${escapeRegExp(helperProblemTitle)}$`, "i") })).toBeVisible({
      timeout: 5000,
    });
    await page.getByRole("button", { name: /save changes/i }).first().click();

    await expect(page).toHaveURL(/manage-contests/, { timeout: 10000 });
    await waitForLoadingDone(page);
    await openManageTab(page, "contests");
    await searchManageList(page, "contests", publishedContestTitle);
    await expectManageStatus(page, publishedContestTitle, "upcoming");

    await applyStatusFilter(page, "Upcoming");
    await expectManageStatus(page, publishedContestTitle, "upcoming");
    await applyStatusFilter(page, "All");

    await clickRowAction(page, publishedContestTitle, "archive");
    await expectManageStatus(page, publishedContestTitle, "archived");

    await applyStatusFilter(page, "Archived");
    await expectManageStatus(page, publishedContestTitle, "archived");
    await applyStatusFilter(page, "All");

    await openRowActionMenu(page, publishedContestTitle);
    await expectMenuItemDisabled(page.getByRole("menuitem", { name: /edit contest/i }));
    await expectMenuItemDisabled(page.getByRole("menuitem", { name: /^Archive$/i }));
    await page.keyboard.press("Escape");

    await clickRowAction(page, publishedContestTitle, "delete");
    await confirmDelete(page);
    await expectManageStatus(page, publishedContestTitle, "deleted");

    await applyStatusFilter(page, "Deleted");
    await expectManageStatus(page, publishedContestTitle, "deleted");

    await openRowActionMenu(page, publishedContestTitle);
    await expectMenuItemDisabled(page.getByRole("menuitem", { name: /edit contest/i }));
    await expectMenuItemDisabled(page.getByRole("menuitem", { name: /^Archive$/i }));
    await expectMenuItemDisabled(page.getByRole("menuitem", { name: /^Delete$/i }));
    await page.keyboard.press("Escape");

    await openManageTab(page, "problems");
    await searchManageList(page, "problems", helperProblemTitle);
    await clickRowAction(page, helperProblemTitle, "delete");
    await confirmDelete(page);
    await expectManageStatus(page, helperProblemTitle, "deleted");
  });
});

// ---------------------------------------------------------------------------
// Instructor dashboard
// ---------------------------------------------------------------------------

test.describe("Instructor dashboard", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsInstructor(page);
  });

  test("shows non-analytics instructor action cards on the dashboard", async ({ page }) => {
    await openInstructorDashboard(page);

    await expect(page.getByRole("button", { name: /manage contests/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /create problem/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /create contest/i })).toBeVisible();
  });

  test("dashboard action cards navigate to the non-analytics instructor pages", async ({ page }) => {
    await openInstructorDashboard(page);

    await page.getByRole("button", { name: /manage contests/i }).click();
    await expect(page).toHaveURL(/\/instructor\/manage-contests/, { timeout: 5000 });

    await openInstructorDashboard(page);
    await page.getByRole("button", { name: /create problem/i }).click();
    await expect(page).toHaveURL(/\/instructor\/create-problem/, { timeout: 5000 });

    await openInstructorDashboard(page);
    await page.getByRole("button", { name: /create contest/i }).click();
    await expect(page).toHaveURL(/\/instructor\/create-contest/, { timeout: 5000 });
  });

  test("overview counts and recent activity update for problem and contest changes", async ({
    page,
  }) => {
    test.setTimeout(120_000);

    const problemTitle = uniqueName("E2E Dashboard Problem");
    const contestTitle = uniqueName("E2E Dashboard Contest");
    const schedule = getFutureContestSchedule();

    await openInstructorDashboard(page);
    const baselineActiveContests = await getOverviewValue(page, "Active Contests");
    const baselineProblemsCreated = await getOverviewValue(page, "Problems Created");

    await createProblemDraft(page, problemTitle);

    await openInstructorDashboard(page);
    await expectOverviewValue(page, "Active Contests", baselineActiveContests);
    await expectOverviewValue(page, "Problems Created", baselineProblemsCreated + 1);
    await expect(page.getByText(`Problem "${problemTitle}" saved as draft`)).toBeVisible({
      timeout: 10000,
    });

    await page.goto("/instructor/create-contest");
    await waitForLoadingDone(page);
    await page.getByPlaceholder("e.g., Week 5 Lab Contest").fill(contestTitle);
    await page.locator('input[type="date"]').first().fill(schedule.startDate);
    await page.locator('input[type="time"]').first().fill(schedule.startTime);
    await page.locator('input[type="date"]').nth(1).fill(schedule.endDate);
    await page.locator('input[type="time"]').nth(1).fill(schedule.endTime);

    await page.getByRole("button", { name: /add problems/i }).click();
    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible({ timeout: 5000 });
    await dialog
      .getByRole("button", { name: new RegExp(escapeRegExp(problemTitle), "i") })
      .click();
    await dialog.getByRole("button", { name: /done \(/i }).click();
    await expect(dialog).not.toBeVisible({ timeout: 5000 });

    await page.getByRole("button", { name: /publish contest/i }).first().click();
    await expect(page).toHaveURL(/manage-contests/, { timeout: 10000 });
    await waitForLoadingDone(page);

    await openInstructorDashboard(page);
    await expectOverviewValue(page, "Active Contests", baselineActiveContests + 1);
    await expectOverviewValue(page, "Problems Created", baselineProblemsCreated + 1);
    await expect(page.getByText(`Contest "${contestTitle}" scheduled`)).toBeVisible({
      timeout: 10000,
    });

    await page.goto("/instructor/manage-contests");
    await waitForLoadingDone(page);
    await openManageTab(page, "contests");
    await searchManageList(page, "contests", contestTitle);
    await clickRowAction(page, contestTitle, "archive");
    await expectManageStatus(page, contestTitle, "archived");

    await openInstructorDashboard(page);
    await expectOverviewValue(page, "Active Contests", baselineActiveContests);
    await expectOverviewValue(page, "Problems Created", baselineProblemsCreated + 1);
    await expect(page.getByText(`Contest "${contestTitle}" archived`)).toBeVisible({
      timeout: 10000,
    });

    await page.goto("/instructor/manage-contests");
    await waitForLoadingDone(page);
    await openManageTab(page, "problems");
    await searchManageList(page, "problems", problemTitle);
    await clickRowAction(page, problemTitle, "delete");
    await confirmDelete(page);
    await expectManageStatus(page, problemTitle, "deleted");

    await openInstructorDashboard(page);
    await expectOverviewValue(page, "Active Contests", baselineActiveContests);
    await expectOverviewValue(page, "Problems Created", baselineProblemsCreated);
    await expect(page.getByText(`Problem "${problemTitle}" deleted`)).toBeVisible({
      timeout: 10000,
    });

    await page.goto("/instructor/manage-contests");
    await waitForLoadingDone(page);
    await openManageTab(page, "contests");
    await searchManageList(page, "contests", contestTitle);
    await clickRowAction(page, contestTitle, "delete");
    await confirmDelete(page);
    await expectManageStatus(page, contestTitle, "deleted");

    await openInstructorDashboard(page);
    await expectOverviewValue(page, "Active Contests", baselineActiveContests);
    await expectOverviewValue(page, "Problems Created", baselineProblemsCreated);
    await expect(page.getByText(`Contest "${contestTitle}" deleted`)).toBeVisible({
      timeout: 10000,
    });
  });
});
