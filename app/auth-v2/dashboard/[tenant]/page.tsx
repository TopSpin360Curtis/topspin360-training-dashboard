import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import DashboardShell from "@/components/DashboardShell";
import {
  getAuthV2SignInPath,
  getClerkAuthenticatedTenantForRoute,
  isAuthV2Available,
  resolveTenantFromRoute
} from "@/lib/authV2";

type AuthV2DashboardPageProps = {
  params: Promise<{ tenant: string }>;
};

export default async function AuthV2DashboardPage({ params }: AuthV2DashboardPageProps) {
  const { tenant: tenantRoute } = await params;
  const requestedTenant = resolveTenantFromRoute(tenantRoute);

  if (!requestedTenant) {
    notFound();
  }

  if (!isAuthV2Available()) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-10">
        <div className="w-full max-w-lg rounded-[2rem] border border-slate-200 bg-white p-8 shadow-soft">
          <h1 className="text-2xl font-semibold text-brand-ink">Secure Access Not Configured</h1>
          <p className="mt-3 text-sm leading-6 text-slate-600">
            Add the Clerk environment variables and set `AUTH_V2_ENABLED=true` before using this
            secure dashboard.
          </p>
        </div>
      </main>
    );
  }

  const authenticatedTenant = await getClerkAuthenticatedTenantForRoute(requestedTenant.loginRoute);

  if (!authenticatedTenant) {
    redirect(getAuthV2SignInPath(requestedTenant.loginRoute));
  }

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(26,111,196,0.12),_transparent_45%),linear-gradient(180deg,_#f7fbff_0%,_#eef3f9_100%)]">
      <div className="mx-auto flex max-w-7xl justify-end px-4 py-4 sm:px-6 lg:px-8">
        <Link
          href="/auth-v2/account"
          className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-brand-blue/30 hover:text-brand-ink"
        >
          Account Settings
        </Link>
      </div>

      <DashboardShell
        passwordProtectionEnabled={false}
        authenticatedTenant={authenticatedTenant}
        lockTenantSelection
        allowLogout={false}
        sheetTenantId={authenticatedTenant.id}
      />
    </main>
  );
}
