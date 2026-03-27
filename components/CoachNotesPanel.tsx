"use client";

import { useEffect, useMemo, useState } from "react";
import type { CoachNote } from "@/lib/types";

type NoteDraft = {
  playerName?: string;
  dayOfWeek?: string;
  noteDate?: string;
};

type CoachNotesPanelProps = {
  title?: string;
  subtitle?: string;
  players: string[];
  days: string[];
  notes: CoachNote[];
  onSaveNote: (note: Omit<CoachNote, "id" | "createdAt">) => void;
  initialPlayer?: string;
  initialDay?: string;
  initialDate?: string;
  draft?: NoteDraft | null;
  onDraftConsumed?: () => void;
  collapsible?: boolean;
  defaultExpanded?: boolean;
};

export default function CoachNotesPanel({
  title = "Coach notes",
  subtitle = "Local notes fallback is active until Supabase is configured.",
  players,
  days,
  notes,
  onSaveNote,
  initialPlayer = "Full team",
  initialDay = "",
  initialDate = "",
  draft,
  onDraftConsumed,
  collapsible = false,
  defaultExpanded = true
}: CoachNotesPanelProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const [playerName, setPlayerName] = useState(initialPlayer);
  const [dayOfWeek, setDayOfWeek] = useState(initialDay || days[0] || "Monday");
  const [noteDate, setNoteDate] = useState(initialDate);
  const [author, setAuthor] = useState("Coach");
  const [noteText, setNoteText] = useState("");

  useEffect(() => {
    if (!draft) {
      return;
    }

    if (draft.playerName) {
      setPlayerName(draft.playerName);
    }

    if (draft.dayOfWeek) {
      setDayOfWeek(draft.dayOfWeek);
    }

    if (draft.noteDate !== undefined) {
      setNoteDate(draft.noteDate);
    }

    setIsExpanded(true);
    onDraftConsumed?.();
  }, [draft, onDraftConsumed]);

  const filteredNotes = useMemo(
    () =>
      [...notes]
        .filter((note) => {
          if (playerName !== "Full team" && note.playerName !== playerName) {
            return false;
          }

          if (dayOfWeek && note.dayOfWeek !== dayOfWeek) {
            return false;
          }

          return true;
        })
        .sort((left, right) => right.createdAt.localeCompare(left.createdAt)),
    [dayOfWeek, notes, playerName]
  );

  function handleSave() {
    const trimmedText = noteText.trim();

    if (!trimmedText) {
      return;
    }

    onSaveNote({
      playerName,
      dayOfWeek,
      noteText: trimmedText,
      author: author.trim() || "Coach",
      noteDate: noteDate || undefined
    });
    setNoteText("");
  }

  function handleCancel() {
    setNoteText("");
    setNoteDate(initialDate);
    setPlayerName(initialPlayer);
    setDayOfWeek(initialDay || days[0] || "Monday");
  }

  return (
    <article className="rounded-3xl border border-white/60 bg-white/95 p-5 shadow-soft">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-brand-blue/70">
            Notes
          </p>
          <h3 className="mt-2 text-xl font-semibold text-brand-ink">{title}</h3>
          <p className="mt-1 text-sm text-slate-500">{subtitle}</p>
        </div>
        {collapsible ? (
          <button
            type="button"
            onClick={() => setIsExpanded((current) => !current)}
            className="min-h-11 rounded-full bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-200"
          >
            {isExpanded ? "Hide notes" : "Show notes"}
          </button>
        ) : null}
      </div>

      {isExpanded ? (
        <div className="mt-5 space-y-5">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <label className="space-y-2 text-sm">
              <span className="font-medium text-slate-700">Player</span>
              <select
                value={playerName}
                onChange={(event) => setPlayerName(event.target.value)}
                className="min-h-11 w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 outline-none transition focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/20"
              >
                <option value="Full team">Full team</option>
                {players.map((player) => (
                  <option key={player} value={player}>
                    {player}
                  </option>
                ))}
              </select>
            </label>

            <label className="space-y-2 text-sm">
              <span className="font-medium text-slate-700">Day of week</span>
              <select
                value={dayOfWeek}
                onChange={(event) => setDayOfWeek(event.target.value)}
                className="min-h-11 w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 outline-none transition focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/20"
              >
                {days.map((day) => (
                  <option key={day} value={day}>
                    {day}
                  </option>
                ))}
              </select>
            </label>

            <label className="space-y-2 text-sm">
              <span className="font-medium text-slate-700">Date (optional)</span>
              <input
                type="date"
                value={noteDate}
                onChange={(event) => setNoteDate(event.target.value)}
                className="min-h-11 w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 outline-none transition focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/20"
              />
            </label>

            <label className="space-y-2 text-sm">
              <span className="font-medium text-slate-700">Author</span>
              <input
                value={author}
                onChange={(event) => setAuthor(event.target.value)}
                className="min-h-11 w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 outline-none transition focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/20"
              />
            </label>
          </div>

          <label className="block space-y-2 text-sm">
            <span className="font-medium text-slate-700">Note</span>
            <textarea
              value={noteText}
              onChange={(event) => setNoteText(event.target.value)}
              rows={4}
              className="w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/20"
              placeholder="Add coach context, session response, or follow-up detail."
            />
          </label>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={handleSave}
              className="min-h-11 rounded-full bg-brand-blue px-4 py-2 text-sm font-semibold text-white transition hover:brightness-95"
            >
              Save note
            </button>
            <button
              type="button"
              onClick={handleCancel}
              className="min-h-11 rounded-full bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-200"
            >
              Cancel
            </button>
          </div>

          <div className="space-y-3">
            {filteredNotes.length ? (
              filteredNotes.map((note) => (
                <div
                  key={note.id}
                  className="rounded-2xl border border-slate-100 bg-slate-50/80 p-4"
                >
                  <div className="flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-brand-blue/70">
                    <span>{note.playerName}</span>
                    <span>{note.dayOfWeek}</span>
                    {note.noteDate ? <span>{note.noteDate}</span> : null}
                  </div>
                  <p className="mt-3 text-sm leading-6 text-brand-ink">{note.noteText}</p>
                  <p className="mt-3 text-xs text-slate-500">
                    {note.author} • {new Date(note.createdAt).toLocaleString("en-CA")}
                  </p>
                </div>
              ))
            ) : (
              <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/80 p-4 text-sm text-slate-500">
                No notes yet for this scope.
              </div>
            )}
          </div>
        </div>
      ) : null}
    </article>
  );
}
