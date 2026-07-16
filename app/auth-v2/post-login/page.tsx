import { redirect } from "next/navigation";
import {
  getAuthV2DashboardPath,
  getAuthV2SignInPath,
  getClerkAuthenticatedTenantForRoute,
  getClerkDashboardAccess,
  isAuthV2Available,
  resolveTenantFromRoute
} from "@/lib/authV2";

type AuthV2PostLoginPageProps = {
  searchParams: Promise<{ tenant?: string }>;
};

export default async function AuthV2PostLoginPage({ searchParams }: AuthV2PostLoginPageProps) {
  const { tenant: tenantRoute } = await searchParams;

  if (!isAuthV2Available()) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-10">
        <div className="w-full max-w-lg rounded-[2rem] border border-slate-200 bg-white p-8 shadow-soft">
          <h1 className="text-2xl font-semibold text-brand-ink">Auth Preview Not Configured</h1>
          <p className="mt-3 text-sm leading-6 text-slate-600">
            Add the Clerk environment variables and set `AUTH_V2_ENABLED=true` before using this
            preview sign-in flow.
          </p>
        </div>
      </main>
    );
  }

  const access = await getClerkDashboardAccess();

  if (!access) {
    redirect(getAuthV2SignInPath(tenantRoute ?? null));
  }

  const requestedTenant = resolveTenantFromRoute(tenantRoute);

  if (requestedTenant && access.tenantIds.includes(requestedTenant.id)) {
    redirect(getAuthV2DashboardPath(requestedTenant.loginRoute));
  }

  const fallbackTenant = await getClerkAuthenticatedTenantForRoute(tenantRoute);

  if (fallbackTenant) {
    redirect(getAuthV2DashboardPath(fallbackTenant.loginRoute));
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-10">
      <div className="w-full max-w-xl rounded-[2rem] border border-rose-200 bg-white p-8 shadow-soft">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-rose-500">
          Access Blocked
        </p>
        <h1 className="mt-3 text-3xl font-semibold text-brand-ink">
          Your account is not assigned to this team yet
        </h1>
        <p className="mt-4 text-sm leading-6 text-slate-600">
          The new auth system is working, but your Clerk user still needs dashboard tenant
          metadata before we can open a team dataset. Once that metadata is added, this route
          will send you straight into the correct dashboard.
        </p>
        <p className="mt-4 text-sm text-slate-500">
          Expected metadata: `dashboardTenantIds`, optional `dashboardRole`, optional
          `dashboardCanExport`.
        </p>
      </div>
    </main>
  );
}
