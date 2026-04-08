import { NextRequest, NextResponse } from "next/server";
import {
  AUTH_COOKIE_NAME,
  AUTH_MODE_COOKIE_NAME,
  AUTH_TENANT_COOKIE_NAME,
  getTenantsForScope,
  validateAuthCookies
} from "@/lib/auth";
import { getLoginAuditEvents, isLoginAuditConfigured } from "@/lib/loginAudit";

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
  const loginEvents = (await getLoginAuditEvents()).filter((event) =>
    tenantIds.has(event.tenantId)
  );

  return NextResponse.json({
    accounts,
    loginEvents,
    auditConfigured: isLoginAuditConfigured()
  });
}
