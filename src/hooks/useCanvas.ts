"use client";

import { useState, useCallback, useEffect } from "react";
import type { AlienUser, Pixel, CanvasState, UserCanvasState } from "@/lib/types";
import { verifyIdentity, sendPayment } from "@/lib/alien-bridge";

const SESSION_KEY = "human_canvas_session";

interface StoredSession {
  user: AlienUser;
  state: UserCanvasState;
}

function saveSession(user: AlienUser, state: UserCanvasState) {
  try {
    localStorage.setItem(SESSION_KEY, JSON.stringify({ user, state }));
  } catch {}
}

function loadSession(): StoredSession | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function clearSession() {
  try {
    localStorage.removeItem(SESSION_KEY);
  } catch {}
}

export function useAlien() {
  const [user, setUser] = useState<AlienUser | null>(null);
  const [userState, setUserState] = useState<UserCanvasState | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Auto-restore session on mount
  useEffect(() => {
    const session = loadSession();
    if (session?.user) {
      setUser(session.user);
      setUserState(session.state);

      // Re-register with backend (ensures user exists in this serverless instance)
      fetch("/api/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          alienId: session.user.alienId,
          displayName: session.user.displayName,
        }),
      })
        .then((r) => r.json())
        .then((data) => {
          if (data.state) setUserState(data.state);
        })
        .catch(() => {});
    }
  }, []);

  const verify = useCallback(async () => {
    setIsVerifying(true);
    setError(null);
    try {
      const identity = await verifyIdentity();
      if (!identity.success) throw new Error("Failed");
      const res = await fetch("/api/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ alienId: identity.alienId, displayName: identity.displayName }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setUser(data.user);
      setUserState(data.state);
      // Persist session so page refresh keeps you logged in
      saveSession(data.user, data.state);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed");
    } finally {
      setIsVerifying(false);
    }
  }, []);

  const placePixel = useCallback(async (x: number, y: number, color: string) => {
    if (!user) throw new Error("Not verified");
    const res = await fetch("/api/place", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: user.id, x, y, color, fromDisplayName: user.displayName }),
    });
    const data = await res.json();
    if (data.error) throw new Error(data.error);
    if (data.state) {
      setUserState(data.state);
      saveSession(user, data.state);
    }
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("canvas-action"));
    }
    return data.pixel;
  }, [user]);

  const boostPixel = useCallback(async (x: number, y: number, level: number) => {
    if (!user) throw new Error("Not verified");
    const payment = await sendPayment("canvas_boost", level, `Boost ${x},${y}`);
    if (!payment.success) throw new Error("Payment failed");
    const res = await fetch("/api/boost", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: user.id, x, y, level, transactionId: payment.transactionId, fromDisplayName: user.displayName }),
    });
    const data = await res.json();
    if (data.error) throw new Error(data.error);
    if (data.state) {
      setUserState(data.state);
      saveSession(user, data.state);
    }
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("canvas-action"));
    }
    return data.pixel;
  }, [user]);

  const refreshState = useCallback(async () => {
    if (!user) return;
    const res = await fetch("/api/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ alienId: user.alienId, displayName: user.displayName }),
    });
    const data = await res.json();
    if (data.state) {
      setUserState(data.state);
      saveSession(user, data.state);
    }
  }, [user]);

  const logout = useCallback(() => {
    setUser(null);
    setUserState(null);
    clearSession();
  }, []);

  return { user, userState, isVerifying, error, verify, placePixel, boostPixel, refreshState, logout };
}

export function useCanvasData() {
  const [canvasState, setCanvasState] = useState<CanvasState | null>(null);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch("/api/canvas");
      const data = await res.json();
      setCanvasState(data);
    } catch {}
  }, []);

  useEffect(() => {
    refresh();
    const es = new EventSource("/api/events");
    es.onmessage = () => refresh();
    // Listen for local action events (serverless fallback)
    const handleAction = () => setTimeout(refresh, 500);
    window.addEventListener("canvas-action", handleAction);
    // Also poll every 5s for round timer updates
    const interval = setInterval(refresh, 5000);
    return () => {
      es.close();
      window.removeEventListener("canvas-action", handleAction);
      clearInterval(interval);
    };
  }, [refresh]);

  return { canvasState, refresh };
}
