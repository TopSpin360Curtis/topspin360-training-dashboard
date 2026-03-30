"use client";

import type { MouseEvent } from "react";
import { useMemo, useState } from "react";

import ExportButton from "@/components/ExportButton";
import RiskBandBadge from "@/components/RiskBandBadge";
import TeamAverageComparator from "@/components/TeamAverageComparator";
import {
  formatNumber,
  formatSignedPercent,
  getRiskBand,
  getPlayerStats,
  getTeamBenchmarkProgress
} from "@/lib/dataUtils";
import type { BenchmarkConfig, RiskBand, TrainingSession } from "@/lib/types";

type GoalsViewProps = {
  data: TrainingSession[];
  players: string[];
  config: BenchmarkConfig;
  onConfigChange: (config: BenchmarkConfig) => void;
  onExportPdf: () => void;
  onExportCsv: () => void;
  teamAverage: number;
  teamAverageChangePct: number;
  onPlayerContextMenu?: (player: string, event: MouseEvent<HTMLElement>) => void;
};

function ProgressRow({
  label,
  value,
  tone = "blue"
}: {
  label: string;
  value: number;
  tone?: "blue" | "orange" | "green";
}) {
  const colors = {
    blue: "bg-brand-blue",
    orange: "bg-brand-orange",
    green: "bg-tier-topText"
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium text-slate-700">{label}</span>
        <span className="text-slate-500">{Math.round(value)}%</span>
      </div>
      <div className="h-3 rounded-full bg-slate-100">
        <div
          className={`h-3 rounded-full ${colors[tone]}`}
          style={{ width: `${Math.min(100, value)}%` }}
        />
      </div>
    </div>
  );
}

