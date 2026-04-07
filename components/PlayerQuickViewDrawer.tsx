"use client";

import { useEffect, useMemo, useRef } from "react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";
import AsymmetryIndicator from "@/components/AsymmetryIndicator";
import RiskBandBadge from "@/components/RiskBandBadge";
import TeamAverageComparator from "@/components/TeamAverageComparator";
import TrendStatusChip from "@/components/TrendStatusChip";
import { formatDate, formatNumber } from "@/lib/dataUtils";
import type { PlayerStats, RiskBand, TrainingSession } from "@/lib/types";

type PlayerQuickViewDrawerProps = {
  isOpen: boolean;
  player: string | null;
  stats: PlayerStats | null;
  recentSessions: Array<
    TrainingSession & {
      delta: number;
      riskBand: RiskBand;
    }
  >;
  trendSessions: Array<
    TrainingSession & {
      delta: number;
      riskBand: RiskBand;
      rollingBest: number;
      teamAverage: number | null;
    }
  >;
  teamAverage: number;
  dateRangeLabel: string;
  onClose: () => void;
  onOpenFullTrends: (player: string) => void;
  onAddNote: (player: string) => void;
  onMarkInjured: (player: string) => void;
};

function renderDelta(delta: number) {
  if (delta > 0) {
    return <span className="font-semibold text-emerald-700">+{formatNumber(delta)}</span>;
  }

  if (delta < 0) {
    return <span className="font-semibold text-rose-700">-{formatNumber(Math.abs(delta))}</span>;
  }

  return <span className="font-semibold text-slate-500">0.00</span>;
}

