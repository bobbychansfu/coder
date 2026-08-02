import { NextRequest, NextResponse } from "next/server";
import { normalizeRole } from "@/lib/authz";
import { createCasSessionToken } from "@/lib/casAuthSession";
import { prisma } from "@/lib/prisma";
import { recordDailyLogin, syncStudentGamification } from "@/server/gamification/persistence";

const AUTH_BACKEND_BASE_URL = process.env.AUTH_BACKEND_BASE_URL;
const AUTH_BACKEND_CAS_PATH = process.env.AUTH_BACKEND_CAS_PATH || "/";
const CAS_LOGIN_BASE_URL = process.env.CAS_LOGIN_BASE_URL;
const CAS_SERVICE_URL = process.env.CAS_SERVICE_URL;
const CAS_VALIDATE_URL = process.env.CAS_VALIDATE_URL;
const CAS_AUTH_COOKIE_SECRET = process.env.CAS_AUTH_COOKIE_SECRET;
const SESSION_COOKIE_NAME = process.env.SESSION_COOKIE_NAME || "session";
const DEFAULT_POST_LOGIN_PATH = "/dashboard";
const CAS_NEXT_COOKIE_NAME = "cas_post_login_path";
const CAS_NEXT_COOKIE_TTL_SECONDS = 10 * 60;
const CAS_SESSION_TTL_SECONDS = 60 * 60 * 6;

interface CasLoginRequestBody {
  next?: unknown;
}

function normalizeNextPath(next: unknown): string {
  if (typeof next !== "string" || next.length === 0) {
    return DEFAULT_POST_LOGIN_PATH;
  }

  if (!next.startsWith("/") || next.startsWith("//")) {
    return DEFAULT_POST_LOGIN_PATH;
  }

  return next;
}

function getLoginErrorRedirectUrl(request: NextRequest, nextPath: string, error: string): URL {
  const loginUrl = new URL("/login", request.nextUrl.origin);
  loginUrl.searchParams.set("next", nextPath);
  loginUrl.searchParams.set("error", error);
  return loginUrl;
}

interface CasConfig {
  authBackendBaseUrl: string;
  authBackendCasPath: string;
  casLoginBaseUrl: string;
  casLoginOrigin: string;
}

function buildServiceUrl(request: NextRequest): string | null {
  try {
    const serviceUrl = CAS_SERVICE_URL
      ? new URL(CAS_SERVICE_URL)
      : new URL("/api/auth/cas/callback", request.nextUrl.origin);

    serviceUrl.search = "";
    serviceUrl.hash = "";
    return serviceUrl.toString();
  } catch {
    return null;
  }
}

function getCasConfig(): CasConfig | null {
  if (!CAS_LOGIN_BASE_URL) {
    return null;
  }

  try {
    return {
      authBackendBaseUrl: AUTH_BACKEND_BASE_URL ?? "",
      authBackendCasPath: AUTH_BACKEND_CAS_PATH,
      casLoginBaseUrl: CAS_LOGIN_BASE_URL,
      casLoginOrigin: new URL(CAS_LOGIN_BASE_URL).origin,
    };
  } catch {
    return null;
  }
}

function buildCasLoginRedirectUrl(serviceUrl: string, casLoginBaseUrl: string): string {
  const casLoginUrl = new URL(casLoginBaseUrl);
  casLoginUrl.searchParams.set("service", serviceUrl);

  return casLoginUrl.toString();
}

async function readNextPathFromBody(request: NextRequest): Promise<string | null> {
  try {
    const body = (await request.json()) as CasLoginRequestBody;
    return typeof body.next === "string" ? body.next : null;
  } catch {
    return null;
  }
}

function buildBackendCasValidationUrl(
  ticket: string,
  serviceUrl: string,
  authBackendCasPath: string,
  authBackendBaseUrl: string,
): string {
  const backendUrl = new URL(authBackendCasPath, authBackendBaseUrl);
  backendUrl.searchParams.set("ticket", ticket);
  backendUrl.searchParams.set("service", serviceUrl);
  return backendUrl.toString();
}

