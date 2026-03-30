"use client";

import { useEffect, useState } from "react";
import type { InjuryType, PlayerInjury } from "@/lib/types";

type InjuryModalProps = {
  open: boolean;
  player: string;
  initialInjury?: PlayerInjury;
  onClose: () => void;
  onSave: (injury: PlayerInjury) => void;
};

export default function InjuryModal({
  open,
  player,
  initialInjury,
  onClose,
  onSave
}: InjuryModalProps) {
  const [injuryDate, setInjuryDate] = useState("");
  const [injuryType, setInjuryType] = useState<InjuryType>("head");

  useEffect(() => {
    if (!open) {
      return;
    }

    setInjuryDate(initialInjury?.date ?? new Date().toISOString().slice(0, 10));
    setInjuryType(initialInjury?.type ?? "head");
  }, [initialInjury, open]);

  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/40 px-4 py-6">
      <div className="w-full max-w-lg rounded-[2rem] border border-white/70 bg-white p-6 shadow-soft">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-brand-blue/70">
              Injury Workflow
            </p>
            <h2 className="mt-2 text-2xl font-semibold text-brand-ink">
              Mark {player} as injured
            </h2>
            <p className="mt-2 text-sm text-slate-500">
              Save a structured head or neck injury record and jump directly to the Injury tab.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="min-h-11 rounded-full bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-200"
          >
            Close
          </button>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <label className="space-y-2">
            <span className="text-sm font-medium text-slate-700">Injury date</span>
            <input
              type="date"
              value={injuryDate}
              onChange={(event) => setInjuryDate(event.target.value)}
              className="min-h-11 w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none transition focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/20"
            />
          </label>

          <label className="space-y-2">
            <span className="text-sm font-medium text-slate-700">Injury type</span>
            <select
              value={injuryType}
              onChange={(event) => setInjuryType(event.target.value as InjuryType)}
              className="min-h-11 w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none transition focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/20"
            >
              <option value="head">Head</option>
              <option value="neck">Neck</option>
            </select>
          </label>
        </div>

        <div className="mt-6 flex flex-wrap justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="min-h-11 rounded-full bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-200"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={!injuryDate}
            onClick={() =>
              onSave({
                date: injuryDate,
                type: injuryType,
                createdAt: initialInjury?.createdAt ?? new Date().toISOString()
              })
            }
            className="min-h-11 rounded-full bg-brand-blue px-4 py-2 text-sm font-semibold text-white transition hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Save injury
          </button>
        </div>
      </div>
    </div>
  );
}
