import type { CoachNote } from "@/lib/types";

const NOTES_STORAGE_KEY = "topspin360-coach-notes";

export function loadCoachNotes() {
  if (typeof window === "undefined") {
    return [] as CoachNote[];
  }

  try {
    const stored = window.localStorage.getItem(NOTES_STORAGE_KEY);

    if (!stored) {
      return [];
    }

    const parsed = JSON.parse(stored) as CoachNote[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveCoachNotes(notes: CoachNote[]) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(NOTES_STORAGE_KEY, JSON.stringify(notes));
}
