"use client";

import type {
  DashboardProfile,
  PlayerInjury,
  PlayerInjuryMap
} from "@/lib/types";

const INJURY_STORAGE_KEY = "topspin360-player-injuries";

const TEAM_DEFAULT_INJURIES: PlayerInjuryMap = {
  "Terrion Arnold": [
    {
      date: "2025-11-16",
      type: "head",
      label: "Concussion",
      weekLabel: "Week 11",
      status: "No data",
      notes: ["No training sessions saved under his name."],
      createdAt: "2025-11-16T12:00:00.000Z"
    }
  ],
  "Khalil Dorsey": [
    {
      date: "2025-09-28",
      type: "head",
      label: "Concussion / Wrist Injury",
      weekLabel: "Week 4",
      status: "Under review",
      createdAt: "2025-09-28T12:00:00.000Z"
    }
  ],
  "Kalif Raymond": [
    {
      date: "2025-10-05",
      type: "neck",
      label: "Neck Injury",
      weekLabel: "Week 5",
      status: "Follow-up expected",
      createdAt: "2025-10-05T12:00:00.000Z"
    }
  ],
  "Brock Wright": [
    {
      date: "2025-11-16",
      type: "neck",
      label: "Neck",
      weekLabel: "Week 11",
      notes: ["Interesting that RFD may not have been affected despite being on the injury report."],
      createdAt: "2025-11-16T12:00:00.000Z"
    }
  ],
  "Thomas Harper": [
    {
      date: "2025-12-04",
      type: "head",
      label: "Concussion",
      weekLabel: "Week 14",
      status: "No data",
      notes: ["No training sessions saved under his name."],
      createdAt: "2025-12-04T12:00:00.000Z"
    },
    {
      date: "2025-12-25",
      type: "head",
      label: "Concussion",
      weekLabel: "Week 17",
      status: "No data",
      notes: ["No training sessions saved under his name."],
      createdAt: "2025-12-25T12:00:00.000Z"
    }
  ],
  "Alex Anzalone": [
    {
      date: "2025-12-25",
      type: "head",
      label: "Concussion",
      weekLabel: "Week 17",
      status: "Single historical session",
      createdAt: "2025-12-25T12:00:00.000Z"
    }
  ]
};

function normalizeInjuryEntry(entry: unknown): PlayerInjury | null {
  if (!entry || typeof entry !== "object" || Array.isArray(entry)) {
    return null;
  }

  const injury = entry as Partial<PlayerInjury>;

  if (
    typeof injury.date !== "string" ||
    (injury.type !== "head" && injury.type !== "neck")
  ) {
    return null;
  }

  return {
    date: injury.date,
    type: injury.type,
    createdAt: typeof injury.createdAt === "string" ? injury.createdAt : undefined,
    label: typeof injury.label === "string" ? injury.label : undefined,
    weekLabel: typeof injury.weekLabel === "string" ? injury.weekLabel : undefined,
    weeksAffected:
      typeof injury.weeksAffected === "number" ? injury.weeksAffected : undefined,
    status: typeof injury.status === "string" ? injury.status : undefined,
    notes: Array.isArray(injury.notes)
      ? injury.notes.filter((note): note is string => typeof note === "string")
      : undefined
  };
}

function normalizeStoredInjuryMap(value: unknown): PlayerInjuryMap {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }

  return Object.entries(value).reduce<PlayerInjuryMap>((accumulator, [player, rawValue]) => {
    const entries = Array.isArray(rawValue)
      ? rawValue.map(normalizeInjuryEntry).filter((entry): entry is PlayerInjury => Boolean(entry))
      : [normalizeInjuryEntry(rawValue)].filter((entry): entry is PlayerInjury => Boolean(entry));

    if (entries.length) {
      accumulator[player] = entries;
    }

    return accumulator;
  }, {});
}

function mergeInjuryMaps(base: PlayerInjuryMap, custom: PlayerInjuryMap) {
  const merged: PlayerInjuryMap = { ...base };

  Object.entries(custom).forEach(([player, entries]) => {
    const existing = merged[player] ?? [];
    const seen = new Set(
      existing.map((entry) => `${entry.date}-${entry.type}-${entry.label ?? ""}-${entry.weekLabel ?? ""}`)
    );

    const nextEntries = [...existing];

    entries.forEach((entry) => {
      const signature = `${entry.date}-${entry.type}-${entry.label ?? ""}-${entry.weekLabel ?? ""}`;

      if (!seen.has(signature)) {
        nextEntries.push(entry);
        seen.add(signature);
      }
    });

    merged[player] = nextEntries.sort((left, right) => left.date.localeCompare(right.date));
  });

  return merged;
}

function getDefaultPlayerInjuries(profile: DashboardProfile): PlayerInjuryMap {
  return profile === "team" ? TEAM_DEFAULT_INJURIES : {};
}

export function getInjuryStorageKey(profile: DashboardProfile) {
  return `${INJURY_STORAGE_KEY}-${profile}`;
}

export function loadPlayerInjuries(profile: DashboardProfile): PlayerInjuryMap {
  const defaults = getDefaultPlayerInjuries(profile);

  if (typeof window === "undefined") {
    return defaults;
  }

  const stored = window.localStorage.getItem(getInjuryStorageKey(profile));

  if (!stored) {
    return defaults;
  }

  try {
    const parsed = JSON.parse(stored) as unknown;
    const normalized = normalizeStoredInjuryMap(parsed);
    return mergeInjuryMaps(defaults, normalized);
  } catch {
    window.localStorage.removeItem(getInjuryStorageKey(profile));
    return defaults;
  }
}

export function savePlayerInjuries(profile: DashboardProfile, injuries: PlayerInjuryMap) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(getInjuryStorageKey(profile), JSON.stringify(injuries));
}
