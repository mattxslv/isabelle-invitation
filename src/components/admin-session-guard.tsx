"use client";

import { useEffect } from "react";
import { adminActivityAction, idleSignOutAction } from "@/app/admin/actions";
import { ADMIN_IDLE_MS } from "@/lib/session-policy";

const ACTIVITY_KEY = "isabelle-admin-activity";

export function AdminSessionGuard() {
  useEffect(() => {
    let lastActivity = Date.now();
    let lastSync = 0;
    let lastStored = 0;
    let syncing = false;
    let leaving = false;
    let stopped = false;
    function shareActivity() {
      if (lastActivity - lastStored < 1000) return;
      lastStored = lastActivity;
      try { localStorage.setItem(ACTIVITY_KEY, String(lastActivity)); } catch { /* Private browsing may disable storage. */ }
    }
    function latestActivity() {
      try {
        const shared = Number(localStorage.getItem(ACTIVITY_KEY));
        if (shared > lastActivity && shared <= Date.now()) lastActivity = shared;
      } catch { /* The current tab still tracks its own activity. */ }
      return lastActivity;
    }
    async function signOut() {
      if (leaving || stopped) return;
      leaving = true;
      try { await idleSignOutAction(); }
      catch { /* Redirect even when the network is unavailable; server expiry remains enforced. */ }
      finally { if (!stopped) window.location.replace("/admin/login"); }
    }
    function check() {
      if (Date.now() - latestActivity() >= ADMIN_IDLE_MS) { void signOut(); return false; }
      return !leaving;
    }
    async function sync() {
      if (syncing || leaving || stopped || Date.now() - lastSync < 60_000) return;
      syncing = true;
      lastSync = Date.now();
      try {
        const valid = await adminActivityAction();
        if (!valid && !stopped) window.location.replace("/admin/login");
      } catch { /* Server expiry still applies if the connection drops. */ }
      finally { syncing = false; }
    }
    function activity() {
      if (!check()) return;
      lastActivity = Date.now();
      shareActivity();
      void sync();
    }
    function visible() { if (document.visibilityState === "visible") check(); }
    shareActivity();
    void sync();
    const timer = window.setInterval(check, 1000);
    const events = ["pointerdown", "pointermove", "keydown", "scroll", "touchstart"] as const;
    for (const name of events) window.addEventListener(name, activity, { passive: true });
    document.addEventListener("visibilitychange", visible);
    window.addEventListener("focus", check);
    return () => {
      stopped = true;
      clearInterval(timer);
      for (const name of events) window.removeEventListener(name, activity);
      document.removeEventListener("visibilitychange", visible);
      window.removeEventListener("focus", check);
    };
  }, []);
  return null;
}
