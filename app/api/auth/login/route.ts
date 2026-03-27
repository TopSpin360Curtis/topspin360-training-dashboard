import { NextResponse } from "next/server";
import { AUTH_COOKIE_NAME, getExpectedPasswordHash, hashPassword } from "@/lib/auth";

export async function POST(request: Request) {
  const expectedHash = await getExpectedPasswordHash();

  if (!expectedHash) {
    return NextResponse.json(
      { error: "Password protection is not configured." },
      { status: 400 }
    );
  }

  const payload = (await request.json().catch(() => null)) as { password?: string } | null;
  const submittedPassword = payload?.password?.trim() ?? "";

  if (!submittedPassword) {
    return NextResponse.json({ error: "Enter the dashboard password." }, { status: 400 });
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

  return response;
}
