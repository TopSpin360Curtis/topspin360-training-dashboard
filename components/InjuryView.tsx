"use client";

import { formatDate, formatNumber, getPlayerStats } from "@/lib/dataUtils";
import RiskBandBadge from "@/components/RiskBandBadge";
import TeamAverageComparator from "@/components/TeamAverageComparator";
import type { PlayerInjuryMap, TrainingSession } from "@/lib/types";

type InjuryViewProps = {
  players: string[];
  data: TrainingSession[];
  injuries: PlayerInjuryMap;
  teamAverage: number;
};

function formatInjuryType(value: "head" | "neck") {
  return value === "head" ? "Head" : "Neck";
}

export default function InjuryView({
  players,
  data,
  injuries,
  teamAverage
}: InjuryViewProps) {
  const injuryRows = players
    .map((player) => {
      const playerInjuries = injuries[player] ?? [];
      const stats = getPlayerStats(data, player);

      return playerInjuries.map((injury, index) => ({
        player,
        injury,
        stats,
        id: `${player}-${injury.date}-${injury.type}-${index}`
      }));
    })
    .flat()
    .sort((left, right) => right.injury.date.localeCompare(left.injury.date));

  const uniquePlayersImpacted = new Set(injuryRows.map((row) => row.player)).size;
  const headCount = injuryRows.filter((row) => row.injury.type === "head").length;
  const neckCount = injuryRows.filter((row) => row.injury.type === "neck").length;
  const latestInjury = injuryRows[0];

  return (
    <div className="space-y-6">
      <article className="rounded-3xl border border-white/60 bg-white/95 p-5 shadow-soft">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-brand-blue/70">
              Injury Tracking
            </p>
            <h3 className="mt-2 text-xl font-semibold text-brand-ink">
              Structured player injury log
            </h3>
          </div>
          <p className="max-w-2xl text-sm text-slate-500">
            Right-click a player name anywhere in the dashboard to log a head or neck injury and
            jump back here for follow-up.
          </p>
        </div>
      </article>

      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        {[
          {
            label: "Injury records",
            value: String(injuryRows.length),
            subtext: injuryRows.length ? `${uniquePlayersImpacted} players impacted` : "No current injuries"
          },
          {
            label: "Head injuries",
            value: String(headCount),
            subtext: "Structured head injury records"
          },
          {
            label: "Neck injuries",
            value: String(neckCount),
            subtext: "Structured neck injury records"
          },
          {
            label: "Most recent injury",
            value: latestInjury ? latestInjury.player : "None logged",
            subtext: latestInjury
              ? `${formatInjuryType(latestInjury.injury.type)} • ${formatDate(latestInjury.injury.date)}`
              : "Use the player context menu to begin"
          }
        ].map((card) => (
          <article
            key={card.label}
            className="rounded-3xl border border-white/60 bg-white/95 p-5 shadow-soft"
          >
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-brand-blue/70">
              {card.label}
            </p>
            <p className="mt-3 text-2xl font-semibold text-brand-ink">{card.value}</p>
            <p className="mt-2 text-sm text-slate-500">{card.subtext}</p>
          </article>
        ))}
      </div>

      <article className="overflow-x-auto rounded-3xl border border-white/60 bg-white/95 shadow-soft">
        <div className="border-b border-slate-100 px-5 py-4">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-brand-blue/70">
            Current injuries
          </p>
          <h3 className="text-xl font-semibold text-brand-ink">Player injury register</h3>
        </div>
        {injuryRows.length ? (
          <table className="min-w-full text-left text-sm">
            <thead className="bg-slate-50/80">
              <tr>
                {["Player", "Type", "Injury date", "Avg RFD", "Sessions", "Risk Band", "Vs Team"].map(
                  (label) => (
                    <th key={label} className="px-4 py-4 font-semibold text-slate-700">
                      {label}
                    </th>
                  )
                )}
              </tr>
            </thead>
            <tbody>
              {injuryRows.map((row) => (
                <tr key={row.id} className="border-t border-slate-100">
                  <td className="px-4 py-4 font-semibold text-brand-ink">{row.player}</td>
                  <td className="px-4 py-4">
                    <div className="space-y-2">
                      <span className="rounded-full bg-rose-50 px-3 py-1 text-xs font-semibold text-rose-700">
                        {formatInjuryType(row.injury.type)}
                      </span>
                      {row.injury.label ? (
                        <p className="text-xs text-slate-500">{row.injury.label}</p>
                      ) : null}
                    </div>
                  </td>
                  <td className="px-4 py-4 text-slate-700">
                    <div className="space-y-1">
                      <p>{formatDate(row.injury.date)}</p>
                      {row.injury.weekLabel ? (
                        <p className="text-xs text-slate-500">{row.injury.weekLabel}</p>
                      ) : null}
                    </div>
                  </td>
                  <td className="px-4 py-4 text-slate-700">{formatNumber(row.stats.avgRFD)}</td>
                  <td className="px-4 py-4 text-slate-700">{row.stats.sessions}</td>
                  <td className="px-4 py-4">
                    <RiskBandBadge band={row.stats.riskBand} compact />
                  </td>
                  <td className="px-4 py-4">
                    <TeamAverageComparator
                      delta={row.stats.avgRFD - teamAverage}
                      deltaPct={
                        teamAverage ? ((row.stats.avgRFD - teamAverage) / teamAverage) * 100 : 0
                      }
                      compact
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="p-5 text-sm text-slate-500">
            No injury records are logged for the active profile yet. Right-click a player name and
            choose <span className="font-semibold text-brand-ink">Mark as Injured</span>.
          </div>
        )}
      </article>
    </div>
  );
}
