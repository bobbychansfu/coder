import { NextRequest, NextResponse } from "next/server";

const AUTH_BACKEND_BASE_URL = process.env.AUTH_BACKEND_BASE_URL;
const AUTH_BACKEND_CAS_PATH = process.env.AUTH_BACKEND_CAS_PATH || "/";
const CAS_LOGIN_BASE_URL = process.env.CAS_LOGIN_BASE_URL;
const DEFAULT_POST_LOGIN_PATH = "/dashboard";

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

function getCasConfig(): CasConfig | null {
  if (!AUTH_BACKEND_BASE_URL || !CAS_LOGIN_BASE_URL) {
    return null;
  }

  try {
    return {
      authBackendBaseUrl: AUTH_BACKEND_BASE_URL,
      authBackendCasPath: AUTH_BACKEND_CAS_PATH,
      casLoginBaseUrl: CAS_LOGIN_BASE_URL,
      casLoginOrigin: new URL(CAS_LOGIN_BASE_URL).origin,
    };
  } catch {
    return null;
  }
}

function buildCasLoginRedirectUrl(request: NextRequest, nextPath: string, casLoginBaseUrl: string): string {
  const serviceUrl = new URL("/api/auth/cas/callback", request.nextUrl.origin);
  serviceUrl.searchParams.set("next", nextPath);

  const casLoginUrl = new URL(casLoginBaseUrl);
  casLoginUrl.searchParams.set("service", serviceUrl.toString());

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

function buildBackendCasValidationUrl(ticket: string, authBackendCasPath: string, authBackendBaseUrl: string): string {
  const backendUrl = new URL(authBackendCasPath, authBackendBaseUrl);
  backendUrl.searchParams.set("ticket", ticket);
  return backendUrl.toString();
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
  const redirectUrl = buildCasLoginRedirectUrl(request, nextPath, casConfig.casLoginBaseUrl);

  if (responseMode === "redirect") {
    return NextResponse.redirect(redirectUrl);
  }

  return NextResponse.json({ redirectUrl }, { status: 200 });
}

export async function handleCasCallback(request: NextRequest): Promise<NextResponse> {
  const casConfig = getCasConfig();
  const ticket = request.nextUrl.searchParams.get("ticket");
  const nextPath = normalizeNextPath(request.nextUrl.searchParams.get("next"));

  if (!casConfig) {
    return NextResponse.redirect(
      getLoginErrorRedirectUrl(request, nextPath, "cas_config_missing"),
    );
  }

  if (!ticket) {
    return NextResponse.redirect(getLoginErrorRedirectUrl(request, nextPath, "missing_ticket"));
  }

  const backendEndpoint = buildBackendCasValidationUrl(
    ticket,
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
    const failedStatus =
      backendResponse.status === 401 ||
      backendResponse.status === 403 ||
      backendResponse.status >= 500;

    if (failedStatus || redirectedToCas) {
      return NextResponse.redirect(getLoginErrorRedirectUrl(request, nextPath, "cas_denied"));
    }

    const appRedirectUrl = new URL(nextPath, request.nextUrl.origin);
    const response = NextResponse.redirect(appRedirectUrl);
    const setCookie = backendResponse.headers.get("set-cookie");

    if (setCookie) {
      response.headers.set("set-cookie", setCookie);
    }

    return response;
  } catch {
    return NextResponse.redirect(
      getLoginErrorRedirectUrl(request, nextPath, "cas_backend_unreachable"),
    );
  }
}
