"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";
import CoachNotesPanel from "@/components/CoachNotesPanel";
import { formatNumber, getOrderedWeekdays, getRiskBand } from "@/lib/dataUtils";
import type { AutoInsight, CoachNote, DayOfWeekPlayerHeatmapRow, DayOfWeekStat } from "@/lib/types";

type DayOfWeekViewProps = {
  data: DayOfWeekStat[];
  heatmap: DayOfWeekPlayerHeatmapRow[];
  teamAverage: number;
  players: string[];
  insights: AutoInsight[];
  teamToggle: "team" | "individual";
  onTeamToggle: (value: "team" | "individual") => void;
  selectedPlayer: string;
  onSelectedPlayerChange: (value: string) => void;
  notes: CoachNote[];
  onSaveNote: (note: Omit<CoachNote, "id" | "createdAt">) => void;
  noteDraft?: {
    playerName?: string;
    dayOfWeek?: string;
    noteDate?: string;
  } | null;
  onNoteDraftConsumed?: () => void;
};

const HEATMAP_RAMP = ["#e6f1fb", "#bfd8f2", "#8bb8e5", "#4f87c7", "#0c447c"];

function getHeatmapColor(value: number, min: number, max: number) {
  if (max <= min) {
    return HEATMAP_RAMP[2];
  }

  const ratio = (value - min) / (max - min);
  const index = Math.min(
    HEATMAP_RAMP.length - 1,
    Math.max(0, Math.round(ratio * (HEATMAP_RAMP.length - 1)))
  );
  return HEATMAP_RAMP[index];
}

function getBalanceTone(value: number) {
  if (value < 3) {
    return "bg-emerald-50 text-emerald-700";
  }

  if (value <= 6) {
    return "bg-amber-50 text-amber-700";
  }

  return "bg-rose-50 text-rose-700";
}

function InsightCard({ insight }: { insight: AutoInsight }) {
  const tones = {
    info: "bg-slate-50 text-slate-700",
    warning: "bg-amber-50 text-amber-700",
    positive: "bg-emerald-50 text-emerald-700"
  };
  const icons = {
    info: "i",
    warning: "!",
    positive: "↑"
  };

  return (
    <div className={`rounded-2xl p-4 ${tones[insight.tone]}`}>
      <div className="flex items-start gap-3">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/80 text-sm font-bold">
          {icons[insight.tone]}
        </span>
        <div>
          <p className="text-sm font-semibold">{insight.title}</p>
          <p className="mt-1 text-sm leading-6">{insight.body}</p>
        </div>
      </div>
    </div>
  );
}

