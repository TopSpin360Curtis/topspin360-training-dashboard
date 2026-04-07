import Link from "next/link";
import LoginForm from "@/components/LoginForm";
import {
  getDefaultLoginPathForMode,
  getDefaultTenantForMode,
  getLoginPathForTenant
} from "@/lib/auth";
import type { DashboardProfile, DashboardTenant } from "@/lib/types";

type ModeLoginScreenProps = {
  mode: DashboardProfile;
  nextPath: string;
  tenant?: DashboardTenant | null;
};

const MODE_META: Record<
  DashboardProfile,
  {
    label: string;
    eyebrow: string;
    description: string;
    accent: string;
    alternateHref: string;
    alternateLabel: string;
  }
> = {
  team: {
    label: "Team Data",
    eyebrow: "Protected Team Access",
    description:
      "Sign in with your team username and password. This route only admits accounts mapped to live team datasets.",
    accent: "bg-brand-blue text-white",
    alternateHref: "/login/test",
    alternateLabel: "Use Test Login"
  },
  test: {
    label: "Test Data",
    eyebrow: "Protected Test Access",
    description:
      "Sign in with your test username and password. This route only admits accounts mapped to demo datasets.",
    accent: "bg-brand-orange text-white",
    alternateHref: "/login/team",
    alternateLabel: "Use Team Login"
  }
};

export default function ModeLoginScreen({ mode, nextPath, tenant = null }: ModeLoginScreenProps) {
  const meta = MODE_META[mode];
  const loginRoute = tenant ? getLoginPathForTenant(tenant.id) : getDefaultLoginPathForMode(mode);
  const alternateMode = mode === "team" ? "test" : "team";
  const alternateTenant = getDefaultTenantForMode(alternateMode);
  const alternateHref = alternateTenant
    ? getLoginPathForTenant(alternateTenant.id)
    : meta.alternateHref;
  const badgeLabel = tenant?.label ?? meta.label;

  return (
    <main className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top,_rgba(26,111,196,0.18),_transparent_40%),linear-gradient(180deg,_#f7fbff_0%,_#eef3f9_100%)] px-4 py-10">
      <section className="w-full max-w-md rounded-[2rem] border border-white/70 bg-white/95 p-8 shadow-soft backdrop-blur">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-blue text-sm font-bold text-white">
            TS
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-brand-blue/70">
              TopSpin360
            </p>
            <h1 className="text-xl font-semibold text-brand-ink">{meta.eyebrow}</h1>
          </div>
        </div>

        <div className="mt-5 flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
              Login Route
            </p>
            <p className="mt-1 text-sm font-semibold text-brand-ink">{loginRoute}</p>
          </div>
          <span className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] ${meta.accent}`}>
            {badgeLabel}
          </span>
        </div>

        <p className="mt-5 text-sm leading-6 text-slate-600">{meta.description}</p>

        <LoginForm nextPath={nextPath} mode={mode} />

        <div className="mt-5 flex items-center justify-between gap-3 text-sm">
          <span className="text-slate-500">Need the other environment?</span>
          <Link
            href={alternateHref}
            className="font-semibold text-brand-blue transition hover:text-brand-ink"
          >
            {meta.alternateLabel}
          </Link>
        </div>
      </section>
    </main>
  );
}
