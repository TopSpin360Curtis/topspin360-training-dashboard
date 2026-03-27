"use client";

import type { ReactNode } from "react";

type StatCardProps = {
  label: string;
  value: string;
  subtext?: string;
  badge?: ReactNode;
  footer?: ReactNode;
};

export default function StatCard({
  label,
  value,
  subtext,
  badge,
  footer
}: StatCardProps) {
  return (
    <article className="rounded-3xl border border-white/60 bg-white/95 p-5 shadow-soft">
      <div className="flex items-start justify-between gap-3">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-brand-blue/70">
          {label}
        </p>
        {badge}
      </div>
      <p className="mt-3 text-3xl font-semibold text-brand-ink">{value}</p>
      {subtext ? <p className="mt-2 text-sm text-slate-500">{subtext}</p> : null}
      {footer ? <div className="mt-4">{footer}</div> : null}
    </article>
  );
}