function buildSfuValidationUrl(ticket: string, serviceUrl: string): string | null {
  if (!CAS_VALIDATE_URL) return null;

  try {
    const validationUrl = new URL(CAS_VALIDATE_URL);
    validationUrl.searchParams.set("ticket", ticket);
    validationUrl.searchParams.set("service", serviceUrl);
    return validationUrl.toString();
  } catch {
    return null;
  }
}

function readCasUser(xml: string): string | null {
  if (!/<(?:[A-Za-z][\w.-]*:)?authenticationSuccess\b/.test(xml)) return null;

  const match = xml.match(
    /<(?:[A-Za-z][\w.-]*:)?user\b[^>]*>\s*([A-Za-z0-9._-]+)\s*<\/(?:[A-Za-z][\w.-]*:)?user>/,
  );
  return match?.[1] ?? null;
}

async function validateDirectlyWithSfu(ticket: string, serviceUrl: string): Promise<{
  computingId: string;
  role: "student" | "instructor" | "admin";
} | null> {
  const validationUrl = buildSfuValidationUrl(ticket, serviceUrl);
  if (!validationUrl || !CAS_AUTH_COOKIE_SECRET) return null;

  const casResponse = await fetch(validationUrl, {
    method: "GET",
    headers: { Accept: "application/xml, text/xml" },
    cache: "no-store",
  });
  if (!casResponse.ok) return null;

  const computingId = readCasUser(await casResponse.text())?.toLowerCase();
  if (!computingId) return null;

  const email = `${computingId}@sfu.ca`;
  const existingUser = await prisma.user.findFirst({
    where: { OR: [{ computingId }, { email }] },
    select: { id: true, computingId: true, role: true },
  });

  // CAS has already proved ownership of this SFU computing ID. Provision new
  // users as students, while preserving the role of any existing account.
  const user =
    existingUser?.computingId === computingId
      ? existingUser
      : existingUser
        ? await prisma.user.update({
            where: { id: existingUser.id },
            data: { computingId },
            select: { id: true, computingId: true, role: true },
          })
        : await prisma.user.create({
            data: {
              computingId,
              email,
              firstName: computingId,
              lastName: "SFU User",
              role: "STUDENT",
            },
            select: { id: true, computingId: true, role: true },
          });

  const role = normalizeRole(user?.role);
  if (!role) return null;

  try {
    await recordDailyLogin(user.id);
    if (role === "student") await syncStudentGamification(computingId);
  } catch (error) {
    // Login should still succeed if optional activity/gamification tracking is unavailable.
    console.error("CAS post-login tracking failed", error);
  }

  return { computingId, role };
}

function setPostLoginCookie(response: NextResponse, nextPath: string): void {
  response.cookies.set({
    name: CAS_NEXT_COOKIE_NAME,
    value: nextPath,
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/api/auth/cas/callback",
    maxAge: CAS_NEXT_COOKIE_TTL_SECONDS,
  });
}

function clearPostLoginCookie(response: NextResponse): NextResponse {
  response.cookies.set({
    name: CAS_NEXT_COOKIE_NAME,
    value: "",
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/api/auth/cas/callback",
    maxAge: 0,
  });
  return response;
}

export async function handleCasLoginStart(
  request: NextRequest,
  responseMode: "json" | "redirect" = "json",
): Promise<NextResponse> {
  const casConfig = getCasConfig();
  if (!casConfig) {
    const nextPath = normalizeNextPath(request.nextUrl.searchParams.get("next"));
    if (responseMode === "redirect") {
      return NextResponse.redirect(getLoginErrorRedirectUrl(request, nextPath, "cas_config_missing"));
    }
    return NextResponse.json(
      {
        message:
          "CAS is not configured. Set AUTH_BACKEND_BASE_URL and CAS_LOGIN_BASE_URL in .env.",
      },
      { status: 500 },
    );
  }

  const bodyNextPath = responseMode === "json" ? await readNextPathFromBody(request) : null;
  const queryNextPath = request.nextUrl.searchParams.get("next");
  const nextPath = normalizeNextPath(bodyNextPath ?? queryNextPath);
  const serviceUrl = buildServiceUrl(request);
  if (!serviceUrl) {
    if (responseMode === "redirect") {
      return NextResponse.redirect(getLoginErrorRedirectUrl(request, nextPath, "cas_config_missing"));
    }
    return NextResponse.json({ message: "CAS_SERVICE_URL is invalid." }, { status: 500 });
  }
  const redirectUrl = buildCasLoginRedirectUrl(serviceUrl, casConfig.casLoginBaseUrl);

  if (responseMode === "redirect") {
    const response = NextResponse.redirect(redirectUrl);
    setPostLoginCookie(response, nextPath);
    return response;
  }

  const response = NextResponse.json({ redirectUrl }, { status: 200 });
  setPostLoginCookie(response, nextPath);
  return response;
}

