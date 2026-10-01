// Pure push helpers (no DB, no web-push) so they're testable and client-safe.

/** Push lands at 7 pm Central. Two UTC crons fire; only the one in this hour sends. */
export const PUSH_HOUR = 19;

export function isPushHour(hourCentral: number): boolean {
  return hourCentral === PUSH_HOUR;
}

/** Push services answer 404/410 when a subscription is expired or revoked. */
export function isGoneStatus(status: number | undefined): boolean {
  return status === 404 || status === 410;
}

/** VAPID public keys are URL-safe base64 without padding; PushManager wants bytes. */
export function urlBase64ToUint8Array(base64String: string): Uint8Array<ArrayBuffer> {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64);
  const bytes = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) bytes[i] = raw.charCodeAt(i);
  return bytes;
}
