"use client";

import type { MouseEvent } from "react";
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
import AlertsModal from "@/components/AlertsModal";
import AdminAccessModal from "@/components/AdminAccessModal";
import CoachNotesPanel from "@/components/CoachNotesPanel";
import CompareView from "@/components/CompareView";
import DayOfWeekView from "@/components/DayOfWeekView";
import FilterBar from "@/components/FilterBar";
import GoalsView from "@/components/GoalsView";
import InjuryModal from "@/components/InjuryModal";
import InjuryView from "@/components/InjuryView";
import Leaderboard from "@/components/Leaderboard";
import Navbar from "@/components/Navbar";
import PlayerQuickViewDrawer from "@/components/PlayerQuickViewDrawer";
import RiskBandBadge from "@/components/RiskBandBadge";
import StatCard from "@/components/StatCard";
import TeamAverageComparator from "@/components/TeamAverageComparator";
import TrendCharts from "@/components/TrendCharts";
import {
  buildDefaultBenchmarkConfig,
  coerceTrainingSession,
  extractUnclaimedTrainingRows,
  exportToCSV,
  filterByDateRange,
  filterByDayOfWeek,
  filterByPlayers,
  getDayOfWeekHeatmapData,
  getDayOfWeekInsights,
  getDayOfWeekStats,
  formatSignedPercent,
  formatNumber,
  getBandDistribution,
  getBestPerformer,
  getCohortPlayers,
  getDateBounds,
  getHighPriorityAlerts,
  getMostSessions,
  getOrderedWeekdays,
  getPeriodRange,
  getRecentPlayerSessions,
  getPlayerStats,
  getPlayerTrendSeries,
  getRiskBand,
  getTodayIso,
  getTeamAverageRFD,
  getTeamLeaderboard,
  getTopPerformers,
  getUniquePlayers
} from "@/lib/dataUtils";
import { exportElementToPdf } from "@/lib/exportPdf";
import { loadPlayerInjuries, savePlayerInjuries } from "@/lib/injuryStorage";
import { loadCoachNotes, saveCoachNotes } from "@/lib/notesStorage";
import { sampleTrainingData } from "@/lib/sampleData";
import { getLoginPathForTenant } from "@/lib/auth";
import type {
  BenchmarkConfig,
  CoachNote,
  DataSourceMeta,
  DashboardProfile,
  DashboardTenant,
  PlayerInjury,
  PlayerInjuryMap,
  PlayerAlert,
  ReviewPriority,
  TrainingSession
} from "@/lib/types";

type TabKey = "overview" | "trends" | "compare" | "dayOfWeek" | "injury" | "goals";
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
type DatePreset = "last7" | "last30" | "season" | "season2024" | "season2023";

const BENCHMARK_STORAGE_KEY = "topspin360-benchmarks";
const DASHBOARD_DATA_STORAGE_KEY = "topspin360-dashboard-data";
const DASHBOARD_SOURCE_STORAGE_KEY = "topspin360-dashboard-source";
const PROFILE_LABELS: Record<DashboardProfile, string> = {
  team: "Team",
  test: "Test"
};

function getBenchmarkStorageKey(namespace: string) {
  return `${BENCHMARK_STORAGE_KEY}-${namespace}`;
}

function getDataStorageKey(namespace: string) {
  return `${DASHBOARD_DATA_STORAGE_KEY}-${namespace}`;
}

function getSourceStorageKey(namespace: string) {
  return `${DASHBOARD_SOURCE_STORAGE_KEY}-${namespace}`;
}

function getDefaultSourceMeta(profile: DashboardProfile): DataSourceMeta {
  return {
    source: "sample",
    profile,
    message: `Manual sync mode is on for the ${PROFILE_LABELS[profile]} profile. The dashboard will stay on cached, sample, or CSV data until you click Sync Sheets.`
  };
}

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