export default function DayOfWeekView({
  data,
  heatmap,
  teamAverage,
  players,
  insights,
  teamToggle,
  onTeamToggle,
  selectedPlayer,
  onSelectedPlayerChange,
  notes,
  onSaveNote,
  noteDraft,
  onNoteDraftConsumed
}: DayOfWeekViewProps) {
  const orderedDays = getOrderedWeekdays(data.map((item) => item.day));
  const populated = data.filter((day) => day.sessionCount > 0);
  const bestDay = [...populated].sort((left, right) => right.avgRFD - left.avgRFD)[0];
  const worstDay = [...populated].sort((left, right) => left.avgRFD - right.avgRFD)[0];
  const mostActiveDay = [...populated].sort(
    (left, right) => right.sessionCount - left.sessionCount
  )[0];
  const bestBalanceDay = [...populated].sort(
    (left, right) => left.balancePct - right.balancePct
  )[0];
  const heatmapValues = heatmap.flatMap((row) =>
    Object.values(row.values).filter((value): value is number => value !== null)
  );
  const heatmapMin = Math.min(...heatmapValues, 0);
  const heatmapMax = Math.max(...heatmapValues, 1);

  return (
    <div className="space-y-6">
      <article className="rounded-3xl border border-white/60 bg-white/95 p-5 shadow-soft">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-brand-blue/70">
              Day of Week
            </p>
            <h3 className="mt-2 text-xl font-semibold text-brand-ink">
              Weekly training pattern view
            </h3>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="inline-flex rounded-full border border-slate-200 bg-slate-50 p-1">
              <button
                type="button"
                onClick={() => onTeamToggle("team")}
                className={`min-h-11 rounded-full px-4 py-2 text-sm font-semibold transition ${
                  teamToggle === "team"
                    ? "bg-brand-blue text-white"
                    : "text-slate-600 hover:text-brand-ink"
                }`}
              >
                Full team
              </button>
              <button
                type="button"
                onClick={() => onTeamToggle("individual")}
                className={`min-h-11 rounded-full px-4 py-2 text-sm font-semibold transition ${
                  teamToggle === "individual"
                    ? "bg-brand-blue text-white"
                    : "text-slate-600 hover:text-brand-ink"
                }`}
              >
                Individual
              </button>
            </div>

            {teamToggle === "individual" ? (
              <select
                value={selectedPlayer}
                onChange={(event) => onSelectedPlayerChange(event.target.value)}
                className="min-h-11 w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none transition focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/20 sm:w-72"
              >
                {players.map((player) => (
                  <option key={player} value={player}>
                    {player}
                  </option>
                ))}
              </select>
            ) : null}
          </div>
        </div>
      </article>

      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        {[
          {
            label: "Best day by avg RFD",
            value: bestDay ? `${bestDay.day}` : "No data",
            subtext: bestDay ? `${formatNumber(bestDay.avgRFD)} avg RFD` : "No sessions"
          },
          {
            label: "Worst day by avg RFD",
            value: worstDay ? `${worstDay.day}` : "No data",
            subtext: worstDay ? `${formatNumber(worstDay.avgRFD)} avg RFD` : "No sessions"
          },
          {
            label: "Most active day",
            value: mostActiveDay ? `${mostActiveDay.day}` : "No data",
            subtext: mostActiveDay ? `${mostActiveDay.sessionCount} sessions` : "No sessions"
          },
          {
            label: "Best CW/CCW balance day",
            value: bestBalanceDay ? `${bestBalanceDay.day}` : "No data",
            subtext: bestBalanceDay ? `${formatNumber(bestBalanceDay.balancePct)}% imbalance` : "No sessions"
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

      <div className="grid gap-6 xl:grid-cols-[1.35fr_0.95fr]">
        <article className="rounded-3xl border border-white/60 bg-white/95 p-5 shadow-soft">
          <div className="mb-4">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-brand-blue/70">
              Output by day
            </p>
            <h3 className="text-xl font-semibold text-brand-ink">Avg CCW vs CW</h3>
          </div>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data}>
                <CartesianGrid strokeDasharray="3 3" stroke="#d9e2ef" />
                <XAxis dataKey="day" stroke="#6b7280" />
                <YAxis stroke="#6b7280" />
                <Tooltip formatter={(value: number) => formatNumber(value)} />
                <ReferenceLine y={teamAverage} stroke="#10213a" strokeDasharray="6 4" label="Team Avg" />
                <Bar dataKey="avgCCW" fill="#1a6fc4" radius={[8, 8, 0, 0]} />
                <Bar dataKey="avgCW" fill="#e88c3a" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </article>

        <article className="rounded-3xl border border-white/60 bg-white/95 p-5 shadow-soft">
          <div className="mb-4">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-brand-blue/70">
              Session volume
            </p>
            <h3 className="text-xl font-semibold text-brand-ink">Sessions by day</h3>
          </div>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data}>
                <CartesianGrid strokeDasharray="3 3" stroke="#d9e2ef" />
                <XAxis dataKey="day" stroke="#6b7280" />
                <YAxis stroke="#6b7280" allowDecimals={false} />
                <Tooltip formatter={(value: number) => value} />
                <Bar dataKey="sessionCount" radius={[8, 8, 0, 0]}>
                  {data.map((item) => (
                    <Cell
                      key={item.day}
                      fill={
                        mostActiveDay && item.day === mostActiveDay.day
                          ? "#1a6fc4"
                          : "#bfd8f2"
                      }
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </article>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.35fr_0.95fr]">
        <article className="rounded-3xl border border-white/60 bg-white/95 p-5 shadow-soft">
          <div className="mb-4">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-brand-blue/70">
              Heatmap
            </p>
            <h3 className="text-xl font-semibold text-brand-ink">Top players by weekday</h3>
          </div>
          <div className="overflow-x-auto">
            <div className="min-w-[560px] space-y-2">
              <div
                className="grid gap-2"
                style={{ gridTemplateColumns: `180px repeat(${orderedDays.length}, minmax(88px, 1fr))` }}
              >
                <div />
                {orderedDays.map((day) => (
                  <div
                    key={day}
                    className="px-2 py-2 text-center text-xs font-semibold uppercase tracking-[0.16em] text-slate-500"
                  >
                    {day.slice(0, 3)}
                  </div>
                ))}
              </div>
              {heatmap.map((row) => (
                <div
                  key={row.player}
                  className="grid gap-2"
                  style={{ gridTemplateColumns: `180px repeat(${orderedDays.length}, minmax(88px, 1fr))` }}
                >
                  <div className="rounded-2xl bg-slate-50 px-3 py-3">
                    <p className="text-sm font-semibold text-brand-ink">{row.player}</p>
                    <p className="text-xs text-slate-500">{row.sessions} sessions</p>
                  </div>
                  {orderedDays.map((day) => {
                    const value = row.values[day];
                    const background = value === null ? "#f8fafc" : getHeatmapColor(value, heatmapMin, heatmapMax);
                    const textColor = value !== null && value > (heatmapMin + heatmapMax) / 2 ? "#ffffff" : "#10213a";

                    return (
                      <div
                        key={`${row.player}-${day}`}
                        className="flex min-h-[72px] items-center justify-center rounded-2xl px-2 py-3 text-sm font-semibold"
                        style={{ backgroundColor: background, color: textColor }}
                      >
                        {value === null ? "—" : formatNumber(value)}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </article>

        <article className="rounded-3xl border border-white/60 bg-white/95 p-5 shadow-soft">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-brand-blue/70">
            Auto insights
          </p>
          <h3 className="mt-2 text-xl font-semibold text-brand-ink">Coach readout</h3>
          <div className="mt-4 space-y-3">
            {insights.map((insight) => (
              <InsightCard key={insight.title} insight={insight} />
            ))}
          </div>
        </article>
      </div>

      <article className="overflow-x-auto rounded-3xl border border-white/60 bg-white/95 shadow-soft">
        <div className="border-b border-slate-100 px-5 py-4">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-brand-blue/70">
            Breakdown
          </p>
          <h3 className="text-xl font-semibold text-brand-ink">Day of week table</h3>
        </div>
        <table className="min-w-full text-left text-sm">
          <thead className="bg-slate-50/80">
            <tr>
              {["Day", "Sessions", "Avg RFD", "Avg CCW", "Avg CW", "Balance %"].map((label) => (
                <th key={label} className="px-4 py-4 font-semibold text-slate-700">
                  {label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((row) => (
              <tr key={row.day} className="border-t border-slate-100">
                <td className="px-4 py-4 font-semibold text-brand-ink">{row.day}</td>
                <td className="px-4 py-4 text-slate-700">{row.sessionCount}</td>
                <td className="px-4 py-4 text-slate-700">
                  {formatNumber(row.avgRFD)}
                  <span className="ml-2 inline-flex rounded-full bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-600">
                    {getRiskBand(row.avgRFD) === "lowest"
                      ? "Lowest Risk"
                      : getRiskBand(row.avgRFD) === "lower"
                        ? "Lower Risk"
                        : getRiskBand(row.avgRFD) === "moderate"
                          ? "Moderate Risk"
                          : "High Risk"}
                  </span>
                </td>
                <td className="px-4 py-4 text-slate-700">{formatNumber(row.avgCCW)}</td>
                <td className="px-4 py-4 text-slate-700">{formatNumber(row.avgCW)}</td>
                <td className="px-4 py-4">
                  <span className={`rounded-full px-3 py-1 text-xs font-semibold ${getBalanceTone(row.balancePct)}`}>
                    {formatNumber(row.balancePct)}%
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </article>

      <CoachNotesPanel
        title="Coach session notes"
        subtitle="Notes are scoped by player, day of week, and optional date."
        players={players}
        days={orderedDays}
        notes={notes}
        onSaveNote={onSaveNote}
        initialPlayer={teamToggle === "individual" ? selectedPlayer : "Full team"}
        draft={noteDraft}
        onDraftConsumed={onNoteDraftConsumed}
      />
    </div>
  );
}
