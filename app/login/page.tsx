import LoginForm from "@/components/LoginForm";

export default async function LoginPage({
  searchParams
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const resolvedSearchParams = await searchParams;
  const nextValue = resolvedSearchParams.next;
  const nextPath =
    typeof nextValue === "string"
      ? nextValue
      : Array.isArray(nextValue)
        ? nextValue[0] || "/"
        : "/";

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
            <h1 className="text-xl font-semibold text-brand-ink">Protected Dashboard Access</h1>
          </div>
        </div>

        <p className="mt-5 text-sm leading-6 text-slate-600">
          Enter the shared dashboard password to view athlete training data and private
          reports.
        </p>

        <LoginForm nextPath={nextPath} />
      </section>
    </main>
  );
}
