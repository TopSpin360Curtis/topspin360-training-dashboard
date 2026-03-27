"use client";

import { useMemo, useState } from "react";

type FilterBarProps = {
  players: string[];
  selectedPlayers: string[];
  onPlayersChange: (players: string[]) => void;
  onSelectFullTeam: () => void;
  onClearPlayers: () => void;
  selectedCohort: string;
  onCohortChange: (value: string) => void;
  startDate: string;
  endDate: string;
  onStartDateChange: (value: string) => void;
  onEndDateChange: (value: string) => void;
  selectedDays: string[];
  daysOfWeek: string[];
  onDayToggle: (value: string) => void;
  onClearDays: () => void;
  onApplyDatePreset: (preset: "last7" | "last30" | "season") => void;
  onCsvUpload: (file: File) => void;
};

export default function FilterBar({
  players,
  selectedPlayers,
  onPlayersChange,
  onSelectFullTeam,
  onClearPlayers,
  selectedCohort,
  onCohortChange,
  startDate,
  endDate,
  onStartDateChange,
  onEndDateChange,
  selectedDays,
  daysOfWeek,
  onDayToggle,
  onClearDays,
  onApplyDatePreset,
  onCsvUpload
}: FilterBarProps) {
  const [playerSearch, setPlayerSearch] = useState("");
  const filteredPlayers = useMemo(() => {
    const query = playerSearch.trim().toLowerCase();

    if (!query) {
      return players;
    }

    return players.filter((player) => player.toLowerCase().includes(query));
  }, [playerSearch, players]);

  return (
    <section className="no-print mx-auto mt-6 max-w-7xl px-4 sm:px-6 lg:px-8">
      <div className="rounded-3xl border border-white/60 bg-white/90 p-4 shadow-soft backdrop-blur">
        <div className="grid gap-4 lg:grid-cols-[1.5fr_1fr_1fr_0.8fr]">
          <div className="space-y-2">
            <div className="flex items-center justify-between gap-3">
              <span className="text-sm font-medium text-slate-700">Players</span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onSelectFullTeam}
                  className="rounded-full bg-brand-blue/10 px-3 py-1 text-xs font-semibold text-brand-blue transition hover:bg-brand-blue/15"
                >
                  Full Team
                </button>
                <button
                  type="button"
                  onClick={onClearPlayers}
                  className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600 transition hover:bg-slate-200"
                >
                  Clear
                </button>
              </div>
            </div>
            <input
              type="search"
              value={playerSearch}
              onChange={(event) => setPlayerSearch(event.target.value)}
              placeholder="Search players"
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 outline-none transition focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/20"
            />
            <div className="max-h-56 overflow-y-auto rounded-2xl border border-slate-200 bg-slate-50 p-2">
              <div className="flex flex-wrap gap-2">
                {filteredPlayers.length ? (
                  filteredPlayers.map((player) => {
                    const isSelected = selectedPlayers.includes(player);

                    return (
                      <button
                        key={player}
                        type="button"
                        onClick={() =>
                          onPlayersChange(
                            isSelected
                              ? selectedPlayers.filter((value) => value !== player)
                              : [...selectedPlayers, player]
                          )
                        }
                        className={`rounded-full px-3 py-2 text-sm font-medium transition ${
                          isSelected
                            ? "bg-brand-blue text-white"
                            : "bg-white text-slate-700 hover:bg-brand-blue/10"
                        }`}
                      >
                        {player}
                      </button>
                    );
                  })
                ) : (
                  <p className="px-2 py-3 text-sm text-slate-500">
                    No players match your search.
                  </p>
                )}
              </div>
            </div>
            <p className="text-xs text-slate-500">
              Click to toggle players without holding Command. Use Full Team to select everyone explicitly.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
            <label className="space-y-2">
              <span className="text-sm font-medium text-slate-700">Start date</span>
              <input
                type="date"
                value={startDate}
                onChange={(event) => onStartDateChange(event.target.value)}
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none transition focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/20"
              />
            </label>
            <label className="space-y-2">
              <span className="text-sm font-medium text-slate-700">End date</span>
              <input
                type="date"
                value={endDate}
                onChange={(event) => onEndDateChange(event.target.value)}
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none transition focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/20"
              />
            </label>
            <div className="space-y-2">
              <span className="text-sm font-medium text-slate-700">Quick ranges</span>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => onApplyDatePreset("last7")}
                  className="rounded-full bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-200"
                >
                  Last 7 days
                </button>
                <button
                  type="button"
                  onClick={() => onApplyDatePreset("last30")}
                  className="rounded-full bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-200"
                >
                  Last 30 days
                </button>
                <button
                  type="button"
                  onClick={() => onApplyDatePreset("season")}
                  className="rounded-full bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-200"
                >
                  Current season
                </button>
              </div>
            </div>
          </div>

          <div className="grid gap-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-3">
                <span className="text-sm font-medium text-slate-700">Day of week</span>
                <button
                  type="button"
                  onClick={onClearDays}
                  className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600 transition hover:bg-slate-200"
                >
                  All days
                </button>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-2">
                <div className="flex flex-wrap gap-2">
                  {daysOfWeek.map((day) => {
                    const isSelected = selectedDays.includes(day);

                    return (
                      <button
                        key={day}
                        type="button"
                        onClick={() => onDayToggle(day)}
                        className={`rounded-full px-3 py-2 text-sm font-medium transition ${
                          isSelected
                            ? "bg-brand-blue text-white"
                            : "bg-white text-slate-700 hover:bg-brand-blue/10"
                        }`}
                      >
                        {day}
                      </button>
                    );
                  })}
                </div>
              </div>
              <p className="text-xs text-slate-500">
                Left click to toggle one or many training days.
              </p>
            </div>

            <label className="space-y-2">
              <span className="text-sm font-medium text-slate-700">CSV fallback</span>
              <input
                type="file"
                accept=".csv,text/csv"
                onChange={(event) => {
                  const file = event.target.files?.[0];

                  if (file) {
                    onCsvUpload(file);
                  }
                }}
                className="block w-full text-sm text-slate-600 file:mr-3 file:rounded-full file:border-0 file:bg-brand-blue file:px-4 file:py-2 file:text-sm file:font-medium file:text-white hover:file:brightness-95"
              />
            </label>
          </div>

          <div className="rounded-2xl bg-brand-mist p-4">
            <label className="space-y-2">
              <span className="text-xs font-semibold uppercase tracking-[0.24em] text-brand-blue/70">
                Cohort Comparison
              </span>
              <select
                value={selectedCohort}
                onChange={(event) => onCohortChange(event.target.value)}
                className="w-full rounded-2xl border border-white/60 bg-white/80 px-3 py-2 text-sm text-slate-700 outline-none transition focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/20"
              >
                <option value="all">Full Team</option>
                <option value="above-average">Above Team Average</option>
                <option value="below-average">Below Team Average</option>
                <option value="high-frequency">High Frequency Trainers</option>
                <option value="low-frequency">Low Frequency Trainers</option>
              </select>
            </label>
            <ul className="mt-3 space-y-2 text-sm text-slate-700">
              <li>Cohorts are generated automatically from the current date and day filters.</li>
              <li>Player chips can still narrow the cohort further.</li>
              <li>Manual Sheets sync remains off until you click Sync Sheets.</li>
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
