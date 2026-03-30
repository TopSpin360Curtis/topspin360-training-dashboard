"use client";

import InjuryNoDataState from "@/components/InjuryNoDataState";
import { formatDate, formatNumber } from "@/lib/dataUtils";
import type {
  InjuryDetailSession,
  InjuryLookbackWindow,
  TrainingSession
} from "@/lib/types";

type InjurySessionBreakdownProps = {
  title: string;
  subtitle: string;
  totalSessions: number;
  totalSessionsLabel?: string;
  averageRfd?: number | null;
  lookbacks?: InjuryLookbackWindow[];
  latestSession?: TrainingSession | null;
  daysBetween?: number | null;
  postSessions?: InjuryDetailSession[];
  emptyTitle: string;
  emptyBody: string;
};

export default function InjurySessionBreakdown({
  title,
  subtitle,
  totalSessions,
  totalSessionsLabel = "Total sessions",
  averageRfd,
  lookbacks = [],
  latestSession,
  daysBetween,
  postSessions = [],
  emptyTitle,
  emptyBody
}: InjurySessionBreakdownProps) {
  const hasData = totalSessions > 0 || postSessions.length > 0 || Boolean(latestSession);

  return (
    <article className="rounded-3xl border border-white/60 bg-white/95 p-5 shadow-soft">
      <p className="text-xs font-semibold uppercase tracking-[0.24em] text-brand-blue/70">
        {title}
      </p>
      <h3 className="mt-2 text-xl font-semibold text-brand-ink">{subtitle}</h3>

      {!hasData ? (
        <div className="mt-4">
          <InjuryNoDataState title={emptyTitle} body={emptyBody} />
        </div>
      ) : (
        <div className="mt-4 space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl bg-slate-50/80 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                {totalSessionsLabel}
              </p>
              <p className="mt-2 text-2xl font-semibold text-brand-ink">{totalSessions}</p>
            </div>
            <div className="rounded-2xl bg-slate-50/80 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                Avg RFD
              </p>
              <p className="mt-2 text-2xl font-semibold text-brand-ink">
                {averageRfd !== null && averageRfd !== undefined ? formatNumber(averageRfd) : "—"}
              </p>
            </div>
          </div>

          {lookbacks.length ? (
            <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-4">
              <p className="text-sm font-semibold text-brand-ink">
                Training windows before injury
              </p>
              <div className="mt-3 grid gap-3 md:grid-cols-3">
                {lookbacks.map((window) => (
                  <div key={window.days} className="rounded-2xl bg-white p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                      Last {window.days} days
                    </p>
                    <p className="mt-2 text-2xl font-semibold text-brand-ink">
                      {window.sessionCount}
                    </p>
                    <p className="mt-1 text-sm text-slate-500">
                      {window.sessionCount === 1 ? "training session" : "training sessions"}
                    </p>
                    <div className="mt-3 space-y-1 text-sm text-slate-600">
                      <p>
                        Avg RFD:{" "}
                        {window.averageRfd !== null ? formatNumber(window.averageRfd) : "—"}
                      </p>
                      <p>
                        Latest:{" "}
                        {window.latestSessionDate ? formatDate(window.latestSessionDate) : "No session"}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          {latestSession ? (
            <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-4">
              <p className="text-sm font-semibold text-brand-ink">
                Latest relevant session
              </p>
              <div className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                    Date
                  </p>
                  <p className="mt-1 text-sm text-slate-700">{formatDate(latestSession.date)}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                    Max RFD CCW
                  </p>
                  <p className="mt-1 text-sm text-slate-700">
                    {formatNumber(latestSession.maxRfdCCW)}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                    Max RFD CW
                  </p>
                  <p className="mt-1 text-sm text-slate-700">
                    {formatNumber(latestSession.maxRfdCW)}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                    Best RFD
                  </p>
                  <p className="mt-1 text-sm text-slate-700">{formatNumber(latestSession.bestRfd)}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                    Days from injury
                  </p>
                  <p className="mt-1 text-sm text-slate-700">
                    {daysBetween !== null && daysBetween !== undefined ? daysBetween : "—"}
                  </p>
                </div>
              </div>
            </div>
          ) : null}

          {postSessions.length ? (
            <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-4">
              <p className="text-sm font-semibold text-brand-ink">First post-injury sessions</p>
              <div className="mt-3 space-y-3">
                {postSessions.map((session) => (
                  <div
                    key={session.id}
                    className="grid gap-3 rounded-2xl bg-white px-4 py-3 sm:grid-cols-2 xl:grid-cols-5"
                  >
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                        Date
                      </p>
                      <p className="mt-1 text-sm text-slate-700">{formatDate(session.date)}</p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                        Max RFD CCW
                      </p>
                      <p className="mt-1 text-sm text-slate-700">{formatNumber(session.maxRfdCCW)}</p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                        Max RFD CW
                      </p>
                      <p className="mt-1 text-sm text-slate-700">{formatNumber(session.maxRfdCW)}</p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                        Best RFD
                      </p>
                      <p className="mt-1 text-sm text-slate-700">{formatNumber(session.bestRfd)}</p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                        Days post-injury
                      </p>
                      <p className="mt-1 text-sm text-slate-700">{session.daysFromInjury}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      )}
    </article>
  );
}
