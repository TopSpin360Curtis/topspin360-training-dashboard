"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";
import AsymmetryIndicator from "@/components/AsymmetryIndicator";
import RiskBandBadge from "@/components/RiskBandBadge";
import TeamAverageComparator from "@/components/TeamAverageComparator";
import TrendStatusChip from "@/components/TrendStatusChip";
import { formatNumber, getPlayerStats } from "@/lib/dataUtils";
import type { TrainingSession } from "@/lib/types";

type CompareViewProps = {
  players: string[];
  selectedPlayers: string[];
  onSelectionChange: (players: string[]) => void;
  data: TrainingSession[];
  teamAverage: number;
};

export default function CompareView({
  players,
  selectedPlayers,
  onSelectionChange,
  data,
  teamAverage
}: CompareViewProps) {
  const chartData = selectedPlayers.map((player) => getPlayerStats(data, player));
  const highestAvg = [...chartData].sort((left, right) => right.avgRFD - left.avgRFD)[0];
  const bestBalance = [...chartData].sort(
    (left, right) => left.imbalancePct - right.imbalancePct
  )[0];
  const mostActive = [...chartData].sort((left, right) => right.sessions - left.sessions)[0];
  const biggestImprovement = [...chartData].sort(
    (left, right) => right.recentChangePct - left.recentChangePct
  )[0];

  return (
    <div className="space-y-6">
      <article className="rounded-3xl border border-white/60 bg-white/95 p-5 shadow-soft">
        <div className="grid gap-4 lg:grid-cols-[1fr_2fr] lg:items-start">
          <label className="space-y-2">
            <span className="text-sm font-medium text-slate-700">
              Compare up to 6 players
            </span>
            <select
              multiple
              value={selectedPlayers}
              onChange={(event) =>
                onSelectionChange(
                  Array.from(event.target.selectedOptions, (option) => option.value).slice(
                    0,
                    6
                  )
                )
              }
              className="min-h-32 w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none transition focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/20"
            >
              {players.map((player) => (
                <option key={player} value={player}>
                  {player}
                </option>
              ))}
            </select>
          </label>

          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} layout="vertical" barGap={12}>
                <CartesianGrid strokeDasharray="3 3" stroke="#d9e2ef" />
                <XAxis type="number" stroke="#6b7280" />
                <YAxis dataKey="player" type="category" stroke="#6b7280" width={110} />
                <Tooltip formatter={(value: number) => formatNumber(value)} />
                <Legend />
                <ReferenceLine
                  x={teamAverage}
                  stroke="#10213a"
                  strokeDasharray="6 4"
                  label="Team Avg"
                />
                <Bar dataKey="ccwAvg" fill="#1a6fc4" name="Avg RFD CCW" radius={[0, 8, 8, 0]} />
                <Bar dataKey="cwAvg" fill="#e88c3a" name="Avg RFD CW" radius={[0, 8, 8, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </article>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {[
          ["Highest Avg RFD", highestAvg ? `${highestAvg.player} • ${formatNumber(highestAvg.avgRFD)}` : "No selection"],
          ["Best Balance", bestBalance ? `${bestBalance.player} • ${formatNumber(bestBalance.imbalancePct)}% imbalance` : "No selection"],
          ["Most Active", mostActive ? `${mostActive.player} • ${mostActive.sessions} sessions` : "No selection"],
          ["Largest Improvement", biggestImprovement ? `${biggestImprovement.player} • ${formatNumber(biggestImprovement.recentChangePct)}%` : "No selection"]
        ].map(([label, value]) => (
          <article
            key={label}
            className="rounded-3xl border border-white/60 bg-white/95 p-5 shadow-soft"
          >
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-brand-blue/70">
              {label}
            </p>
            <p className="mt-3 text-sm font-semibold text-brand-ink">{value}</p>
          </article>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {chartData.map((stat) => (
          <article
            key={stat.player}
            className="rounded-3xl border border-white/60 bg-white/95 p-5 shadow-soft"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-brand-blue/70">
                  {stat.player}
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  <RiskBandBadge band={stat.riskBand} compact />
                  <TrendStatusChip status={stat.trendStatus} />
                </div>
              </div>
              <p className="text-2xl font-semibold text-brand-ink">
                {formatNumber(stat.avgRFD)}
              </p>
            </div>

            <div className="mt-4 space-y-4">
              <TeamAverageComparator
                delta={stat.avgRFD - teamAverage}
                deltaPct={teamAverage ? ((stat.avgRFD - teamAverage) / teamAverage) * 100 : 0}
              />

              <AsymmetryIndicator
                ccw={stat.ccwAvg}
                cw={stat.cwAvg}
                imbalanceAbs={stat.imbalanceAbs}
                imbalancePct={stat.imbalancePct}
              />

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-slate-500">Best RFD</p>
                  <p className="text-lg font-semibold text-brand-ink">
                    {formatNumber(stat.bestRFD)}
                  </p>
                </div>
                <div>
                  <p className="text-slate-500">Sessions</p>
                  <p className="text-lg font-semibold text-brand-ink">{stat.sessions}</p>
                </div>
              </div>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
