/**
 * Manual verification test: AI judging end-to-end via dev login.
 * Run with: npx playwright test tests/e2e/practice/verify-ai-judging.spec.ts --headed
 *
 * Checks:
 *  1. Dev login works
 *  2. Practice problem list loads
 *  3. Submission POST reaches the backend
 *  4. SSE stream opens
 *  5. Status transitions: queued -> running -> done/failed
 *  6. Verdict + feedback render in the UI
 *  7. DB persistence: GET /api/practice/submissions/:id returns final state
 */

import { test, expect, type Page, type Response } from "@playwright/test";

const JUDGING_TIMEOUT = 60_000; // Gemini can take up to ~30s

function formatVerdictLabel(verdict: string | null) {
  const normalized = verdict?.trim().toLowerCase();

  switch (normalized) {
    case "accepted":
      return "Accepted";
    case "wrong_answer":
    case "wrong answer":
      return "Wrong Answer";
    case "partial":
      return "Partial";
    case "runtime_error":
    case "runtime error":
      return "Runtime Error";
    case "failed":
      return "Failed";
    default:
      return verdict;
  }
}

async function devLoginAsStudent(page: Page) {
  const res = await page.request.post("/api/auth/dev-login", {
    data: { email: "dylan.04@sfu.ca", role: "student" },
  });
  expect(res.status(), "dev-login must return 200").toBe(200);
}

async function getFirstProblemCode(page: Page): Promise<string> {
  await page.goto("/practice");
  await expect(page.getByRole("heading", { name: "Practice Problems" })).toBeVisible({
    timeout: 10_000,
  });
  // Wait for spinner to disappear
  await expect(page.getByRole("progressbar").first()).not.toBeVisible({ timeout: 15_000 });

  const firstCard = page.locator('a[href^="/practice/"]').first();
  await expect(firstCard).toBeVisible({ timeout: 10_000 });
  const href = await firstCard.getAttribute("href");
  const code = href?.replace("/practice/", "");
  expect(code, "Could not read problem code from list").toBeTruthy();
  return code!;
}

test.setTimeout(JUDGING_TIMEOUT + 30_000);