function formatLastUpdated(value?: string) {
  if (!value) {
    return "Not synced yet";
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit"
  }).format(new Date(value));
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
  rows,
  onPlayerClick,
  onPlayerContextMenu
}: {
  rows: Array<{
    player: string;
    reviewPriority: ReviewPriority;
    reviewReasons: string[];
  }>;
  onPlayerClick?: (player: string) => void;
  onPlayerContextMenu?: (player: string, event: MouseEvent<HTMLElement>) => void;
}) {
  const toneMap: Record<ReviewPriority, string> = {
    high: "border-rose-300 bg-rose-50/90 text-rose-700",
    monitor: "border-amber-300 bg-amber-50/90 text-amber-700",
    "on-track": "border-emerald-300 bg-emerald-50/90 text-emerald-700"
  };
  const labelMap: Record<ReviewPriority, string> = {
    high: "High Priority",
    monitor: "Monitor",
    "on-track": "On Track"
  };
  const [showAll, setShowAll] = useState(false);
  const [expandedPlayer, setExpandedPlayer] = useState<string | null>(null);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const visibleRows = showAll ? rows : rows.slice(0, 4);

  return (
    <article className="rounded-3xl border border-white/60 bg-white/95 p-5 shadow-soft">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-lg font-semibold text-brand-ink">Review Queue</h3>
          <p className="mt-1 text-sm text-slate-500">{rows.length} players flagged</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {rows.length > 4 ? (
            <button
              type="button"
              onClick={() => setShowAll((current) => !current)}
              className="min-h-11 rounded-full bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-200"
            >
              {showAll ? "Show fewer" : `View all ${rows.length} →`}
            </button>
          ) : null}
          <button
            type="button"
            onClick={() => setIsCollapsed((current) => !current)}
            className="min-h-11 rounded-full bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-200"
          >
            {isCollapsed ? "Expand" : "Collapse"}
          </button>
        </div>
      </div>

      {!isCollapsed ? (
        <div className="mt-4 space-y-3">
        {visibleRows.map((row) => {
          const isExpanded = expandedPlayer === row.player;

          return (
            <div
              key={row.player}
              onClick={() =>
                setExpandedPlayer((current) => (current === row.player ? null : row.player))
              }
              className={`w-full rounded-2xl border-l-4 p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${toneMap[row.reviewPriority]}`}
              onContextMenu={(event) => onPlayerContextMenu?.(row.player, event)}
            >
              <div className="flex items-start justify-between gap-3">
                <button
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation();
                    onPlayerClick?.(row.player);
                  }}
                  className="text-sm font-semibold text-brand-ink transition hover:text-brand-blue"
                >
                  {row.player}
                </button>
                <span className="rounded-full bg-white/80 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em]">
                  {labelMap[row.reviewPriority]}
                </span>
              </div>
              <p
                className={`mt-3 text-sm leading-6 text-slate-600 ${
                  isExpanded ? "" : "line-clamp-2"
                }`}
              >
                {row.reviewReasons.join(" · ")}
              </p>
            </div>
          );
        })}
        {!rows.length ? (
          <div className="w-full rounded-2xl border border-dashed border-slate-200 bg-slate-50/70 p-4 text-sm text-slate-500">
            No players are currently flagged in the active cohort.
          </div>
        ) : null}
        </div>
      ) : (
        <div className="mt-4 rounded-2xl border border-dashed border-slate-200 bg-slate-50/70 p-4 text-sm text-slate-500">
          Coach review is collapsed. Expand to see flagged players.
        </div>
      )}
    </article>
  );
}

