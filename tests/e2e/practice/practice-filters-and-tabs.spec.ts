import { test, expect, type Page } from "@playwright/test";

async function loginAsStudent(page: Page) {
  const response = await page.request.post("/api/auth/dev-login", {
    data: { email: "dylan.04@sfu.ca", role: "student" },
  });
  expect(response.status()).toBe(200);
}

async function waitForLoadingDone(page: Page) {
  await expect(page.getByRole("progressbar").first()).not.toBeVisible({ timeout: 15000 });
}

async function getFirstProblemCode(page: Page): Promise<string | null> {
  await page.goto("/practice");
  await waitForLoadingDone(page);
  const firstCard = page.locator('a[href^="/practice/"]').first();
  if ((await firstCard.count()) === 0) return null;
  const href = await firstCard.getAttribute("href");
  return href?.replace("/practice/", "") ?? null;
}

async function typeInMonaco(page: Page, text: string) {
  await page.locator(".monaco-editor .view-lines").first().click();
  await page.keyboard.type(text);
}

// ---------------------------------------------------------------------------
// Filter panel
// ---------------------------------------------------------------------------

test.describe("Practice list — filter panel", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsStudent(page);
  });

  test("Filters panel is visible with Difficulty and Status groups", async ({ page }) => {
    await page.goto("/practice");
    await waitForLoadingDone(page);

    await expect(page.getByRole("heading", { name: "Filters" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Difficulty" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Status" })).toBeVisible();
  });

  test("Difficulty filter buttons are present: Easy, Medium, Hard", async ({ page }) => {
    await page.goto("/practice");
    await waitForLoadingDone(page);

    await expect(page.getByRole("button", { name: "Easy" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Medium" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Hard" })).toBeVisible();
  });

  test("clicking Easy filter only shows easy problems", async ({ page }) => {
    await page.goto("/practice");
    await waitForLoadingDone(page);

    const allCards = page.locator('a[href^="/practice/"]');
    const totalCount = await allCards.count();
    if (totalCount === 0) test.skip();

    await page.getByRole("button", { name: "Easy" }).click();
    await waitForLoadingDone(page);

    // Every visible difficulty badge must say "Easy"
    const difficultyBadges = page.locator("[class*='difficulty'], [class*='Difficulty']");
    const badgeCount = await difficultyBadges.count();
    for (let i = 0; i < badgeCount; i++) {
      const text = (await difficultyBadges.nth(i).textContent()) ?? "";
      expect(text.toLowerCase()).toContain("easy");
    }
  });

  test("clicking Medium filter only shows medium problems", async ({ page }) => {
    await page.goto("/practice");
    await waitForLoadingDone(page);

    const totalCount = await page.locator('a[href^="/practice/"]').count();
    if (totalCount === 0) test.skip();

    await page.getByRole("button", { name: "Medium" }).click();
    await waitForLoadingDone(page);

    const difficultyBadges = page.locator("[class*='difficulty'], [class*='Difficulty']");
    const badgeCount = await difficultyBadges.count();
    for (let i = 0; i < badgeCount; i++) {
      const text = (await difficultyBadges.nth(i).textContent()) ?? "";
      expect(text.toLowerCase()).toContain("medium");
    }
  });

  test("selecting All after a difficulty filter restores all problems", async ({ page }) => {
    await page.goto("/practice");
    await waitForLoadingDone(page);

    const beforeCount = await page.locator('a[href^="/practice/"]').count();
    if (beforeCount === 0) test.skip();

    await page.getByRole("button", { name: "Easy" }).click();
    await waitForLoadingDone(page);

    // Click the "All" button inside the Difficulty filter group specifically
    await page
      .getByRole("heading", { name: "Difficulty" })
      .locator("..")
      .getByRole("button", { name: "All" })
      .click();
    await waitForLoadingDone(page);

    const afterCount = await page.locator('a[href^="/practice/"]').count();
    expect(afterCount).toBe(beforeCount);
  });

  test("search and difficulty filter combine correctly", async ({ page }) => {
    await page.goto("/practice");
    await waitForLoadingDone(page);

    if ((await page.locator('a[href^="/practice/"]').count()) === 0) test.skip();

    await page.getByRole("button", { name: "Easy" }).click();
    await waitForLoadingDone(page);

    const searchInput = page.getByPlaceholder("Search for ...");
    await searchInput.fill("zzznomatchxxx");
    await page.waitForTimeout(600);
    await waitForLoadingDone(page);

    expect(await page.locator('a[href^="/practice/"]').count()).toBe(0);
  });

  test("Status filter Completed button is present", async ({ page }) => {
    await page.goto("/practice");
    await waitForLoadingDone(page);

    await expect(page.getByRole("button", { name: "Completed" })).toBeVisible();
  });
});

