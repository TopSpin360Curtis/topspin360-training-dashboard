"use client";

import type { MouseEvent } from "react";
import { useMemo, useState } from "react";
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
  onPlayerContextMenu?: (player: string, event: MouseEvent<HTMLElement>) => void;
};

export default function CompareView({
  players,
  selectedPlayers,
  onSelectionChange,
  data,
  teamAverage,
  onPlayerContextMenu
}: CompareViewProps) {
  const [playerFilter, setPlayerFilter] = useState("");
  const filteredPlayers = useMemo(() => {
    const query = playerFilter.trim().toLowerCase();

    if (!query) {
      return players;
    }

    return players.filter((player) => player.toLowerCase().includes(query));
  }, [playerFilter, players]);
  const maxSelected = selectedPlayers.length >= 6;
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
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-3">
              <span className="text-sm font-medium text-slate-700">
                Compare up to 6 players
              </span>
              <button
                type="button"
                onClick={() =>
                  onSelectionChange(
                    selectedPlayers.length ? [] : players.slice(0, 6)
                  )
                }
                className="text-xs font-semibold text-brand-blue transition hover:text-brand-ink"
              >
                {selectedPlayers.length ? "Clear all" : "Select all"}
              </button>
            </div>

            <input
              type="search"
              value={playerFilter}
              onChange={(event) => setPlayerFilter(event.target.value)}
              placeholder="Filter players…"
              className="min-h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none transition focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/20"
            />

            <div className="max-h-[220px] overflow-y-auto rounded-lg border border-slate-200 bg-white p-2">
              <div className="space-y-1">
                {filteredPlayers.length ? (
                  filteredPlayers.map((player) => {
                    const isChecked = selectedPlayers.includes(player);
                    const isDisabled = !isChecked && maxSelected;

                    return (
                      <label
                        key={player}
                        onContextMenu={(event) => onPlayerContextMenu?.(player, event)}
                        className={`flex min-h-[28px] cursor-pointer items-center gap-2 rounded-md px-2 py-1 text-[12px] transition ${
                          isDisabled
                            ? "cursor-not-allowed text-slate-400"
                            : "text-slate-700 hover:bg-slate-50"
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          disabled={isDisabled}
                          onChange={() =>
                            onSelectionChange(
                              isChecked
                                ? selectedPlayers.filter((value) => value !== player)
                                : [...selectedPlayers, player].slice(0, 6)
                            )
                          }
                          className="h-4 w-4 rounded border-slate-300 text-brand-blue focus:ring-brand-blue"
                        />
                        <span>{player}</span>
                      </label>
                    );
                  })
                ) : (
                  <p className="px-2 py-3 text-[12px] text-slate-500">
                    No players match your filter.
                  </p>
                )}
              </div>
            </div>

            {maxSelected ? (
              <p className="text-xs font-medium text-slate-500">
                Maximum 6 players selected
              </p>
            ) : null}
          </div>

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
                <p
                  className="text-xs font-semibold uppercase tracking-[0.24em] text-brand-blue/70"
                  onContextMenu={(event) => onPlayerContextMenu?.(stat.player, event)}
                >
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
