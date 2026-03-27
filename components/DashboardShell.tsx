"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Papa from "papaparse";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";
import { useReactToPrint } from "react-to-print";
import CompareView from "@/components/CompareView";
import FilterBar from "@/components/FilterBar";
import GoalsView from "@/components/GoalsView";
import Leaderboard from "@/components/Leaderboard";
import Navbar from "@/components/Navbar";
import RiskBandBadge from "@/components/RiskBandBadge";
import StatCard from "@/components/StatCard";
import TeamAverageComparator from "@/components/TeamAverageComparator";
import TrendCharts from "@/components/TrendCharts";
import {
  buildDefaultBenchmarkConfig,
  coerceTrainingSession,
  exportToCSV,
  filterByDateRange,
  filterByDayOfWeek,
  filterByPlayers,
  formatSignedPercent,
  formatNumber,
  getBandDistribution,
  getBestPerformer,
  getCohortPlayers,
  getDateBounds,
  getMostSessions,
  getPeriodRange,
  getPlayerStats,
  getPlayerTrendSeries,
  getReviewQueue,
  getRiskBand,
  getTeamAverageRFD,
  getTeamLeaderboard,
  getTopPerformers,
  getTotalRevolutions,
  getUniquePlayers
} from "@/lib/dataUtils";
import { sampleTrainingData } from "@/lib/sampleData";
import type {
  BenchmarkConfig,
  DataSourceMeta,
  ReviewPriority,
  TrainingSession
} from "@/lib/types";

type TabKey = "overview" | "trends" | "compare" | "goals";
type SortKey =
  | "rank"
  | "player"
  | "avgRFD"
  | "sessions"
  | "trendDelta"
  | "teamDeltaPct"
  | "imbalancePct";
type CohortKey =
  | "all"
  | "above-average"
  | "below-average"
  | "high-frequency"
  | "low-frequency";
type DatePreset = "last7" | "last30" | "season";

const BENCHMARK_STORAGE_KEY = "topspin360-benchmarks";
const DASHBOARD_DATA_STORAGE_KEY = "topspin360-dashboard-data";
const DASHBOARD_SOURCE_STORAGE_KEY = "topspin360-dashboard-source";

const COHORT_LABELS: Record<CohortKey, string> = {
  all: "Full Team",
  "above-average": "Above Team Average",
  "below-average": "Below Team Average",
  "high-frequency": "High Frequency Trainers",
  "low-frequency": "Low Frequency Trainers"
};

function arraysEqual(left: string[], right: string[]) {
  return left.length === right.length && left.every((value, index) => value === right[index]);
}

function SectionPanel({
  title,
  items
}: {
  title: string;
  items: Array<{ label: string; value: string; tone?: string }>;
}) {
  return (
    <article className="rounded-3xl border border-white/60 bg-white/95 p-5 shadow-soft">
      <p className="text-xs font-semibold uppercase tracking-[0.24em] text-brand-blue/70">
        Spotlight
      </p>
      <h3 className="mt-2 text-lg font-semibold text-brand-ink">{title}</h3>
      <div className="mt-4 space-y-3">
        {items.length ? (
          items.map((item) => (
            <div
              key={item.label}
              className="rounded-2xl border border-slate-100 bg-slate-50/70 p-3"
            >
              <p className="text-sm font-medium text-brand-ink">{item.label}</p>
              <p className={`mt-1 text-sm ${item.tone ?? "text-slate-500"}`}>
                {item.value}
              </p>
            </div>
          ))
        ) : (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/70 p-4 text-sm text-slate-500">
            No players match the current filters.
          </div>
        )}
      </div>
    </article>
  );
}

