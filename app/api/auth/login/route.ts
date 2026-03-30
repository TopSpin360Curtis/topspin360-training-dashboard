import { NextResponse } from "next/server";
import type { DashboardProfile } from "@/lib/types";
import {
  AUTH_COOKIE_NAME,
  AUTH_MODE_COOKIE_NAME,
  getExpectedPasswordHash,
  hashPassword,
  isDashboardMode
} from "@/lib/auth";

export async function POST(request: Request) {
  const expectedHash = await getExpectedPasswordHash();

  if (!expectedHash) {
    return NextResponse.json(
      { error: "Password protection is not configured." },
      { status: 400 }
    );
  }

  const payload = (await request.json().catch(() => null)) as
    | { password?: string; mode?: DashboardProfile }
    | null;
  const submittedPassword = payload?.password?.trim() ?? "";
  const submittedMode = payload?.mode;

  if (!submittedPassword) {
    return NextResponse.json({ error: "Enter the dashboard password." }, { status: 400 });
  }

  if (!isDashboardMode(submittedMode)) {
    return NextResponse.json(
      { error: "Choose either the Team or Test login route." },
      { status: 400 }
    );
  }

  const submittedHash = await hashPassword(submittedPassword);

  if (submittedHash !== expectedHash) {
    return NextResponse.json({ error: "That password is not correct." }, { status: 401 });
  }

  const response = NextResponse.json({ success: true });
  response.cookies.set({
    name: AUTH_COOKIE_NAME,
    value: expectedHash,
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 12
  });
  response.cookies.set({
    name: AUTH_MODE_COOKIE_NAME,
    value: submittedMode,
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 12
  });

  return response;
}
