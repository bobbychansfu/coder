import { expect, test, type Page } from "@playwright/test";

async function loginAsStudent(page: Page) {
  const response = await page.request.post("/api/auth/dev-login", {
    data: { email: "dylan.04@sfu.ca", role: "student" },
  });
  expect(response.status()).toBe(200);
}

interface ContestInfoPayload {
  contests: Array<{ id: string; name: string; participants: number }>;
  contestsOpen: Array<{ id: string; name: string; participants: number }>;
}

test.describe("Contest registration", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsStudent(page);
  });

  test("student can manually register from Available Contests and then view the contest", async ({
    page,
  }) => {
    const initialResponse = await page.request.get("/api/s/info");
    expect(initialResponse.status()).toBe(200);

    const initialPayload = (await initialResponse.json()) as ContestInfoPayload;
    const openContest = initialPayload.contestsOpen[0];

    if (!openContest) {
      test.skip();
    }

    const directAccessResponse = await page.goto(`/contests/${openContest.id}`);
    expect(directAccessResponse?.status()).toBe(404);

    await page.goto("/contests");
    await page.getByRole("tab", { name: "Available Contests" }).click();
    await expect(page.getByRole("heading", { name: "Available Contests" })).toBeVisible();
    await page.getByRole("button", { name: `Register ${openContest.name}` }).click();

    await expect(page.getByRole("dialog")).toContainText("Confirm registration");
    await expect(page.getByRole("dialog")).toContainText(openContest.name);
    await page.getByRole("button", { name: "Confirm" }).click();

    await expect(page.getByRole("dialog")).not.toBeVisible({ timeout: 10000 });
    await page.getByRole("tab", { name: "My Contests" }).click();
    await expect(page.getByText(openContest.name)).toBeVisible({ timeout: 10000 });

    await page.goto(`/contests/${openContest.id}`);
    await expect(page.getByText("Participants")).toBeVisible({ timeout: 10000 });
    await expect(page.getByText(`${openContest.participants + 1} registered`)).toBeVisible({
      timeout: 10000,
    });

    const updatedResponse = await page.request.get("/api/s/info");
    expect(updatedResponse.status()).toBe(200);

    const updatedPayload = (await updatedResponse.json()) as ContestInfoPayload;
    const registeredContest = updatedPayload.contests.find((contest) => contest.id === openContest.id);

    expect(registeredContest).toBeTruthy();
    expect(updatedPayload.contestsOpen.some((contest) => contest.id === openContest.id)).toBe(false);
    expect(registeredContest?.participants).toBe(openContest.participants + 1);
  });
});