export async function handleCasCallback(request: NextRequest): Promise<NextResponse> {
  const casConfig = getCasConfig();
  const ticket = request.nextUrl.searchParams.get("ticket");
  const nextPath = normalizeNextPath(
    request.cookies.get(CAS_NEXT_COOKIE_NAME)?.value ?? request.nextUrl.searchParams.get("next"),
  );
  const serviceUrl = buildServiceUrl(request);

  if (!casConfig || !serviceUrl) {
    return clearPostLoginCookie(
      NextResponse.redirect(getLoginErrorRedirectUrl(request, nextPath, "cas_config_missing")),
    );
  }

  if (!ticket) {
    return clearPostLoginCookie(
      NextResponse.redirect(getLoginErrorRedirectUrl(request, nextPath, "missing_ticket")),
    );
  }

  if (CAS_VALIDATE_URL) {
    try {
      const user = await validateDirectlyWithSfu(ticket, serviceUrl);
      if (!user || !CAS_AUTH_COOKIE_SECRET) {
        return clearPostLoginCookie(
          NextResponse.redirect(getLoginErrorRedirectUrl(request, nextPath, "cas_denied")),
        );
      }

      const token = createCasSessionToken(
        { ...user, ttlSeconds: CAS_SESSION_TTL_SECONDS },
        CAS_AUTH_COOKIE_SECRET,
      );
      const response = NextResponse.redirect(new URL(nextPath, request.nextUrl.origin));
      response.cookies.set({
        name: SESSION_COOKIE_NAME,
        value: token,
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        path: "/",
        maxAge: CAS_SESSION_TTL_SECONDS,
      });
      return clearPostLoginCookie(response);
    } catch (error) {
      console.error("Direct CAS callback failed", error);
      return clearPostLoginCookie(
        NextResponse.redirect(
          getLoginErrorRedirectUrl(request, nextPath, "cas_backend_unreachable"),
        ),
      );
    }
  }

  if (!casConfig.authBackendBaseUrl) {
    return clearPostLoginCookie(
      NextResponse.redirect(getLoginErrorRedirectUrl(request, nextPath, "cas_config_missing")),
    );
  }

  const backendEndpoint = buildBackendCasValidationUrl(
    ticket,
    serviceUrl,
    casConfig.authBackendCasPath,
    casConfig.authBackendBaseUrl,
  );

  try {
    const backendResponse = await fetch(backendEndpoint, {
      method: "GET",
      headers: {
        Cookie: request.headers.get("cookie") || "",
        Accept: "application/json",
      },
      cache: "no-store",
      redirect: "manual",
    });

    const redirectLocation = backendResponse.headers.get("location");
    const redirectedToCas = redirectLocation?.startsWith(casConfig.casLoginOrigin);
    const failedStatus = !backendResponse.ok;

    if (failedStatus || redirectedToCas) {
      return clearPostLoginCookie(
        NextResponse.redirect(getLoginErrorRedirectUrl(request, nextPath, "cas_denied")),
      );
    }

    const setCookie = backendResponse.headers.get("set-cookie");
    if (!setCookie) {
      return clearPostLoginCookie(
        NextResponse.redirect(getLoginErrorRedirectUrl(request, nextPath, "cas_denied")),
      );
    }

    const appRedirectUrl = new URL(nextPath, request.nextUrl.origin);
    const response = NextResponse.redirect(appRedirectUrl);
    response.headers.append("set-cookie", setCookie);
    return clearPostLoginCookie(response);
  } catch {
    return clearPostLoginCookie(
      NextResponse.redirect(
        getLoginErrorRedirectUrl(request, nextPath, "cas_backend_unreachable"),
      ),
    );
  }
}
