"use client";

import type { MouseEvent } from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import InjuryDetailPanel from "@/components/InjuryDetailPanel";
import RiskBandBadge from "@/components/RiskBandBadge";
import TeamAverageComparator from "@/components/TeamAverageComparator";
import {
  formatDate,
  formatNumber,
  getInjuryDetailData,
  getInjuryRegisterRows
} from "@/lib/dataUtils";
import type { PlayerInjuryMap, TrainingSession } from "@/lib/types";

type InjuryViewProps = {
  availablePlayers: string[];
  players: string[];
  data: TrainingSession[];
  filteredData: TrainingSession[];
  injuries: PlayerInjuryMap;
  teamAverage: number;
  onAddInjuryRequest: (player: string) => void;
  onPlayerClick?: (player: string) => void;
  onPlayerContextMenu?: (player: string, event: MouseEvent<HTMLElement>) => void;
};

function formatInjuryType(value: "head" | "neck") {
  return value === "head" ? "Head" : "Neck";
}

export default function InjuryView({
  availablePlayers,
  players,
  data,
  filteredData,
  injuries,
  teamAverage,
  onAddInjuryRequest,
  onPlayerClick,
  onPlayerContextMenu
}: InjuryViewProps) {
  const [selectedInjuryId, setSelectedInjuryId] = useState<string | null>(null);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [playerSearch, setPlayerSearch] = useState("");
  const tableRef = useRef<HTMLDivElement | null>(null);
  const detailRef = useRef<HTMLDivElement | null>(null);

  const injuryRows = useMemo(
    () => getInjuryRegisterRows(players, filteredData, injuries),
    [filteredData, injuries, players]
  );
  const latestInjury = injuryRows[0];
  const uniquePlayersImpacted = new Set(injuryRows.map((row) => row.player)).size;
  const headCount = injuryRows.filter((row) => row.injury.type === "head").length;
  const neckCount = injuryRows.filter((row) => row.injury.type === "neck").length;
  const selectedRow =
    injuryRows.find((row) => row.id === selectedInjuryId) ?? null;
  const selectedDetail = useMemo(
    () =>
      selectedRow
        ? getInjuryDetailData(data, selectedRow.player, selectedRow.injury)
        : null,
    [data, selectedRow]
  );
  const searchablePlayers = useMemo(
    () =>
      Array.from(new Set([...availablePlayers, ...Object.keys(injuries)])).sort((left, right) =>
        left.localeCompare(right)
      ),
    [availablePlayers, injuries]
  );
  const filteredSearchPlayers = useMemo(() => {
    const query = playerSearch.trim().toLowerCase();

    if (!query) {
      return searchablePlayers;
    }

    return searchablePlayers.filter((player) => player.toLowerCase().includes(query));
  }, [playerSearch, searchablePlayers]);

  useEffect(() => {
    if (!injuryRows.length) {
      setSelectedInjuryId(null);
      return;
    }

    setSelectedInjuryId((current) =>
      current && injuryRows.some((row) => row.id === current) ? current : null
    );
  }, [injuryRows]);

  useEffect(() => {
    if (!selectedDetail || !detailRef.current) {
      return;
    }

    detailRef.current.scrollIntoView({
      behavior: "smooth",
      block: "start"
    });
  }, [selectedDetail]);

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
            Click any injury row for a deeper pre and post-injury drill-down. Players with no
            recorded training data still stay visible here.
          </p>
        </div>
        <div className="mt-5 border-t border-slate-100 pt-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-brand-blue/70">
                Add injury
              </p>
              <p className="mt-1 text-sm text-slate-500">
                Search for a player, then open the injury prompt to save a new record.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setIsAddOpen((current) => !current)}
              className="min-h-11 rounded-full bg-brand-blue px-4 py-2 text-sm font-semibold text-white transition hover:brightness-95"
            >
              {isAddOpen ? "Close" : "Add injury"}
            </button>
          </div>

          {isAddOpen ? (
            <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
              <label className="block">
                <span className="text-sm font-medium text-slate-700">Search player</span>
                <input
                  type="text"
                  value={playerSearch}
                  onChange={(event) => setPlayerSearch(event.target.value)}
                  placeholder="Search for a player name..."
                  className="mt-2 min-h-11 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none transition focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/20"
                />
              </label>

              <div className="mt-3 max-h-64 overflow-y-auto rounded-2xl border border-slate-200 bg-white">
                {filteredSearchPlayers.length ? (
                  filteredSearchPlayers.map((player) => (
                    <button
                      key={player}
                      type="button"
                      onClick={() => {
                        setIsAddOpen(false);
                        setPlayerSearch("");
                        onAddInjuryRequest(player);
                      }}
                      className="flex min-h-11 w-full items-center justify-between border-b border-slate-100 px-4 py-3 text-left text-sm text-slate-700 transition hover:bg-slate-50 last:border-b-0"
                    >
                      <span className="font-medium text-brand-ink">{player}</span>
                      <span className="text-xs font-semibold uppercase tracking-[0.16em] text-brand-blue/70">
                        Select
                      </span>
                    </button>
                  ))
                ) : (
                  <div className="px-4 py-5 text-sm text-slate-500">
                    No players match that search yet.
                  </div>
                )}
              </div>
            </div>
          ) : null}
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

      <div
        ref={tableRef}
        className="overflow-x-auto rounded-3xl border border-white/60 bg-white/95 shadow-soft"
      >
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
                {[
                  "Player",
                  "Type",
                  "Injury date",
                  "Avg RFD",
                  "Sessions",
                  "Most Recent",
                  "Risk Band",
                  "Vs Team"
                ].map(
                  (label) => (
                    <th key={label} className="px-4 py-4 font-semibold text-slate-700">
                      {label}
                    </th>
                  )
                )}
              </tr>
            </thead>
            <tbody>
              {injuryRows.map((row) => {
                const isSelected = row.id === selectedInjuryId;

                return (
                  <tr
                    key={row.id}
                    onClick={() => setSelectedInjuryId(row.id)}
                    className={`cursor-pointer border-t border-slate-100 transition hover:bg-slate-50/80 ${
                      isSelected ? "bg-brand-blue/5 ring-1 ring-inset ring-brand-blue/20" : ""
                    }`}
                  >
                    <td className="px-4 py-4 font-semibold text-brand-ink">
                      <button
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation();
                          onPlayerClick?.(row.player);
                        }}
                        onContextMenu={(event) => {
                          event.stopPropagation();
                          onPlayerContextMenu?.(row.player, event);
                        }}
                        className="transition hover:text-brand-blue"
                      >
                        {row.player}
                      </button>
                    </td>
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
                    <td className="px-4 py-4 text-slate-700">
                      {row.hasTrainingData ? formatNumber(row.stats.avgRFD) : "—"}
                    </td>
                    <td className="px-4 py-4 text-slate-700">
                      <div className="space-y-1">
                        <p>{row.stats.sessions}</p>
                        {!row.hasTrainingData ? (
                          <p className="text-xs text-slate-500">0 training sessions recorded</p>
                        ) : null}
                      </div>
                    </td>
                    <td className="px-4 py-4 text-slate-700">
                      {row.latestSessionDate ? (
                        <div className="space-y-1">
                          <p className="font-medium text-brand-ink">
                            {formatNumber(row.latestBestRFD ?? 0)}
                          </p>
                          <p className="text-xs text-slate-500">
                            {formatDate(row.latestSessionDate)}
                          </p>
                        </div>
                      ) : (
                        <span className="text-sm text-slate-400">—</span>
                      )}
                    </td>
                    <td className="px-4 py-4">
                      {row.hasTrainingData ? (
                        <RiskBandBadge band={row.stats.riskBand} compact />
                      ) : (
                        <span className="text-sm text-slate-400">—</span>
                      )}
                    </td>
                    <td className="px-4 py-4">
                      {row.hasTrainingData ? (
                        <TeamAverageComparator
                          delta={row.stats.avgRFD - teamAverage}
                          deltaPct={
                            teamAverage ? ((row.stats.avgRFD - teamAverage) / teamAverage) * 100 : 0
                          }
                          compact
                        />
                      ) : (
                        <span className="text-sm text-slate-400">—</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        ) : (
          <div className="p-5 text-sm text-slate-500">
            No injury records are logged for the active profile yet. Right-click a player name and
            choose <span className="font-semibold text-brand-ink">Mark as Injured</span>.
          </div>
        )}
      </div>

      {selectedDetail ? (
        <div ref={detailRef}>
          <InjuryDetailPanel
            detail={selectedDetail}
            onReturnToList={() =>
              tableRef.current?.scrollIntoView({
                behavior: "smooth",
                block: "start"
              })
            }
          />
        </div>
      ) : null}
    </div>
  );
}
