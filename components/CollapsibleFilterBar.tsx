"use client";

import { ReactNode, useRef, useState } from "react";

type CollapsibleFilterBarProps = {
  selectedPlayers: string[];
  allPlayers: string[];
  startDate: string;
  endDate: string;
  selectedDays: string[];
  selectedCohort?: string;
  children: ReactNode;
};

const DATE_FORMATTER = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric"
});

function formatDateRange(startDate: string, endDate: string) {
  if (!startDate && !endDate) {
    return "No date range";
  }

  if (!startDate || !endDate) {
    return startDate || endDate;
  }

  return `${DATE_FORMATTER.format(new Date(`${startDate}T12:00:00`))} – ${DATE_FORMATTER.format(
    new Date(`${endDate}T12:00:00`)
  )}`;
}

function formatDaySummary(selectedDays: string[]) {
  if (!selectedDays.length) {
    return "All days";
  }

  return selectedDays
    .map((day) => day.slice(0, 3))
    .join(" · ");
}

function formatPlayerSummary(selectedPlayers: string[], allPlayers: string[]) {
  if (!selectedPlayers.length || selectedPlayers.length === allPlayers.length) {
    return "Full Team";
  }

  return selectedPlayers.length === 1 ? selectedPlayers[0] : `${selectedPlayers.length} players`;
}

function SummaryChip({
  label,
  value
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-medium text-slate-600">
      <span className="uppercase tracking-[0.16em] text-slate-400">{label}</span>
      <span className="text-slate-600">{value}</span>
    </div>
  );
}

export default function CollapsibleFilterBar({
  selectedPlayers,
  allPlayers,
  startDate,
  endDate,
  selectedDays,
  selectedCohort,
  children
}: CollapsibleFilterBarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  return (
    <div className="rounded-3xl border border-white/60 bg-white/90 shadow-soft backdrop-blur">
      <button
        type="button"
        onClick={() => setIsOpen((current) => !current)}
        className="flex min-h-10 w-full items-center gap-3 px-4 py-2 text-left"
      >
        <span className="inline-flex items-center gap-2 text-sm font-semibold text-brand-ink">
          <span
            className={`text-sm text-slate-500 transition-transform duration-200 ${
              isOpen ? "rotate-90" : ""
            }`}
          >
            ›
          </span>
          Filters
        </span>
        <div className="flex flex-1 flex-wrap items-center gap-2 overflow-hidden">
          <SummaryChip
            label="Players"
            value={formatPlayerSummary(selectedPlayers, allPlayers)}
          />
          <SummaryChip label="Date" value={formatDateRange(startDate, endDate)} />
          <SummaryChip label="Days" value={formatDaySummary(selectedDays)} />
        </div>
        <span className="text-sm text-slate-400">{isOpen ? "⌃" : "✎"}</span>
      </button>

      <div
        className="overflow-hidden transition-[max-height] duration-200 ease-in-out"
        style={{
          maxHeight: isOpen ? `${contentRef.current?.scrollHeight ?? 0}px` : "0px"
        }}
      >
        <div ref={contentRef} className="border-t border-slate-100 px-4 pb-4 pt-3">
          <div className="mb-3 flex justify-end">
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="min-h-10 rounded-full bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-600 transition hover:bg-slate-200"
            >
              Done
            </button>
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}
