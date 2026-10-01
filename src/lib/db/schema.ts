import { sql } from "drizzle-orm";
import {
  boolean,
  check,
  date,
  integer,
  pgEnum,
  pgTable,
  serial,
  text,
  timestamp,
  unique,
} from "drizzle-orm/pg-core";

import { HABIT_UNITS, QUEST_PERIODS } from "../types";

export const habitUnit = pgEnum("habit_unit", HABIT_UNITS);
export const questPeriod = pgEnum("quest_period", QUEST_PERIODS);

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  displayName: text("display_name").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const habits = pgTable(
  "habits",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    unit: habitUnit("unit").notNull(),
    defaultTarget: integer("default_target").notNull(),
    color: text("color").notNull(),
    icon: text("icon").notNull(),
    archived: boolean("archived").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    unique("habits_user_name_unique").on(t.userId, t.name),
    check("habits_default_target_positive", sql`${t.defaultTarget} > 0`),
  ],
);

export const quests = pgTable(
  "quests",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    period: questPeriod("period").notNull(),
    startDate: date("start_date", { mode: "string" }).notNull(),
    endDate: date("end_date", { mode: "string" }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [check("quests_dates_ordered", sql`${t.endDate} >= ${t.startDate}`)],
);

export const questHabits = pgTable(
  "quest_habits",
  {
    id: serial("id").primaryKey(),
    questId: integer("quest_id").notNull().references(() => quests.id, { onDelete: "cascade" }),
    habitId: integer("habit_id").notNull().references(() => habits.id, { onDelete: "cascade" }),
    dailyTarget: integer("daily_target").notNull(),
  },
  (t) => [
    unique("quest_habits_quest_habit_unique").on(t.questId, t.habitId),
    check("quest_habits_target_positive", sql`${t.dailyTarget} > 0`),
  ],
);

export const logs = pgTable(
  "logs",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    habitId: integer("habit_id").notNull().references(() => habits.id, { onDelete: "cascade" }),
    date: date("date", { mode: "string" }).notNull(),
    amount: integer("amount").notNull().default(0),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    unique("logs_habit_date_unique").on(t.habitId, t.date),
    check("logs_amount_nonnegative", sql`${t.amount} >= 0`),
  ],
);
