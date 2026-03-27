"use client";

import { useRouter } from "next/navigation";

type NavbarProps = {
  viewMode: "individual" | "team";
  onViewChange: (value: "individual" | "team") => void;
  onExport: () => void;
  onSyncSheets: () => void;
  isSyncing: boolean;
  canLogout?: boolean;
};

export default function Navbar({
  viewMode,
  onViewChange,
  onExport,
  onSyncSheets,
  isSyncing,
  canLogout = false
}: NavbarProps) {
  const router = useRouter();

  async function handleLogout() {
    await fetch("/api/auth/logout", {
      method: "POST"
    });
    router.replace("/login");
    router.refresh();
  }

  return (
    <header className="no-print sticky top-0 z-20 border-b border-white/40 bg-white/85 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-brand-blue text-sm font-bold text-white shadow-soft">
            TS
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-brand-blue/70">
              TopSpin360
            </p>
            <h1 className="text-lg font-semibold text-brand-ink">
              TopSpin360 Training Dashboard
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 p-1">
          {[
            {
              label: "Individual Reports",
              value: "individual"
            },
            {
              label: "Team Report",
              value: "team"
            }
          ].map((item) => (
            <button
              key={item.value}
              type="button"
              onClick={() => onViewChange(item.value as "individual" | "team")}
              className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                viewMode === item.value
                  ? "bg-brand-blue text-white shadow-sm"
                  : "text-slate-600 hover:text-brand-ink"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          {canLogout ? (
            <button
              type="button"
              onClick={() => void handleLogout()}
              className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600 transition hover:text-brand-ink"
            >
              Log Out
            </button>
          ) : null}

          <button
            type="button"
            onClick={onSyncSheets}
            disabled={isSyncing}
            className="rounded-full border border-brand-blue/20 bg-brand-mist px-4 py-2 text-sm font-semibold text-brand-blue transition hover:bg-brand-blue/10 disabled:cursor-wait disabled:opacity-60"
          >
            {isSyncing ? "Syncing..." : "Sync Sheets"}
          </button>

          <button
            type="button"
            onClick={onExport}
            className="rounded-full bg-brand-orange px-4 py-2 text-sm font-semibold text-white transition hover:brightness-95"
          >
            Export
          </button>
        </div>
      </div>
    </header>
  );
}
