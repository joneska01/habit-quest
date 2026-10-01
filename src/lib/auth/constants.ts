// Kept dependency-free so proxy.ts can import it (Next docs: proxy shouldn't rely on shared server modules).
export type SessionData = { userId?: number };

export const SESSION_COOKIE = "hq_session";
