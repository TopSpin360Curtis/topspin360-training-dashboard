"use client";

import { formatNumber } from "@/lib/dataUtils";
import type { PlayerAlert } from "@/lib/types";

type AlertsModalProps = {
  alerts: PlayerAlert[];
  open: boolean;
  onClose: () => void;
  onViewTrends: (player: string) => void;
  onAddNote: (player: string) => void;
};

export default function AlertsModal({
  alerts,
  open,
  onClose,
  onViewTrends,
  onAddNote
}: AlertsModalProps) {
  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 px-4 py-6">
      <div className="max-h-[85vh] w-full max-w-3xl overflow-y-auto rounded-[2rem] border border-white/70 bg-white p-6 shadow-soft">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-brand-blue/70">
              Alerts
            </p>
            <h2 className="mt-2 text-2xl font-semibold text-brand-ink">
              High Priority Player Digest
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="min-h-11 rounded-full bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-200"
          >
            Close
          </button>
        </div>

        <div className="mt-6 space-y-4">
          {alerts.length ? (
            alerts.map((alert) => (
              <div
                key={alert.player}
                className="rounded-3xl border border-rose-100 bg-rose-50/60 p-4"
              >
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-lg font-semibold text-brand-ink">{alert.player}</p>
                      <span className="rounded-full bg-rose-100 px-3 py-1 text-xs font-semibold text-rose-700">
                        High Priority
                      </span>
                    </div>
                    <p className="mt-2 text-sm text-slate-600">
                      {alert.reasons.join(" · ")}
                    </p>
                    <p className="mt-2 text-sm text-slate-500">
                      Avg RFD {formatNumber(alert.avgRFD)} • Sessions {alert.sessions} •
                      Balance {formatNumber(alert.imbalancePct)}%
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => onViewTrends(alert.player)}
                      className="min-h-11 rounded-full bg-brand-blue px-4 py-2 text-sm font-semibold text-white transition hover:brightness-95"
                    >
                      View trends
                    </button>
                    <button
                      type="button"
                      onClick={() => onAddNote(alert.player)}
                      className="min-h-11 rounded-full bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
                    >
                      Add note
                    </button>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50 p-5 text-sm text-slate-500">
              No high priority alerts in the active cohort right now.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
