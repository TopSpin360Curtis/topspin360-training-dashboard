import type {
  AutoInsight,
  BenchmarkConfig,
  CoachNote,
  DayOfWeekPlayerHeatmapRow,
  DayOfWeekStat,
  GoalTarget,
  LeaderboardRow,
  PercentileTier,
  PlayerStats,
  PlayerAlert,
  ReviewPriority,
  RiskBand,
  TrainingSession
} from "@/lib/types";

const NUMBER_FORMATTER = new Intl.NumberFormat("en-CA", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2
});

const DATE_FORMATTER = new Intl.DateTimeFormat("en-CA", {
  month: "short",
  day: "numeric",
  year: "numeric"
});

export const RISK_BAND_META: Record<
  RiskBand,
  {
    label: string;
    shortLabel: string;
    description: string;
    tones: string;
  }
> = {
  high: {
    label: "High Risk",
    shortLabel: "High",
    description: "0.00 to 11.00",
    tones: "bg-rose-50 text-rose-700 ring-rose-200"
  },
  moderate: {
    label: "Moderate Risk",
    shortLabel: "Moderate",
    description: "11.01 to 22.00",
    tones: "bg-amber-50 text-amber-700 ring-amber-200"
  },
  lower: {
    label: "Lower Risk",
    shortLabel: "Lower",
    description: "22.01 to 35.00",
    tones: "bg-emerald-50 text-emerald-700 ring-emerald-200"
  },
  lowest: {
    label: "Lowest Risk",
    shortLabel: "Lowest",
    description: "35.00+",
    tones: "bg-sky-50 text-sky-700 ring-sky-200"
  }
};

function normalizeKey(key: string) {
  return key.toLowerCase().replace(/[^a-z0-9]/g, "");
}

