import type { NextFetchEvent, NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { clerkMiddleware } from "@clerk/nextjs/server";
import {
  AUTH_COOKIE_NAME,
  AUTH_MODE_COOKIE_NAME,
  AUTH_TENANT_COOKIE_NAME,
  DEFAULT_AUTH_MODE,
  getTenantById,
  getDefaultLoginPathForMode,
  isAuthenticationEnabled,
  validateAuthCookies
} from "@/lib/auth";

const PUBLIC_PATH_PREFIXES = ["/_next", "/login", "/auth-v2"];
const PUBLIC_EXACT_PATHS = ["/", "/favicon.ico", "/api/auth/login", "/api/auth/logout", "/api/sheets"];

function isClerkEnabled() {
  return Boolean(
    process.env.AUTH_V2_ENABLED?.trim().toLowerCase() === "true" &&
      process.env.CLERK_SECRET_KEY?.trim() &&
      process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY?.trim()
  );
}

function shouldRunClerkMiddleware(pathname: string) {
  return pathname.startsWith("/auth-v2") || pathname === "/api/sheets";
}

async function legacyMiddleware(request: NextRequest) {
  if (!isAuthenticationEnabled()) {
    return NextResponse.next();
  }

  const { pathname, search } = request.nextUrl;

  if (
    PUBLIC_EXACT_PATHS.includes(pathname) ||
    PUBLIC_PATH_PREFIXES.some((prefix) => pathname.startsWith(prefix))
  ) {
    return NextResponse.next();
  }

  const authCookie = request.cookies.get(AUTH_COOKIE_NAME)?.value;
  const tenantCookie = request.cookies.get(AUTH_TENANT_COOKIE_NAME)?.value;
  const modeCookie = request.cookies.get(AUTH_MODE_COOKIE_NAME)?.value;
  const authenticatedTenant = await validateAuthCookies({
    tenantId: tenantCookie,
    authToken: authCookie,
    mode: modeCookie
  });

  if (authenticatedTenant) {
    return NextResponse.next();
  }

  if (pathname.startsWith("/api/")) {
    return NextResponse.json(
      {
        error: "Unauthorized. Sign in again to access protected dashboard data."
      },
      { status: 401 }
    );
  }

  const loginUrl = request.nextUrl.clone();
  loginUrl.pathname = getDefaultLoginPathForMode(
    getTenantById(tenantCookie)?.profile ?? DEFAULT_AUTH_MODE
  );
  loginUrl.searchParams.set("next", `${pathname}${search}`);

  return NextResponse.redirect(loginUrl);
}

const authV2Middleware = clerkMiddleware(async (_auth, request: NextRequest) => {
  return legacyMiddleware(request);
});

export default function middleware(request: NextRequest, event: NextFetchEvent) {
  if (isClerkEnabled() && shouldRunClerkMiddleware(request.nextUrl.pathname)) {
    return authV2Middleware(request, event);
  }

  return legacyMiddleware(request);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image).*)"]
};
