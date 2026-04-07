import { NextResponse } from "next/server";
import type { DashboardProfile } from "@/lib/types";
import {
  AUTH_COOKIE_NAME,
  AUTH_MODE_COOKIE_NAME,
  AUTH_TENANT_COOKIE_NAME,
  authenticateTenantLogin,
  isAuthenticationEnabled,
  isDashboardMode
} from "@/lib/auth";

export async function POST(request: Request) {
  if (!isAuthenticationEnabled()) {
    return NextResponse.json(
      { error: "Dashboard authentication is not configured." },
      { status: 400 }
    );
  }

  const payload = (await request.json().catch(() => null)) as
    | { username?: string; password?: string; mode?: DashboardProfile }
    | null;
  const submittedUsername = payload?.username?.trim() ?? "";
  const submittedPassword = payload?.password?.trim() ?? "";
  const submittedMode = payload?.mode;

  if (!submittedUsername) {
    return NextResponse.json({ error: "Enter your username." }, { status: 400 });
  }

  if (!submittedPassword) {
    return NextResponse.json({ error: "Enter your password." }, { status: 400 });
  }

  if (!isDashboardMode(submittedMode)) {
    return NextResponse.json(
      { error: "Choose either the Team or Test login route." },
      { status: 400 }
    );
  }

  const authenticated = await authenticateTenantLogin({
    username: submittedUsername,
    password: submittedPassword,
    mode: submittedMode
  });

  if (!authenticated) {
    return NextResponse.json(
      { error: "Those login details do not match this dashboard route." },
      { status: 401 }
    );
  }

  const response = NextResponse.json({ success: true });
  response.cookies.set({
    name: AUTH_COOKIE_NAME,
    value: authenticated.authToken,
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 12
  });
  response.cookies.set({
    name: AUTH_MODE_COOKIE_NAME,
    value: authenticated.tenant.profile,
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 12
  });
  response.cookies.set({
    name: AUTH_TENANT_COOKIE_NAME,
    value: authenticated.tenant.id,
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 12
  });

  return response;
}
