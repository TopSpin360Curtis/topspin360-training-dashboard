import { cookies } from "next/headers";
import DashboardShell from "@/components/DashboardShell";
import {
  AUTH_COOKIE_NAME,
  AUTH_MODE_COOKIE_NAME,
  AUTH_TENANT_COOKIE_NAME,
  isAuthenticationEnabled,
  validateAuthCookies
} from "@/lib/auth";

export default async function HomePage() {
  const cookieStore = await cookies();
  const authenticatedTenant = await validateAuthCookies({
    tenantId: cookieStore.get(AUTH_TENANT_COOKIE_NAME)?.value,
    authToken: cookieStore.get(AUTH_COOKIE_NAME)?.value,
    mode: cookieStore.get(AUTH_MODE_COOKIE_NAME)?.value
  });

  return (
    <DashboardShell
      passwordProtectionEnabled={isAuthenticationEnabled()}
      authenticatedTenant={authenticatedTenant}
    />
  );
}
