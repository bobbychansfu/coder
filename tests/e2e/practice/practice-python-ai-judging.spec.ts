/**
 * Full AI judging flow using Python language.
 * Requires real Gemini API (JUDGING_MODE=gemini, GEMINI_API_KEY set).
 * Dev server must be running on :3000.
 */
import { test, expect, type Page } from "@playwright/test";

const JUDGING_TIMEOUT = 120_000; // 2 min — Gemini can be slow

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

// ---------------------------------------------------------------------------
// Python submission + AI judging
// ---------------------------------------------------------------------------

test.describe("Practice — Python AI judging", () => {
  let problemCode: string | null = null;

  test.beforeAll(async ({ browser }) => {
    const page = await browser.newPage();
    await loginAsStudent(page);
    problemCode = await getFirstProblemCode(page);
    await page.close();
  });

  test("Python language is selectable", async ({ page }) => {
    if (!problemCode) test.skip();

    await loginAsStudent(page);
    await page.goto(`/practice/${problemCode}`);
    await expect(page.locator(".monaco-editor")).toBeVisible({ timeout: 15000 });

    const languageSelect = page.locator('[role="combobox"]').first();
    await languageSelect.click();
    const pythonOption = page.getByRole("option", { name: "Python" });
    await expect(pythonOption).toBeVisible({ timeout: 3000 });
    await pythonOption.click();
    await expect(languageSelect).toContainText("Python");
  });

  test("Python code submit sends correct language in payload", async ({ page }) => {
    if (!problemCode) test.skip();

    await loginAsStudent(page);
    await page.goto(`/practice/${problemCode}`);
    await expect(page.locator(".monaco-editor")).toBeVisible({ timeout: 15000 });

    // Switch to Python
    const languageSelect = page.locator('[role="combobox"]').first();
    await languageSelect.click();
    const pythonOption = page.getByRole("option", { name: "Python" });
    if ((await pythonOption.count()) === 0) test.skip();
    await pythonOption.click();

    // Wait for any pending judging from prior run
    await expect(
      page.getByText(/queued for gemini judging|judging your code/i),
    ).not.toBeVisible({ timeout: 30_000 });

    // Type code in Monaco
    await page.locator(".monaco-editor .view-lines").first().click();
    await page.keyboard.press("Control+a");
    await page.keyboard.press("Delete");
    await page.keyboard.type("# e2e python test\n");

    const submitBtn = page.getByRole("button", { name: /^submit$/i });
    await expect(submitBtn).toBeEnabled({ timeout: 10000 });

    const submitRequestPromise = page.waitForRequest(
      (req) => req.url().includes("/api/practice/submissions") && req.method() === "POST",
    );
    await submitBtn.click();
    const submitRequest = await submitRequestPromise;

    const body = JSON.parse(submitRequest.postData() ?? "{}") as Record<string, unknown>;
    expect(body.language).toBe("python");
  });

  test("full Python AI judging flow: submit → SSE → verdict → persisted", async ({ page }) => {
    if (!problemCode) test.skip();
    test.setTimeout(JUDGING_TIMEOUT + 30_000);

    await loginAsStudent(page);
    await page.goto(`/practice/${problemCode}`);
    await expect(page.locator(".monaco-editor")).toBeVisible({ timeout: 15000 });

    // Switch to Python
    const languageSelect = page.locator('[role="combobox"]').first();
    await languageSelect.click();
    const pythonOption = page.getByRole("option", { name: "Python" });
    if ((await pythonOption.count()) === 0) test.skip();
    await pythonOption.click();

    // Wait for any residual judging state from page restore
    await expect(
      page.getByText(/queued for gemini judging|judging your code/i),
    ).not.toBeVisible({ timeout: 30_000 });

    // Clear editor and type a stub Python solution
    await page.locator(".monaco-editor .view-lines").first().click();
    await page.keyboard.press("Control+a");
    await page.keyboard.press("Delete");
    await page.keyboard.type(
      "# e2e python stub\ndef solve(*args):\n    return None\n",
    );

    // Capture SSE stream request and submit request before clicking
    const streamRequestPromise = page.waitForRequest(
      (req) =>
        req.url().includes("/api/practice/submissions/") &&
        req.url().includes("/stream") &&
        req.method() === "GET",
    );
    const submitRequestPromise = page.waitForRequest(
      (req) => req.url().includes("/api/practice/submissions") && req.method() === "POST",
    );

    const submitBtn = page.getByRole("button", { name: /^submit$/i });
    await expect(submitBtn).toBeEnabled({ timeout: 10000 });
    await submitBtn.click();

    // ── Submission created ────────────────────────────────────────────────────
    const submitRequest = await submitRequestPromise;
    const submitResponse = await submitRequest.response();
    expect(submitResponse).not.toBeNull();
    if (!submitResponse) {
      throw new Error("Submit request did not receive a response");
    }
    const submitBody = (await submitResponse.json()) as {
      submissionId?: string;
      status?: string;
    };
    expect(submitBody.submissionId).toBeTruthy();
    const submissionId = submitBody.submissionId!;
    console.log(`[python-e2e] submission created: ${submissionId}`);

    // ── SSE stream opened ─────────────────────────────────────────────────────
    const streamReq = await streamRequestPromise;
    expect(streamReq.url()).toContain(submissionId);
    console.log(`[python-e2e] SSE stream: ${streamReq.url()}`);

    // ── UI shows judging state ────────────────────────────────────────────────
    await expect(page.getByText("Output", { exact: true })).toBeVisible({ timeout: 5000 });
    await expect(
      page.getByText(/queued for gemini judging|judging your code/i),
    ).toBeVisible({ timeout: 5000 });

    // ── Wait for judging to complete ──────────────────────────────────────────
    await expect(submitBtn).toBeEnabled({ timeout: JUDGING_TIMEOUT });
    await expect(
      page.getByText(/queued for gemini judging|judging your code/i),
    ).not.toBeVisible({ timeout: 5000 });
    console.log("[python-e2e] judging complete");

    // ── Output block shows a verdict ─────────────────────────────────────────
    const outputBlock = page.locator("[class*='outputBlock']").first();
    const outputText = await outputBlock.textContent();
    expect(outputText?.trim().length).toBeGreaterThan(0);
    console.log(`[python-e2e] output: "${outputText?.slice(0, 120)}"`);

    // ── Verify DB persistence ─────────────────────────────────────────────────
    const persisted = await page.request
      .get(`/api/practice/submissions/${submissionId}`)
      .then((r) => r.json()) as {
      submissionId: string;
      status: string;
      verdict: string | null;
      judgedBy: string | null;
    };
    console.log("[python-e2e] persisted:", JSON.stringify(persisted));

    expect(persisted.submissionId).toBe(submissionId);
    expect(["done", "failed"]).toContain(persisted.status);
    expect(persisted.judgedBy).toBe("gemini");
    expect(persisted.verdict).not.toBeNull();

    // ── Reload and verify result rehydrates ───────────────────────────────────
    await page.reload();
    await expect(page.locator(".monaco-editor")).toBeVisible({ timeout: 15000 });
    await expect(page.getByText("Output", { exact: true })).toBeVisible({ timeout: 5000 });
    await expect(
      page.getByText(/queued for gemini judging|judging your code/i),
    ).not.toBeVisible({ timeout: 120_000 });

    const reloadedOutput = page.locator("[class*='outputBlock']").first();
    await expect(reloadedOutput).toBeVisible({ timeout: 5000 });
    console.log("[python-e2e] reload hydration verified");
  });
});
