"use client";

import { getRiskBandMeta } from "@/lib/dataUtils";
import type { RiskBand } from "@/lib/types";

type RiskBandBadgeProps = {
  band: RiskBand;
  compact?: boolean;
};

export default function RiskBandBadge({
  band,
  compact = false
}: RiskBandBadgeProps) {
  const meta = getRiskBandMeta(band);

  return (
    <span
      className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ring-1 ${meta.tones}`}
      title={meta.description}
    >
      {compact ? meta.shortLabel : meta.label}
    </span>
  );
}
