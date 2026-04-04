/**
 * Instructor publish flow with cross-module check:
 * publish a problem as "public" → verify it appears on the student practice list.
 *
 * Uses dev login (instructor for authoring, student for verification).
 */
import { test, expect, type Page } from "@playwright/test";

function uniqueName(prefix: string) {
  return `${prefix} ${Date.now()} ${Math.random().toString(36).slice(2, 7)}`;
}

async function loginAsInstructor(page: Page) {
  const response = await page.request.post("/api/auth/dev-login", {
    data: { email: "sarah.johnson@sfu.ca", role: "INSTRUCTOR" },
  });
  expect(response.status()).toBe(200);
}

async function loginAsStudent(page: Page) {
  const response = await page.request.post("/api/auth/dev-login", {
    data: { email: "dylan.04@sfu.ca", role: "student" },
  });
  expect(response.status()).toBe(200);
}

async function waitForLoadingDone(page: Page) {
  await expect(page.getByRole("progressbar").first()).not.toBeVisible({ timeout: 15000 });
}

// ---------------------------------------------------------------------------
// Publish problem → practice list
// ---------------------------------------------------------------------------

test.describe("Instructor publish → practice list cross-check", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsInstructor(page);
  });

  test("published problem with full details appears on student practice list", async ({ page, browser }) => {
    test.setTimeout(120_000);

    const title = uniqueName("E2E Published Problem");

    // ── Step 1: Create and fully fill out a problem ───────────────────────────
    await page.goto("/instructor/create-problem");
    await waitForLoadingDone(page);

    // Metadata tab
    await page.getByPlaceholder("e.g., Two Sum").fill(title);
    await page.getByRole("button", { name: /next: statement/i }).click();

    // Statement tab
    await page.getByPlaceholder("Describe the problem clearly...").fill(
      "Given an array of integers, return the sum of all elements.",
    );
    await page.getByPlaceholder("Describe the input format...").fill(
      "First line: n (number of elements). Second line: n space-separated integers.",
    );
    await page.getByPlaceholder("Describe the output format...").fill(
      "A single integer: the sum.",
    );
    await page.getByPlaceholder("e.g., 1 ≤ n ≤ 10^5").fill("1 <= n <= 100");
    await page.getByRole("button", { name: /next: examples/i }).click();

    // Examples tab
    await page.getByPlaceholder("4 9\n2 7 11 15").fill("3\n1 2 3");
    await page.getByPlaceholder("0 1").fill("6");
    await page.getByPlaceholder("Explain why this output is correct...").fill("1 + 2 + 3 = 6.");
    await page.getByRole("button", { name: /next: starter code/i }).click();

    // Starter Code tab — fill TypeScript at minimum
    await page.locator("button").filter({ hasText: /^TypeScript$/ }).first().click();
    await page.locator("textarea:visible").first().fill(
      "export function solve(nums: number[]): number {\n  return nums.reduce((a, b) => a + b, 0);\n}\n",
    );

    // ── Step 2: Publish (not save draft) ─────────────────────────────────────
    await page.getByRole("button", { name: /save changes|publish/i }).first().click();
    await expect(page).toHaveURL(/manage-contests/, { timeout: 15000 });
    await waitForLoadingDone(page);

    // ── Step 3: Verify manage page shows "active" status ─────────────────────
    await page.getByRole("tab", { name: /problems/i }).click();
    await waitForLoadingDone(page);

    const searchInput = page.getByPlaceholder("Search problems...");
    await searchInput.fill(title);

    const row = page.getByRole("row").filter({ hasText: title }).first();
    await expect(row).toBeVisible({ timeout: 10000 });
    await expect(row.getByText(/^active$/i)).toBeVisible({ timeout: 5000 });

    // ── Step 4: Login as student and verify problem appears in practice list ──
    const studentPage = await browser.newPage();
    await loginAsStudent(studentPage);
    await studentPage.goto("/practice");
    await expect(studentPage.getByRole("progressbar").first()).not.toBeVisible({ timeout: 15000 });

    const searchPractice = studentPage.getByPlaceholder("Search for ...");
    await searchPractice.fill(title);
    await studentPage.waitForTimeout(600); // debounce
    await expect(studentPage.getByRole("progressbar").first()).not.toBeVisible({ timeout: 15000 });

    await expect(
      studentPage.locator('a[href^="/practice/"]').filter({ hasText: title }),
    ).toBeVisible({ timeout: 10000 });

    await studentPage.close();

    // ── Cleanup: archive and delete the test problem ──────────────────────────
    await page.reload();
    await waitForLoadingDone(page);
    await page.getByRole("tab", { name: /problems/i }).click();
    await waitForLoadingDone(page);
    await searchInput.fill(title);

    await page
      .getByRole("button", { name: new RegExp(`Open actions for ${title}`, "i") })
      .click();
    await page.getByRole("menuitem", { name: /archive/i }).click();

    await page
      .getByRole("button", { name: new RegExp(`Open actions for ${title}`, "i") })
      .click();
    await page.getByRole("menuitem", { name: /delete/i }).click();
    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible({ timeout: 5000 });
    await dialog.getByRole("button", { name: /^delete$/i }).click();
    await expect(dialog).not.toBeVisible({ timeout: 10000 });
  });

  test("draft problem does NOT appear on student practice list", async ({ page, browser }) => {
    test.setTimeout(60_000);

    const title = uniqueName("E2E Draft Hidden Problem");

    // Create a draft (title only, save draft)
    await page.goto("/instructor/create-problem");
    await waitForLoadingDone(page);
    await page.getByPlaceholder("e.g., Two Sum").fill(title);
    await page.getByRole("button", { name: /save draft/i }).click();
    await expect(page).toHaveURL(/manage-contests/, { timeout: 10000 });

    // Verify student cannot see it in practice list
    const studentPage = await browser.newPage();
    await loginAsStudent(studentPage);
    await studentPage.goto("/practice");
    await expect(studentPage.getByRole("progressbar").first()).not.toBeVisible({ timeout: 15000 });

    const searchPractice = studentPage.getByPlaceholder("Search for ...");
    await searchPractice.fill(title);
    await studentPage.waitForTimeout(600);
    await expect(studentPage.getByRole("progressbar").first()).not.toBeVisible({ timeout: 10000 });

    // Draft problem should NOT appear
    await expect(
      studentPage.locator('a[href^="/practice/"]').filter({ hasText: title }),
    ).not.toBeVisible({ timeout: 5000 });

    await studentPage.close();

    // Cleanup: delete the draft
    await waitForLoadingDone(page);
    await page.getByRole("tab", { name: /problems/i }).click();
    await waitForLoadingDone(page);
    await page.getByPlaceholder("Search problems...").fill(title);

    await page
      .getByRole("button", { name: new RegExp(`Open actions for ${title}`, "i") })
      .click();
    await page.getByRole("menuitem", { name: /delete/i }).click();
    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible({ timeout: 5000 });
    await dialog.getByRole("button", { name: /^delete$/i }).click();
    await expect(dialog).not.toBeVisible({ timeout: 10000 });
  });
});
