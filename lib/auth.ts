import type { DashboardProfile, DashboardRole, DashboardTenant } from "@/lib/types";

export const AUTH_COOKIE_NAME = "topspin360-auth";
export const AUTH_MODE_COOKIE_NAME = "topspin360-mode";
export const AUTH_TENANT_COOKIE_NAME = "topspin360-tenant";
export const DEFAULT_AUTH_MODE: DashboardProfile = "team";
export const DASHBOARD_MODES: DashboardProfile[] = ["team", "test"];

type DashboardTenantConfig = DashboardTenant & {
  password: string;
  sheetId?: string;
  range?: string;
  publicSheetId?: string;
  apiKey?: string;
};

type RawDashboardTenantConfig = {
  id?: unknown;
  label?: unknown;
  username?: unknown;
  password?: unknown;
  profile?: unknown;
  sheetId?: unknown;
  range?: unknown;
  publicSheetId?: unknown;
  apiKey?: unknown;
  role?: unknown;
  canExport?: unknown;
};

function normalizeText(value: string) {
  return value.trim();
}

function normalizeTenantId(value: string) {
  return normalizeText(value).toLowerCase().replace(/[^a-z0-9-]/g, "-");
}

function normalizeUsername(value: string) {
  return normalizeText(value).toLowerCase();
}

