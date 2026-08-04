import { expect, test } from "@playwright/test";

test("protected routes redirect unauthenticated users and preserve the destination", async ({ page }) => {
  await page.goto("/contests?tab=upcoming");

  await expect(page).toHaveURL(/\/login\?next=%2Fcontests%3Ftab%3Dupcoming$/);
});

test("dev login rejects identities outside the configured demo users", async ({ request }) => {
  const response = await request.post("/api/auth/dev-login", {
    data: { email: "unknown@sfu.ca", role: "STUDENT" },
  });

  expect(response.status()).toBe(401);
});

test("dev quick login returns to the original protected page", async ({ page }) => {
  await page.goto("/login?next=%2Fcontests");
  await page.getByRole("button", { name: "Demo Student" }).click();

  await expect(page).toHaveURL(/\/contests$/);
});

test("logout clears the local session", async ({ page }) => {
  const loginResponse = await page.request.post("/api/auth/dev-login", {
    data: { email: "dylan.04@sfu.ca", role: "STUDENT" },
  });
  expect(loginResponse.status()).toBe(200);

  const logoutResponse = await page.request.post("/api/auth/logout");
  expect(logoutResponse.status()).toBe(200);

  await page.goto("/dashboard");
  await expect(page).toHaveURL(/\/login\?next=%2Fdashboard$/);
});

test("admin can create a guest account and the guest can sign in", async ({ page }) => {
  const username = `guest-${Date.now()}`;
  const password = "GuestPass123!";
  const adminLogin = await page.request.post("/api/auth/dev-login", {
    data: { email: "admin@sfu.ca", role: "ADMIN" },
  });
  expect(adminLogin.status()).toBe(200);

  const createGuest = await page.request.post("/api/admin/guest-users", {
    data: { username, password, firstName: "Test", lastName: "Guest", expiresAt: null },
  });
  expect(createGuest.status()).toBe(201);
  await page.request.post("/api/auth/logout");

  await page.goto("/guest-login");
  await page.getByLabel("Username").fill(username);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: "Sign in as Guest" }).click();
  await expect(page).toHaveURL(/\/dashboard$/);
});

test("guest login does not reveal whether a username exists", async ({ request }) => {
  const response = await request.post("/api/auth/guest-login", {
    data: { username: `missing-${Date.now()}`, password: "WrongPassword123!" },
  });
  expect(response.status()).toBe(401);
  await expect(response.json()).resolves.toEqual({ message: "Invalid username or password." });
});
