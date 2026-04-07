import type { CoachNote } from "@/lib/types";

const NOTES_STORAGE_KEY = "topspin360-coach-notes";

function getNotesStorageKey(namespace = "default") {
  return `${NOTES_STORAGE_KEY}-${namespace}`;
}

export function loadCoachNotes(namespace = "default") {
  if (typeof window === "undefined") {
    return [] as CoachNote[];
  }

  try {
    const stored = window.localStorage.getItem(getNotesStorageKey(namespace));

    if (!stored) {
      return [];
    }

    const parsed = JSON.parse(stored) as CoachNote[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveCoachNotes(notes: CoachNote[], namespace = "default") {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(getNotesStorageKey(namespace), JSON.stringify(notes));
}
