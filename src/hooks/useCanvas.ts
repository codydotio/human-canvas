"use client";

import { useState, useCallback, useEffect } from "react";
import type { AlienUser, Pixel, CanvasState, UserCanvasState } from "@/lib/types";
import { verifyIdentity, sendPayment } from "@/lib/alien-bridge";

export function useAlien() {
  const [user, setUser] = useState<AlienUser | null>(null);
  const [userState, setUserState] = useState<UserCanvasState | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
      body: JSON.stringify({ userId: user.id, x, y, color }),
    });
    const data = await res.json();
    if (data.error) throw new Error(data.error);
    if (data.state) setUserState(data.state);
    return data.pixel;
  }, [user]);

  const boostPixel = useCallback(async (x: number, y: number, level: number) => {
    if (!user) throw new Error("Not verified");
    const payment = await sendPayment("canvas_boost", level, `Boost ${x},${y}`);
    if (!payment.success) throw new Error("Payment failed");
    const res = await fetch("/api/boost", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: user.id, x, y, level, transactionId: payment.transactionId }),
    });
    const data = await res.json();
    if (data.error) throw new Error(data.error);
    if (data.state) setUserState(data.state);
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
    if (data.state) setUserState(data.state);
  }, [user]);

  return { user, userState, isVerifying, error, verify, placePixel, boostPixel, refreshState };
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
    // Also poll every 5s for round timer updates
    const interval = setInterval(refresh, 5000);
    return () => { es.close(); clearInterval(interval); };
  }, [refresh]);

  return { canvasState, refresh };
}
