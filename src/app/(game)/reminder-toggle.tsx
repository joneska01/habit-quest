"use client";

import { useEffect, useState } from "react";

import { urlBase64ToUint8Array } from "@/lib/push-logic";
import type { PushSubscriptionInput } from "@/lib/validation";

import { deletePushSubscription, savePushSubscription, sendTestPush } from "./push-actions";

type Status = "loading" | "unsupported" | "denied" | "off" | "on";

const HINTS: Partial<Record<Status, string>> = {
  unsupported: "Add Habit Quest to your Home Screen (Share → Add to Home Screen), then open it from there to turn on reminders.",
  denied: "Notifications are blocked. Turn them on in iPhone Settings → Notifications → Habit Quest, then reopen the app.",
  off: "Get a nudge around 7 pm on days with habits left.",
  on: "You'll get a nudge around 7 pm on days with habits left.",
};

export function ReminderToggle({ vapidPublicKey }: { vapidPublicKey: string }) {
  const [status, setStatus] = useState<Status>("loading");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  // Detect support and any existing subscription after mount (browser-only APIs).
  useEffect(() => {
    const supported = "serviceWorker" in navigator && "PushManager" in window && "Notification" in window;
    const check = async (): Promise<Status> => {
      if (!supported) return "unsupported";
      if (Notification.permission === "denied") return "denied";
      const reg = await navigator.serviceWorker.register("/sw.js", { scope: "/", updateViaCache: "none" });
      return (await reg.pushManager.getSubscription()) ? "on" : "off";
    };
    check()
      .then(setStatus)
      .catch(() => setStatus("unsupported"));
  }, []);

  async function run(action: () => Promise<void>) {
    setBusy(true);
    setMessage(null);
    try {
      await action();
    } catch {
      setMessage("Something went wrong. Try again from the home-screen app.");
    } finally {
      setBusy(false);
    }
  }

  const turnOn = () =>
    run(async () => {
      // iOS only shows the permission prompt in direct response to this tap.
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setStatus(permission === "denied" ? "denied" : "off");
        return;
      }
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
      });
      const result = await savePushSubscription(sub.toJSON() as PushSubscriptionInput);
      if ("error" in result) {
        await sub.unsubscribe();
        setMessage(result.error);
        return;
      }
      setStatus("on");
      setMessage("Reminders on! Tap SEND TEST to try one.");
    });

  const turnOff = () =>
    run(async () => {
      const sub = await (await navigator.serviceWorker.ready).pushManager.getSubscription();
      if (sub) {
        await deletePushSubscription(sub.endpoint);
        await sub.unsubscribe();
      }
      setStatus("off");
    });

  const test = () =>
    run(async () => {
      const { sent } = await sendTestPush();
      setMessage(sent > 0 ? "Test sent! Check your notifications." : "No device is subscribed yet. Tap TURN ON first.");
    });

  if (status === "loading") return null;

  return (
    <section className="pixel-card flex flex-col gap-3 bg-cloud p-4" aria-label="7 pm reminders">
      <h2 className="font-pixel text-xs">🔔 7 PM REMINDERS {status === "on" && <span className="text-grass">ON</span>}</h2>
      <p className="text-sm font-bold">{HINTS[status]}</p>
      {status === "off" && (
        <button type="button" disabled={busy} onClick={turnOn} className="pixel-btn">
          {busy ? "ASKING..." : "TURN ON"}
        </button>
      )}
      {status === "on" && (
        <div className="grid grid-cols-2 gap-2">
          <button type="button" disabled={busy} onClick={test} className="pixel-btn bg-grass px-1 text-[10px]">
            SEND TEST
          </button>
          <button type="button" disabled={busy} onClick={turnOff} className="pixel-btn bg-cloud px-1 text-[10px]">
            TURN OFF
          </button>
        </div>
      )}
      {message && (
        <p role="status" className="text-sm font-bold">
          {message}
        </p>
      )}
    </section>
  );
}