export default function DashboardShell({
  passwordProtectionEnabled = false,
  authenticatedTenant = null
}: {
  passwordProtectionEnabled?: boolean;
  authenticatedTenant?: DashboardTenant | null;
}) {
  const modeLocked = Boolean(passwordProtectionEnabled && authenticatedTenant);
  const [activeProfile, setActiveProfile] = useState<DashboardProfile>(
    authenticatedTenant?.profile ?? "team"
  );
  const [data, setData] = useState<TrainingSession[]>(sampleTrainingData);
  const [sourceMeta, setSourceMeta] = useState<DataSourceMeta>(
    getDefaultSourceMeta(authenticatedTenant?.profile ?? "team")
  );
  const [viewMode, setViewMode] = useState<"individual" | "team">("team");
  const [activeTab, setActiveTab] = useState<TabKey>("overview");
  const [selectedCohort, setSelectedCohort] = useState<CohortKey>("all");
  const [selectedPlayers, setSelectedPlayers] = useState<string[]>([]);
  const [selectedDays, setSelectedDays] = useState<string[]>([]);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [selectedTrendPlayer, setSelectedTrendPlayer] = useState("");
  const [trendPlayerSearch, setTrendPlayerSearch] = useState("");
  const [comparePlayers, setComparePlayers] = useState<string[]>([]);
  const [benchmarkConfig, setBenchmarkConfig] = useState<BenchmarkConfig>(
    buildDefaultBenchmarkConfig(sampleTrainingData)
  );
  const [sortKey, setSortKey] = useState<SortKey>("avgRFD");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  const [isSyncingSheets, setIsSyncingSheets] = useState(false);
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [coachNotes, setCoachNotes] = useState<CoachNote[]>([]);
  const [dayViewMode, setDayViewMode] = useState<"team" | "individual">("team");
  const [selectedDayPlayer, setSelectedDayPlayer] = useState("");
  const [alerts, setAlerts] = useState<PlayerAlert[]>([]);
  const [isAlertsOpen, setIsAlertsOpen] = useState(false);
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [playerInjuries, setPlayerInjuries] = useState<PlayerInjuryMap>({});
  const [contextMenu, setContextMenu] = useState<{
    player: string;
    x: number;
    y: number;
  } | null>(null);
  const [injuryModalPlayer, setInjuryModalPlayer] = useState<string | null>(null);
  const [selectedPlayerDetail, setSelectedPlayerDetail] = useState<string | null>(null);
  const [noteDraft, setNoteDraft] = useState<{
    playerName?: string;
    dayOfWeek?: string;
    noteDate?: string;
  } | null>(null);
  const overviewExportRef = useRef<HTMLElement | null>(null);
  const trendsExportRef = useRef<HTMLElement | null>(null);
  const compareExportRef = useRef<HTMLElement | null>(null);
  const dayOfWeekExportRef = useRef<HTMLElement | null>(null);
  const injuryExportRef = useRef<HTMLElement | null>(null);
  const goalsExportRef = useRef<HTMLElement | null>(null);
  const autoSyncedNamespaceRef = useRef<string | null>(null);
  const [profileReady, setProfileReady] = useState(false);
  const storageNamespace = authenticatedTenant ? `tenant-${authenticatedTenant.id}` : activeProfile;
  const activeDatasetLabel = authenticatedTenant?.label ?? PROFILE_LABELS[activeProfile];
  const canExport = authenticatedTenant?.canExport ?? true;
  const isAdmin = authenticatedTenant?.role === "admin";

  useEffect(() => {
    if (modeLocked && authenticatedTenant && activeProfile !== authenticatedTenant.profile) {
      setActiveProfile(authenticatedTenant.profile);
    }
  }, [activeProfile, authenticatedTenant, modeLocked]);

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
  const profilePlayers = useMemo(() => getUniquePlayers(data), [data]);
  const filteredData = useMemo(
    () => filterByPlayers(cohortData, selectedPlayers),
    [cohortData, selectedPlayers]
  );
  const filteredPlayers = useMemo(() => getUniquePlayers(filteredData), [filteredData]);
  const filteredUnclaimedSessions = useMemo(() => {
    const rows = sourceMeta.unclaimedRows ?? [];

    return rows.filter((row) => {
      if (startDate && row.date && row.date < startDate) {
        return false;
      }

      if (endDate && row.date && row.date > endDate) {
        return false;
      }

      if (selectedDays.length && row.dayOfWeek && !selectedDays.includes(row.dayOfWeek)) {
        return false;
      }

      if ((startDate || endDate) && !row.date) {
        return false;
      }

      return true;
    }).length;
  }, [endDate, selectedDays, sourceMeta.unclaimedRows, startDate]);
  const trendSelectablePlayers = useMemo(() => {
    const query = trendPlayerSearch.trim().toLowerCase();

    if (!query) {
      return filteredPlayers;
    }

    return filteredPlayers.filter((player) => player.toLowerCase().includes(query));
  }, [filteredPlayers, trendPlayerSearch]);
  const leaderboard = getTeamLeaderboard(filteredData, teamScopeData);
  const flaggedPlayers = getTeamLeaderboard(
    selectedPlayers.length ? filteredData : cohortData,
    teamScopeData
  ).filter((row) => row.reviewPriority !== "on-track");
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
    () => getOrderedWeekdays([...new Set(data.map((session) => session.dayOfWeek))]),
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
  const playerQuickViewStats = selectedPlayerDetail
    ? getPlayerStats(filteredData, selectedPlayerDetail)
    : null;
  const playerQuickViewTrendSessions = selectedPlayerDetail
    ? getPlayerTrendSeries(filteredData, selectedPlayerDetail, teamScopeData)
    : [];
  const playerQuickViewRecentSessions = selectedPlayerDetail
    ? getRecentPlayerSessions(filteredData, selectedPlayerDetail, 5)
    : [];
  const dayPlayer = players.includes(selectedDayPlayer) ? selectedDayPlayer : players[0] || "";
  const dayScopedData =
    dayViewMode === "individual" && dayPlayer
      ? filterByPlayers(filteredData, [dayPlayer])
      : filteredData;
  const dayOfWeekStats = getDayOfWeekStats(dayScopedData);
  const dayOfWeekHeatmap = getDayOfWeekHeatmapData(
    dayViewMode === "individual" ? filterByPlayers(filteredData, [dayPlayer]) : filteredData,
    daysOfWeek
  );
  const dayOfWeekInsights = getDayOfWeekInsights(dayOfWeekStats);

  useEffect(() => {
    setCoachNotes(loadCoachNotes(storageNamespace));
  }, [storageNamespace]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    setProfileReady(false);
    const storedData = window.localStorage.getItem(getDataStorageKey(storageNamespace));
    const storedSource = window.localStorage.getItem(getSourceStorageKey(storageNamespace));
    let nextData = sampleTrainingData;
    let nextSource = getDefaultSourceMeta(activeProfile);

    if (storedData) {
      try {
        const parsed = JSON.parse(storedData) as TrainingSession[];

        if (Array.isArray(parsed) && parsed.length) {
          nextData = parsed;
        }
      } catch {
        window.localStorage.removeItem(getDataStorageKey(storageNamespace));
      }
    }

    if (storedSource) {
      try {
        const parsed = JSON.parse(storedSource) as DataSourceMeta;

        nextSource = {
          ...parsed,
          profile: activeProfile
        };
      } catch {
        window.localStorage.removeItem(getSourceStorageKey(storageNamespace));
      }
    }

    const nextPlayers = getUniquePlayers(nextData);
    const nextBounds = getDateBounds(nextData);

    setData(nextData);
    setSourceMeta(nextSource);
    setSelectedPlayers([]);
    setSelectedDays([]);
    setStartDate(nextBounds.start);
    setEndDate(nextBounds.end);
    setSelectedTrendPlayer(nextPlayers[0] ?? "");
    setTrendPlayerSearch("");
    setComparePlayers(nextPlayers.slice(0, 3));
    setSelectedDayPlayer(nextPlayers[0] ?? "");
    setPlayerInjuries(loadPlayerInjuries(activeProfile, storageNamespace));
    setProfileReady(true);
  }, [activeProfile, storageNamespace]);

  useEffect(() => {
    if (!authenticatedTenant || !profileReady) {
      return;
    }

    if (autoSyncedNamespaceRef.current === storageNamespace) {
      return;
    }

    autoSyncedNamespaceRef.current = storageNamespace;
    void handleSyncSheets();
  }, [authenticatedTenant, profileReady, storageNamespace]);

  function handleProfileChange(nextProfile: DashboardProfile) {
    if (modeLocked) {
      return;
    }

    setActiveProfile(nextProfile);
  }

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

    if (!selectedDayPlayer && players[0]) {
      setSelectedDayPlayer(players[0]);
    }
  }, [
    comparePlayers.length,
    data,
    endDate,
    players,
    selectedDayPlayer,
    selectedTrendPlayer,
    startDate
  ]);

  useEffect(() => {
    setSelectedPlayers((current) => {
      const next = current.filter((player) => players.includes(player));
      return arraysEqual(current, next) ? current : next;
    });
    setComparePlayers((current) => {
      const next = current.filter((player) => players.includes(player));
      return arraysEqual(current, next) ? current : next;
    });
    setSelectedDayPlayer((current) =>
      current && players.includes(current) ? current : players[0] ?? ""
    );
  }, [players]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const stored = window.localStorage.getItem(getBenchmarkStorageKey(storageNamespace));
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
        window.localStorage.removeItem(getBenchmarkStorageKey(storageNamespace));
      }
    }

    setBenchmarkConfig(defaults);
  }, [data, storageNamespace]);

  useEffect(() => {
    if (typeof window === "undefined" || !profileReady) {
      return;
    }

    window.localStorage.setItem(
      getBenchmarkStorageKey(storageNamespace),
      JSON.stringify(benchmarkConfig)
    );
  }, [benchmarkConfig, profileReady, storageNamespace]);

  useEffect(() => {
    if (typeof window === "undefined" || !profileReady) {
      return;
    }

    window.localStorage.setItem(getDataStorageKey(storageNamespace), JSON.stringify(data));
    window.localStorage.setItem(
      getSourceStorageKey(storageNamespace),
      JSON.stringify(sourceMeta)
    );
  }, [data, profileReady, sourceMeta, storageNamespace]);

  useEffect(() => {
    saveCoachNotes(coachNotes, storageNamespace);
  }, [coachNotes, storageNamespace]);

  useEffect(() => {
    if (!profileReady) {
      return;
    }

    savePlayerInjuries(activeProfile, playerInjuries, storageNamespace);
  }, [activeProfile, playerInjuries, profileReady, storageNamespace]);

  useEffect(() => {
    setAlerts(getHighPriorityAlerts(selectedPlayers.length ? filteredData : cohortData, teamScopeData));
  }, [cohortData, filteredData, selectedPlayers.length, teamScopeData]);

  useEffect(() => {
    if (!contextMenu) {
      return;
    }

    function handleDismiss() {
      setContextMenu(null);
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setContextMenu(null);
      }
    }

    window.addEventListener("click", handleDismiss);
    window.addEventListener("scroll", handleDismiss, true);
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("click", handleDismiss);
      window.removeEventListener("scroll", handleDismiss, true);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [contextMenu]);

  function handleSortChange(nextKey: SortKey) {
    if (sortKey === nextKey) {
      setSortDirection((current) => (current === "asc" ? "desc" : "asc"));
      return;
    }

    setSortKey(nextKey);
    setSortDirection(nextKey === "player" ? "asc" : "desc");
  }

  function handlePlayerContextMenu(
    player: string,
    event: MouseEvent<HTMLElement>
  ) {
    event.preventDefault();
    setContextMenu({
      player,
      x: event.clientX,
      y: event.clientY
    });
  }

  function handleCsvUpload(file: File) {
    Papa.parse<Record<string, unknown>>(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const cleaned = results.data
          .map((row, index) => coerceTrainingSession(row, index))
          .filter((row): row is TrainingSession => Boolean(row));
        const unclaimedRows = extractUnclaimedTrainingRows(results.data);

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
            profile: activeProfile,
            message: `Loaded ${cleaned.length} valid rows into ${activeDatasetLabel} from ${file.name}.`,
            updatedAt: new Date().toISOString(),
            unclaimedSessions: unclaimedRows.length,
            unclaimedRows
          });
        }
      }
    });
  }

  async function handleSyncSheets() {
    setIsSyncingSheets(true);

    try {
      const response = await fetch(`/api/sheets?profile=${activeProfile}`, {
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
        profile?: DashboardProfile;
        message?: string;
        error?: string;
        unclaimedSessions?: number;
        unclaimedRows?: DataSourceMeta["unclaimedRows"];
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
          profile: payload.profile ?? activeProfile,
          message:
            payload.message ??
            `Synced ${activeDatasetLabel} Google Sheets manually. Only full-name players are included.`,
          updatedAt: new Date().toISOString(),
          unclaimedSessions: payload.unclaimedSessions ?? 0,
          unclaimedRows: payload.unclaimedRows ?? []
        });
      } else {
        setSourceMeta({
          source: payload.source ?? "sample",
          profile: payload.profile ?? activeProfile,
          message:
            payload.message ??
            "Manual sheet sync returned no valid player rows, so the current dataset was left unchanged.",
          updatedAt: new Date().toISOString(),
          unclaimedSessions: payload.unclaimedSessions ?? 0,
          unclaimedRows: payload.unclaimedRows ?? []
        });
      }
    } catch (error) {
      setSourceMeta({
        source: "sample",
        profile: activeProfile,
        message:
          error instanceof Error
            ? error.message
            : "Manual Sheets sync failed. The current dataset was left unchanged.",
        updatedAt: new Date().toISOString(),
        unclaimedSessions: sourceMeta.unclaimedSessions ?? 0,
        unclaimedRows: sourceMeta.unclaimedRows ?? []
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
    const anchor = getTodayIso();

    if (preset === "season") {
      setStartDate("2025-03-01");
      setEndDate("2026-03-31");
      return;
    }

    if (preset === "season2024") {
      setStartDate("2024-03-01");
      setEndDate("2025-03-31");
      return;
    }

    if (preset === "season2023") {
      setStartDate("2023-03-01");
      setEndDate("2024-03-31");
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
    if (!canExport) {
      return;
    }

    exportToCSV(filteredData);
  }

  async function handleExportPdf() {
    if (!canExport) {
      return;
    }

    const tabTargets: Record<TabKey, HTMLElement | null> = {
      overview: overviewExportRef.current,
      trends: trendsExportRef.current,
      compare: compareExportRef.current,
      dayOfWeek: dayOfWeekExportRef.current,
      injury: injuryExportRef.current,
      goals: goalsExportRef.current
    };
    const target = tabTargets[activeTab];

    if (!target || typeof window === "undefined") {
      return;
    }

    setIsExportingPdf(true);

    try {
      await exportElementToPdf({
        element: target,
        fileName: `topspin360-${authenticatedTenant?.id ?? activeProfile}-${activeTab}.pdf`
      });
    } finally {
      setIsExportingPdf(false);
    }
  }

  function scrollToReviewQueue() {
    document.getElementById("coach-review-queue")?.scrollIntoView({
      behavior: "smooth",
      block: "start"
    });
  }

  function handleSaveCoachNote(note: Omit<CoachNote, "id" | "createdAt">) {
    setCoachNotes((current) => [
      {
        ...note,
        id: `${note.playerName}-${note.dayOfWeek}-${Date.now()}`,
        createdAt: new Date().toISOString()
      },
      ...current
    ]);
  }

  function handleViewAlertTrends(player: string) {
    setSelectedTrendPlayer(player);
    setSelectedPlayers([player]);
    setViewMode("individual");
    setActiveTab("trends");
    setIsAlertsOpen(false);
  }

  function handleAddAlertNote(player: string) {
    setSelectedPlayers([player]);
    setSelectedDayPlayer(player);
    setDayViewMode("individual");
    setActiveTab("dayOfWeek");
    setNoteDraft({
      playerName: player
    });
    setIsAlertsOpen(false);
  }

  function handleOpenInjuryModal(player: string) {
    setContextMenu(null);
    setInjuryModalPlayer(player);
  }

  function handleOpenPlayerQuickView(player: string) {
    setContextMenu(null);
    setSelectedPlayerDetail(player);
  }

  function handleClosePlayerQuickView() {
    setSelectedPlayerDetail(null);
  }

  function handleOpenPlayerQuickViewTrends(player: string) {
    setSelectedTrendPlayer(player);
    setSelectedPlayers([player]);
    setViewMode("individual");
    setActiveTab("trends");
    setSelectedPlayerDetail(null);
  }

  function handleAddPlayerQuickViewNote(player: string) {
    const latestSession = getRecentPlayerSessions(filteredData, player, 1)[0];

    setSelectedTrendPlayer(player);
    setSelectedPlayers([player]);
    setViewMode("individual");
    setActiveTab("trends");
    setNoteDraft({
      playerName: player,
      dayOfWeek: latestSession?.dayOfWeek,
      noteDate: latestSession?.date
    });
    setSelectedPlayerDetail(null);
  }

  function handleSavePlayerInjury(injury: PlayerInjury) {
    if (!injuryModalPlayer) {
      return;
    }

    setPlayerInjuries((current) => ({
      ...current,
      [injuryModalPlayer]: [...(current[injuryModalPlayer] ?? []), injury].sort((left, right) =>
        left.date.localeCompare(right.date)
      )
    }));
    setActiveTab("injury");
    setInjuryModalPlayer(null);
  }

  const tabs: Array<{
    key: TabKey;
    label: string;
  }> = [
    { key: "overview", label: "Overview" },
    { key: "trends", label: "Trends" },
    { key: "compare", label: "Compare Players" },
    { key: "dayOfWeek", label: "Day of week" },
    { key: "injury", label: "Injury" },
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
        dataProfile={activeProfile}
        tenantLabel={activeDatasetLabel}
        tenantLoginPath={authenticatedTenant ? getLoginPathForTenant(authenticatedTenant.id) : undefined}
        onProfileChange={handleProfileChange}
        modeLocked={modeLocked}
        onExportCsv={handleExportCsv}
        onExportPdf={() => void handleExportPdf()}
        onSyncSheets={handleSyncSheets}
        onShowAlerts={() => setIsAlertsOpen(true)}
        onShowAdmin={() => setIsAdminOpen(true)}
        isSyncing={isSyncingSheets}
        isExportingPdf={isExportingPdf}
        alertCount={alerts.length}
        canLogout={passwordProtectionEnabled}
        canExport={canExport}
        isAdmin={isAdmin}
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
        onClearFilters={() => {
          setSelectedPlayers([]);
          setSelectedDays([]);
          setSelectedCohort("all");
          setStartDate(dateBounds.start);
          setEndDate(dateBounds.end);
        }}
        onApplyDatePreset={handleApplyDatePreset}
        onPlayerContextMenu={handlePlayerContextMenu}
      />

      <main className="print-panel mx-auto mt-6 max-w-7xl px-4 sm:px-6 lg:px-8">
        <section
          className="no-print sticky z-40 -mx-4 px-4 py-2 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8"
          style={{ top: "calc(var(--topspin-navbar-height, 84px) + 8px)" }}
        >
          <div className="rounded-3xl border border-slate-200 bg-white px-4 py-3 shadow-[0_1px_4px_rgba(0,0,0,0.06)]">
            <div className="flex flex-wrap gap-2">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key)}
              className={`min-h-11 rounded-full px-4 py-2 text-sm font-semibold transition ${
                activeTab === tab.key
                  ? "bg-brand-ink text-white"
                  : "bg-white/90 text-slate-600 hover:text-brand-ink"
              }`}
            >
              {tab.label}
            </button>
          ))}
            </div>
          </div>
        </section>

        {activeTab === "overview" ? (
          <section ref={overviewExportRef} className="mt-6 space-y-6">
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
                  <button
                    type="button"
                    onClick={scrollToReviewQueue}
                    className="mt-2 text-left"
                  >
                    <p className="text-lg font-semibold text-brand-ink">{flaggedPlayers.length}</p>
                    <p className="mt-1 text-sm text-slate-500 underline decoration-slate-300 underline-offset-4">
                      players flagged for monitor or high priority
                    </p>
                  </button>
                </div>
              </div>
            </article>

            <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
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
                label="Sessions in Period"
                value={String(filteredData.length)}
                subtext="Training sessions in the current filtered range"
                footer={
                  <p className="text-sm font-semibold text-slate-600">
                    Sessions unclaimed: {filteredUnclaimedSessions}
                  </p>
                }
              />
            </div>

            <div className="grid gap-6 xl:grid-cols-[2fr_0.9fr]">
              <Leaderboard
                rows={rankedLeaderboard}
                sortKey={sortKey}
                sortDirection={sortDirection}
                onSortChange={handleSortChange}
                onPlayerClick={handleOpenPlayerQuickView}
                onPlayerContextMenu={handlePlayerContextMenu}
              />

              <div className="space-y-6">
                <SectionPanel title="Top Performers" items={topPerformers} />
                <SectionPanel title="Most Sessions" items={mostSessions} />
                <section id="coach-review-queue">
                  <ReviewPanel
                    rows={flaggedPlayers}
                    onPlayerClick={handleOpenPlayerQuickView}
                    onPlayerContextMenu={handlePlayerContextMenu}
                  />
                </section>
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
          <section ref={trendsExportRef} className="mt-6 space-y-6">
            <article className="no-print rounded-3xl border border-white/60 bg-white/95 p-5 shadow-soft">
              <div className="grid gap-4 md:grid-cols-[minmax(0,280px)_minmax(0,360px)] md:items-end">
                <label className="space-y-2">
                  <span className="text-sm font-medium text-slate-700">Search players</span>
                  <input
                    type="search"
                    value={trendPlayerSearch}
                    onChange={(event) => setTrendPlayerSearch(event.target.value)}
                    placeholder="Filter players…"
                    className="min-h-11 w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none transition focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/20"
                  />
                </label>
                <label className="space-y-2">
                  <span className="text-sm font-medium text-slate-700">Player</span>
                  <select
                    value={
                      trendSelectablePlayers.includes(trendPlayer)
                        ? trendPlayer
                        : trendSelectablePlayers[0] || trendPlayer
                    }
                    onChange={(event) => setSelectedTrendPlayer(event.target.value)}
                    className="min-h-11 w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none transition focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/20"
                  >
                    {trendSelectablePlayers.map((player) => (
                      <option key={player} value={player}>
                        {player}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
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

            <CoachNotesPanel
              title="Coach notes"
              subtitle="Capture context for the selected player without leaving the trend view."
              players={filteredPlayers}
              days={daysOfWeek}
              notes={coachNotes}
              onSaveNote={handleSaveCoachNote}
              initialPlayer={trendPlayer || "Full team"}
              initialDay={trendSessions.at(-1)?.dayOfWeek ?? daysOfWeek[0] ?? "Monday"}
              initialDate={trendSessions.at(-1)?.date ?? ""}
              draft={noteDraft}
              onDraftConsumed={() => setNoteDraft(null)}
              collapsible
              defaultExpanded={false}
            />
          </section>
        ) : null}

        {activeTab === "compare" ? (
          <section ref={compareExportRef} className="mt-6">
            <CompareView
              players={getUniquePlayers(filteredData)}
              selectedPlayers={comparePlayers}
              onSelectionChange={setComparePlayers}
              data={filteredData}
              teamAverage={teamAverage}
              onPlayerClick={handleOpenPlayerQuickView}
              onPlayerContextMenu={handlePlayerContextMenu}
            />
          </section>
        ) : null}

        {activeTab === "dayOfWeek" ? (
          <section ref={dayOfWeekExportRef} className="mt-6">
            <DayOfWeekView
              data={dayOfWeekStats}
              heatmap={dayOfWeekHeatmap}
              teamAverage={teamAverage}
              players={players}
              insights={dayOfWeekInsights}
              teamToggle={dayViewMode}
              onTeamToggle={setDayViewMode}
              selectedPlayer={dayPlayer}
              onSelectedPlayerChange={setSelectedDayPlayer}
              notes={coachNotes}
              onSaveNote={handleSaveCoachNote}
              noteDraft={noteDraft}
              onNoteDraftConsumed={() => setNoteDraft(null)}
            />
          </section>
        ) : null}

        {activeTab === "injury" ? (
          <section ref={injuryExportRef} className="mt-6">
            <InjuryView
              availablePlayers={profilePlayers}
              players={profilePlayers}
              data={data}
              injuries={playerInjuries}
              teamAverage={teamAverage}
              onAddInjuryRequest={handleOpenInjuryModal}
              onPlayerClick={handleOpenPlayerQuickView}
              onPlayerContextMenu={handlePlayerContextMenu}
            />
          </section>
        ) : null}

        {activeTab === "goals" ? (
          <section ref={goalsExportRef} className="mt-6">
            <GoalsView
              data={filteredData}
              players={getUniquePlayers(filteredData)}
              config={benchmarkConfig}
              onConfigChange={setBenchmarkConfig}
              onExportPdf={() => void handleExportPdf()}
              onExportCsv={handleExportCsv}
              teamAverage={teamAverage}
              teamAverageChangePct={displayedChangePct}
              canExport={canExport}
              onPlayerClick={handleOpenPlayerQuickView}
              onPlayerContextMenu={handlePlayerContextMenu}
            />
          </section>
        ) : null}

        <PlayerQuickViewDrawer
          isOpen={Boolean(selectedPlayerDetail)}
          player={selectedPlayerDetail}
          stats={playerQuickViewStats}
          recentSessions={playerQuickViewRecentSessions}
          trendSessions={playerQuickViewTrendSessions}
          teamAverage={teamAverage}
          dateRangeLabel={
            startDate && endDate ? `${startDate} to ${endDate}` : "Current filter window"
          }
          onClose={handleClosePlayerQuickView}
          onOpenFullTrends={handleOpenPlayerQuickViewTrends}
          onAddNote={handleAddPlayerQuickViewNote}
          onMarkInjured={(player) => {
            handleOpenInjuryModal(player);
            setSelectedPlayerDetail(null);
          }}
        />

        <section className="mt-6 rounded-3xl border border-white/60 bg-white/95 px-5 py-4 shadow-soft">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-brand-blue/70">
                Last updated
              </p>
              <p className="mt-1 text-sm font-semibold text-brand-ink">
                {formatLastUpdated(sourceMeta.updatedAt)}
              </p>
            </div>
            <p className="max-w-3xl text-sm text-slate-500">
              {sourceMeta.message ??
                "Track team readiness, compare players, and monitor benchmark progress in one dashboard."}
            </p>
          </div>
          <p className="mt-3 text-sm font-medium text-slate-500">
            Sessions unclaimed: {filteredUnclaimedSessions}
          </p>
        </section>
      </main>

      <AlertsModal
        alerts={alerts}
        open={isAlertsOpen}
        onClose={() => setIsAlertsOpen(false)}
        onViewTrends={handleViewAlertTrends}
        onAddNote={handleAddAlertNote}
      />
      <AdminAccessModal
        open={isAdminOpen}
        onClose={() => setIsAdminOpen(false)}
      />

      {contextMenu ? (
        <div className="fixed inset-0 z-[65]">
          <button
            type="button"
            aria-label="Close player menu"
            className="absolute inset-0 cursor-default"
            onClick={() => setContextMenu(null)}
          />
          <div
            className="absolute min-w-[220px] rounded-2xl border border-slate-200 bg-white p-2 shadow-soft"
            style={{
              left:
                typeof window === "undefined"
                  ? contextMenu.x
                  : Math.min(contextMenu.x, window.innerWidth - 244),
              top:
                typeof window === "undefined"
                  ? contextMenu.y
                  : Math.min(contextMenu.y, window.innerHeight - 92)
            }}
          >
            <button
              type="button"
              onClick={() => handleOpenInjuryModal(contextMenu.player)}
              className="min-h-11 w-full rounded-xl px-3 py-2 text-left text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              Mark as Injured
            </button>
          </div>
        </div>
      ) : null}

      <InjuryModal
        open={Boolean(injuryModalPlayer)}
        player={injuryModalPlayer ?? ""}
        initialInjury={
          injuryModalPlayer
            ? playerInjuries[injuryModalPlayer]?.at(-1)
            : undefined
        }
        onClose={() => setInjuryModalPlayer(null)}
        onSave={handleSavePlayerInjury}
      />
    </div>
  );
}
