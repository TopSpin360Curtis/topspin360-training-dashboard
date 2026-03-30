import type { DashboardProfile } from "@/lib/types";

export const AUTH_COOKIE_NAME = "topspin360-auth";
export const AUTH_MODE_COOKIE_NAME = "topspin360-mode";
export const DEFAULT_AUTH_MODE: DashboardProfile = "team";
export const DASHBOARD_MODES: DashboardProfile[] = ["team", "test"];

function normalizePassword(value: string) {
  return value.trim();
}

export function isDashboardMode(value: string | null | undefined): value is DashboardProfile {
  return value === "team" || value === "test";
}

export function getLoginPathForMode(mode: DashboardProfile) {
  return `/login/${mode}`;
}

export function getDashboardModeFromCookieValue(value: string | null | undefined) {
  return isDashboardMode(value) ? value : null;
}

export async function hashPassword(value: string) {
  const normalized = normalizePassword(value);
  const digest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(normalized)
  );

  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

export async function getExpectedPasswordHash() {
  const password = process.env.DASHBOARD_ACCESS_PASSWORD;

  if (!password) {
    return null;
  }

  return hashPassword(password);
}

export function isPasswordProtectionEnabled() {
  return Boolean(process.env.DASHBOARD_ACCESS_PASSWORD?.trim());
}
