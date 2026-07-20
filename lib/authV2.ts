import { auth, currentUser } from "@clerk/nextjs/server";
import { getTenantById, getTenantByLoginRoute } from "@/lib/auth";
import type { DashboardRole, DashboardTenant } from "@/lib/types";

type ClerkDashboardAccess = {
  userId: string;
  email: string | null;
  tenantIds: string[];
  primaryTenantId: string | null;
  role?: DashboardRole;
  canExport?: boolean;
};

type AuthV2Invite = {
  email: string;
  tenantIds: string[];
  role?: DashboardRole;
  canExport?: boolean;
};

function normalizeBoolean(value: unknown) {
  if (typeof value === "boolean") {
    return value;
  }

  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();

    if (["true", "1", "yes", "y"].includes(normalized)) {
      return true;
    }

    if (["false", "0", "no", "n"].includes(normalized)) {
      return false;
    }
  }

  return undefined;
}

function normalizeRole(value: unknown): DashboardRole | undefined {
  return value === "admin" || value === "member" ? value : undefined;
}

function normalizeEmailAddress(value: string) {
  return value.trim().toLowerCase();
}

function normalizeTenantIdList(value: unknown) {
  if (typeof value === "string" && value.trim()) {
    return [value.trim().toLowerCase()];
  }

  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .filter((entry): entry is string => typeof entry === "string")
    .map((entry) => entry.trim().toLowerCase())
    .filter(Boolean);
}

function dedupeTenantIds(values: string[]) {
  return Array.from(new Set(values));
}

function parseInviteEntry(value: unknown): AuthV2Invite | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const raw = value as Record<string, unknown>;
  const email = typeof raw.email === "string" ? normalizeEmailAddress(raw.email) : "";
  const tenantIds = dedupeTenantIds([
    ...normalizeTenantIdList(raw.tenantId),
    ...normalizeTenantIdList(raw.tenantIds)
  ]);

  if (!email || !tenantIds.length) {
    return null;
  }

  return {
    email,
    tenantIds,
    role: normalizeRole(raw.role),
    canExport: normalizeBoolean(raw.canExport)
  };
}

function getAuthV2Invites(): AuthV2Invite[] {
  const raw = process.env.AUTH_V2_INVITES_JSON?.trim();

  if (!raw) {
    return [];
  }

  try {
    const parsed = JSON.parse(raw) as unknown;

    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed
      .map((entry) => parseInviteEntry(entry))
      .filter((entry): entry is AuthV2Invite => Boolean(entry));
  } catch {
    return [];
  }
}

function getInviteForEmail(email: string | null | undefined) {
  if (!email) {
    return null;
  }

  const normalizedEmail = normalizeEmailAddress(email);
  return getAuthV2Invites().find((entry) => entry.email === normalizedEmail) ?? null;
}

function applyMetadataOverrides(
  tenant: DashboardTenant,
  access: Pick<ClerkDashboardAccess, "role" | "canExport">
) {
  return {
    ...tenant,
    role: access.role ?? tenant.role,
    canExport: access.canExport ?? tenant.canExport
  };
}

export function isAuthV2Enabled() {
  return process.env.AUTH_V2_ENABLED?.trim().toLowerCase() === "true";
}

export function isClerkConfigured() {
  return Boolean(
    process.env.CLERK_SECRET_KEY?.trim() &&
      process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY?.trim()
  );
}

export function isAuthV2Available() {
  return isAuthV2Enabled() && isClerkConfigured();
}

export function isAuthV2InviteOnly() {
  const value = process.env.AUTH_V2_INVITE_ONLY?.trim().toLowerCase();

  if (!value) {
    return true;
  }

  return !["false", "0", "no", "n", "off"].includes(value);
}

export function getAuthV2SignInPath(tenantRoute?: string | null) {
  return tenantRoute ? `/auth-v2/sign-in?tenant=${tenantRoute}` : "/auth-v2/sign-in";
}

export function getAuthV2SignUpPath(tenantRoute?: string | null) {
  return tenantRoute ? `/auth-v2/sign-up?tenant=${tenantRoute}` : "/auth-v2/sign-up";
}

export function getAuthV2DashboardPath(tenantRoute: string) {
  return `/auth-v2/dashboard/${tenantRoute}`;
}

export function resolveTenantFromRoute(tenantRoute: string | null | undefined) {
  if (!tenantRoute) {
    return null;
  }

  return getTenantByLoginRoute(tenantRoute) ?? getTenantById(tenantRoute);
}

export function getAuthV2InviteForEmail(
  email: string | null | undefined,
  tenantRoute?: string | null
) {
  const invite = getInviteForEmail(email);

  if (!invite) {
    return null;
  }

  const resolvedTenant = resolveTenantFromRoute(tenantRoute);

  if (resolvedTenant && !invite.tenantIds.includes(resolvedTenant.id)) {
    return null;
  }

  return invite;
}

export async function getClerkDashboardAccess(): Promise<ClerkDashboardAccess | null> {
  if (!isAuthV2Available()) {
    return null;
  }

  const session = await auth();

  if (!session.userId) {
    return null;
  }

  const user = await currentUser();

  if (!user) {
    return null;
  }

  const metadata = (user.publicMetadata ?? {}) as Record<string, unknown>;
  const invite = getInviteForEmail(
    user.primaryEmailAddress?.emailAddress ?? user.emailAddresses[0]?.emailAddress ?? null
  );
  const tenantIds = dedupeTenantIds([
    ...(invite?.tenantIds ?? []),
    ...normalizeTenantIdList(metadata.dashboardTenantIds),
    ...normalizeTenantIdList(metadata.dashboardTenantId),
    ...normalizeTenantIdList(metadata.tenantIds),
    ...normalizeTenantIdList(metadata.tenantId)
  ]);

  return {
    userId: session.userId,
    email:
      user.primaryEmailAddress?.emailAddress ??
      user.emailAddresses[0]?.emailAddress ??
      null,
    tenantIds,
    primaryTenantId: tenantIds[0] ?? null,
    role: invite?.role ?? normalizeRole(metadata.dashboardRole) ?? normalizeRole(metadata.role),
    canExport:
      invite?.canExport ??
      normalizeBoolean(metadata.dashboardCanExport) ??
      normalizeBoolean(metadata.canExport)
  };
}

export async function getClerkAuthenticatedTenant(
  preferredTenantId?: string | null
): Promise<DashboardTenant | null> {
  const access = await getClerkDashboardAccess();

  if (!access) {
    return null;
  }

  if (preferredTenantId) {
    const preferredTenant = getTenantById(preferredTenantId);

    if (preferredTenant && access.tenantIds.includes(preferredTenant.id)) {
      return applyMetadataOverrides(preferredTenant, access);
    }
  }

  if (access.primaryTenantId) {
    const primaryTenant = getTenantById(access.primaryTenantId);

    if (primaryTenant) {
      return applyMetadataOverrides(primaryTenant, access);
    }
  }

  return null;
}

export async function getClerkAuthenticatedTenantForRoute(
  tenantRoute?: string | null
): Promise<DashboardTenant | null> {
  const resolvedTenant = resolveTenantFromRoute(tenantRoute);

  return getClerkAuthenticatedTenant(resolvedTenant?.id ?? null);
}
