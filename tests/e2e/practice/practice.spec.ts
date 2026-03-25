import { test, expect, type Page } from "@playwright/test";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function loginAsStudent(page: Page) {
  const response = await page.request.post("/api/auth/dev-login", {
    data: { email: "dylan.04@sfu.ca", role: "student" },
  });
  expect(response.status()).toBe(200);
}

/** Wait for MUI loading spinner to disappear (targets only the root progressbar). */
async function waitForLoadingDone(page: Page) {
  await expect(page.getByRole("progressbar").first()).not.toBeVisible({ timeout: 15000 });
}

/** Returns the code of the first available practice problem, or null if none. */
async function getFirstProblemCode(page: Page): Promise<string | null> {
  await page.goto("/practice");
  await waitForLoadingDone(page);
  const firstCard = page.locator('a[href^="/practice/"]').first();
  if ((await firstCard.count()) === 0) return null;
  const href = await firstCard.getAttribute("href");
  return href?.replace("/practice/", "") ?? null;
}

async function typeInMonaco(page: Page, text: string) {
  // Click the visible editor content area to focus Monaco, then type via keyboard.
  // The .inputarea textarea is positioned off-screen by Monaco and cannot be clicked normally.
  await page.locator(".monaco-editor .view-lines").first().click();
  await page.keyboard.type(text);
}

// ---------------------------------------------------------------------------
// Practice list page
// ---------------------------------------------------------------------------

