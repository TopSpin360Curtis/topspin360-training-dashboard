"use client";

import { formatNumber, formatSignedPercent } from "@/lib/dataUtils";

type TeamAverageComparatorProps = {
  delta: number;
  deltaPct: number;
  compact?: boolean;
};

export default function TeamAverageComparator({
  delta,
  deltaPct,
  compact = false
}: TeamAverageComparatorProps) {
  const tone =
    delta > 0
      ? "text-emerald-700"
      : delta < 0
        ? "text-rose-700"
        : "text-slate-500";

  if (compact) {
    return (
      <span className={`text-xs font-semibold ${tone}`}>
        {formatSignedPercent(deltaPct)} vs team
      </span>
    );
  }

  return (
    <div className="space-y-1">
      <p className={`text-sm font-semibold ${tone}`}>
        {formatSignedPercent(deltaPct)} vs team average
      </p>
      <p className="text-xs text-slate-500">{formatNumber(delta)} absolute RFD delta</p>
    </div>
  );
}
