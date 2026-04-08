"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { DashboardProfile } from "@/lib/types";

type NavbarProps = {
  viewMode: "individual" | "team";
  onViewChange: (value: "individual" | "team") => void;
  dataProfile: DashboardProfile;
  tenantLabel?: string;
  tenantLoginPath?: string;
  onProfileChange: (value: DashboardProfile) => void;
  modeLocked?: boolean;
  onExportCsv: () => void;
  onExportPdf: () => void;
  onSyncSheets: () => void;
  onShowAlerts: () => void;
  onShowAdmin?: () => void;
  isSyncing: boolean;
  isExportingPdf?: boolean;
  alertCount?: number;
  canLogout?: boolean;
  canExport?: boolean;
  isAdmin?: boolean;
};

export default function Navbar({
  viewMode,
  onViewChange,
  dataProfile,
  tenantLabel,
  tenantLoginPath,
  onProfileChange,
  modeLocked = false,
  onExportCsv,
  onExportPdf,
  onSyncSheets,
  onShowAlerts,
  onShowAdmin,
  isSyncing,
  isExportingPdf = false,
  alertCount = 0,
  canLogout = false,
  canExport = true,
  isAdmin = false
}: NavbarProps) {
  const router = useRouter();
  const headerRef = useRef<HTMLElement | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [exportMenuOpen, setExportMenuOpen] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined" || !headerRef.current) {
      return;
    }

    const element = headerRef.current;

    const updateHeight = () => {
      document.documentElement.style.setProperty(
        "--topspin-navbar-height",
        `${element.offsetHeight}px`
      );
    };

    updateHeight();

    const observer = new ResizeObserver(() => {
      updateHeight();
    });

    observer.observe(element);
    window.addEventListener("resize", updateHeight);

    return () => {
      observer.disconnect();
      window.removeEventListener("resize", updateHeight);
    };
  }, []);

  async function handleLogout() {
    await fetch("/api/auth/logout", {
      method: "POST"
    });
    router.replace(tenantLoginPath ?? `/login/${dataProfile}`);
    router.refresh();
  }

  return (
    <header
      ref={headerRef}
      className="no-print sticky top-0 z-[60] border-b border-white/40 bg-white/85 backdrop-blur"
    >
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
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

        {modeLocked ? (
          <div
            className={`hidden items-center gap-3 rounded-full border px-4 py-2 md:flex ${
              dataProfile === "team"
                ? "border-brand-blue/20 bg-brand-mist text-brand-blue"
                : "border-brand-orange/20 bg-amber-50 text-brand-orange"
            }`}
          >
            <span className="rounded-full bg-white/80 px-3 py-1 text-sm font-semibold">
              {tenantLabel ?? (dataProfile === "team" ? "Team Data" : "Test Data")}
            </span>
          </div>
        ) : (
          <div className="hidden items-center gap-2 rounded-full border border-slate-200 bg-slate-50 p-1 md:flex">
            {[
              { label: "Team Data", value: "team" },
              { label: "Test Data", value: "test" }
            ].map((item) => (
              <button
                key={item.value}
                type="button"
                onClick={() => onProfileChange(item.value as DashboardProfile)}
                className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                  dataProfile === item.value
                    ? "bg-brand-ink text-white shadow-sm"
                    : "text-slate-600 hover:text-brand-ink"
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        )}

        <div className="hidden items-center gap-2 rounded-full border border-slate-200 bg-slate-50 p-1 sm:flex">
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
          <div className="inline-flex rounded-full border border-slate-200 bg-slate-50 p-1 sm:hidden">
            <button
              type="button"
              onClick={() => onViewChange("individual")}
              aria-label="Individual reports"
              className={`min-h-11 min-w-11 rounded-full px-3 py-2 text-sm font-semibold transition ${
                viewMode === "individual"
                  ? "bg-brand-blue text-white"
                  : "text-slate-600 hover:text-brand-ink"
              }`}
            >
              I
            </button>
            <button
              type="button"
              onClick={() => onViewChange("team")}
              aria-label="Team report"
              className={`min-h-11 min-w-11 rounded-full px-3 py-2 text-sm font-semibold transition ${
                viewMode === "team"
                  ? "bg-brand-blue text-white"
                  : "text-slate-600 hover:text-brand-ink"
              }`}
            >
              T
            </button>
          </div>

          <button
            type="button"
            onClick={onShowAlerts}
            className="relative min-h-11 rounded-full border border-rose-100 bg-rose-50 px-4 py-2 text-sm font-semibold text-rose-700 transition hover:bg-rose-100"
          >
            Alerts
            {alertCount ? (
              <span className="absolute right-2 top-2 h-2.5 w-2.5 rounded-full bg-rose-500" />
            ) : null}
          </button>

          {isAdmin ? (
            <button
              type="button"
              onClick={onShowAdmin}
              className="min-h-11 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:text-brand-ink"
            >
              Admin
            </button>
          ) : null}

          <div className="relative sm:hidden">
            <button
              type="button"
              onClick={() => setMenuOpen((current) => !current)}
              className="min-h-11 min-w-11 rounded-full border border-slate-200 bg-white px-3 py-2 text-lg font-semibold text-slate-700 transition hover:bg-slate-50"
              aria-label="Open actions"
            >
              ...
            </button>

            {menuOpen ? (
              <div className="absolute right-0 top-14 w-48 rounded-2xl border border-slate-200 bg-white p-2 shadow-soft">
                {canLogout ? (
                  <div className="rounded-xl bg-slate-50 px-3 py-3 text-sm">
                    <p className="font-semibold text-brand-ink">
                      {tenantLabel ?? (dataProfile === "team" ? "Team Data" : "Test Data")}
                    </p>
                  </div>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={() => {
                        setMenuOpen(false);
                        onProfileChange("team");
                      }}
                      className={`min-h-11 w-full rounded-xl px-3 py-2 text-left text-sm font-semibold transition hover:bg-slate-50 ${
                        dataProfile === "team" ? "text-brand-blue" : "text-slate-700"
                      }`}
                    >
                      Team Data
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setMenuOpen(false);
                        onProfileChange("test");
                      }}
                      className={`min-h-11 w-full rounded-xl px-3 py-2 text-left text-sm font-semibold transition hover:bg-slate-50 ${
                        dataProfile === "test" ? "text-brand-blue" : "text-slate-700"
                      }`}
                    >
                      Test Data
                    </button>
                  </>
                )}
                {canLogout ? (
                  <button
                    type="button"
                    onClick={() => void handleLogout()}
                    className="min-h-11 w-full rounded-xl px-3 py-2 text-left text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                  >
                    Log Out
                  </button>
                ) : null}
                <button
                  type="button"
                  onClick={() => {
                    setMenuOpen(false);
                    onSyncSheets();
                  }}
                  className="min-h-11 w-full rounded-xl px-3 py-2 text-left text-sm font-semibold text-brand-blue transition hover:bg-slate-50"
                >
                  {isSyncing ? "Syncing..." : "Sync Sheets"}
                </button>
                {canExport ? (
                  <>
                    <button
                      type="button"
                      onClick={() => {
                        setMenuOpen(false);
                        onExportCsv();
                      }}
                      className="min-h-11 w-full rounded-xl px-3 py-2 text-left text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                    >
                      Export CSV
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setMenuOpen(false);
                        onExportPdf();
                      }}
                      className="min-h-11 w-full rounded-xl px-3 py-2 text-left text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                    >
                      {isExportingPdf ? "Exporting PDF..." : "Export PDF"}
                    </button>
                  </>
                ) : null}
              </div>
            ) : null}
          </div>

          <div className="hidden items-center gap-2 sm:flex">
            {canLogout ? (
              <button
                type="button"
                onClick={() => void handleLogout()}
                className="min-h-11 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600 transition hover:text-brand-ink"
              >
                Log Out
              </button>
            ) : null}

            <button
              type="button"
              onClick={onSyncSheets}
              disabled={isSyncing}
              className="min-h-11 rounded-full border border-brand-blue/20 bg-brand-mist px-4 py-2 text-sm font-semibold text-brand-blue transition hover:bg-brand-blue/10 disabled:cursor-wait disabled:opacity-60"
            >
              {isSyncing ? "Syncing..." : "Sync Sheets"}
            </button>

            {canExport ? (
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setExportMenuOpen((current) => !current)}
                  className="min-h-11 rounded-full bg-brand-orange px-4 py-2 text-sm font-semibold text-white transition hover:brightness-95"
                >
                  Export
                </button>

                {exportMenuOpen ? (
                  <>
                    <button
                      type="button"
                      aria-label="Close export menu"
                      className="fixed inset-0 z-10 cursor-default"
                      onClick={() => setExportMenuOpen(false)}
                    />
                    <div className="absolute right-0 top-14 z-20 min-w-[180px] rounded-2xl border border-slate-200 bg-white p-2 shadow-soft">
                      <button
                        type="button"
                        onClick={() => {
                          setExportMenuOpen(false);
                          onExportCsv();
                        }}
                        className="min-h-11 w-full rounded-xl px-3 py-2 text-left text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                      >
                        Export CSV
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setExportMenuOpen(false);
                          onExportPdf();
                        }}
                        className="min-h-11 w-full rounded-xl px-3 py-2 text-left text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                      >
                        {isExportingPdf ? "Exporting PDF..." : "Export PDF"}
                      </button>
                    </div>
                  </>
                ) : null}
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </header>
  );
}
