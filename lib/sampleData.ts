import type { TrainingSession } from "@/lib/types";

const seedRows = [
  ["Avery Chen", "2026-02-03", "Tuesday", 24.4, 22.6],
  ["Avery Chen", "2026-02-10", "Tuesday", 25.1, 23.8],
  ["Avery Chen", "2026-02-17", "Tuesday", 26.7, 24.1],
  ["Avery Chen", "2026-03-03", "Tuesday", 27.3, 24.8],
  ["Avery Chen", "2026-03-17", "Tuesday", 28.6, 25.2],
  ["Jordan Brooks", "2026-02-04", "Wednesday", 19.8, 21.4],
  ["Jordan Brooks", "2026-02-11", "Wednesday", 20.3, 22.1],
  ["Jordan Brooks", "2026-02-25", "Wednesday", 21.2, 23.4],
  ["Jordan Brooks", "2026-03-11", "Wednesday", 22.1, 23.9],
  ["Jordan Brooks", "2026-03-18", "Wednesday", 22.4, 24.2],
  ["Maya Singh", "2026-02-02", "Monday", 28.4, 27.8],
  ["Maya Singh", "2026-02-09", "Monday", 29.1, 28.5],
  ["Maya Singh", "2026-02-23", "Monday", 29.7, 29.1],
  ["Maya Singh", "2026-03-09", "Monday", 30.6, 29.8],
  ["Maya Singh", "2026-03-23", "Monday", 31.4, 30.1],
  ["Leo Martinez", "2026-02-05", "Thursday", 17.6, 18.1],
  ["Leo Martinez", "2026-02-12", "Thursday", 18.2, 18.4],
  ["Leo Martinez", "2026-02-26", "Thursday", 18.8, 19.5],
  ["Leo Martinez", "2026-03-12", "Thursday", 19.1, 20.2],
  ["Leo Martinez", "2026-03-19", "Thursday", 19.6, 20.8],
  ["Sofia Patel", "2026-02-06", "Friday", 26.1, 25.7],
  ["Sofia Patel", "2026-02-13", "Friday", 26.5, 26.2],
  ["Sofia Patel", "2026-02-27", "Friday", 27.4, 26.8],
  ["Sofia Patel", "2026-03-13", "Friday", 27.8, 27.2],
  ["Sofia Patel", "2026-03-20", "Friday", 28.3, 27.7],
  ["Noah Kim", "2026-02-03", "Tuesday", 21.7, 20.8],
  ["Noah Kim", "2026-02-17", "Tuesday", 22.4, 21.2],
  ["Noah Kim", "2026-03-03", "Tuesday", 22.6, 21.9],
  ["Noah Kim", "2026-03-10", "Tuesday", 23.1, 22.2],
  ["Noah Kim", "2026-03-24", "Tuesday", 24.1, 22.8],
  ["Riley Turner", "2026-02-06", "Friday", 16.5, 17.2],
  ["Riley Turner", "2026-02-20", "Friday", 17.1, 17.5],
  ["Riley Turner", "2026-03-06", "Friday", 17.4, 18.1],
  ["Riley Turner", "2026-03-13", "Friday", 17.6, 18.3],
  ["Riley Turner", "2026-03-20", "Friday", 17.9, 18.7],
  ["Emma Walker", "2026-02-07", "Saturday", 23.8, 24.4],
  ["Emma Walker", "2026-02-21", "Saturday", 24.1, 24.7],
  ["Emma Walker", "2026-03-07", "Saturday", 24.9, 25.3],
  ["Emma Walker", "2026-03-14", "Saturday", 25.2, 25.6],
  ["Emma Walker", "2026-03-21", "Saturday", 25.8, 26.1]
] as const;

export const sampleTrainingData: TrainingSession[] = seedRows.map(
  ([player, date, dayOfWeek, maxRfdCCW, maxRfdCW], index) => ({
    id: `${player}-${date}-${index}`,
    player,
    date,
    dayOfWeek,
    maxRfdCCW,
    maxRfdCW,
    bestRfd: Math.max(maxRfdCCW, maxRfdCW)
  })
);