export default function PlayerQuickViewDrawer({
  isOpen,
  player,
  stats,
  recentSessions,
  trendSessions,
  teamAverage,
  dateRangeLabel,
  onClose,
  onOpenFullTrends,
  onAddNote,
  onMarkInjured
}: PlayerQuickViewDrawerProps) {
  const panelRef = useRef<HTMLDivElement | null>(null);
  const closeButtonRef = useRef<HTMLButtonElement | null>(null);
  const lastSession = recentSessions[0] ?? null;
  const favoredDirection = stats
    ? stats.ccwAvg >= stats.cwAvg
      ? "CCW"
      : "CW"
    : null;
  const chartData = useMemo(() => trendSessions.slice(-8), [trendSessions]);
  const sixtyDaySnapshot = useMemo(() => {
    if (!trendSessions.length) {
      return {
        sessionCount: 0,
        averageRfd: null as number | null,
        peakRfd: null as number | null
      };
    }

    const latestSessionDate = trendSessions[trendSessions.length - 1]?.date;

    if (!latestSessionDate) {
      return {
        sessionCount: 0,
        averageRfd: null as number | null,
        peakRfd: null as number | null
      };
    }

    const cutoff = new Date(`${latestSessionDate}T12:00:00`);
    cutoff.setDate(cutoff.getDate() - 60);

    const windowSessions = trendSessions.filter((session) => {
      const sessionDate = new Date(`${session.date}T12:00:00`);
      return sessionDate >= cutoff;
    });

    return {
      sessionCount: windowSessions.length,
      averageRfd: windowSessions.length
        ? windowSessions.reduce((sum, session) => sum + session.bestRfd, 0) / windowSessions.length
        : null,
      peakRfd: windowSessions.length
        ? Math.max(...windowSessions.map((session) => session.bestRfd))
        : null
    };
  }, [trendSessions]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeButtonRef.current?.focus();

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
        return;
      }

      if (event.key !== "Tab" || !panelRef.current) {
        return;
      }

      const focusable = Array.from(
        panelRef.current.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        )
      ).filter((element) => !element.hasAttribute("disabled"));

      if (!focusable.length) {
        return;
      }

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const activeElement = document.activeElement;

      if (event.shiftKey && activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen || !player) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[70]">
      <button
        type="button"
        aria-label="Close player quick view"
        className="absolute inset-0 bg-slate-900/35 backdrop-blur-[1px]"
        onClick={onClose}
      />

      <aside
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={`${player} quick view`}
        className="absolute inset-y-0 right-0 flex h-full w-full max-w-2xl flex-col bg-white shadow-2xl sm:w-[92vw] md:w-[780px]"
      >
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4 sm:px-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-brand-blue/70">
              Player Quick View
            </p>
            <h2 className="mt-1 text-2xl font-semibold text-brand-ink">{player}</h2>
            <p className="mt-1 text-sm text-slate-500">{dateRangeLabel}</p>
          </div>
          <button
            ref={closeButtonRef}
            type="button"
            onClick={onClose}
            className="min-h-11 rounded-full bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-200"
          >
            Close
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-5 sm:px-6">
          {stats && stats.sessions > 0 ? (
            <div className="space-y-6">
              <section className="rounded-3xl border border-slate-100 bg-slate-50/70 p-5">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <RiskBandBadge band={stats.riskBand} />
                      <TrendStatusChip status={stats.trendStatus} />
                    </div>
                    <p className="mt-3 text-sm text-slate-500">
                      {stats.sessions} sessions in the current view
                      {lastSession ? ` • Last session ${formatDate(lastSession.date)}` : ""}
                    </p>
                  </div>
                  <div className="min-w-[180px] rounded-2xl bg-white p-4 shadow-sm">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-blue/70">
                      Avg RFD
                    </p>
                    <p className="mt-2 text-3xl font-semibold text-brand-ink">
                      {formatNumber(stats.avgRFD)}
                    </p>
                  </div>
                </div>

                <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                  <div className="rounded-2xl bg-white p-4 shadow-sm">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                      Best RFD
                    </p>
                    <p className="mt-2 text-xl font-semibold text-brand-ink">
                      {formatNumber(stats.bestRFD)}
                    </p>
                  </div>
                  <div className="rounded-2xl bg-white p-4 shadow-sm">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                      Vs Team Average
                    </p>
                    <div className="mt-2">
                      <TeamAverageComparator
                        delta={stats.avgRFD - teamAverage}
                        deltaPct={teamAverage ? ((stats.avgRFD - teamAverage) / teamAverage) * 100 : 0}
                      />
                    </div>
                  </div>
                  <div className="rounded-2xl bg-white p-4 shadow-sm">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                      Favored Direction
                    </p>
                    <p className="mt-2 text-xl font-semibold text-brand-ink">
                      {favoredDirection}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      Based on average directional output
                    </p>
                  </div>
                  <div className="rounded-2xl bg-white p-4 shadow-sm">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                      CW/CCW Imbalance
                    </p>
                    <p className="mt-2 text-xl font-semibold text-brand-ink">
                      {formatNumber(stats.imbalancePct)}%
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      {formatNumber(stats.imbalanceAbs)} absolute RFD difference
                    </p>
                  </div>
                </div>

                <div className="mt-5 rounded-2xl bg-white p-4 shadow-sm">
                  <AsymmetryIndicator
                    ccw={stats.ccwAvg}
                    cw={stats.cwAvg}
                    imbalanceAbs={stats.imbalanceAbs}
                    imbalancePct={stats.imbalancePct}
                  />
                </div>

                <div className="mt-5 rounded-2xl bg-white p-4 shadow-sm">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-blue/70">
                        Past 60 Days
                      </p>
                      <p className="mt-1 text-sm text-slate-500">
                        Based on the player&apos;s latest session in the current view
                      </p>
                    </div>
                  </div>
                  <div className="mt-4 grid gap-4 md:grid-cols-3">
                    <div className="rounded-2xl bg-slate-50/80 p-4">
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                        Sessions
                      </p>
                      <p className="mt-2 text-2xl font-semibold text-brand-ink">
                        {sixtyDaySnapshot.sessionCount}
                      </p>
                    </div>
                    <div className="rounded-2xl bg-slate-50/80 p-4">
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                        Average
                      </p>
                      <p className="mt-2 text-2xl font-semibold text-brand-ink">
                        {sixtyDaySnapshot.averageRfd !== null
                          ? formatNumber(sixtyDaySnapshot.averageRfd)
                          : "—"}
                      </p>
                    </div>
                    <div className="rounded-2xl bg-slate-50/80 p-4">
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                        Peak
                      </p>
                      <p className="mt-2 text-2xl font-semibold text-brand-ink">
                        {sixtyDaySnapshot.peakRfd !== null
                          ? formatNumber(sixtyDaySnapshot.peakRfd)
                          : "—"}
                      </p>
                    </div>
                  </div>
                </div>
              </section>

              <section className="rounded-3xl border border-white/60 bg-white/95 p-5 shadow-soft">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.24em] text-brand-blue/70">
                      Trend Snapshot
                    </p>
                    <h3 className="mt-2 text-lg font-semibold text-brand-ink">
                      Recent RFD trend
                    </h3>
                  </div>
                  <p className="text-sm text-slate-500">Best RFD, rolling average, and team average</p>
                </div>
                {chartData.length ? (
                  <div className="mt-4 h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#d9e2ef" />
                        <XAxis
                          dataKey="date"
                          tickFormatter={(value) => formatDate(String(value))}
                          stroke="#6b7280"
                        />
                        <YAxis stroke="#6b7280" />
                        <Tooltip
                          formatter={(value: number) => formatNumber(value)}
                          labelFormatter={(value) => formatDate(String(value))}
                        />
                        <Line
                          type="monotone"
                          dataKey="bestRfd"
                          stroke="#10213a"
                          strokeWidth={3}
                          dot={{ r: 3 }}
                          name="Best RFD"
                        />
                        <Line
                          type="monotone"
                          dataKey="rollingBest"
                          stroke="#1a6fc4"
                          strokeWidth={3}
                          dot={false}
                          name="Rolling Avg"
                        />
                        <Line
                          type="monotone"
                          dataKey="teamAverage"
                          stroke="#e88c3a"
                          strokeDasharray="6 4"
                          strokeWidth={2}
                          dot={false}
                          name="Team Avg"
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="mt-4 rounded-2xl border border-dashed border-slate-200 bg-slate-50/70 p-5 text-sm text-slate-500">
                    No training trend is available in the current filter window.
                  </div>
                )}
              </section>

              <section className="rounded-3xl border border-white/60 bg-white/95 p-5 shadow-soft">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.24em] text-brand-blue/70">
                      Recent Sessions
                    </p>
                    <h3 className="mt-2 text-lg font-semibold text-brand-ink">
                      Last 5 sessions
                    </h3>
                  </div>
                </div>
                <div className="mt-4 overflow-x-auto rounded-2xl border border-slate-100 bg-slate-50/70">
                  <table className="min-w-full text-left text-sm">
                    <thead className="border-b border-slate-100 bg-white/80">
                      <tr>
                        {["Date", "Day", "CCW", "CW", "Best RFD", "Delta"].map((label) => (
                          <th key={label} className="px-4 py-3 font-semibold text-slate-700">
                            {label}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {recentSessions.map((session) => (
                        <tr key={session.id} className="border-t border-slate-100 first:border-t-0">
                          <td className="px-4 py-3 text-brand-ink">{formatDate(session.date)}</td>
                          <td className="px-4 py-3 text-slate-600">{session.dayOfWeek}</td>
                          <td className="px-4 py-3 text-slate-600">{formatNumber(session.maxRfdCCW)}</td>
                          <td className="px-4 py-3 text-slate-600">{formatNumber(session.maxRfdCW)}</td>
                          <td className="px-4 py-3 font-semibold text-brand-ink">
                            {formatNumber(session.bestRfd)}
                          </td>
                          <td className="px-4 py-3">{renderDelta(session.delta)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            </div>
          ) : (
            <section className="rounded-3xl border border-dashed border-slate-200 bg-slate-50/70 p-6">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-brand-blue/70">
                No Training Data
              </p>
              <h3 className="mt-2 text-xl font-semibold text-brand-ink">
                0 training sessions recorded
              </h3>
              <p className="mt-3 max-w-xl text-sm leading-6 text-slate-500">
                No sessions are available for this player in the current filter window. You can still
                add a note, mark the player as injured, or jump to Trends after adjusting filters.
              </p>
            </section>
          )}
        </div>

        <div className="border-t border-slate-200 px-5 py-4 sm:px-6">
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => onOpenFullTrends(player)}
              className="min-h-11 rounded-full bg-brand-blue px-4 py-2 text-sm font-semibold text-white transition hover:brightness-95"
            >
              Open Full Trends
            </button>
            <button
              type="button"
              onClick={() => onAddNote(player)}
              className="min-h-11 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              Add Note
            </button>
            <button
              type="button"
              onClick={() => onMarkInjured(player)}
              className="min-h-11 rounded-full border border-rose-200 bg-rose-50 px-4 py-2 text-sm font-semibold text-rose-700 transition hover:bg-rose-100"
            >
              Mark as Injured
            </button>
          </div>
        </div>
      </aside>
    </div>
  );
}
