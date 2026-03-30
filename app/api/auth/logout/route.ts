import { NextResponse } from "next/server";
import { AUTH_COOKIE_NAME, AUTH_MODE_COOKIE_NAME } from "@/lib/auth";

export async function POST() {
  const response = NextResponse.json({ success: true });
  [AUTH_COOKIE_NAME, AUTH_MODE_COOKIE_NAME].forEach((name) => {
    response.cookies.set({
      name,
      value: "",
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 0
    });
  });

  return response;
}