function ReviewPanel({
  rows
}: {
  rows: Array<{
    player: string;
    reviewPriority: ReviewPriority;
    reviewReasons: string[];
  }>;
}) {
  const toneMap: Record<ReviewPriority, string> = {
    high: "bg-rose-50 text-rose-700",
    monitor: "bg-amber-50 text-amber-700",
    "on-track": "bg-emerald-50 text-emerald-700"
  };
  const labelMap: Record<ReviewPriority, string> = {
    high: "High Priority",
    monitor: "Monitor",
    "on-track": "On Track"
  };

  return (
    <article className="rounded-3xl border border-white/60 bg-white/95 p-5 shadow-soft">
      <p className="text-xs font-semibold uppercase tracking-[0.24em] text-brand-blue/70">
        Coach Review
      </p>
      <h3 className="mt-2 text-lg font-semibold text-brand-ink">Transparent review queue</h3>
      <div className="mt-4 space-y-3">
        {rows.map((row) => (
          <div
            key={row.player}
            className="rounded-2xl border border-slate-100 bg-slate-50/70 p-3"
          >
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-semibold text-brand-ink">{row.player}</p>
              <span className={`rounded-full px-3 py-1 text-xs font-semibold ${toneMap[row.reviewPriority]}`}>
                {labelMap[row.reviewPriority]}
              </span>
            </div>
            <p className="mt-2 text-xs text-slate-500">{row.reviewReasons.join(" • ")}</p>
          </div>
        ))}
      </div>
    </article>
  );
}

