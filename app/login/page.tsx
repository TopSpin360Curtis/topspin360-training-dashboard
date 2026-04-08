import Link from "next/link";
import {
  getConfiguredTenants,
  getDefaultLoginPathForMode,
  getLoginPathForRoute
} from "@/lib/auth";

export default function LoginLandingPage() {
  const tenants = getConfiguredTenants();
  const routeTenants = Array.from(
    new Map(tenants.map((tenant) => [tenant.loginRoute, tenant])).values()
  );

  return (
    <main className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top,_rgba(26,111,196,0.18),_transparent_40%),linear-gradient(180deg,_#f7fbff_0%,_#eef3f9_100%)] px-4 py-10">
      <section className="w-full max-w-3xl rounded-[2rem] border border-white/70 bg-white/95 p-8 shadow-soft backdrop-blur">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-brand-blue/70">
          TopSpin360
        </p>
        <h1 className="mt-2 text-2xl font-semibold text-brand-ink">
          Choose your protected dashboard login
        </h1>
        <p className="mt-4 text-sm leading-6 text-slate-600">
          Each username is tied to a single dataset. Use the correct team or test route below.
        </p>

        {routeTenants.length ? (
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            {routeTenants.map((tenant) => (
              <Link
                key={tenant.loginRoute}
                href={getLoginPathForRoute(tenant.loginRoute)}
                className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-5 transition hover:-translate-y-0.5 hover:border-brand-blue/30 hover:bg-white"
              >
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-blue/70">
                  {tenant.profile === "team" ? "Team Route" : "Test Route"}
                </p>
                <p className="mt-2 text-lg font-semibold text-brand-ink">{tenant.label}</p>
                <p className="mt-1 text-sm font-semibold text-slate-500">
                  {getLoginPathForRoute(tenant.loginRoute)}
                </p>
                <p className="mt-2 text-sm text-slate-500">Shared login route</p>
              </Link>
            ))}
          </div>
        ) : (
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <Link
              href={getDefaultLoginPathForMode("team")}
              className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-5 transition hover:-translate-y-0.5 hover:border-brand-blue/30 hover:bg-white"
            >
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-blue/70">
                Team Route
              </p>
              <p className="mt-2 text-lg font-semibold text-brand-ink">
                {getDefaultLoginPathForMode("team")}
              </p>
            </Link>

            <Link
              href={getDefaultLoginPathForMode("test")}
              className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-5 transition hover:-translate-y-0.5 hover:border-brand-orange/30 hover:bg-white"
            >
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-blue/70">
                Test Route
              </p>
              <p className="mt-2 text-lg font-semibold text-brand-ink">
                {getDefaultLoginPathForMode("test")}
              </p>
            </Link>
          </div>
        )}
      </section>
    </main>
  );
}
