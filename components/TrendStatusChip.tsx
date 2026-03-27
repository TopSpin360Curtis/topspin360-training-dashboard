"use client";

import type { TrendStatus } from "@/lib/types";

type TrendStatusChipProps = {
  status: TrendStatus;
};

const STATUS_META: Record<
  TrendStatus,
  {
    label: string;
    tones: string;
  }
> = {
  improving: {
    label: "Improving",
    tones: "bg-emerald-50 text-emerald-700 ring-emerald-200"
  },
  plateauing: {
    label: "Plateauing",
    tones: "bg-slate-100 text-slate-700 ring-slate-200"
  },
  declining: {
    label: "Needs Review",
    tones: "bg-rose-50 text-rose-700 ring-rose-200"
  }
};

export default function TrendStatusChip({ status }: TrendStatusChipProps) {
  const meta = STATUS_META[status];

  return (
    <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ring-1 ${meta.tones}`}>
      {meta.label}
    </span>
  );
}
