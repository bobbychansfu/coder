import { expect, test, type Page } from "@playwright/test";

const CONTEST_PROBLEM_URL = "/contests/contest-1/problems/a";

async function loginAsStudent(page: Page) {
  const response = await page.request.post("/api/auth/dev-login", {
    data: { email: "dylan.04@sfu.ca", role: "student" },
  });
  expect(response.status()).toBe(200);
}

async function typeInMonaco(page: Page, text: string) {
  await page.locator(".monaco-editor .view-lines").first().click();
  await page.keyboard.type(text);
}

test.describe("Contest problem submission page", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsStudent(page);
  });

  test("loads starter code for the contest problem editor", async ({ page }) => {
    await page.goto(CONTEST_PROBLEM_URL);
    await expect(page.locator(".monaco-editor")).toBeVisible({ timeout: 15000 });
    await expect(page.locator(".monaco-editor .view-lines")).toContainText("twoSum");
  });

  test("typed contest answer survives a page refresh", async ({ page }) => {
    const persistedMarker = `contest draft ${Date.now()}`;

    await page.goto(CONTEST_PROBLEM_URL);
    await expect(page.locator(".monaco-editor")).toBeVisible({ timeout: 15000 });

    await page.locator(".monaco-editor .view-lines").first().click();
    await page.keyboard.press("Control+a");
    await page.keyboard.press("Delete");
    await typeInMonaco(page, persistedMarker);
    await expect(page.locator(".monaco-editor .view-lines")).toContainText(persistedMarker);

    await page.reload();
    await expect(page.locator(".monaco-editor")).toBeVisible({ timeout: 15000 });
    await expect(page.locator(".monaco-editor .view-lines")).toContainText(persistedMarker, {
      timeout: 10000,
    });
  });
});