test("AI judging full flow: login -> submit -> SSE -> verdict persisted", async ({ page }) => {
  // ── 1. Dev login ─────────────────────────────────────────────────────────────
  await devLoginAsStudent(page);
  console.log("[verify] dev login OK");

  // ── 2. Pick first practice problem ───────────────────────────────────────────
  const problemCode = await getFirstProblemCode(page);
  console.log(`[verify] first problem code: ${problemCode}`);

  // ── 3. Open problem page ─────────────────────────────────────────────────────
  await page.goto(`/practice/${problemCode}`);
  await expect(page.locator(".monaco-editor")).toBeVisible({ timeout: 15_000 });
  console.log("[verify] problem page loaded, Monaco visible");

  // ── 4. Capture POST /api/practice/submissions ─────────────────────────────────
  const submitResponsePromise = page.waitForResponse(
    (r: Response) =>
      r.url().includes("/api/practice/submissions") &&
      !r.url().includes("/stream") &&
      r.request().method() === "POST",
    { timeout: 15_000 },
  );

  // ── 5. Capture SSE stream request ────────────────────────────────────────────
  const streamRequestPromise = page.waitForRequest(
    (r) =>
      r.url().includes("/api/practice/submissions/") &&
      r.url().includes("/stream") &&
      r.method() === "GET",
    { timeout: 15_000 },
  );

  // ── 6. Type code into Monaco and submit ──────────────────────────────────────
  await page.locator(".monaco-editor .view-lines").first().click();
  await page.keyboard.type("\n// AI judging verification test");

  const submitBtn = page.getByRole("button", { name: /^submit$/i });
  await expect(submitBtn).toBeEnabled({ timeout: 10_000 });
  await submitBtn.click();
  console.log("[verify] Submit clicked");

  // ── 7. Verify POST payload ────────────────────────────────────────────────────
  const submitResponse = await submitResponsePromise;
  expect(submitResponse.status(), "POST /api/practice/submissions must return 200").toBe(200);
  const submitBody = await submitResponse.json() as { submissionId?: string; status?: string };
  expect(submitBody.submissionId, "response must include submissionId").toBeTruthy();
  expect(submitBody.status).toBe("queued");
  const submissionId = submitBody.submissionId!;
  console.log(`[verify] submission created: ${submissionId} status=${submitBody.status}`);

  // ── 8. Verify SSE stream opened ───────────────────────────────────────────────
  const streamReq = await streamRequestPromise;
  expect(streamReq.url()).toContain(submissionId);
  console.log(`[verify] SSE stream opened: ${streamReq.url()}`);

  // ── 9. UI shows queued/running state ─────────────────────────────────────────
  await expect(page.getByText("Output", { exact: true })).toBeVisible({ timeout: 5_000 });
  await expect(
    page.getByText(/queued for gemini judging|judging your code/i),
  ).toBeVisible({ timeout: 5_000 });
  console.log("[verify] UI shows judging state");

  // ── 10. Wait for terminal state ───────────────────────────────────────────────
  // The submit button re-enables only when status reaches done or failed.
  await expect(submitBtn).toBeEnabled({ timeout: JUDGING_TIMEOUT });
  console.log("[verify] submit button re-enabled — judging complete");

  // Spinner must be gone
  await expect(
    page.getByText(/queued for gemini judging|judging your code/i),
  ).not.toBeVisible({ timeout: 5_000 });

  // Output block must show final content (feedback or verdict label)
  const outputBlock = page.locator("[class*='outputBlock']").first();
  const outputText = await outputBlock.textContent();
  console.log(`[verify] output block text: "${outputText?.slice(0, 200)}"`);

  // (submit button already asserted re-enabled above)

  // ── 11. Verify backend persistence via GET /api/practice/submissions/:id ──────
  const persistedResponse = await page.request.get(
    `/api/practice/submissions/${submissionId}`,
  );
  expect(persistedResponse.status(), "GET submission must return 200").toBe(200);
  const persisted = await persistedResponse.json() as {
    submissionId: string;
    status: string;
    verdict: string | null;
    judgedBy: string | null;
    score: number | null;
    feedback: string | null;
  };

  console.log("[verify] persisted record:", JSON.stringify({
    submissionId: persisted.submissionId,
    status: persisted.status,
    verdict: persisted.verdict,
    judgedBy: persisted.judgedBy,
    score: persisted.score,
    feedbackLength: persisted.feedback?.length ?? 0,
  }));

  expect(persisted.submissionId).toBe(submissionId);
  expect(["done", "failed"]).toContain(persisted.status);
  expect(persisted.judgedBy).toBe("gemini");
  expect(persisted.verdict).not.toBeNull();

  // ── 12. Reload the problem page and verify saved result rehydrates in the UI ──
  await page.reload();
  await expect(page.locator(".monaco-editor")).toBeVisible({ timeout: 15_000 });
  await expect(page.getByText("Output", { exact: true })).toBeVisible({ timeout: 5_000 });

  const reloadedOutputBlock = page.locator("[class*='outputBlock']").first();
  await expect(
    page.getByText(/queued for gemini judging|judging your code/i),
  ).not.toBeVisible({ timeout: 120_000 });

  if (persisted.feedback) {
    await expect(reloadedOutputBlock).toContainText(persisted.feedback.slice(0, 20), {
      timeout: 10_000,
    });
  } else if (persisted.verdict) {
    await expect(reloadedOutputBlock).toContainText(formatVerdictLabel(persisted.verdict) ?? "", {
      timeout: 10_000,
    });
  }

  console.log("[verify] ALL CHECKS PASSED");
});
