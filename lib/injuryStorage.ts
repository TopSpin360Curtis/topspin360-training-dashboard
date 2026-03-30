"use client";

import type { DashboardProfile, PlayerInjuryMap } from "@/lib/types";

const INJURY_STORAGE_KEY = "topspin360-player-injuries";

export function getInjuryStorageKey(profile: DashboardProfile) {
  return `${INJURY_STORAGE_KEY}-${profile}`;
}

export function loadPlayerInjuries(profile: DashboardProfile): PlayerInjuryMap {
  if (typeof window === "undefined") {
    return {};
  }

  const stored = window.localStorage.getItem(getInjuryStorageKey(profile));

  if (!stored) {
    return {};
  }

  try {
    const parsed = JSON.parse(stored) as PlayerInjuryMap;

    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      return {};
    }

    return parsed;
  } catch {
    window.localStorage.removeItem(getInjuryStorageKey(profile));
    return {};
  }
}

export function savePlayerInjuries(profile: DashboardProfile, injuries: PlayerInjuryMap) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(getInjuryStorageKey(profile), JSON.stringify(injuries));
}
