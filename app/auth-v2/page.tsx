import Link from "next/link";
import { getConfiguredTenants } from "@/lib/auth";
import { isAuthV2Available, isAuthV2InviteOnly } from "@/lib/authV2";

export default function AuthV2LandingPage() {
  const tenants = getConfiguredTenants()
    .filter((tenant) => tenant.profile === "team")
    .filter(
      (tenant, index, entries) =>
        entries.findIndex((entry) => entry.loginRoute === tenant.loginRoute) === index
    );
  const authReady = isAuthV2Available();
  const inviteOnly = isAuthV2InviteOnly();

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(26,111,196,0.12),_transparent_45%),linear-gradient(180deg,_#f7fbff_0%,_#eef3f9_100%)] px-4 py-10">
      <div className="mx-auto max-w-5xl rounded-[2rem] border border-white/70 bg-white/95 p-8 shadow-soft backdrop-blur">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-brand-blue/70">
          TopSpin360
        </p>
        <h1 className="mt-3 text-3xl font-semibold text-brand-ink">Background Auth Preview</h1>
        <p className="mt-4 max-w-3xl text-sm leading-6 text-slate-600">
          This is the non-live authentication track for self-managed passwords, email
          verification, and future password resets. It runs separately from the current Lions
          login flow so we can test safely before rollout.
        </p>

        {!authReady ? (
          <div className="mt-8 rounded-3xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-900">
            Clerk is not configured yet. Once `AUTH_V2_ENABLED`, `CLERK_SECRET_KEY`, and
            `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` are set, these preview routes will go live.
          </div>
        ) : null}

        {authReady && inviteOnly ? (
          <div className="mt-4 rounded-3xl border border-sky-200 bg-sky-50 px-5 py-4 text-sm text-sky-900">
            Invite-only mode is on. New accounts must use an admin-issued invitation email before
            they can access a team dataset.
          </div>
        ) : null}

        <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {tenants.map((tenant) => (
            <Link
              key={tenant.id}
              href={`/auth-v2/${tenant.loginRoute}`}
              className="rounded-[1.5rem] border border-slate-200 bg-slate-50/90 p-5 transition hover:border-brand-blue/30 hover:bg-white"
            >
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-brand-blue/70">
                Team Route
              </p>
              <h2 className="mt-3 text-xl font-semibold text-brand-ink">{tenant.label}</h2>
              <p className="mt-2 text-sm text-slate-500">/auth-v2/{tenant.loginRoute}</p>
            </Link>
          ))}
        </div>
      </div>
    </main>
  );
}
