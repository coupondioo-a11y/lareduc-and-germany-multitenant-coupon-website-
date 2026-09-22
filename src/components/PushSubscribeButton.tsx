"use client";

import { useState } from "react";
import { Bell, BellRing } from "lucide-react";

function urlBase64ToUint8Array(base64: string): BufferSource {
  const padding = "=".repeat((4 - (base64.length % 4)) % 4);
  const base64Safe = (base64 + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64Safe);
  return Uint8Array.from([...raw].map((c) => c.charCodeAt(0))) as BufferSource;
}

export function PushSubscribeButton({ storeSlug }: { storeSlug?: string }) {
  const [state, setState] = useState<"idle" | "loading" | "subscribed" | "error">("idle");

  async function subscribe() {
    setState("loading");
    try {
      if (!("serviceWorker" in navigator) || !("PushManager" in window)) throw new Error("unsupported");

      const permission = await Notification.requestPermission();
      if (permission !== "granted") throw new Error("permission denied");

      const registration = await navigator.serviceWorker.ready;
      const { publicKey } = await fetch("/api/push/vapid-public-key").then((r) => r.json());

      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey),
      });

      const res = await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...subscription.toJSON(), sourceStoreSlug: storeSlug }),
      });
      if (!res.ok) throw new Error("subscribe failed");

      setState("subscribed");
    } catch {
      setState("error");
    }
  }

  if (state === "subscribed") {
    return (
      <span className="inline-flex items-center gap-1.5 text-sm text-emerald-700">
        <BellRing size={15} aria-hidden />
        Alertes activées
      </span>
    );
  }

  return (
    <button
      type="button"
      onClick={subscribe}
      disabled={state === "loading"}
      className="inline-flex items-center gap-1.5 text-sm font-medium text-ink-soft transition-colors duration-200 hover:text-ink disabled:opacity-50"
    >
      <Bell size={15} aria-hidden />
      {state === "error" ? "Réessayer" : "Recevoir les alertes"}
    </button>
  );
}
