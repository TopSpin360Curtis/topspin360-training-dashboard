"use client";

import { formatNumber } from "@/lib/dataUtils";
import AsymmetryIndicator from "@/components/AsymmetryIndicator";
import RiskBandBadge from "@/components/RiskBandBadge";
import TeamAverageComparator from "@/components/TeamAverageComparator";
import TrendStatusChip from "@/components/TrendStatusChip";
import type { LeaderboardRow } from "@/lib/types";

type SortKey =
  | "rank"
  | "player"
  | "avgRFD"
  | "sessions"
  | "trendDelta"
  | "teamDeltaPct"
  | "imbalancePct";

type LeaderboardProps = {
  rows: LeaderboardRow[];
  sortKey: SortKey;
  sortDirection: "asc" | "desc";
  onSortChange: (key: SortKey) => void;
};

function getRowTone(index: number, total: number) {
  if (index < 3) {
    return "bg-tier-topBg/60";
  }

  if (index >= Math.floor(total * 0.8)) {
    return "bg-tier-midBg/60";
  }

  return "";
}

function renderTrend(delta: number) {
  if (delta > 0) {
    return <span className="font-semibold text-tier-topText">▲ {formatNumber(delta)}</span>;
  }

  if (delta < 0) {
    return (
      <span className="font-semibold text-tier-devText">
        ▼ {formatNumber(Math.abs(delta))}
      </span>
    );
  }

  return <span className="font-semibold text-slate-500">• 0.00</span>;
}

export default function Leaderboard({
  rows,
  sortKey,
  sortDirection,
  onSortChange
}: LeaderboardProps) {
  const headings: Array<{
    label: string;
    key: SortKey;
  }> = [
    { label: "Rank", key: "rank" },
    { label: "Player", key: "player" },
    { label: "Avg RFD", key: "avgRFD" },
    { label: "Vs Team", key: "teamDeltaPct" },
    { label: "Balance", key: "imbalancePct" },
    { label: "Sessions", key: "sessions" },
    { label: "Trend", key: "trendDelta" }
  ];

  return (
    <div className="overflow-x-auto rounded-3xl border border-white/60 bg-white/95 shadow-soft">
      <table className="min-w-full text-left text-sm">
        <thead className="border-b border-slate-100 bg-slate-50/80">
          <tr>
            {headings.map((heading) => (
              <th key={heading.key} className="px-4 py-4 font-semibold text-slate-700">
                <button
                  type="button"
                  onClick={() => onSortChange(heading.key)}
                  className="flex items-center gap-2 transition hover:text-brand-blue"
                >
                  {heading.label}
                  {sortKey === heading.key ? (
                    <span className="text-xs text-brand-blue">
                      {sortDirection === "asc" ? "↑" : "↓"}
                    </span>
                  ) : null}
                </button>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr
              key={row.player}
              className={`border-b border-slate-100 last:border-b-0 ${getRowTone(
                index,
                rows.length
              )}`}
            >
              <td className="px-4 py-4 font-semibold text-brand-ink">{row.rank}</td>
              <td className="px-4 py-4">
                <p className="font-medium text-brand-ink">{row.player}</p>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <RiskBandBadge band={row.riskBand} />
                  <TrendStatusChip status={row.trendStatus} />
                </div>
              </td>
              <td className="px-4 py-4">
                <p className="font-semibold text-brand-ink">{formatNumber(row.avgRFD)}</p>
                <p className="mt-1 text-xs text-slate-500">
                  Best {formatNumber(row.bestRFD)}
                </p>
              </td>
              <td className="px-4 py-4">
                <TeamAverageComparator
                  delta={row.teamDelta}
                  deltaPct={row.teamDeltaPct}
                  compact
                />
              </td>
              <td className="px-4 py-4">
                <AsymmetryIndicator
                  ccw={row.ccwAvg}
                  cw={row.cwAvg}
                  imbalanceAbs={row.imbalanceAbs}
                  imbalancePct={row.imbalancePct}
                  compact
                />
              </td>
              <td className="px-4 py-4 text-slate-700">{row.sessions}</td>
              <td className="px-4 py-4">
                <div className="space-y-2">
                  <div>{renderTrend(row.trendDelta)}</div>
                  <p className="text-xs text-slate-500">
                    {row.reviewPriority === "high"
                      ? "High Priority"
                      : row.reviewPriority === "monitor"
                        ? "Monitor"
                        : "On Track"}
                  </p>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
