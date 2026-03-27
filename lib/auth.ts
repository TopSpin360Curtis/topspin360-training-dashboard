export const AUTH_COOKIE_NAME = "topspin360-auth";

function normalizePassword(value: string) {
  return value.trim();
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
