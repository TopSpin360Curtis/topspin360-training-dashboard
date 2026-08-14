import { SignUp } from "@clerk/nextjs";
import {
  getAuthV2InviteForEmail,
  getAuthV2SignInPath,
  isAuthV2Available,
  isAuthV2InviteOnly,
  isTenantTemporarilyDisabled,
  resolveTenantFromRoute
} from "@/lib/authV2";
import TenantUnavailableNotice from "@/components/TenantUnavailableNotice";

type AuthV2SignUpPageProps = {
  searchParams: Promise<{ email?: string; tenant?: string }>;
};

export default async function AuthV2SignUpPage({ searchParams }: AuthV2SignUpPageProps) {
  const { email, tenant } = await searchParams;

  if (!isAuthV2Available()) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-10">
        <div className="w-full max-w-lg rounded-[2rem] border border-slate-200 bg-white p-8 shadow-soft">
          <h1 className="text-2xl font-semibold text-brand-ink">Auth Preview Not Configured</h1>
          <p className="mt-3 text-sm leading-6 text-slate-600">
            Add the Clerk environment variables and set `AUTH_V2_ENABLED=true` before using this
            preview sign-up flow.
          </p>
        </div>
      </main>
    );
  }

  const resolvedTenant = resolveTenantFromRoute(tenant ?? null);
  if (resolvedTenant && isTenantTemporarilyDisabled(resolvedTenant.id)) {
    return <TenantUnavailableNotice tenantLabel={resolvedTenant.label} />;
  }

  const inviteOnly = isAuthV2InviteOnly();
  const invite = getAuthV2InviteForEmail(email ?? null, tenant ?? null);

  if (inviteOnly && !invite) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-10">
        <div className="w-full max-w-xl rounded-[2rem] border border-slate-200 bg-white p-8 shadow-soft">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-brand-blue/70">
            Invite Only
          </p>
          <h1 className="mt-3 text-3xl font-semibold text-brand-ink">
            Account creation is limited to invited emails
          </h1>
          <p className="mt-4 text-sm leading-6 text-slate-600">
            This auth flow is protected for sensitive team data. Admins must approve the exact
            email address before a new account can be created.
          </p>
          <div className="mt-6 rounded-3xl border border-sky-200 bg-sky-50 px-5 py-4 text-sm text-sky-900">
            Ask an admin to add your email to the invite list, then reopen the sign-up link for
            {resolvedTenant ? ` ${resolvedTenant.label}` : " your team"} using that same email
            address.
          </div>
          <div className="mt-6">
            <a
              href={getAuthV2SignInPath(resolvedTenant?.loginRoute ?? tenant ?? null)}
              className="inline-flex rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:border-brand-blue/30 hover:text-brand-ink"
            >
              Back to Sign In
            </a>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top,_rgba(26,111,196,0.18),_transparent_40%),linear-gradient(180deg,_#f7fbff_0%,_#eef3f9_100%)] px-4 py-10">
      <div className="space-y-4">
        {inviteOnly && invite ? (
          <div className="mx-auto w-full max-w-md rounded-3xl border border-sky-200 bg-sky-50 px-5 py-4 text-sm text-sky-900 shadow-soft">
            This invite is approved for <strong>{invite.email}</strong>. Complete sign-up with
            that same email address to unlock {resolvedTenant?.label ?? "the assigned"} dataset.
          </div>
        ) : null}

        <SignUp
          path="/auth-v2/sign-up"
          routing="path"
          signInUrl={getAuthV2SignInPath(tenant ?? null)}
          forceRedirectUrl={`/auth-v2/post-login${tenant ? `?tenant=${tenant}` : ""}`}
        />
      </div>
    </main>
  );
}
