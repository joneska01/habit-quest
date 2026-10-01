import { describe, expect, it } from "vitest";

import { questEndDate, questStatus, suggestQuestName } from "./quests";

describe("questEndDate", () => {
  it("makes week quests 7 days long", () => {
    expect(questEndDate("week", "2026-10-01")).toBe("2026-10-07");
  });
  it("runs month quests to the end of the start month", () => {
    expect(questEndDate("month", "2026-10-01")).toBe("2026-10-31");
    expect(questEndDate("month", "2026-10-15")).toBe("2026-10-31");
  });
});

describe("suggestQuestName", () => {
  it("names month and week quests", () => {
    expect(suggestQuestName("month", "2026-10-01")).toBe("October 2026");
    expect(suggestQuestName("week", "2026-10-01")).toBe("Week of Oct 1");
  });
});

describe("questStatus", () => {
  const quest = { startDate: "2026-10-01", endDate: "2026-10-31" };
  it("is inclusive on both ends", () => {
    expect(questStatus(quest, "2026-09-30")).toBe("upcoming");
    expect(questStatus(quest, "2026-10-01")).toBe("active");
    expect(questStatus(quest, "2026-10-31")).toBe("active");
    expect(questStatus(quest, "2026-11-01")).toBe("completed");
  });
});