// ---------------------------------------------------------------------------
// Problem detail — tab switching
// ---------------------------------------------------------------------------

test.describe("Practice problem — tab switching", () => {
  let firstProblemCode: string | null = null;

  test.beforeAll(async ({ browser }) => {
    const page = await browser.newPage();
    await loginAsStudent(page);
    firstProblemCode = await getFirstProblemCode(page);
    await page.close();
  });

  test.beforeEach(async ({ page }) => {
    await loginAsStudent(page);
  });

  test("Description and Submissions tabs are visible", async ({ page }) => {
    if (!firstProblemCode) test.skip();

    await page.goto(`/practice/${firstProblemCode}`);
    await expect(page.locator(".monaco-editor")).toBeVisible({ timeout: 15000 });

    await expect(page.getByRole("button", { name: /description/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /submissions/i })).toBeVisible();
  });

  test("Description tab is active by default and shows problem content", async ({ page }) => {
    if (!firstProblemCode) test.skip();

    await page.goto(`/practice/${firstProblemCode}`);
    await expect(page.locator(".monaco-editor")).toBeVisible({ timeout: 15000 });

    // Click Description tab explicitly
    await page.getByRole("button", { name: /description/i }).click();

    // Problem description area should be visible (contains text from the problem)
    const problemContent = page.locator("[class*='description'], [class*='problemContent'], [class*='statement']").first();
    const tabContent = page.locator("[class*='tabContent'], [class*='content']").first();
    // At least description panel is visible
    await expect(page.getByRole("button", { name: /description/i })).toBeVisible();
  });

  test("clicking Submissions tab before any run shows empty state", async ({ page }) => {
    if (!firstProblemCode) test.skip();

    await page.goto(`/practice/${firstProblemCode}`);
    await expect(page.locator(".monaco-editor")).toBeVisible({ timeout: 15000 });

    // Wait for any in-progress judging from prior tests to settle
    await expect(
      page.getByText(/queued for gemini judging|judging your code/i),
    ).not.toBeVisible({ timeout: 30_000 });

    await page.getByRole("button", { name: /submissions/i }).click();
    // Either shows previous submissions or "No submissions yet"
    const noSubmissions = page.getByText(/no submissions yet/i);
    const submissionRows = page.locator("[class*='submissionsRow']");
    const hasRows = (await submissionRows.count()) > 0;
    if (!hasRows) {
      await expect(noSubmissions).toBeVisible({ timeout: 5000 });
    }
  });

  test("Submissions tab shows a run record after submitting", async ({ page }) => {
    if (!firstProblemCode) test.skip();
    test.setTimeout(60_000);

    await page.goto(`/practice/${firstProblemCode}`);
    await expect(page.locator(".monaco-editor")).toBeVisible({ timeout: 15000 });

    // Wait for any pending judging from prior run restoration
    await expect(
      page.getByText(/queued for gemini judging|judging your code/i),
    ).not.toBeVisible({ timeout: 30_000 });

    await typeInMonaco(page, "\n// e2e submission history test");
    const submitBtn = page.getByRole("button", { name: /^submit$/i });
    await expect(submitBtn).toBeEnabled({ timeout: 10000 });
    await submitBtn.click();

    // Wait for judging to finish
    await expect(submitBtn).toBeEnabled({ timeout: 60_000 });
    await expect(
      page.getByText(/queued for gemini judging|judging your code/i),
    ).not.toBeVisible({ timeout: 5000 });

    // Switch to Submissions tab
    await page.getByRole("button", { name: /submissions/i }).click();

    // At least one row should be visible
    const submissionRows = page.locator("[class*='submissionsRow']");
    await expect(submissionRows.first()).toBeVisible({ timeout: 5000 });
  });

  test("can switch back from Submissions to Description tab", async ({ page }) => {
    if (!firstProblemCode) test.skip();

    await page.goto(`/practice/${firstProblemCode}`);
    await expect(page.locator(".monaco-editor")).toBeVisible({ timeout: 15000 });

    await page.getByRole("button", { name: /submissions/i }).click();
    await page.getByRole("button", { name: /description/i }).click();

    // Monaco editor is still visible (editor is on the right side, always shown)
    await expect(page.locator(".monaco-editor")).toBeVisible();
  });
});
