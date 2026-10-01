import { describe, expect, it } from "vitest";

import { isGoneStatus, isPushHour, PUSH_HOUR, urlBase64ToUint8Array } from "./push-logic";

describe("isPushHour", () => {
  it("is only the 7 pm Central hour", () => {
    expect(PUSH_HOUR).toBe(19);
    expect(isPushHour(19)).toBe(true);
    expect(isPushHour(18)).toBe(false); // the CST-side cron firing during CDT... or vice versa
    expect(isPushHour(20)).toBe(false);
  });
});

describe("isGoneStatus", () => {
  it("treats 404 and 410 as an expired subscription", () => {
    expect(isGoneStatus(404)).toBe(true);
    expect(isGoneStatus(410)).toBe(true);
    expect(isGoneStatus(429)).toBe(false);
    expect(isGoneStatus(undefined)).toBe(false);
  });
});

describe("urlBase64ToUint8Array", () => {
  it("decodes URL-safe base64 without padding", () => {
    // "hi?" → standard base64 "aGk/" → URL-safe "aGk_"
    expect([...urlBase64ToUint8Array("aGk_")]).toEqual([104, 105, 63]);
    // "a" → "YQ==" → unpadded "YQ"
    expect([...urlBase64ToUint8Array("YQ")]).toEqual([97]);
  });
});
