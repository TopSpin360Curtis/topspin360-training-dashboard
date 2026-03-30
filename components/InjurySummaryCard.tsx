"use client";

import { formatDate } from "@/lib/dataUtils";
import type { InjuryDetailData } from "@/lib/types";

type InjurySummaryCardProps = {
  detail: InjuryDetailData;
};

function formatInjuryType(value: "head" | "neck") {
  return value === "head" ? "Head" : "Neck";
}

export default function InjurySummaryCard({ detail }: InjurySummaryCardProps) {
  return (
    <article className="rounded-3xl border border-white/60 bg-white/95 p-5 shadow-soft">
      <p className="text-xs font-semibold uppercase tracking-[0.24em] text-brand-blue/70">
        Injury Summary
      </p>
      <h3 className="mt-2 text-2xl font-semibold text-brand-ink">{detail.player}</h3>

      <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {[
          {
            label: "Injury type",
            value: detail.injury.label ?? formatInjuryType(detail.injury.type)
          },
          {
            label: "Injury date",
            value: formatDate(detail.injury.date),
            subtext: detail.injury.weekLabel
          },
          {
            label: "Training record",
            value: detail.hasTrainingData ? `${detail.totalSessions} sessions` : "No data"
          }
        ].map((item) => (
          <div key={item.label} className="rounded-2xl bg-slate-50/80 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
              {item.label}
            </p>
            <p className="mt-2 text-lg font-semibold text-brand-ink">{item.value}</p>
            {item.subtext ? <p className="mt-1 text-sm text-slate-500">{item.subtext}</p> : null}
          </div>
        ))}
      </div>
    </article>
  );
}
