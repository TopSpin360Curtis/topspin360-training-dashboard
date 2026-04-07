import Link from "next/link";

export default function LoginLandingPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top,_rgba(26,111,196,0.18),_transparent_40%),linear-gradient(180deg,_#f7fbff_0%,_#eef3f9_100%)] px-4 py-10">
      <section className="w-full max-w-lg rounded-[2rem] border border-white/70 bg-white/95 p-8 shadow-soft backdrop-blur">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-brand-blue/70">
          TopSpin360
        </p>
        <h1 className="mt-2 text-2xl font-semibold text-brand-ink">
          Choose a protected dashboard environment
        </h1>
        <p className="mt-4 text-sm leading-6 text-slate-600">
          Team and Test data use separate login routes, and each username is bound to one
          dataset only after sign-in.
        </p>

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <Link
            href="/login/team"
            className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-5 transition hover:-translate-y-0.5 hover:border-brand-blue/30 hover:bg-white"
          >
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-blue/70">
              Team Route
            </p>
            <p className="mt-2 text-lg font-semibold text-brand-ink">/login/team</p>
            <p className="mt-2 text-sm text-slate-500">Live team environment and real data.</p>
          </Link>

          <Link
            href="/login/test"
            className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-5 transition hover:-translate-y-0.5 hover:border-brand-orange/30 hover:bg-white"
          >
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-blue/70">
              Test Route
            </p>
            <p className="mt-2 text-lg font-semibold text-brand-ink">/login/test</p>
            <p className="mt-2 text-sm text-slate-500">Isolated demo environment and test data.</p>
          </Link>
        </div>
      </section>
    </main>
  );
}
