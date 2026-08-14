type TenantUnavailableNoticeProps = {
  tenantLabel: string;
};

export default function TenantUnavailableNotice({
  tenantLabel
}: TenantUnavailableNoticeProps) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top,_rgba(26,111,196,0.12),_transparent_45%),linear-gradient(180deg,_#f7fbff_0%,_#eef3f9_100%)] px-4 py-10">
      <div className="w-full max-w-2xl rounded-[2rem] border border-amber-200 bg-white p-8 shadow-soft">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-amber-600">
          Temporary Pause
        </p>
        <h1 className="mt-3 text-3xl font-semibold text-brand-ink">
          {tenantLabel} dashboard is temporarily unavailable
        </h1>
        <p className="mt-4 text-sm leading-6 text-slate-600">
          We have temporarily taken this dashboard offline while we verify the linked data source.
          Access will be restored as soon as the data issue is resolved.
        </p>
        <div className="mt-6 rounded-3xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-900">
          Please do not use this dashboard until we confirm the correct team dataset is loading.
        </div>
      </div>
    </main>
  );
}
