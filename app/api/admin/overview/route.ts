import { NextRequest, NextResponse } from "next/server";
import {
  AUTH_COOKIE_NAME,
  AUTH_MODE_COOKIE_NAME,
  AUTH_TENANT_COOKIE_NAME,
  getTenantsForScope,
  validateAuthCookies
} from "@/lib/auth";
import { getLoginAuditEvents, isLoginAuditConfigured } from "@/lib/loginAudit";

function getAuditErrorMessage(error: unknown) {
  const message = error instanceof Error ? error.message : "Unknown error";

  if (/permission|forbidden|caller does not have permission/i.test(message)) {
    return "Login audit sheet permission denied. Share the Logins sheet with the dashboard service account as an Editor.";
  }

  if (/not found|requested entity was not found/i.test(message)) {
    return "Login audit sheet not found. Double-check LOGIN_AUDIT_SHEET_ID in Vercel.";
  }

  if (/unable to parse range|range/i.test(message)) {
    return "Login audit sheet range is invalid. Set LOGIN_AUDIT_SHEET_RANGE to Logins!A:H and confirm the tab is named Logins.";
  }

  if (/GOOGLE_SERVICE_ACCOUNT_JSON/i.test(message)) {
    return message;
  }

  return `Login audit sheet could not be read: ${message}`;
}

export async function GET(request: NextRequest) {
  const authenticatedTenant = await validateAuthCookies({
    tenantId: request.cookies.get(AUTH_TENANT_COOKIE_NAME)?.value,
    authToken: request.cookies.get(AUTH_COOKIE_NAME)?.value,
    mode: request.cookies.get(AUTH_MODE_COOKIE_NAME)?.value
  });

  if (!authenticatedTenant || authenticatedTenant.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const accounts = getTenantsForScope(authenticatedTenant.id);
  const tenantIds = new Set(accounts.map((account) => account.id));
  let loginEvents = [] as Awaited<ReturnType<typeof getLoginAuditEvents>>;
  let auditConfigured = false;
  let auditError = "";

  try {
    auditConfigured = isLoginAuditConfigured();
    if (auditConfigured) {
      loginEvents = (await getLoginAuditEvents()).filter((event) =>
        tenantIds.has(event.tenantId)
      );
    }
  } catch (error) {
    auditConfigured = false;
    auditError = getAuditErrorMessage(error);
  }

  return NextResponse.json({
    accounts,
    loginEvents,
    auditConfigured,
    auditError
  });
}
