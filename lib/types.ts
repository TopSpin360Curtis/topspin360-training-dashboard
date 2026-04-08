export type TrainingSession = {
  id: string;
  player: string;
  date: string;
  dayOfWeek: string;
  maxRfdCCW: number;
  maxRfdCW: number;
  bestRfd: number;
};

export type DashboardProfile = "team" | "test";

export type DashboardTenant = {
  id: string;
  label: string;
  username: string;
  profile: DashboardProfile;
};

export type RiskBand = "high" | "moderate" | "lower" | "lowest";
export type InjuryType = "head" | "neck";

export type PlayerInjury = {
  date: string;
  type: InjuryType;
  createdAt?: string;
  label?: string;
  weekLabel?: string;
  weeksAffected?: number;
  status?: string;
  notes?: string[];
};

export type PlayerInjuryMap = Record<string, PlayerInjury[]>;

export type InjuryRegisterRow = {
  id: string;
  player: string;
  injury: PlayerInjury;
  stats: PlayerStats;
  hasTrainingData: boolean;
  sessionsLabel: string;
};

export type InjuryDetailSession = TrainingSession & {
  daysFromInjury: number;
};

export type InjuryMonthlySessionCount = {
  monthLabel: string;
  count: number;
};

export type InjuryLookbackWindow = {
  days: 30 | 60 | 120;
  sessionCount: number;
  averageRfd: number | null;
  latestSessionDate: string | null;
};

export type InjuryTrendPoint = {
  date: string;
  maxRfdCCW: number;
  maxRfdCW: number;
  bestRfd: number;
};

export type InjuryDetailData = {
  id: string;
  player: string;
  injury: PlayerInjury;
  hasTrainingData: boolean;
  totalSessions: number;
  preInjurySessions: TrainingSession[];
  postInjurySessions: InjuryDetailSession[];
  latestPreInjurySession: TrainingSession | null;
  firstPostInjurySessions: InjuryDetailSession[];
  monthlyPreInjuryCounts: InjuryMonthlySessionCount[];
  preInjuryLookbacks: InjuryLookbackWindow[];
  averagePreInjuryRfd: number | null;
  averagePostInjuryRfd: number | null;
  daysBetweenLastSessionAndInjury: number | null;
  weeksAffected: number | null;
  statusLabel: string;
  observations: string[];
  trendSeries: InjuryTrendPoint[];
};

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
  latestBestRFD?: number;
  daysSinceLastTraining?: number | null;
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
  profile?: DashboardProfile;
  message?: string;
  updatedAt?: string;
  unclaimedSessions?: number;
};
