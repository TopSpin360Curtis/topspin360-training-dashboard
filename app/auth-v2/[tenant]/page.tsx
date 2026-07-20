import Link from "next/link";
import { notFound } from "next/navigation";
import {
  getAuthV2SignInPath,
  getAuthV2SignUpPath,
  isAuthV2Available,
  isAuthV2InviteOnly,
  resolveTenantFromRoute
} from "@/lib/authV2";

type AuthV2TenantPageProps = {
  params: Promise<{ tenant: string }>;
};

export default async function AuthV2TenantPage({ params }: AuthV2TenantPageProps) {
  const { tenant: tenantRoute } = await params;
  const tenant = resolveTenantFromRoute(tenantRoute);

  if (!tenant) {
    notFound();
  }

  const authReady = isAuthV2Available();
  const inviteOnly = isAuthV2InviteOnly();

  return (
    <main className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top,_rgba(26,111,196,0.18),_transparent_40%),linear-gradient(180deg,_#f7fbff_0%,_#eef3f9_100%)] px-4 py-10">
      <section className="w-full max-w-xl rounded-[2rem] border border-white/70 bg-white/95 p-8 shadow-soft backdrop-blur">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-brand-blue/70">
          TopSpin360
        </p>
        <h1 className="mt-3 text-3xl font-semibold text-brand-ink">{tenant.label} Secure Access</h1>
        <p className="mt-4 text-sm leading-6 text-slate-600">
          Team-specific sign-in with self-managed passwords, email verification, and account
          recovery.
        </p>

        <div className="mt-6 rounded-3xl border border-slate-200 bg-slate-50 p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-brand-blue/70">
            Secure Route
          </p>
          <p className="mt-2 text-lg font-semibold text-brand-ink">/auth-v2/{tenant.loginRoute}</p>
        </div>

        {!authReady ? (
          <div className="mt-6 rounded-3xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-900">
            Clerk credentials are not configured yet, so this secure sign-in page is in standby
            mode.
          </div>
        ) : (
          <>
            {inviteOnly ? (
              <div className="mt-6 rounded-3xl border border-sky-200 bg-sky-50 px-5 py-4 text-sm text-sky-900">
                This route is invite only. Users can sign in only after an admin has approved
                their email address for the {tenant.label} dataset.
              </div>
            ) : null}

            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                href={getAuthV2SignInPath(tenant.loginRoute)}
                className="rounded-full bg-brand-blue px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-blue/90"
              >
                Continue to Sign In
              </Link>
              {!inviteOnly ? (
                <Link
                  href={getAuthV2SignUpPath(tenant.loginRoute)}
                  className="rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:border-brand-blue/30 hover:text-brand-ink"
                >
                  Create Account
                </Link>
              ) : null}
            </div>
          </>
        )}
      </section>
    </main>
  );
}
