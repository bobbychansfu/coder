import { expect, test, type Page } from "@playwright/test";

async function loginAsStudent(page: Page) {
  const response = await page.request.post("/api/auth/dev-login", {
    data: { email: "dylan.04@sfu.ca", role: "student" },
  });
  expect(response.status()).toBe(200);
}

interface ContestInfoPayload {
  contests: Array<{ id: string; participants: number }>;
  contestsOpen: Array<{ id: string; participants: number }>;
}

test.describe("Contest auto-registration", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsStudent(page);
  });

  test("opening an open contest auto-registers the student", async ({ page }) => {
    const initialResponse = await page.request.get("/api/s/info");
    expect(initialResponse.status()).toBe(200);

    const initialPayload = (await initialResponse.json()) as ContestInfoPayload;
    const openContest = initialPayload.contestsOpen[0];

    if (!openContest) {
      test.skip();
    }

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
