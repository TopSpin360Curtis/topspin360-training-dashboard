"use client";

import InjuryNoDataState from "@/components/InjuryNoDataState";
import InjurySessionBreakdown from "@/components/InjurySessionBreakdown";
import InjurySummaryCard from "@/components/InjurySummaryCard";
import InjuryTrendCard from "@/components/InjuryTrendCard";
import type { InjuryDetailData } from "@/lib/types";

type InjuryDetailPanelProps = {
  detail: InjuryDetailData;
  onReturnToList: () => void;
};

export default function InjuryDetailPanel({
  detail,
  onReturnToList
}: InjuryDetailPanelProps) {
  return (
    <section className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-brand-blue/70">
            Injury Detail
          </p>
          <h3 className="mt-2 text-2xl font-semibold text-brand-ink">
            {detail.player} injury drill-down
          </h3>
        </div>
        <button
          type="button"
          onClick={onReturnToList}
          className="min-h-11 rounded-full bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-200"
        >
          Return to list
        </button>
      </div>

      <InjurySummaryCard detail={detail} />

      <div className="grid gap-6 xl:grid-cols-2">
        <InjurySessionBreakdown
          title="Pre-injury training"
          subtitle="Training summary before the injury date"
          totalSessions={detail.preInjurySessions.length}
          averageRfd={detail.averagePreInjuryRfd}
          monthlyCounts={detail.monthlyPreInjuryCounts}
          lookbacks={detail.preInjuryLookbacks}
          latestSession={detail.latestPreInjurySession}
          daysBetween={detail.daysBetweenLastSessionAndInjury}
          emptyTitle="No pre-injury sessions"
          emptyBody="There are no recorded sessions before this injury date for the selected player."
        />

        <InjurySessionBreakdown
          title="Post-injury follow-up"
          subtitle="Training sessions after the injury date"
          totalSessions={detail.postInjurySessions.length}
          postSessions={detail.firstPostInjurySessions}
          emptyTitle="No post-injury sessions"
          emptyBody="No follow-up sessions have been recorded after the injury date yet."
        />
      </div>

      <InjuryTrendCard detail={detail} />

      <article className="rounded-3xl border border-white/60 bg-white/95 p-5 shadow-soft">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-brand-blue/70">
          Notes & observations
        </p>
        <h3 className="mt-2 text-xl font-semibold text-brand-ink">
          Coach-facing observations
        </h3>
        <div className="mt-4 space-y-3">
          {detail.observations.length ? (
            detail.observations.map((note, index) => (
              <div
                key={`${detail.id}-note-${index}`}
                className="rounded-2xl border border-slate-100 bg-slate-50/70 p-4 text-sm leading-6 text-slate-600"
              >
                {note}
              </div>
            ))
          ) : (
            <InjuryNoDataState
              title="No additional observations"
              body="No derived or seeded notes are available for this injury yet."
            />
          )}
        </div>
      </article>
    </section>
  );
}