export default function DashboardShell({
  passwordProtectionEnabled = false
}: {
  passwordProtectionEnabled?: boolean;
}) {
  const [data, setData] = useState<TrainingSession[]>(sampleTrainingData);
  const [sourceMeta, setSourceMeta] = useState<DataSourceMeta>({
    source: "sample",
    message: "Manual sync mode is on. The dashboard will stay on local sample or CSV data until you click Sync Sheets."
  });
  const [viewMode, setViewMode] = useState<"individual" | "team">("team");
  const [activeTab, setActiveTab] = useState<TabKey>("overview");
  const [selectedCohort, setSelectedCohort] = useState<CohortKey>("all");
  const [selectedPlayers, setSelectedPlayers] = useState<string[]>([]);
  const [selectedDays, setSelectedDays] = useState<string[]>([]);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [selectedTrendPlayer, setSelectedTrendPlayer] = useState("");
  const [comparePlayers, setComparePlayers] = useState<string[]>([]);
  const [benchmarkConfig, setBenchmarkConfig] = useState<BenchmarkConfig>(
    buildDefaultBenchmarkConfig(sampleTrainingData)
  );
  const [sortKey, setSortKey] = useState<SortKey>("avgRFD");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  const [isSyncingSheets, setIsSyncingSheets] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);

  const dateBounds = useMemo(() => getDateBounds(data), [data]);
  const filteredByDate = useMemo(
    () => filterByDateRange(data, startDate, endDate),
    [data, startDate, endDate]
  );
  const filteredByDay = useMemo(
    () => filterByDayOfWeek(filteredByDate, selectedDays),
    [filteredByDate, selectedDays]
  );
  const teamScopeData = filteredByDay;
  const cohortPlayers = useMemo(
    () => getCohortPlayers(teamScopeData, selectedCohort),
    [teamScopeData, selectedCohort]
  );
  const cohortData = useMemo(
    () =>
      selectedCohort === "all"
        ? teamScopeData
        : filterByPlayers(teamScopeData, cohortPlayers),
    [teamScopeData, selectedCohort, cohortPlayers]
  );
  const players = useMemo(() => getUniquePlayers(cohortData), [cohortData]);
  const filteredData = useMemo(
    () => filterByPlayers(cohortData, selectedPlayers),
    [cohortData, selectedPlayers]
  );
  const filteredPlayers = useMemo(() => getUniquePlayers(filteredData), [filteredData]);
  const leaderboard = getTeamLeaderboard(filteredData, teamScopeData);
  const reviewQueue = getReviewQueue(
    selectedPlayers.length ? filteredData : cohortData,
    teamScopeData
  );
  const teamAverage = getTeamAverageRFD(teamScopeData);
  const displayedAverage = getTeamAverageRFD(filteredData);
  const displayedBand = getRiskBand(displayedAverage);
  const bandDistribution = getBandDistribution(filteredData);
  const sortedLeaderboard = [...leaderboard].sort((left, right) => {
    const direction = sortDirection === "asc" ? 1 : -1;

    if (sortKey === "player") {
      return left[sortKey].localeCompare(right[sortKey]) * direction;
    }

    return ((left[sortKey] as number) - (right[sortKey] as number)) * direction;
  });
  const rankedLeaderboard = sortedLeaderboard.map((row, index) => ({
    ...row,
    rank: index + 1
  }));
  const daysOfWeek = useMemo(
    () => [...new Set(data.map((session) => session.dayOfWeek))],
    [data]
  );
  const bestPerformer = getBestPerformer(filteredData);
  const previousRange = getPeriodRange(startDate || dateBounds.start, endDate || dateBounds.end);
  const previousTeamScopeData = previousRange
    ? filterByDayOfWeek(
        filterByDateRange(data, previousRange.previousStart, previousRange.previousEnd),
        selectedDays
      )
    : [];
  const previousCohortData =
    selectedCohort === "all"
      ? previousTeamScopeData
      : filterByPlayers(
          previousTeamScopeData,
          getCohortPlayers(previousTeamScopeData, selectedCohort)
        );
  const previousDisplayedData = filterByPlayers(previousCohortData, selectedPlayers);
  const previousDisplayedAverage = getTeamAverageRFD(previousDisplayedData);
  const displayedChangePct = previousDisplayedAverage
    ? ((displayedAverage - previousDisplayedAverage) / previousDisplayedAverage) * 100
    : 0;
  const overviewChartData = getTeamLeaderboard(
    selectedPlayers.length ? filteredData : cohortData,
    teamScopeData
  ).map((row) => ({
    player: row.player,
    ccwAvg: Number(row.ccwAvg.toFixed(2)),
    cwAvg: Number(row.cwAvg.toFixed(2)),
    avgRFD: Number(row.avgRFD.toFixed(2))
  }));
  const trendPlayer =
    (filteredPlayers.includes(selectedTrendPlayer) ? selectedTrendPlayer : "") ||
    filteredPlayers[0] ||
    players[0] ||
    sampleTrainingData[0]?.player ||
    "";
  const trendPlayerStats = getPlayerStats(filteredData, trendPlayer);
  const trendSessions = getPlayerTrendSeries(filteredData, trendPlayer, teamScopeData);

  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: "TopSpin360 Training Dashboard"
  });

  useEffect(() => {
    const storedData = window.localStorage.getItem(DASHBOARD_DATA_STORAGE_KEY);
    const storedSource = window.localStorage.getItem(DASHBOARD_SOURCE_STORAGE_KEY);

    if (storedData) {
      try {
        const parsed = JSON.parse(storedData) as TrainingSession[];

        if (Array.isArray(parsed) && parsed.length) {
          setData(parsed);
        }
      } catch {
        window.localStorage.removeItem(DASHBOARD_DATA_STORAGE_KEY);
      }
    }

    if (storedSource) {
      try {
        const parsed = JSON.parse(storedSource) as DataSourceMeta;
        setSourceMeta(parsed);
      } catch {
        window.localStorage.removeItem(DASHBOARD_SOURCE_STORAGE_KEY);
      }
    }
  }, []);

  useEffect(() => {
    const bounds = getDateBounds(data);

    if (!startDate) {
      setStartDate(bounds.start);
    }

    if (!endDate) {
      setEndDate(bounds.end);
    }

    if (!selectedTrendPlayer && players[0]) {
      setSelectedTrendPlayer(players[0]);
    }

    if (!comparePlayers.length) {
      setComparePlayers(players.slice(0, 3));
    }
  }, [comparePlayers.length, data, endDate, players, selectedTrendPlayer, startDate]);

  useEffect(() => {
    setSelectedPlayers((current) => {
      const next = current.filter((player) => players.includes(player));
      return arraysEqual(current, next) ? current : next;
    });
    setComparePlayers((current) => {
      const next = current.filter((player) => players.includes(player));
      return arraysEqual(current, next) ? current : next;
    });
  }, [players]);

  useEffect(() => {
    const stored = window.localStorage.getItem(BENCHMARK_STORAGE_KEY);
    const defaults = buildDefaultBenchmarkConfig(data);

    if (stored) {
      try {
        const parsed = JSON.parse(stored) as BenchmarkConfig;
        setBenchmarkConfig({
          thresholds: parsed.thresholds?.length ? parsed.thresholds : defaults.thresholds,
          teamSessionGoal: parsed.teamSessionGoal || defaults.teamSessionGoal,
          playerTargets: {
            ...defaults.playerTargets,
            ...parsed.playerTargets
          }
        });
        return;
      } catch {
        window.localStorage.removeItem(BENCHMARK_STORAGE_KEY);
      }
    }

    setBenchmarkConfig(defaults);
  }, [data]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    window.localStorage.setItem(
      BENCHMARK_STORAGE_KEY,
      JSON.stringify(benchmarkConfig)
    );
  }, [benchmarkConfig]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    window.localStorage.setItem(DASHBOARD_DATA_STORAGE_KEY, JSON.stringify(data));
    window.localStorage.setItem(
      DASHBOARD_SOURCE_STORAGE_KEY,
      JSON.stringify(sourceMeta)
    );
  }, [data, sourceMeta]);

  function handleSortChange(nextKey: SortKey) {
    if (sortKey === nextKey) {
      setSortDirection((current) => (current === "asc" ? "desc" : "asc"));
      return;
    }

    setSortKey(nextKey);
    setSortDirection(nextKey === "player" ? "asc" : "desc");
  }

  function handleCsvUpload(file: File) {
    Papa.parse<Record<string, unknown>>(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const cleaned = results.data
          .map((row, index) => coerceTrainingSession(row, index))
          .filter((row): row is TrainingSession => Boolean(row));

        if (cleaned.length) {
          setData(cleaned);
          setSelectedPlayers([]);
          setSelectedDays([]);
          setStartDate(getDateBounds(cleaned).start);
          setEndDate(getDateBounds(cleaned).end);
          setSelectedTrendPlayer(getUniquePlayers(cleaned)[0] ?? "");
          setComparePlayers(getUniquePlayers(cleaned).slice(0, 3));
          setSourceMeta({
            source: "csv",
            message: `Loaded ${cleaned.length} valid rows from ${file.name}. Non-name labels and invalid player IDs were excluded.`
          });
        }
      }
    });
  }

  async function handleSyncSheets() {
    setIsSyncingSheets(true);

    try {
      const response = await fetch("/api/sheets", {
        cache: "no-store",
        credentials: "same-origin"
      });
      const contentType = response.headers.get("content-type") || "";

      if (!contentType.includes("application/json")) {
        throw new Error(
          response.status === 401
            ? "You have been signed out. Log in again, then retry Sync Sheets."
            : `Sheets sync returned an unexpected response (${response.status}).`
        );
      }

      const payload = (await response.json()) as {
        data: TrainingSession[];
        source: DataSourceMeta["source"];
        message?: string;
        error?: string;
      };

      if (!response.ok) {
        throw new Error(payload.error || payload.message || "Unable to sync Google Sheets.");
      }

      if (Array.isArray(payload.data) && payload.data.length) {
        setData(payload.data);
        setSelectedPlayers([]);
        setSelectedDays([]);
        setStartDate(getDateBounds(payload.data).start);
        setEndDate(getDateBounds(payload.data).end);
        setSelectedTrendPlayer(getUniquePlayers(payload.data)[0] ?? "");
        setComparePlayers(getUniquePlayers(payload.data).slice(0, 3));
        setSourceMeta({
          source: payload.source,
          message:
            payload.message ??
            "Synced Google Sheets manually. Only full-name players are included."
        });
      } else {
        setSourceMeta({
          source: payload.source ?? "sample",
          message:
            payload.message ??
            "Manual sheet sync returned no valid player rows, so the current dataset was left unchanged."
        });
      }
    } catch (error) {
      setSourceMeta({
        source: "sample",
        message:
          error instanceof Error
            ? error.message
            : "Manual Sheets sync failed. The current dataset was left unchanged."
      });
    } finally {
      setIsSyncingSheets(false);
    }
  }

  function handleViewChange(nextView: "individual" | "team") {
    setViewMode(nextView);
    setActiveTab(nextView === "individual" ? "trends" : "overview");
  }

  function handleDayToggle(day: string) {
    setSelectedDays((current) =>
      current.includes(day)
        ? current.filter((value) => value !== day)
        : [...current, day]
    );
  }

  function handleApplyDatePreset(preset: DatePreset) {
    const anchor = dateBounds.end || endDate || dateBounds.start;

    if (preset === "season") {
      setStartDate("2025-03-01");
      setEndDate("2026-03-31");
      return;
    }

    if (!anchor) {
      return;
    }

    const anchorDate = new Date(`${anchor}T12:00:00`);
    const daysBack = preset === "last7" ? 6 : 29;
    anchorDate.setDate(anchorDate.getDate() - daysBack);
    const nextStart = anchorDate.toISOString().slice(0, 10);

    setStartDate(nextStart);
    setEndDate(anchor);
  }

  function handleExportCsv() {
    exportToCSV(filteredData);
  }

  const tabs: Array<{
    key: TabKey;
    label: string;
  }> = [
    { key: "overview", label: "Overview" },
    { key: "trends", label: "Trends" },
    { key: "compare", label: "Compare Players" },
    { key: "goals", label: "Goals & Benchmarks" }
  ];

  const topPerformers = getTopPerformers(filteredData).map((row) => ({
    label: row.player,
    value: `Best ${formatNumber(row.bestRFD)} • ${row.riskBand === "lowest" ? "Lowest Risk" : row.riskBand === "lower" ? "Lower Risk" : row.riskBand === "moderate" ? "Moderate Risk" : "High Risk"}`
  }));
  const mostSessions = getMostSessions(filteredData).map((row) => ({
    label: row.player,
    value: `${row.sessions} sessions`
  }));
  const playersAboveTeamAverage = rankedLeaderboard.filter((row) => row.teamDelta >= 0).length;

  return (
    <div className="min-h-screen pb-10">
      <Navbar
        viewMode={viewMode}
        onViewChange={handleViewChange}
        onExport={handleExportCsv}
        onSyncSheets={handleSyncSheets}
        isSyncing={isSyncingSheets}
        canLogout={passwordProtectionEnabled}
      />
      <FilterBar
        players={players}
        selectedPlayers={selectedPlayers}
        onPlayersChange={setSelectedPlayers}
        onSelectFullTeam={() => setSelectedPlayers(players)}
        onClearPlayers={() => setSelectedPlayers([])}
        selectedCohort={selectedCohort}
        onCohortChange={(value) => setSelectedCohort(value as CohortKey)}
        startDate={startDate || dateBounds.start}
        endDate={endDate || dateBounds.end}
        onStartDateChange={setStartDate}
        onEndDateChange={setEndDate}
        selectedDays={selectedDays}
        daysOfWeek={daysOfWeek}
        onDayToggle={handleDayToggle}
        onClearDays={() => setSelectedDays([])}
        onApplyDatePreset={handleApplyDatePreset}
        onCsvUpload={handleCsvUpload}
      />

      <main ref={printRef} className="print-panel mx-auto mt-6 max-w-7xl px-4 sm:px-6 lg:px-8">
        <section className="rounded-3xl border border-white/60 bg-gradient-to-r from-brand-blue to-sky-500 px-6 py-5 text-white shadow-soft">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-white/70">
                Data source
              </p>
              <h2 className="mt-1 text-2xl font-semibold">
                {sourceMeta.source === "sheets"
                  ? "Google Sheets connected"
                  : sourceMeta.source === "csv"
                    ? "CSV loaded"
                    : "Sample training data"}
              </h2>
            </div>
            <p className="max-w-2xl text-sm text-white/85">
              {sourceMeta.message ??
                "Track team readiness, compare players, and monitor benchmark progress in one dashboard."}
            </p>
          </div>
        </section>

        <section className="no-print mt-6 flex flex-wrap gap-2">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key)}
              className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                activeTab === tab.key
                  ? "bg-brand-ink text-white"
                  : "bg-white/90 text-slate-600 hover:text-brand-ink"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </section>

        {activeTab === "overview" ? (
          <section className="mt-6 space-y-6">
            <article className="rounded-3xl border border-white/60 bg-white/95 p-5 shadow-soft">
              <div className="grid gap-4 lg:grid-cols-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-brand-blue/70">
                    Active Cohort
                  </p>
                  <p className="mt-2 text-lg font-semibold text-brand-ink">
                    {COHORT_LABELS[selectedCohort]}
                  </p>
                  <p className="mt-1 text-sm text-slate-500">
                    {getUniquePlayers(filteredData).length} players in active view
                  </p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-brand-blue/70">
                    Team Context
                  </p>
                  <p className="mt-2 text-lg font-semibold text-brand-ink">
                    {playersAboveTeamAverage}/{rankedLeaderboard.length}
                  </p>
                  <p className="mt-1 text-sm text-slate-500">
                    players at or above team average
                  </p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-brand-blue/70">
                    Change vs Prior Period
                  </p>
                  <p className="mt-2 text-lg font-semibold text-brand-ink">
                    {formatSignedPercent(displayedChangePct)}
                  </p>
                  <p className="mt-1 text-sm text-slate-500">
                    current cohort average vs prior range
                  </p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-brand-blue/70">
                    Review Queue
                  </p>
                  <p className="mt-2 text-lg font-semibold text-brand-ink">
                    {reviewQueue.filter((row) => row.reviewPriority !== "on-track").length}
                  </p>
                  <p className="mt-1 text-sm text-slate-500">
                    players flagged for monitor or high priority
                  </p>
                </div>
              </div>
            </article>

            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <StatCard
                label="Cohort Avg RFD"
                value={formatNumber(displayedAverage)}
                subtext={startDate && endDate ? `${startDate} to ${endDate}` : "Current filters"}
                badge={<RiskBandBadge band={displayedBand} />}
                footer={
                  <TeamAverageComparator
                    delta={displayedAverage - teamAverage}
                    deltaPct={teamAverage ? ((displayedAverage - teamAverage) / teamAverage) * 100 : 0}
                  />
                }
              />
              <StatCard
                label="Best Performer"
                value={bestPerformer ? formatNumber(bestPerformer.bestRfd) : "0.00"}
                subtext={bestPerformer ? bestPerformer.player : "No sessions available"}
                badge={
                  bestPerformer ? <RiskBandBadge band={getRiskBand(bestPerformer.bestRfd)} /> : undefined
                }
                footer={
                  bestPerformer ? (
                    <TeamAverageComparator
                      delta={bestPerformer.bestRfd - teamAverage}
                      deltaPct={teamAverage ? ((bestPerformer.bestRfd - teamAverage) / teamAverage) * 100 : 0}
                    />
                  ) : undefined
                }
              />
              <StatCard
                label="Players Above Team Avg"
                value={`${playersAboveTeamAverage}`}
                subtext={`${rankedLeaderboard.length ? Math.round((playersAboveTeamAverage / rankedLeaderboard.length) * 100) : 0}% of active cohort`}
                footer={
                  <p className="text-sm font-semibold text-slate-600">
                    {String(rankedLeaderboard.length - playersAboveTeamAverage)} players remain below team average
                  </p>
                }
              />
              <StatCard
                label="Total Revolutions"
                value={String(getTotalRevolutions(filteredData))}
                subtext="Calculated as CW + CCW attempts per session"
                footer={
                  <div className="flex flex-wrap gap-2">
                    {bandDistribution.map((band) => (
                      <div
                        key={band.band}
                        className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600"
                      >
                        {band.label}: {band.count}
                      </div>
                    ))}
                  </div>
                }
              />
            </div>

            <div className="grid gap-6 xl:grid-cols-[2fr_0.9fr]">
              <Leaderboard
                rows={rankedLeaderboard}
                sortKey={sortKey}
                sortDirection={sortDirection}
                onSortChange={handleSortChange}
              />

              <div className="space-y-6">
                <ReviewPanel rows={reviewQueue} />
                <SectionPanel title="Top Performers" items={topPerformers} />
                <SectionPanel title="Most Sessions" items={mostSessions} />
              </div>
            </div>

            <article className="rounded-3xl border border-white/60 bg-white/95 p-5 shadow-soft">
              <div className="mb-4">
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-brand-blue/70">
                  Team View
                </p>
                <h3 className="text-xl font-semibold text-brand-ink">
                  Avg RFD CCW vs CW by player
                </h3>
              </div>
              <div className="h-96">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={overviewChartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#d9e2ef" />
                    <XAxis dataKey="player" stroke="#6b7280" interval={0} angle={-25} height={80} textAnchor="end" />
                    <YAxis stroke="#6b7280" />
                    <Tooltip formatter={(value: number) => formatNumber(value)} />
                    <ReferenceLine
                      y={teamAverage}
                      stroke="#10213a"
                      strokeDasharray="6 4"
                      label="Team Avg"
                    />
                    <Bar
                      dataKey="ccwAvg"
                      fill="#1a6fc4"
                      radius={[10, 10, 0, 0]}
                      onClick={(state) => {
                        const player = state?.payload?.player;

                        if (player) {
                          setSelectedTrendPlayer(player);
                          setActiveTab("trends");
                          setViewMode("individual");
                        }
                      }}
                    />
                    <Bar
                      dataKey="cwAvg"
                      fill="#e88c3a"
                      radius={[10, 10, 0, 0]}
                      onClick={(state) => {
                        const player = state?.payload?.player;

                        if (player) {
                          setSelectedTrendPlayer(player);
                          setActiveTab("trends");
                          setViewMode("individual");
                        }
                      }}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </article>
          </section>
        ) : null}

        {activeTab === "trends" ? (
          <section className="mt-6 space-y-6">
            <article className="no-print rounded-3xl border border-white/60 bg-white/95 p-5 shadow-soft">
              <label className="space-y-2">
                <span className="text-sm font-medium text-slate-700">Player</span>
                <select
                  value={trendPlayer}
                  onChange={(event) => setSelectedTrendPlayer(event.target.value)}
                  className="w-full max-w-sm rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none transition focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/20"
                >
                  {filteredPlayers.map((player) => (
                    <option key={player} value={player}>
                      {player}
                    </option>
                  ))}
                </select>
              </label>
            </article>

            <TrendCharts
              player={trendPlayer}
              sessions={trendSessions}
              playerStats={trendPlayerStats}
              teamAverage={teamAverage}
              dateRangeLabel={
                startDate && endDate ? `${startDate} to ${endDate}` : "Current window"
              }
            />
          </section>
        ) : null}

        {activeTab === "compare" ? (
          <section className="mt-6">
            <CompareView
              players={getUniquePlayers(filteredData)}
              selectedPlayers={comparePlayers}
              onSelectionChange={setComparePlayers}
              data={filteredData}
              teamAverage={teamAverage}
            />
          </section>
        ) : null}

        {activeTab === "goals" ? (
          <section className="mt-6">
            <GoalsView
              data={filteredData}
              players={getUniquePlayers(filteredData)}
              config={benchmarkConfig}
              onConfigChange={setBenchmarkConfig}
              onExportPdf={() => void handlePrint?.()}
              onExportCsv={handleExportCsv}
              teamAverage={teamAverage}
              teamAverageChangePct={displayedChangePct}
            />
          </section>
        ) : null}
      </main>
    </div>
  );
}
