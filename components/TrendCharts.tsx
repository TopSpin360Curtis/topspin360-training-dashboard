"use client";

import { useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
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
import { formatDate, formatNumber, getRecentBestMetrics } from "@/lib/dataUtils";
import type { PlayerStats, RiskBand, TrainingSession } from "@/lib/types";

type TrendSession = TrainingSession & {
  delta: number;
  riskBand: RiskBand;
  rollingBest: number;
  teamAverage: number | null;
};

type TrendChartsProps = {
  player: string;
  sessions: TrendSession[];
  playerStats: PlayerStats;
  teamAverage: number;
  dateRangeLabel: string;
};

type SessionSortKey =
  | "date"
  | "dayOfWeek"
  | "maxRfdCCW"
  | "maxRfdCW"
  | "bestRfd"
  | "riskBand"
  | "delta";

function Gauge({
  label,
  value,
  maxValue,
  color
}: {
  label: string;
  value: number;
  maxValue: number;
  color: string;
}) {
  const percentage = maxValue ? Math.min(100, (value / maxValue) * 100) : 0;
  const degrees = (percentage / 100) * 360;

  return (
    <div className="rounded-xl border border-white/60 bg-white/95 p-4 shadow-soft">
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
        {label}
      </p>
      <div className="mt-4 flex flex-col items-center">
        <div
          className="flex h-[100px] w-[100px] items-center justify-center rounded-full"
          style={{
            background: `conic-gradient(${color} 0deg ${degrees}deg, rgba(16, 33, 58, 0.08) ${degrees}deg 360deg)`
          }}
        >
          <div className="flex h-[72px] w-[72px] flex-col items-center justify-center rounded-full bg-white">
            <span className="text-lg font-semibold text-brand-ink">
              {formatNumber(value)}
            </span>
          </div>
        </div>
        <p className="mt-3 text-center text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">
          {Math.round(percentage)}% to Lower Risk Profile
        </p>
      </div>
    </div>
  );
}

export default function TrendCharts({
  player,
  sessions,
  playerStats,
  teamAverage,
  dateRangeLabel
}: TrendChartsProps) {
  const [sessionSortKey, setSessionSortKey] = useState<SessionSortKey>("date");
  const [sessionSortDirection, setSessionSortDirection] = useState<"asc" | "desc">("desc");
  const metrics = getRecentBestMetrics(sessions, player);
  const lowerRiskThreshold = 33;
  const riskBandOrder: Record<RiskBand, number> = {
    high: 0,
    moderate: 1,
    lower: 2,
    lowest: 3
  };
  const sortedSessionHistory = useMemo(() => {
    const ordered = [...sessions];

    ordered.sort((left, right) => {
      let comparison = 0;

      switch (sessionSortKey) {
        case "date":
          comparison = left.date.localeCompare(right.date);
          break;
        case "dayOfWeek":
          comparison = left.dayOfWeek.localeCompare(right.dayOfWeek);
          break;
        case "maxRfdCCW":
          comparison = left.maxRfdCCW - right.maxRfdCCW;
          break;
        case "maxRfdCW":
          comparison = left.maxRfdCW - right.maxRfdCW;
          break;
        case "bestRfd":
          comparison = left.bestRfd - right.bestRfd;
          break;
        case "riskBand":
          comparison = riskBandOrder[left.riskBand] - riskBandOrder[right.riskBand];
          break;
        case "delta":
          comparison = left.delta - right.delta;
          break;
      }

      return sessionSortDirection === "asc" ? comparison : -comparison;
    });

    return ordered;
  }, [sessions, sessionSortDirection, sessionSortKey]);

  function handleSessionSort(nextKey: SessionSortKey) {
    if (sessionSortKey === nextKey) {
      setSessionSortDirection((current) => (current === "asc" ? "desc" : "asc"));
      return;
    }

    setSessionSortKey(nextKey);
    setSessionSortDirection(nextKey === "date" ? "desc" : "asc");
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 xl:grid-cols-4">
        <article className="rounded-3xl border border-white/60 bg-white/95 p-5 shadow-soft">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-brand-blue/70">
            Current Context
          </p>
          <p className="mt-3 text-2xl font-semibold text-brand-ink">
            {formatNumber(playerStats.avgRFD)}
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <RiskBandBadge band={playerStats.riskBand} />
            <TrendStatusChip status={playerStats.trendStatus} />
          </div>
          <p className="mt-2 text-sm text-slate-500">{dateRangeLabel}</p>
        </article>

        <article className="rounded-3xl border border-white/60 bg-white/95 p-5 shadow-soft">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-brand-blue/70">
            Team Comparison
          </p>
          <p className="mt-3 text-2xl font-semibold text-brand-ink">
            {formatNumber(teamAverage)}
          </p>
          <div className="mt-3">
            <TeamAverageComparator
              delta={playerStats.avgRFD - teamAverage}
              deltaPct={teamAverage ? ((playerStats.avgRFD - teamAverage) / teamAverage) * 100 : 0}
            />
          </div>
        </article>

        <article className="rounded-3xl border border-white/60 bg-white/95 p-5 shadow-soft">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-brand-blue/70">
            Directional Balance
          </p>
          <div className="mt-4">
            <AsymmetryIndicator
              ccw={playerStats.ccwAvg}
              cw={playerStats.cwAvg}
              imbalanceAbs={playerStats.imbalanceAbs}
              imbalancePct={playerStats.imbalancePct}
            />
          </div>
        </article>

        <article className="rounded-3xl border border-white/60 bg-white/95 p-5 shadow-soft">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-brand-blue/70">
            Recent Change
          </p>
          <p className="mt-3 text-2xl font-semibold text-brand-ink">
            {playerStats.recentChangePct > 0 ? "+" : ""}
            {formatNumber(playerStats.recentChangePct)}%
          </p>
          <p className="mt-2 text-sm text-slate-500">
            Last 3 sessions vs prior 3 sessions
          </p>
        </article>
      </div>

      <article className="rounded-3xl border border-white/60 bg-white/95 p-5 shadow-soft">
        <div className="mb-4">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-brand-blue/70">
            Trends
          </p>
          <h3 className="text-xl font-semibold text-brand-ink">
            {player} Best RFD Trend
          </h3>
        </div>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={sessions}>
              <CartesianGrid strokeDasharray="3 3" stroke="#d9e2ef" />
              <XAxis
                dataKey="date"
                tickFormatter={(value) => formatDate(value)}
                stroke="#6b7280"
              />
              <YAxis stroke="#6b7280" />
              <Tooltip
                formatter={(value: number) => formatNumber(value)}
                labelFormatter={(value) => formatDate(String(value))}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="bestRfd"
                stroke="#10213a"
                strokeWidth={3}
                name="Best RFD"
                dot={{ r: 3 }}
              />
              <Line
                type="monotone"
                dataKey="rollingBest"
                stroke="#1a6fc4"
                strokeWidth={3}
                name="Rolling Avg"
                dot={false}
              />
              <Line
                type="monotone"
                dataKey="teamAverage"
                stroke="#e88c3a"
                strokeDasharray="6 4"
                strokeWidth={2}
                name="Team Avg"
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-4 min-[480px]:grid-cols-2 md:grid-cols-2 xl:grid-cols-4">
          <Gauge
            label="Best RFD All-Time (CCW)"
            value={metrics.allTimeCCW}
            maxValue={lowerRiskThreshold}
            color="#1a6fc4"
          />
          <Gauge
            label="Best RFD All-Time (CW)"
            value={metrics.allTimeCW}
            maxValue={lowerRiskThreshold}
            color="#e88c3a"
          />
          <Gauge
            label="Best RFD Past Month (CCW)"
            value={metrics.recentCCW}
            maxValue={lowerRiskThreshold}
            color="#1a6fc4"
          />
          <Gauge
            label="Best RFD Past Month (CW)"
            value={metrics.recentCW}
            maxValue={lowerRiskThreshold}
            color="#e88c3a"
          />
        </div>
      </article>

      <article className="rounded-3xl border border-white/60 bg-white/95 p-5 shadow-soft">
        <div className="mb-4">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-brand-blue/70">
            Session Peaks
          </p>
          <h3 className="text-xl font-semibold text-brand-ink">
            CW vs CCW Session Output
          </h3>
        </div>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={sessions}>
              <CartesianGrid strokeDasharray="3 3" stroke="#d9e2ef" />
              <XAxis
                dataKey="date"
                tickFormatter={(value) => formatDate(value)}
                stroke="#6b7280"
              />
              <YAxis stroke="#6b7280" />
              <Tooltip
                formatter={(value: number) => formatNumber(value)}
                labelFormatter={(value) => formatDate(String(value))}
              />
              <Legend />
              <Bar dataKey="maxRfdCCW" fill="#1a6fc4" radius={[8, 8, 0, 0]} name="CCW" />
              <Bar dataKey="maxRfdCW" fill="#e88c3a" radius={[8, 8, 0, 0]} name="CW" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </article>

      <article className="overflow-x-auto rounded-3xl border border-white/60 bg-white/95 shadow-soft">
        <div className="border-b border-slate-100 px-5 py-4">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-brand-blue/70">
            History
          </p>
          <h3 className="text-xl font-semibold text-brand-ink">Session History</h3>
        </div>
        <table className="min-w-full text-left text-sm">
          <thead className="bg-slate-50/80">
            <tr>
              {[
                { label: "Date", key: "date" },
                { label: "Day of week", key: "dayOfWeek" },
                { label: "Max RFD CCW", key: "maxRfdCCW" },
                { label: "Max RFD CW", key: "maxRfdCW" },
                { label: "Best RFD", key: "bestRfd" },
                { label: "Risk Band", key: "riskBand" },
                { label: "Delta", key: "delta" }
              ].map((column) => (
                <th key={column.key} className="px-4 py-4 font-semibold text-slate-700">
                  <button
                    type="button"
                    onClick={() => handleSessionSort(column.key as SessionSortKey)}
                    className="flex items-center gap-2 transition hover:text-brand-blue"
                  >
                    {column.label}
                    {sessionSortKey === column.key ? (
                      <span className="text-xs text-brand-blue">
                        {sessionSortDirection === "asc" ? "↑" : "↓"}
                      </span>
                    ) : null}
                  </button>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sortedSessionHistory.map((session) => (
              <tr key={session.id} className="border-t border-slate-100">
                <td className="px-4 py-4 text-slate-700">{formatDate(session.date)}</td>
                <td className="px-4 py-4 text-slate-700">{session.dayOfWeek}</td>
                <td className="px-4 py-4 text-slate-700">
                  {formatNumber(session.maxRfdCCW)}
                </td>
                <td className="px-4 py-4 text-slate-700">
                  {formatNumber(session.maxRfdCW)}
                </td>
                <td className="px-4 py-4 font-semibold text-brand-ink">
                  {formatNumber(session.bestRfd)}
                </td>
                <td className="px-4 py-4">
                  <RiskBandBadge band={session.riskBand} compact />
                </td>
                <td className="px-4 py-4">
                  {session.delta > 0 ? (
                    <span className="font-semibold text-tier-topText">
                      ▲ {formatNumber(session.delta)}
                    </span>
                  ) : session.delta < 0 ? (
                    <span className="font-semibold text-tier-devText">
                      ▼ {formatNumber(Math.abs(session.delta))}
                    </span>
                  ) : (
                    <span className="font-semibold text-slate-500">• 0.00</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </article>
    </div>
  );
}
