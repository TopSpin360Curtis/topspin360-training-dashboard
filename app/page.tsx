import { cookies } from "next/headers";
import DashboardShell from "@/components/DashboardShell";
import {
  AUTH_MODE_COOKIE_NAME,
  getDashboardModeFromCookieValue
} from "@/lib/auth";

export default async function HomePage() {
  const cookieStore = await cookies();
  const authenticatedProfile = getDashboardModeFromCookieValue(
    cookieStore.get(AUTH_MODE_COOKIE_NAME)?.value
  );

  return (
    <DashboardShell
      passwordProtectionEnabled={Boolean(process.env.DASHBOARD_ACCESS_PASSWORD?.trim())}
      authenticatedProfile={authenticatedProfile}
    />
  );
}
