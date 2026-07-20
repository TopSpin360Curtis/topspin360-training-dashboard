import Link from "next/link";
import { getConfiguredTenants, getLoginPathForRoute } from "@/lib/auth";

type PublicTeamChooserProps = {
  title?: string;
  description?: string;
};

export default function PublicTeamChooser({
  title = "What team are you?",
  description = "Choose your organization to continue to the correct protected dashboard login."
}: PublicTeamChooserProps) {
  const tenants = getConfiguredTenants()
    .filter((tenant) => tenant.profile === "team")
    .filter(
      (tenant, index, entries) =>
        entries.findIndex((entry) => entry.loginRoute === tenant.loginRoute) === index
    )
    .sort((left, right) => left.label.localeCompare(right.label));

  return (
    <main className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top,_rgba(26,111,196,0.18),_transparent_40%),linear-gradient(180deg,_#f7fbff_0%,_#eef3f9_100%)] px-4 py-10">
      <section className="w-full max-w-3xl rounded-[2rem] border border-white/70 bg-white/95 p-8 shadow-soft backdrop-blur">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-brand-blue/70">
          TopSpin360
        </p>
        <h1 className="mt-2 text-3xl font-semibold text-brand-ink">{title}</h1>
        <p className="mt-4 max-w-2xl text-sm leading-6 text-slate-600">{description}</p>

        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          {tenants.map((tenant) => (
            <Link
              key={tenant.id}
              href={getLoginPathForRoute(tenant.loginRoute)}
              className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-5 transition hover:-translate-y-0.5 hover:border-brand-blue/30 hover:bg-white"
            >
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-blue/70">
                Team Login
              </p>
              <p className="mt-2 text-xl font-semibold text-brand-ink">{tenant.label}</p>
              <p className="mt-2 text-sm text-slate-500">{getLoginPathForRoute(tenant.loginRoute)}</p>
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}
