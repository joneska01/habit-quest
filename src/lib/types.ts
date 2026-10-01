// Shared by the DB schema and pure logic so both agree on one definition.
export const HABIT_UNITS = ["count", "minutes", "check"] as const;
export type HabitUnit = (typeof HABIT_UNITS)[number];

export const QUEST_PERIODS = ["week", "month"] as const;
export type QuestPeriod = (typeof QUEST_PERIODS)[number];