function coerceOptionalString(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function isValidProfile(value: unknown): value is DashboardProfile {
  return value === "team" || value === "test";
}

function isValidRole(value: unknown): value is DashboardRole {
  return value === "admin" || value === "member";
}

function parseTenantConfig(value: RawDashboardTenantConfig): DashboardTenantConfig | null {
  if (
    typeof value.id !== "string" ||
    typeof value.label !== "string" ||
    typeof value.username !== "string" ||
    typeof value.password !== "string" ||
    !isValidProfile(value.profile)
  ) {
    return null;
  }

  const id = normalizeTenantId(value.id);
  const label = normalizeText(value.label);
  const username = normalizeUsername(value.username);
  const password = normalizeText(value.password);
  const role = isValidRole(value.role) ? value.role : "member";
  const canExport = typeof value.canExport === "boolean" ? value.canExport : true;

  if (!id || !label || !username || !password) {
    return null;
  }

  return {
    id,
    label,
    username,
    password,
    profile: value.profile,
    role,
    canExport,
    sheetId: coerceOptionalString(value.sheetId),
    range: coerceOptionalString(value.range),
    publicSheetId: coerceOptionalString(value.publicSheetId),
    apiKey: coerceOptionalString(value.apiKey)
  };
}

function getFallbackTenantConfigs(): DashboardTenantConfig[] {
  const sharedPassword = process.env.DASHBOARD_ACCESS_PASSWORD?.trim();

  if (!sharedPassword) {
    return [];
  }

  return [
    {
      id: "team",
      label: "Team Data",
      username: "team",
      password: sharedPassword,
      profile: "team",
      role: "member",
      canExport: true,
      sheetId: process.env.GOOGLE_SHEET_ID?.trim(),
      range: process.env.GOOGLE_SHEET_RANGE?.trim(),
      publicSheetId: process.env.NEXT_PUBLIC_SHEET_ID?.trim(),
      apiKey: process.env.GOOGLE_API_KEY?.trim()
    },
    {
      id: "test",
      label: "Test Data",
      username: "test",
      password: sharedPassword,
      profile: "test",
      role: "member",
      canExport: true,
      sheetId: process.env.TEST_GOOGLE_SHEET_ID?.trim(),
      range: process.env.TEST_GOOGLE_SHEET_RANGE?.trim(),
      publicSheetId: process.env.NEXT_PUBLIC_TEST_SHEET_ID?.trim(),
      apiKey: process.env.TEST_GOOGLE_API_KEY?.trim() || process.env.GOOGLE_API_KEY?.trim()
    }
  ];
}

function getTenantConfigsFromEnv(): DashboardTenantConfig[] {
  const raw = process.env.DASHBOARD_TENANTS_JSON?.trim();

  if (!raw) {
    return getFallbackTenantConfigs();
  }

  try {
    const parsed = JSON.parse(raw) as unknown;

    if (!Array.isArray(parsed)) {
      return getFallbackTenantConfigs();
    }

    const tenants = parsed
      .map((entry) => parseTenantConfig(entry as RawDashboardTenantConfig))
      .filter((entry): entry is DashboardTenantConfig => Boolean(entry));

    return tenants.length ? tenants : getFallbackTenantConfigs();
  } catch {
    return getFallbackTenantConfigs();
  }
}

export function isDashboardMode(value: string | null | undefined): value is DashboardProfile {
  return value === "team" || value === "test";
}

export function getLoginPathForMode(mode: DashboardProfile) {
  return `/login/${mode}`;
}

export function getLoginPathForTenant(tenantId: string) {
  return `/login/${normalizeTenantId(tenantId)}`;
}

export function getDefaultTenantForMode(mode: DashboardProfile) {
  const tenant = getTenantConfigsFromEnv().find((entry) => entry.profile === mode);

  if (!tenant) {
    return null;
  }

  const { password: _password, ...safeTenant } = tenant;
  return safeTenant;
}

export function getDefaultLoginPathForMode(mode: DashboardProfile) {
  const tenant = getDefaultTenantForMode(mode);
  return tenant ? getLoginPathForTenant(tenant.id) : getLoginPathForMode(mode);
}

export function getDashboardModeFromCookieValue(value: string | null | undefined) {
  return isDashboardMode(value) ? value : null;
}

export function getConfiguredTenants(): DashboardTenant[] {
  return getTenantConfigsFromEnv().map(({ password: _password, ...tenant }) => tenant);
}

export function getTenantById(id: string | null | undefined): DashboardTenant | null {
  if (!id) {
    return null;
  }

  const normalizedId = normalizeTenantId(id);
  const tenant = getTenantConfigsFromEnv().find((entry) => entry.id === normalizedId);

  if (!tenant) {
    return null;
  }

  const { password: _password, ...safeTenant } = tenant;
  return safeTenant;
}

export function getTenantConfigById(id: string | null | undefined): DashboardTenantConfig | null {
  if (!id) {
    return null;
  }

  return getTenantConfigsFromEnv().find((entry) => entry.id === normalizeTenantId(id)) ?? null;
}

function isSameTenantScope(left: DashboardTenantConfig, right: DashboardTenantConfig) {
  return (
    left.profile === right.profile &&
    (left.sheetId ?? "") === (right.sheetId ?? "") &&
    (left.range ?? "") === (right.range ?? "") &&
    (left.publicSheetId ?? "") === (right.publicSheetId ?? "")
  );
}

export function getTenantsForScope(id: string | null | undefined): DashboardTenant[] {
  const current = getTenantConfigById(id);

  if (!current) {
    return [];
  }

  return getTenantConfigsFromEnv()
    .filter((entry) => isSameTenantScope(entry, current))
    .map(({ password: _password, ...tenant }) => tenant);
}

export function isAuthenticationEnabled() {
  return getTenantConfigsFromEnv().length > 0;
}

export async function hashPassword(value: string) {
  const digest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(normalizeText(value))
  );

  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

async function buildTenantAuthToken(tenant: DashboardTenantConfig) {
  return hashPassword(`${tenant.id}:${tenant.password}`);
}

export async function authenticateTenantLogin({
  username,
  password,
  mode
}: {
  username: string;
  password: string;
  mode?: DashboardProfile | null;
}) {
  const normalizedUsername = normalizeUsername(username);
  const normalizedPassword = normalizeText(password);

  if (!normalizedUsername || !normalizedPassword) {
    return null;
  }

  const tenant = getTenantConfigsFromEnv().find(
    (entry) =>
      entry.username === normalizedUsername &&
      entry.password === normalizedPassword &&
      (!mode || entry.profile === mode)
  );

  if (!tenant) {
    return null;
  }

  return {
    tenant: getTenantById(tenant.id)!,
    authToken: await buildTenantAuthToken(tenant)
  };
}

export async function validateAuthCookies({
  tenantId,
  authToken,
  mode
}: {
  tenantId: string | null | undefined;
  authToken: string | null | undefined;
  mode: string | null | undefined;
}) {
  const tenant = getTenantConfigById(tenantId);

  if (!tenant || !authToken || mode !== tenant.profile) {
    return null;
  }

  const expectedToken = await buildTenantAuthToken(tenant);

  if (authToken !== expectedToken) {
    return null;
  }

  const { password: _password, ...safeTenant } = tenant;
  return safeTenant;
}