function normalizeWhitespace(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

function average(values: number[]) {
  if (!values.length) {
    return 0;
  }

  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

const WEEKDAY_ORDER = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday"
] as const;

function median(values: number[]) {
  if (!values.length) {
    return 0;
  }

  const sorted = [...values].sort((left, right) => left - right);
  const middle = Math.floor(sorted.length / 2);

  if (sorted.length % 2 === 0) {
    return (sorted[middle - 1] + sorted[middle]) / 2;
  }

  return sorted[middle];
}

function toNumber(value: unknown) {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : null;
}

function parseIsoDate(value: string) {
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return value;
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function formatNumber(value: number) {
  return NUMBER_FORMATTER.format(value);
}

export function formatSignedPercent(value: number) {
  const prefix = value > 0 ? "+" : "";
  return `${prefix}${formatNumber(value)}%`;
}

export function formatDate(value: string) {
  const date = new Date(`${value}T12:00:00`);
  return DATE_FORMATTER.format(date);
}

export function getDayName(value: string) {
  const date = new Date(`${value}T12:00:00`);
  return date.toLocaleDateString("en-CA", {
    weekday: "long"
  });
}

export function sortSessionsByDate(data: TrainingSession[]) {
  return [...data].sort((left, right) => left.date.localeCompare(right.date));
}

export function getRiskBand(value: number): RiskBand {
  if (value <= 11) {
    return "high";
  }

  if (value <= 22) {
    return "moderate";
  }

  if (value <= 35) {
    return "lower";
  }

  return "lowest";
}

export function getRiskBandMeta(value: number | RiskBand) {
  const band = typeof value === "number" ? getRiskBand(value) : value;
  return RISK_BAND_META[band];
}

export function getImbalanceMetrics(ccw: number, cw: number) {
  const imbalanceAbs = Math.abs(ccw - cw);
  const midpoint = (ccw + cw) / 2;
  const imbalancePct = midpoint ? (imbalanceAbs / midpoint) * 100 : 0;

  return {
    imbalanceAbs,
    imbalancePct,
    favoredDirection: ccw >= cw ? "CCW" : "CW"
  };
}

export function getTrendStatus(changePct: number) {
  if (changePct > 5) {
    return "improving";
  }

  if (changePct < -5) {
    return "declining";
  }

  return "plateauing";
}

function getLastSessionDate(sessions: TrainingSession[]) {
  const ordered = sortSessionsByDate(sessions);
  return ordered.at(-1)?.date;
}

function getBottomPercentileThreshold(values: number[], percentile: number) {
  if (!values.length) {
    return 0;
  }

  const sorted = [...values].sort((left, right) => left - right);
  const index = Math.min(
    sorted.length - 1,
    Math.max(0, Math.floor((sorted.length - 1) * percentile))
  );
  return sorted[index];
}

function getRecentActivityThreshold(data: TrainingSession[]) {
  if (!data.length) {
    return "";
  }

  const latestDate = sortSessionsByDate(data).at(-1)?.date;

  if (!latestDate) {
    return "";
  }

  const cutoff = new Date(`${latestDate}T12:00:00`);
  cutoff.setDate(cutoff.getDate() - 14);
  return cutoff.toISOString().slice(0, 10);
}

function getAlertReasons(
  stat: PlayerStats,
  teamAverage: number,
  avgThreshold: number,
  lastSessionDate?: string,
  recentThreshold?: string
) {
  const reasons: string[] = [];

  if (stat.avgRFD <= avgThreshold) {
    reasons.push("Bottom 15% of cohort by avg RFD");
  }

  if (stat.sessions < 3) {
    reasons.push("Low session count");
  }

  if (stat.imbalancePct > 8) {
    reasons.push("CW/CCW imbalance above 8%");
  }

  if (stat.recentChangePct < 0 && stat.avgRFD < teamAverage) {
    reasons.push("Declining trend below team average");
  }

  if (recentThreshold && (!lastSessionDate || lastSessionDate < recentThreshold)) {
    reasons.push("No sessions in past 14 days");
  }

  return reasons;
}

export function isDisplayablePlayerName(value: string) {
  const normalized = normalizeWhitespace(value);

  if (!normalized.includes(" ") || /\d/.test(normalized)) {
    return false;
  }

  const parts = normalized.split(" ");

  if (parts.length < 2) {
    return false;
  }

  return parts.every((part) => /^[A-Za-z][A-Za-z'’-]*$/.test(part) && part.length >= 2);
}

export function coerceTrainingSession(
  row: Record<string, unknown>,
  index = 0
): TrainingSession | null {
  const normalizedEntries = Object.fromEntries(
    Object.entries(row).map(([key, value]) => [normalizeKey(key), value])
  );

  const player = normalizeWhitespace(
    String(normalizedEntries.player ?? normalizedEntries.athlete ?? "")
  );
  const dateRaw = String(normalizedEntries.date ?? "").trim();
  const parsedDate = parseIsoDate(dateRaw);
  const dayOfWeek =
    String(
      normalizedEntries.dayofweek ??
        normalizedEntries.day ??
        normalizedEntries.weekday ??
        ""
    ).trim() || (parsedDate ? getDayName(parsedDate) : "");
  const maxRfdCCW = toNumber(
    normalizedEntries.maxrfdccw ?? normalizedEntries.rfdccw ?? normalizedEntries.ccw
  );
  const maxRfdCW = toNumber(
    normalizedEntries.maxrfdcw ?? normalizedEntries.rfdcw ?? normalizedEntries.cw
  );
  const bestRfd =
    toNumber(normalizedEntries.bestrfd ?? normalizedEntries.best) ??
    Math.max(maxRfdCCW ?? Number.NaN, maxRfdCW ?? Number.NaN);

  if (
    !player ||
    !isDisplayablePlayerName(player) ||
    !parsedDate ||
    maxRfdCCW === null ||
    maxRfdCW === null
  ) {
    return null;
  }

  return {
    id: `${player}-${parsedDate}-${index}`,
    player,
    date: parsedDate,
    dayOfWeek: dayOfWeek || getDayName(parsedDate),
    maxRfdCCW,
    maxRfdCW,
    bestRfd: Number.isFinite(bestRfd) ? bestRfd : Math.max(maxRfdCCW, maxRfdCW)
  };
}

export function filterByDateRange(
  data: TrainingSession[],
  start?: string,
  end?: string
) {
  return data.filter((session) => {
    if (start && session.date < start) {
      return false;
    }

    if (end && session.date > end) {
      return false;
    }

    return true;
  });
}

export function filterByDayOfWeek(data: TrainingSession[], days?: string[]) {
  if (!days?.length || days.includes("All")) {
    return data;
  }

  const selected = new Set(days);
  return data.filter((session) => selected.has(session.dayOfWeek));
}

export function filterByPlayers(data: TrainingSession[], players: string[]) {
  if (!players.length) {
    return data;
  }

  const selected = new Set(players);
  return data.filter((session) => selected.has(session.player));
}

export function getPlayerStats(
  data: TrainingSession[],
  playerName: string
): PlayerStats {
  const sessions = sortSessionsByDate(
    data.filter((session) => session.player === playerName)
  );
  const total = sessions.length;

  if (!total) {
    return {
      player: playerName,
      avgRFD: 0,
      bestRFD: 0,
      sessions: 0,
      ccwAvg: 0,
      cwAvg: 0,
      balance: 0,
      imbalanceAbs: 0,
      imbalancePct: 0,
      riskBand: "high",
      trendStatus: "plateauing",
      recentChangePct: 0
    };
  }

  const ccwAvg =
    average(sessions.map((session) => session.maxRfdCCW));
  const cwAvg =
    average(sessions.map((session) => session.maxRfdCW));
  const avgRFD = average(sessions.map((session) => session.bestRfd));
  const bestRFD = Math.max(...sessions.map((session) => session.bestRfd));
  const recentWindow = sessions.slice(-Math.min(3, sessions.length));
  const previousWindow = sessions.slice(
    Math.max(0, sessions.length - recentWindow.length * 2),
    Math.max(0, sessions.length - recentWindow.length)
  );
  const recentAverage = average(recentWindow.map((session) => session.bestRfd));
  const previousAverage = average(previousWindow.map((session) => session.bestRfd));
  const recentChangePct = previousAverage
    ? ((recentAverage - previousAverage) / previousAverage) * 100
    : 0;
  const imbalance = getImbalanceMetrics(ccwAvg, cwAvg);

  return {
    player: playerName,
    avgRFD,
    bestRFD,
    sessions: total,
    ccwAvg,
    cwAvg,
    balance: ccwAvg - cwAvg,
    imbalanceAbs: imbalance.imbalanceAbs,
    imbalancePct: imbalance.imbalancePct,
    riskBand: getRiskBand(avgRFD),
    trendStatus: getTrendStatus(recentChangePct),
    recentChangePct
  };
}

export function getPercentileTier(
  playerAvg: number,
  allAvgs: number[]
): PercentileTier {
  if (!allAvgs.length) {
    return "mid";
  }

  const sorted = [...allAvgs].sort((left, right) => left - right);
  const floorIndex = Math.max(0, Math.floor((sorted.length - 1) * 0.25));
  const ceilIndex = Math.max(0, Math.floor((sorted.length - 1) * 0.75));
  const lowerBound = sorted[floorIndex];
  const upperBound = sorted[ceilIndex];

  if (playerAvg > upperBound) {
    return "top";
  }

  if (playerAvg < lowerBound) {
    return "dev";
  }

  return "mid";
}

function getTrendDeltaForSessions(sessions: TrainingSession[]) {
  if (sessions.length < 2) {
    return 0;
  }

  const ordered = sortSessionsByDate(sessions);
  const pivot = Math.floor(ordered.length / 2);
  const previous = ordered.slice(0, pivot);
  const current = ordered.slice(pivot);

  if (!previous.length || !current.length) {
    return ordered[ordered.length - 1].bestRfd - ordered[ordered.length - 2].bestRfd;
  }

  const previousAvg =
    previous.reduce((sum, session) => sum + session.bestRfd, 0) / previous.length;
  const currentAvg =
    current.reduce((sum, session) => sum + session.bestRfd, 0) / current.length;

  return currentAvg - previousAvg;
}

export function getTeamAverageRFD(data: TrainingSession[]) {
  const players = [...new Set(data.map((session) => session.player))];

  return average(players.map((player) => getPlayerStats(data, player).avgRFD));
}

export function getTeamAverageByDate(data: TrainingSession[]) {
  const grouped = new Map<string, number[]>();

  data.forEach((session) => {
    const values = grouped.get(session.date) ?? [];
    values.push(session.bestRfd);
    grouped.set(session.date, values);
  });

  return Object.fromEntries(
    Array.from(grouped.entries()).map(([date, values]) => [date, average(values)])
  ) as Record<string, number>;
}

function getReviewPriority(reasons: string[], riskBand: RiskBand): ReviewPriority {
  if (reasons.length || riskBand === "high") {
    return "high";
  }

  if (riskBand === "moderate") {
    return "monitor";
  }

  return "on-track";
}

export function getTeamLeaderboard(
  data: TrainingSession[],
  teamScopeData: TrainingSession[] = data
): LeaderboardRow[] {
  const players = [...new Set(data.map((session) => session.player))];
  const stats = players.map((player) => getPlayerStats(data, player));
  const averages = stats.map((player) => player.avgRFD);
  const teamAverage = getTeamAverageRFD(teamScopeData);
  const avgThreshold = getBottomPercentileThreshold(
    players.map((player) => getPlayerStats(teamScopeData, player).avgRFD),
    0.15
  );
  const recentThreshold = getRecentActivityThreshold(teamScopeData);

  return stats
    .map((stat) => {
      const sessions = data.filter((session) => session.player === stat.player);
      const reviewReasons = getAlertReasons(
        stat,
        teamAverage,
        avgThreshold,
        getLastSessionDate(sessions),
        recentThreshold
      );

      return {
        ...stat,
        tier: getPercentileTier(stat.avgRFD, averages),
        trendDelta: getTrendDeltaForSessions(sessions),
        teamDelta: stat.avgRFD - teamAverage,
        teamDeltaPct: teamAverage ? ((stat.avgRFD - teamAverage) / teamAverage) * 100 : 0,
        reviewPriority: getReviewPriority(reviewReasons, stat.riskBand),
        reviewReasons: reviewReasons.length
          ? reviewReasons
          : stat.riskBand === "moderate"
            ? ["Moderate-risk RFD band"]
            : ["Stable or improving"],
        lastSessionDate: getLastSessionDate(sessions),
        rank: 0
      };
    })
    .sort((left, right) => right.avgRFD - left.avgRFD)
    .map((row, index) => ({
      ...row,
      rank: index + 1
    }));
}

export function getUniquePlayers(data: TrainingSession[]) {
  return [...new Set(data.map((session) => session.player))].sort((left, right) =>
    left.localeCompare(right)
  );
}

export function getDateBounds(data: TrainingSession[]) {
  if (!data.length) {
    return {
      start: "",
      end: ""
    };
  }

  const ordered = sortSessionsByDate(data);
  return {
    start: ordered[0].date,
    end: ordered[ordered.length - 1].date
  };
}

export function getBestPerformer(data: TrainingSession[]) {
  if (!data.length) {
    return null;
  }

  return data.reduce((best, session) =>
    session.bestRfd > best.bestRfd ? session : best
  );
}

export function getTotalRevolutions(data: TrainingSession[]) {
  return data.length * 2;
}

export function getTopPerformers(data: TrainingSession[]) {
  return getTeamLeaderboard(data, data)
    .sort((left, right) => right.bestRFD - left.bestRFD)
    .slice(0, 3);
}

export function getMostSessions(data: TrainingSession[]) {
  return getTeamLeaderboard(data, data)
    .sort((left, right) => right.sessions - left.sessions)
    .slice(0, 3);
}

export function getReviewQueue(
  data: TrainingSession[],
  teamScopeData: TrainingSession[] = data
) {
  const priorityOrder: Record<ReviewPriority, number> = {
    high: 0,
    monitor: 1,
    "on-track": 2
  };

  return getTeamLeaderboard(data, teamScopeData)
    .sort((left, right) => {
      if (priorityOrder[left.reviewPriority] !== priorityOrder[right.reviewPriority]) {
        return priorityOrder[left.reviewPriority] - priorityOrder[right.reviewPriority];
      }

      return left.avgRFD - right.avgRFD;
    })
    .slice(0, 5);
}

export function getHighPriorityAlerts(
  data: TrainingSession[],
  teamScopeData: TrainingSession[] = data
): PlayerAlert[] {
  return getTeamLeaderboard(data, teamScopeData)
    .filter((row) => row.reviewPriority === "high")
    .map((row) => ({
      player: row.player,
      priority: row.reviewPriority,
      reasons: row.reviewReasons,
      avgRFD: row.avgRFD,
      sessions: row.sessions,
      imbalancePct: row.imbalancePct,
      trendDelta: row.trendDelta,
      lastSessionDate: row.lastSessionDate
    }))
    .sort((left, right) => left.avgRFD - right.avgRFD);
}

export function getSessionHistory(data: TrainingSession[], playerName: string) {
  const ordered = sortSessionsByDate(
    data.filter((session) => session.player === playerName)
  );

  return ordered.map((session, index) => {
    const previous = ordered[index - 1];
    return {
      ...session,
      delta: previous ? session.bestRfd - previous.bestRfd : 0,
      riskBand: getRiskBand(session.bestRfd)
    };
  });
}

export function getRollingAverageData(values: number[], windowSize = 3) {
  return values.map((_, index) => {
    const start = Math.max(0, index - windowSize + 1);
    return average(values.slice(start, index + 1));
  });
}

export function getPlayerTrendSeries(
  data: TrainingSession[],
  playerName: string,
  teamScopeData: TrainingSession[]
) {
  const sessions = getSessionHistory(data, playerName);
  const teamAverageByDate = getTeamAverageByDate(teamScopeData);
  const rollingBest = getRollingAverageData(
    sessions.map((session) => session.bestRfd),
    3
  );

  return sessions.map((session, index) => ({
    ...session,
    rollingBest: rollingBest[index],
    teamAverage: teamAverageByDate[session.date] ?? null
  }));
}

export function getRecentBestMetrics(data: TrainingSession[], playerName: string) {
  const sessions = sortSessionsByDate(
    data.filter((session) => session.player === playerName)
  );
  const anchorDate = sessions.length
    ? new Date(`${sessions[sessions.length - 1].date}T12:00:00`)
    : new Date();
  const lastMonthCutoff = new Date(anchorDate);
  lastMonthCutoff.setMonth(lastMonthCutoff.getMonth() - 1);
  const cutoffIso = [
    lastMonthCutoff.getFullYear(),
    String(lastMonthCutoff.getMonth() + 1).padStart(2, "0"),
    String(lastMonthCutoff.getDate()).padStart(2, "0")
  ].join("-");
  const recent = sessions.filter((session) => session.date >= cutoffIso);

  const allTimeCCW = Math.max(0, ...sessions.map((session) => session.maxRfdCCW));
  const allTimeCW = Math.max(0, ...sessions.map((session) => session.maxRfdCW));
  const recentCCW = Math.max(0, ...recent.map((session) => session.maxRfdCCW));
  const recentCW = Math.max(0, ...recent.map((session) => session.maxRfdCW));

  return {
    allTimeCCW,
    allTimeCW,
    recentCCW,
    recentCW
  };
}

export function getTeamBenchmarkProgress(
  data: TrainingSession[],
  config: BenchmarkConfig
) {
  const leaderboard = getTeamLeaderboard(data, data);
  const teamAverage = getTeamAverageRFD(data);
  const bandCounts = Object.entries(RISK_BAND_META).map(([band, meta]) => {
    const count = leaderboard.filter((row) => row.riskBand === band).length;
    return {
      band: band as RiskBand,
      label: meta.label,
      count,
      percentage: leaderboard.length ? (count / leaderboard.length) * 100 : 0
    };
  });

  return {
    teamAverage,
    thresholds: config.thresholds.map((threshold) => ({
      threshold,
      count: leaderboard.filter((row) => row.avgRFD > threshold).length,
      percentage: leaderboard.length
        ? (leaderboard.filter((row) => row.avgRFD > threshold).length /
            leaderboard.length) *
          100
        : 0
    })),
    sessionGoal: {
      target: config.teamSessionGoal,
      count: leaderboard.filter((row) => row.sessions >= config.teamSessionGoal).length,
      percentage: leaderboard.length
        ? (leaderboard.filter((row) => row.sessions >= config.teamSessionGoal).length /
            leaderboard.length) *
          100
        : 0
    },
    bandCounts,
    aboveTeamAverage: leaderboard.filter((row) => row.teamDelta >= 0).length
  };
}

export function getPeriodRange(start?: string, end?: string) {
  if (!start || !end) {
    return null;
  }

  const startDate = new Date(`${start}T12:00:00`);
  const endDate = new Date(`${end}T12:00:00`);
  const diff = Math.round(
    (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
  );
  const previousEnd = new Date(startDate);
  previousEnd.setDate(previousEnd.getDate() - 1);
  const previousStart = new Date(previousEnd);
  previousStart.setDate(previousStart.getDate() - diff);

  return {
    previousStart: previousStart.toISOString().slice(0, 10),
    previousEnd: previousEnd.toISOString().slice(0, 10)
  };
}

export function getBandDistribution(data: TrainingSession[]) {
  const leaderboard = getTeamLeaderboard(data, data);

  return Object.entries(RISK_BAND_META).map(([band, meta]) => {
    const count = leaderboard.filter((row) => row.riskBand === band).length;
    return {
      band: band as RiskBand,
      label: meta.label,
      count,
      percentage: leaderboard.length ? (count / leaderboard.length) * 100 : 0
    };
  });
}

export function getCohortPlayers(
  data: TrainingSession[],
  cohortKey: "all" | "above-average" | "below-average" | "high-frequency" | "low-frequency"
) {
  const leaderboard = getTeamLeaderboard(data, data);
  const teamAverage = getTeamAverageRFD(data);
  const sessionMedian = median(leaderboard.map((row) => row.sessions));

  if (cohortKey === "above-average") {
    return leaderboard
      .filter((row) => row.avgRFD >= teamAverage)
      .map((row) => row.player);
  }

  if (cohortKey === "below-average") {
    return leaderboard
      .filter((row) => row.avgRFD < teamAverage)
      .map((row) => row.player);
  }

  if (cohortKey === "high-frequency") {
    return leaderboard
      .filter((row) => row.sessions >= sessionMedian)
      .map((row) => row.player);
  }

  if (cohortKey === "low-frequency") {
    return leaderboard
      .filter((row) => row.sessions < sessionMedian)
      .map((row) => row.player);
  }

  return leaderboard.map((row) => row.player);
}

export function getOrderedWeekdays(days?: string[]) {
  const source = days?.length ? days : Array.from(WEEKDAY_ORDER);
  return source
    .filter((day): day is (typeof WEEKDAY_ORDER)[number] =>
      WEEKDAY_ORDER.includes(day as (typeof WEEKDAY_ORDER)[number])
    )
    .sort((left, right) => WEEKDAY_ORDER.indexOf(left) - WEEKDAY_ORDER.indexOf(right));
}

export function getDayOfWeekStats(
  data: TrainingSession[],
  playerFilter?: string
): DayOfWeekStat[] {
  const scoped = playerFilter ? data.filter((session) => session.player === playerFilter) : data;
  const grouped = new Map<string, TrainingSession[]>();

  scoped.forEach((session) => {
    const sessions = grouped.get(session.dayOfWeek) ?? [];
    sessions.push(session);
    grouped.set(session.dayOfWeek, sessions);
  });

  return getOrderedWeekdays(Array.from(grouped.keys())).map((day) => {
    const sessions = grouped.get(day) ?? [];
    const avgCCW = average(sessions.map((session) => session.maxRfdCCW));
    const avgCW = average(sessions.map((session) => session.maxRfdCW));
    const midpoint = (avgCCW + avgCW) / 2;

    return {
      day,
      sessionCount: sessions.length,
      avgRFD: average(sessions.map((session) => session.bestRfd)),
      avgCCW,
      avgCW,
      balancePct: midpoint ? (Math.abs(avgCCW - avgCW) / midpoint) * 100 : 0
    };
  });
}

export function getDayOfWeekHeatmapData(
  data: TrainingSession[],
  days: string[],
  limit = 8
): DayOfWeekPlayerHeatmapRow[] {
  const players = getUniquePlayers(data)
    .map((player) => ({
      player,
      sessions: data.filter((session) => session.player === player).length
    }))
    .sort((left, right) => right.sessions - left.sessions)
    .slice(0, limit);

  return players.map((player) => ({
    player: player.player,
    sessions: player.sessions,
    values: Object.fromEntries(
      days.map((day) => {
        const sessions = data.filter(
          (session) => session.player === player.player && session.dayOfWeek === day
        );
        return [day, sessions.length ? average(sessions.map((session) => session.bestRfd)) : null];
      })
    )
  }));
}

export function getDayOfWeekInsights(stats: DayOfWeekStat[]): AutoInsight[] {
  if (!stats.length) {
    return [];
  }

  const validStats = stats.filter((day) => day.sessionCount > 0);

  if (!validStats.length) {
    return [];
  }

  const weeklyMean = average(validStats.map((day) => day.avgRFD));
  const bestDay = [...validStats].sort((left, right) => right.avgRFD - left.avgRFD)[0];
  const worstDay = [...validStats].sort((left, right) => left.avgRFD - right.avgRFD)[0];
  const highestImbalance = [...validStats].sort(
    (left, right) => right.balancePct - left.balancePct
  )[0];
  const sessionCounts = validStats.map((day) => day.sessionCount);
  const performances = validStats.map((day) => day.avgRFD);
  const correlationDenominator = Math.sqrt(
    sessionCounts.reduce((sum, count) => sum + count ** 2, 0) *
      performances.reduce((sum, value) => sum + value ** 2, 0)
  );
  const correlation = correlationDenominator
    ? sessionCounts.reduce(
        (sum, count, index) => sum + count * performances[index],
        0
      ) / correlationDenominator
    : 0;

  return [
    {
      title: "Best weekly window",
      body: `${bestDay.day} leads the week at ${formatNumber(bestDay.avgRFD)}, ${formatSignedPercent(
        weeklyMean ? ((bestDay.avgRFD - weeklyMean) / weeklyMean) * 100 : 0
      )} vs the weekly mean.`,
      tone: "positive"
    },
    {
      title: "Lowest-performing day",
      body: `${worstDay.day} sits lowest at ${formatNumber(worstDay.avgRFD)}, ${formatSignedPercent(
        weeklyMean ? ((worstDay.avgRFD - weeklyMean) / weeklyMean) * 100 : 0
      )} vs the weekly mean.`,
      tone: "warning"
    },
    {
      title: "Directional spike",
      body: `${highestImbalance.day} shows the largest CW/CCW split at ${formatNumber(
        highestImbalance.balancePct
      )}% balance difference, worth a fatigue check.`,
      tone: "warning"
    },
    {
      title: "Volume vs output",
      body:
        correlation >= 0.9
          ? "Higher-volume days are also carrying stronger average RFD this period."
          : correlation <= 0.75
            ? "Session volume is not tightly tracking performance, so day quality likely matters more than quantity."
            : "Volume and performance are moving together moderately across the week.",
      tone: "info"
    }
  ];
}

export function getDefaultGoalTarget(player: string, data: TrainingSession[]): GoalTarget {
  const stats = getPlayerStats(data, player);
  return {
    rfdTarget: Number((stats.bestRFD + 2).toFixed(2)),
    sessionTarget: Math.max(4, stats.sessions + 2)
  };
}

export function buildDefaultBenchmarkConfig(data: TrainingSession[]): BenchmarkConfig {
  const players = getUniquePlayers(data);

  return {
    thresholds: [20, 25, 30],
    teamSessionGoal: 4,
    playerTargets: Object.fromEntries(
      players.map((player) => [player, getDefaultGoalTarget(player, data)])
    )
  };
}

export function exportToCSV(
  data: TrainingSession[],
  filename = "topspin360-training-data.csv"
) {
  if (typeof window === "undefined") {
    return;
  }

  const header = [
    "Player",
    "Date",
    "Day of week",
    "Max RFD CCW",
    "Max RFD CW",
    "Best RFD"
  ];
  const rows = data.map((session) => [
    session.player,
    session.date,
    session.dayOfWeek,
    session.maxRfdCCW.toFixed(2),
    session.maxRfdCW.toFixed(2),
    session.bestRfd.toFixed(2)
  ]);
  const csv = [header, ...rows]
    .map((row) =>
      row
        .map((value) => `"${String(value).replaceAll('"', '""')}"`)
        .join(",")
    )
    .join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}
