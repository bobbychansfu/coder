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
  await page.getByLabel("Email or username").fill(username);
  // exact: the "Show password" toggle button is also labelled with "password".
  await page.getByLabel("Password", { exact: true }).fill(password);
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await expect(page).toHaveURL(/\/dashboard$/);
});

test("a student outside SFU can sign up, sign out, and sign back in with their email", async ({ page }) => {
  const email = `signup-${Date.now()}@example.com`;
  const password = "SignupPass123!";

  await page.goto("/login");
  await page.getByRole("link", { name: "Create an account" }).click();
  await expect(page).toHaveURL(/\/signup$/);

  const signupCard = page.locator("article").filter({ hasText: "Students outside SFU" });
  await signupCard.getByLabel("First name").fill("Ada");
  await signupCard.getByLabel("Last name (optional)").fill("Lovelace");
  await signupCard.getByLabel(/^Nickname/).fill(`ada${Date.now()}`);
  await signupCard.getByLabel("Email").fill(email);
  await signupCard.getByLabel(/^Password/).fill(password);
  await signupCard.getByRole("button", { name: "Create account" }).click();
  await expect(page).toHaveURL(/\/dashboard$/);

  await page.request.post("/api/auth/logout");
  await page.goto("/guest-login");
  await page.getByLabel("Email or username").fill(email.toUpperCase());
  await page.getByLabel("Password", { exact: true }).fill(password);
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await expect(page).toHaveURL(/\/dashboard$/);
});

test("sign-up refuses SFU emails, taken emails and nicknames, and short passwords", async ({ request }) => {
  const nickname = `sam${Date.now()}`;
  const sfu = await request.post("/api/auth/signup", {
    data: { firstName: "Sam", nickname, email: "sam@cs.sfu.ca", password: "LongEnough123!" },
  });
  expect(sfu.status()).toBe(400);
  await expect(sfu.json()).resolves.toEqual({ message: "SFU students sign in with their SFU account instead." });

  const shortPassword = await request.post("/api/auth/signup", {
    data: { firstName: "Sam", nickname, email: `short-${Date.now()}@example.com`, password: "short" },
  });
  expect(shortPassword.status()).toBe(400);

  const badNickname = await request.post("/api/auth/signup", {
    data: { firstName: "Sam", nickname: "sam smith", email: `bad-${Date.now()}@example.com`, password: "LongEnough123!" },
  });
  expect(badNickname.status()).toBe(400);

  const email = `taken-${Date.now()}@example.com`;
  const first = await request.post("/api/auth/signup", {
    data: { firstName: "Sam", nickname, email, password: "LongEnough123!" },
  });
  expect(first.status()).toBe(201);
  const second = await request.post("/api/auth/signup", {
    data: { firstName: "Sam", nickname: `${nickname}x`, email: email.toUpperCase(), password: "LongEnough123!" },
  });
  expect(second.status()).toBe(409);
  const sameNickname = await request.post("/api/auth/signup", {
    data: { firstName: "Sam", nickname: nickname.toUpperCase(), email: `other-${email}`, password: "LongEnough123!" },
  });
  expect(sameNickname.status()).toBe(409);
  await expect(sameNickname.json()).resolves.toEqual({ message: "That nickname is taken." });
});

test("guest login does not reveal whether a username exists", async ({ request }) => {
  const response = await request.post("/api/auth/guest-login", {
    data: { username: `missing-${Date.now()}`, password: "WrongPassword123!" },
  });
  expect(response.status()).toBe(401);
  await expect(response.json()).resolves.toEqual({ message: "Invalid username or password." });
});

test("guest usernames cannot contain @, so they never collide with self-registered emails", async ({ page }) => {
  const adminLogin = await page.request.post("/api/auth/dev-login", {
    data: { email: "admin@sfu.ca", role: "ADMIN" },
  });
  expect(adminLogin.status()).toBe(200);

  const response = await page.request.post("/api/admin/guest-users", {
    data: { username: `someone-${Date.now()}@example.com`, password: "GuestPass123!", expiresAt: null },
  });
  expect(response.status()).toBe(400);
  await expect(response.json()).resolves.toEqual({ message: "Guest usernames cannot contain @." });
});

test("CAS login keeps only same-site return paths", async ({ request }) => {
  for (const next of ["/\\evil.com", "//evil.com", "https://evil.com/", "/\t/evil.com"]) {
    // maxRedirects 0: inspect the hand-off without following it to SFU's CAS server.
    const response = await request.get(`/api/auth/cas/login?next=${encodeURIComponent(next)}`, {
      maxRedirects: 0,
    });
    const setCookie = response.headers()["set-cookie"] ?? "";
    expect(setCookie, `next=${JSON.stringify(next)}`).toContain("cas_post_login_path=%2Fdashboard");
  }

  const sameSite = await request.get(`/api/auth/cas/login?next=${encodeURIComponent("/contests?tab=upcoming")}`, {
    maxRedirects: 0,
  });
  expect(sameSite.headers()["set-cookie"] ?? "").toContain(
    `cas_post_login_path=${encodeURIComponent("/contests?tab=upcoming")}`,
  );
});

test("an expired guest username can be registered again without exposing old history", async ({ page }) => {
  const username = `expired-${Date.now()}`;
  const adminLogin = await page.request.post("/api/auth/dev-login", {
    data: { email: "admin@sfu.ca", role: "ADMIN" },
  });
  expect(adminLogin.status()).toBe(200);

  const expiredAccount = await page.request.post("/api/admin/guest-users", {
    data: {
      username,
      password: "OldPassword!",
      firstName: "Old",
      lastName: "Guest",
      expiresAt: new Date(Date.now() - 60_000).toISOString(),
    },
  });
  expect(expiredAccount.status()).toBe(201);

  const replacement = await page.request.post("/api/admin/guest-users", {
    data: {
      username,
      password: "NewPassword!",
      firstName: "New",
      lastName: "Guest",
      expiresAt: null,
    },
  });
  expect(replacement.status()).toBe(201);
  await expect(replacement.json()).resolves.toMatchObject({
    message: "Expired guest account deleted and replaced.",
    user: { firstName: "New", lastName: "Guest" },
  });
});