export default function GoalsView({
  data,
  players,
  config,
  onConfigChange,
  onExportPdf,
  onExportCsv,
  teamAverage,
  teamAverageChangePct,
  onPlayerContextMenu
}: GoalsViewProps) {
  const [activeRiskBand, setActiveRiskBand] = useState<RiskBand | null>(null);
  const teamProgress = getTeamBenchmarkProgress(data, config);
  const playerGoalStats = useMemo(
    () =>
      players.map((player) => ({
        player,
        stats: getPlayerStats(data, player)
      })),
    [data, players]
  );
  const filteredPlayerGoalStats = useMemo(
    () =>
      activeRiskBand
        ? playerGoalStats.filter(({ stats }) => stats.riskBand === activeRiskBand)
        : playerGoalStats,
    [activeRiskBand, playerGoalStats]
  );

  return (
    <div className="space-y-6">
      <div className="grid gap-4 xl:grid-cols-3">
        <article className="rounded-3xl border border-white/60 bg-white/95 p-5 shadow-soft">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-brand-blue/70">
            Team Average
          </p>
          <p className="mt-3 text-3xl font-semibold text-brand-ink">
            {formatNumber(teamAverage)}
          </p>
          <div className="mt-3 flex items-center gap-2">
            <RiskBandBadge band={getRiskBand(teamAverage)} />
            <span className="text-sm font-semibold text-slate-600">
              {formatSignedPercent(teamAverageChangePct)} vs prior period
            </span>
          </div>
        </article>

        <article className="rounded-3xl border border-white/60 bg-white/95 p-5 shadow-soft xl:col-span-2">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-brand-blue/70">
              Risk Band Distribution
            </p>
            {activeRiskBand ? (
              <button
                type="button"
                onClick={() => setActiveRiskBand(null)}
                className="text-sm font-semibold text-brand-blue transition hover:text-brand-ink"
              >
                Clear filter
              </button>
            ) : null}
          </div>
          <div className="mt-4 grid gap-4 md:grid-cols-4">
            {teamProgress.bandCounts.map((band) => (
              <button
                key={band.band}
                type="button"
                onClick={() =>
                  setActiveRiskBand((currentBand) =>
                    currentBand === band.band ? null : band.band
                  )
                }
                aria-pressed={activeRiskBand === band.band}
                className={`rounded-2xl border p-4 text-left transition focus:outline-none focus:ring-2 focus:ring-brand-blue/20 ${
                  activeRiskBand === band.band
                    ? "border-brand-blue bg-brand-blue/5 shadow-soft ring-1 ring-brand-blue/30"
                    : "border-slate-100 bg-slate-50/80 hover:border-brand-blue/30 hover:bg-white"
                }`}
              >
                <RiskBandBadge band={band.band} />
                <p className="mt-3 text-2xl font-semibold text-brand-ink">{band.count}</p>
                <p className="text-sm text-slate-500">
                  {Math.round(band.percentage)}% of active players
                </p>
              </button>
            ))}
          </div>
        </article>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.1fr_1.4fr]">
        <article className="rounded-3xl border border-white/60 bg-white/95 p-5 shadow-soft">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-brand-blue/70">
            Team Benchmarks
          </p>
          <h3 className="mt-2 text-xl font-semibold text-brand-ink">
            Team progress toward targets
          </h3>
          <div className="mt-5 space-y-4">
            {teamProgress.thresholds.map((item) => (
              <ProgressRow
                key={item.threshold}
                label={`Players above RFD ${item.threshold}`}
                value={item.percentage}
                tone="green"
              />
            ))}
            <ProgressRow
              label={`Players with ${config.teamSessionGoal}+ sessions`}
              value={teamProgress.sessionGoal.percentage}
              tone="orange"
            />
            <ProgressRow
              label="Players at or above team average"
              value={
                players.length ? (teamProgress.aboveTeamAverage / players.length) * 100 : 0
              }
            />
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {config.thresholds.map((threshold, index) => (
              <label key={index} className="space-y-2 text-sm">
                <span className="font-medium text-slate-700">
                  RFD threshold {index + 1}
                </span>
                <input
                  type="number"
                  step="0.1"
                  value={threshold}
                  onChange={(event) => {
                    const next = [...config.thresholds];
                    next[index] = Number(event.target.value);
                    onConfigChange({
                      ...config,
                      thresholds: next
                    });
                  }}
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 outline-none transition focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/20"
                />
              </label>
            ))}
            <label className="space-y-2 text-sm">
              <span className="font-medium text-slate-700">Session goal</span>
              <input
                type="number"
                value={config.teamSessionGoal}
                onChange={(event) =>
                  onConfigChange({
                    ...config,
                    teamSessionGoal: Number(event.target.value)
                  })
                }
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 outline-none transition focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/20"
              />
            </label>
          </div>
        </article>

        <article className="rounded-3xl border border-white/60 bg-white/95 p-5 shadow-soft">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-brand-blue/70">
                Individual Goals
              </p>
              <h3 className="mt-2 text-xl font-semibold text-brand-ink">
                Player target tracking
              </h3>
            </div>
            {activeRiskBand ? (
              <div className="text-right">
                <RiskBandBadge band={activeRiskBand} compact />
                <p className="mt-2 text-sm text-slate-500">
                  Showing {filteredPlayerGoalStats.length} of {playerGoalStats.length} players
                </p>
              </div>
            ) : (
              <p className="text-sm text-slate-500">
                Showing all {playerGoalStats.length} players
              </p>
            )}
          </div>
          <div className="mt-5 grid gap-4">
            {filteredPlayerGoalStats.map(({ player, stats }) => {
              const target = config.playerTargets[player];
              const rfdProgress = target ? (stats.bestRFD / target.rfdTarget) * 100 : 0;
              const sessionProgress = target
                ? (stats.sessions / target.sessionTarget) * 100
                : 0;

              return (
                <div
                  key={player}
                  className="rounded-2xl border border-slate-100 bg-slate-50/70 p-4"
                >
                  <div className="grid gap-4 lg:grid-cols-[1fr_0.8fr_0.8fr] lg:items-start">
                    <div>
                      <div className="flex items-center justify-between gap-3">
                        <p
                          className="font-semibold text-brand-ink"
                          onContextMenu={(event) => onPlayerContextMenu?.(player, event)}
                        >
                          {player}
                        </p>
                        <RiskBandBadge band={stats.riskBand} compact />
                      </div>
                      <p className="mt-1 text-sm text-slate-500">
                        Best {formatNumber(stats.bestRFD)} | Sessions {stats.sessions}
                      </p>
                      <div className="mt-3">
                        <TeamAverageComparator
                          delta={stats.avgRFD - teamAverage}
                          deltaPct={teamAverage ? ((stats.avgRFD - teamAverage) / teamAverage) * 100 : 0}
                        />
                      </div>
                      <div className="mt-4 space-y-3">
                        <ProgressRow label="RFD target" value={rfdProgress} />
                        <ProgressRow
                          label="Session target"
                          value={sessionProgress}
                          tone="orange"
                        />
                      </div>
                    </div>

                    <label className="space-y-2 text-sm">
                      <span className="font-medium text-slate-700">RFD target</span>
                      <input
                        type="number"
                        step="0.1"
                        value={target?.rfdTarget ?? 0}
                        onChange={(event) =>
                          onConfigChange({
                            ...config,
                            playerTargets: {
                              ...config.playerTargets,
                              [player]: {
                                ...(target ?? { rfdTarget: 0, sessionTarget: 0 }),
                                rfdTarget: Number(event.target.value)
                              }
                            }
                          })
                        }
                        className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 outline-none transition focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/20"
                      />
                    </label>

                    <label className="space-y-2 text-sm">
                      <span className="font-medium text-slate-700">Session target</span>
                      <input
                        type="number"
                        value={target?.sessionTarget ?? 0}
                        onChange={(event) =>
                          onConfigChange({
                            ...config,
                            playerTargets: {
                              ...config.playerTargets,
                              [player]: {
                                ...(target ?? { rfdTarget: 0, sessionTarget: 0 }),
                                sessionTarget: Number(event.target.value)
                              }
                            }
                          })
                        }
                        className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 outline-none transition focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/20"
                      />
                    </label>
                  </div>
                </div>
              );
            })}
            {!filteredPlayerGoalStats.length ? (
              <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/70 p-6 text-center text-sm text-slate-500">
                No players are currently in this risk band for the active cohort.
              </div>
            ) : null}
          </div>
        </article>
      </div>

      <article className="rounded-3xl border border-white/60 bg-white/95 p-5 shadow-soft">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-brand-blue/70">
          Export
        </p>
        <h3 className="mt-2 text-xl font-semibold text-brand-ink">
          Share reports with staff
        </h3>
        <div className="mt-5 flex flex-wrap gap-3">
          <ExportButton label="Export PDF" onClick={onExportPdf} />
          <ExportButton
            label="Export CSV"
            onClick={onExportCsv}
            variant="secondary"
          />
        </div>
      </article>
    </div>
  );
}