test.describe("Practice list page", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsStudent(page);
  });

  test("redirects to login when not authenticated", async ({ page }) => {
    await page.context().clearCookies();
    await page.goto("/practice");
    await expect(page).toHaveURL(/\/login/);
  });

  test("loads problem list for authenticated student", async ({ page }) => {
    await page.goto("/practice");
    await expect(page).toHaveURL("/practice");
    await expect(page.getByRole("heading", { name: "Practice Problems" })).toBeVisible();
  });

  test("shows problem cards or empty state", async ({ page }) => {
    await page.goto("/practice");
    await waitForLoadingDone(page);

    const cards = page.locator('a[href^="/practice/"]');
    const count = await cards.count();
    if (count > 0) {
      await expect(cards.first()).toBeVisible();
    } else {
      await expect(page.getByText("No problems found")).toBeVisible();
    }
  });

  test("search input is present and interactive", async ({ page }) => {
    await page.goto("/practice");
    const searchInput = page.getByPlaceholder("Search for ...");
    await expect(searchInput).toBeVisible();
    await searchInput.fill("two sum");
    await expect(searchInput).toHaveValue("two sum");
  });

  test("search with no match shows empty state", async ({ page }) => {
    await page.goto("/practice");
    await waitForLoadingDone(page);

    const searchInput = page.getByPlaceholder("Search for ...");
    await searchInput.fill("zzznoresultsxxx");
    await page.waitForTimeout(600); // debounce
    await waitForLoadingDone(page);

    const cards = page.locator('a[href^="/practice/"]');
    const count = await cards.count();
    // Either 0 results or "No problems found" text
    if (count === 0) {
      await expect(page.getByText(/no problems found/i)).toBeVisible();
    }
    expect(count).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// Practice problem submission page
// ---------------------------------------------------------------------------

test.describe("Practice problem submission page", () => {
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

  test("loads problem detail page", async ({ page }) => {
    if (!firstProblemCode) test.skip();

    await page.goto(`/practice/${firstProblemCode}`);
    // ProblemHeader renders title — wait up to 10s for data to load
    await expect(page.locator("main, [class*='page']").first()).toBeVisible({ timeout: 10000 });
    // No error page
    await expect(page.getByText("Problem not found")).not.toBeVisible();
  });

  test("openSession mutation fires on page load", async ({ page }) => {
    if (!firstProblemCode) test.skip();

    // httpBatchLink puts the procedure name in the URL path
    const sessionRequest = page.waitForRequest((req) =>
      req.url().includes("practiceExecution.openSession"),
    );
    await page.goto(`/practice/${firstProblemCode}`);
    await expect(sessionRequest).resolves.toBeTruthy();
  });

  test("Monaco editor is visible with starter code", async ({ page }) => {
    if (!firstProblemCode) test.skip();

    await page.goto(`/practice/${firstProblemCode}`);
    await expect(page.locator(".monaco-editor")).toBeVisible({ timeout: 15000 });

    // The editor textarea should have content (Monaco sets aria-label)
    const editorLines = page.locator(".monaco-editor .view-lines");
    await expect(editorLines).toBeVisible();
  });

  test("language selector is present", async ({ page }) => {
    if (!firstProblemCode) test.skip();

    await page.goto(`/practice/${firstProblemCode}`);
    await expect(page.locator(".monaco-editor")).toBeVisible({ timeout: 15000 });

    // MUI Select for language — "Solution" heading is nearby
    await expect(page.getByText("Solution")).toBeVisible();
    const select = page.locator('[role="combobox"]').first();
    await expect(select).toBeVisible();
  });

  test("language selector can switch to Python", async ({ page }) => {
    if (!firstProblemCode) test.skip();

    await page.goto(`/practice/${firstProblemCode}`);
    await expect(page.locator(".monaco-editor")).toBeVisible({ timeout: 15000 });

    const select = page.locator('[role="combobox"]').first();
    await select.click();

    const pythonOption = page.getByRole("option", { name: "Python" });
    if ((await pythonOption.count()) > 0) {
      await pythonOption.click();
      await expect(page.locator(".monaco-editor")).toBeVisible();
      // Select now shows Python
      await expect(select).toContainText("Python");
    }
  });

  test("Submit button stays disabled until the user types", async ({ page }) => {
    if (!firstProblemCode) test.skip();

    await page.goto(`/practice/${firstProblemCode}`);
    await expect(page.locator(".monaco-editor")).toBeVisible({ timeout: 15000 });

    const submitBtn = page.getByRole("button", { name: /^submit$/i });
    await expect(submitBtn).toBeVisible();
    await expect(submitBtn).toBeDisabled();

    await typeInMonaco(page, "\n// typed by e2e");
    await expect(submitBtn).toBeEnabled({ timeout: 10000 });
  });

  test("clicking Submit posts to the practice submission endpoint", async ({ page }) => {
    if (!firstProblemCode) test.skip();

    await page.goto(`/practice/${firstProblemCode}`);
    await typeInMonaco(page, "\n// typed by e2e");
    const submitBtn = page.getByRole("button", { name: /^submit$/i });
    await expect(submitBtn).toBeEnabled({ timeout: 10000 });

    const submitRequest = page.waitForRequest((req) =>
      req.url().includes("/api/practice/submissions") && req.method() === "POST",
    );
    await submitBtn.click();
    await expect(submitRequest).resolves.toBeTruthy();
  });

  test("Output section appears and shows judging state after Submit", async ({ page }) => {
    if (!firstProblemCode) test.skip();

    await page.goto(`/practice/${firstProblemCode}`);
    await typeInMonaco(page, "\n// typed by e2e");
    const submitBtn = page.getByRole("button", { name: /^submit$/i });
    await expect(submitBtn).toBeEnabled({ timeout: 10000 });
    await submitBtn.click();

    // "Output" label renders immediately when hasRun=true
    await expect(page.getByText("Output")).toBeVisible({ timeout: 5000 });
    await expect(
      page.getByText(/queued for gemini judging|judging your code/i),
    ).toBeVisible({ timeout: 5000 });
  });

  test("Submit button opens the submission SSE stream", async ({ page }) => {
    if (!firstProblemCode) test.skip();

    await page.goto(`/practice/${firstProblemCode}`);
    await typeInMonaco(page, "\n// typed by e2e");
    const submitBtn = page.getByRole("button", { name: /^submit$/i });
    await expect(submitBtn).toBeEnabled({ timeout: 10000 });

    const streamRequest = page.waitForRequest((req) =>
      req.url().includes("/api/practice/submissions/") &&
      req.url().includes("/stream") &&
      req.method() === "GET",
    );
    await submitBtn.click();
    await expect(streamRequest).resolves.toBeTruthy();
  });

  test("Submit payload includes problemId, language, and code", async ({
    page,
  }) => {
    if (!firstProblemCode) test.skip();

    await page.goto(`/practice/${firstProblemCode}`);
    await typeInMonaco(page, "\n// typed by e2e");
    const submitBtn = page.getByRole("button", { name: /^submit$/i });
    await expect(submitBtn).toBeEnabled({ timeout: 10000 });

    // Capture the request before clicking
    const submitRequestPromise = page.waitForRequest((req) =>
      req.url().includes("/api/practice/submissions") && req.method() === "POST",
    );
    await submitBtn.click();
    const submitRequest = await submitRequestPromise;

    const input = JSON.parse(submitRequest.postData() ?? "{}") as Record<string, unknown>;

    expect(input).toHaveProperty("problemId");
    expect(input).toHaveProperty("language");
    expect(input).toHaveProperty("code");
  });

  test("Submit payload no longer includes sessionId or timestamp", async ({ page }) => {
    if (!firstProblemCode) test.skip();

    await page.goto(`/practice/${firstProblemCode}`);
    await typeInMonaco(page, "\n// typed by e2e");
    const submitBtn = page.getByRole("button", { name: /^submit$/i });
    await expect(submitBtn).toBeEnabled({ timeout: 10000 });

    const submitRequestPromise = page.waitForRequest((req) =>
      req.url().includes("/api/practice/submissions") && req.method() === "POST",
    );
    await submitBtn.click();
    const submitRequest = await submitRequestPromise;

    const input = JSON.parse(submitRequest.postData() ?? "{}") as Record<string, unknown>;

    expect(input).not.toHaveProperty("sessionId");
    expect(input).not.toHaveProperty("timestamp");
  });
});
