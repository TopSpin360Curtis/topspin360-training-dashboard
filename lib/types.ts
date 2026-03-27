export type TrainingSession = {
  id: string;
  player: string;
  date: string;
  dayOfWeek: string;
  maxRfdCCW: number;
  maxRfdCW: number;
  bestRfd: number;
};

export type RiskBand = "high" | "moderate" | "lower" | "lowest";

export type TrendStatus = "improving" | "plateauing" | "declining";

export type ReviewPriority = "high" | "monitor" | "on-track";
export type InsightTone = "info" | "warning" | "positive";

export type PlayerStats = {
  player: string;
  avgRFD: number;
  bestRFD: number;
  sessions: number;
  ccwAvg: number;
  cwAvg: number;
  balance: number;
  imbalanceAbs: number;
  imbalancePct: number;
  riskBand: RiskBand;
  trendStatus: TrendStatus;
  recentChangePct: number;
};

export type PercentileTier = "top" | "mid" | "dev";

export type LeaderboardRow = PlayerStats & {
  rank: number;
  tier: PercentileTier;
  trendDelta: number;
  teamDelta: number;
  teamDeltaPct: number;
  reviewPriority: ReviewPriority;
  reviewReasons: string[];
  lastSessionDate?: string;
};

export type DayOfWeekStat = {
  day: string;
  sessionCount: number;
  avgRFD: number;
  avgCCW: number;
  avgCW: number;
  balancePct: number;
};

export type DayOfWeekPlayerHeatmapRow = {
  player: string;
  sessions: number;
  values: Record<string, number | null>;
};

export type AutoInsight = {
  title: string;
  body: string;
  tone: InsightTone;
};

export type CoachNote = {
  id: string;
  createdAt: string;
  playerName: string;
  dayOfWeek: string;
  noteText: string;
  author: string;
  noteDate?: string;
};

export type PlayerAlert = {
  player: string;
  priority: ReviewPriority;
  reasons: string[];
  avgRFD: number;
  sessions: number;
  imbalancePct: number;
  trendDelta: number;
  lastSessionDate?: string;
};

export type GoalTarget = {
  rfdTarget: number;
  sessionTarget: number;
};

export type BenchmarkConfig = {
  thresholds: number[];
  teamSessionGoal: number;
  playerTargets: Record<string, GoalTarget>;
};

export type DataSourceMeta = {
  source: "sheets" | "csv" | "sample";
  message?: string;
};
