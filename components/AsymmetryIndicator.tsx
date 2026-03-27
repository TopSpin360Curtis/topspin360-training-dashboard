"use client";

import { formatNumber } from "@/lib/dataUtils";

type AsymmetryIndicatorProps = {
  ccw: number;
  cw: number;
  imbalanceAbs: number;
  imbalancePct: number;
  compact?: boolean;
};

export default function AsymmetryIndicator({
  ccw,
  cw,
  imbalanceAbs,
  imbalancePct,
  compact = false
}: AsymmetryIndicatorProps) {
  const total = ccw + cw || 1;
  const ccwWidth = (ccw / total) * 100;
  const tone =
    imbalancePct > 10
      ? "text-rose-700"
      : imbalancePct > 5
        ? "text-amber-700"
        : "text-emerald-700";

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between gap-3 text-xs">
        <span className="font-semibold text-slate-500">CW/CCW Split</span>
        <span className={`font-semibold ${tone}`}>
          {formatNumber(imbalancePct)}% imbalance
        </span>
      </div>
      <div className="flex h-2 overflow-hidden rounded-full bg-slate-100">
        <div className="bg-brand-blue" style={{ width: `${ccwWidth}%` }} />
        <div className="bg-brand-orange" style={{ width: `${100 - ccwWidth}%` }} />
      </div>
      {!compact ? (
        <p className="text-xs text-slate-500">
          {formatNumber(imbalanceAbs)} absolute difference
        </p>
      ) : null}
    </div>
  );
}
