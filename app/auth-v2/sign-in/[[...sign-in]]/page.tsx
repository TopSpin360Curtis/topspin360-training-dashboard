import { SignIn } from "@clerk/nextjs";
import TenantUnavailableNotice from "@/components/TenantUnavailableNotice";
import {
  getAuthV2SignUpPath,
  isAuthV2Available,
  isTenantTemporarilyDisabled,
  resolveTenantFromRoute
} from "@/lib/authV2";

type AuthV2SignInPageProps = {
  searchParams: Promise<{ tenant?: string }>;
};

export default async function AuthV2SignInPage({ searchParams }: AuthV2SignInPageProps) {
  const { tenant } = await searchParams;
  const resolvedTenant = resolveTenantFromRoute(tenant ?? null);

  if (resolvedTenant && isTenantTemporarilyDisabled(resolvedTenant.id)) {
    return <TenantUnavailableNotice tenantLabel={resolvedTenant.label} />;
  }

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

  return (
    <main className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top,_rgba(26,111,196,0.18),_transparent_40%),linear-gradient(180deg,_#f7fbff_0%,_#eef3f9_100%)] px-4 py-10">
      <SignIn
        path="/auth-v2/sign-in"
        routing="path"
        signUpUrl={getAuthV2SignUpPath(tenant ?? null)}
        forceRedirectUrl={`/auth-v2/post-login${tenant ? `?tenant=${tenant}` : ""}`}
      />
    </main>
  );
}
