import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { AUTH_COOKIE_NAME, getExpectedPasswordHash } from "@/lib/auth";

const PUBLIC_PATH_PREFIXES = ["/_next", "/login"];
const PUBLIC_EXACT_PATHS = ["/favicon.ico", "/api/auth/login", "/api/auth/logout"];

export async function middleware(request: NextRequest) {
  const expectedHash = await getExpectedPasswordHash();

  if (!expectedHash) {
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

  if (authCookie === expectedHash) {
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
  loginUrl.pathname = "/login";
  loginUrl.searchParams.set("next", `${pathname}${search}`);

  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image).*)"]
};
