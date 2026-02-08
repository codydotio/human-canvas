"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAlien, useCanvasData } from "@/hooks/useCanvas";
import PixelCanvas from "@/components/PixelCanvas";
import AICuratorPanel from "@/components/AICuratorPanel";
import { PALETTE } from "@/lib/types";
import type { Pixel } from "@/lib/types";

export default function Home() {
  const { user, userState, isVerifying, error, verify, placePixel, boostPixel, refreshState } = useAlien();
  const { canvasState } = useCanvasData();
  const [selectedColor, setSelectedColor] = useState(PALETTE[0]);
  const [hoveredPixel, setHoveredPixel] = useState<Pixel | null>(null);
  const [roundTimer, setRoundTimer] = useState(60);
  const [message, setMessage] = useState<string | null>(null);
  const [started, setStarted] = useState(false);

  // Round timer countdown
  useEffect(() => {
    if (!canvasState) return;
    const tick = () => {
      const remaining = Math.max(0, Math.ceil((canvasState.roundEndsAt - Date.now()) / 1000));
      setRoundTimer(remaining);
    };
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [canvasState]);

  const handlePixelClick = useCallback(async (x: number, y: number) => {
    if (!user || !userState) return;
    if (!userState.canPlaceThisRound) {
      setMessage("Wait for next round!");
      setTimeout(() => setMessage(null), 2000);
      return;
    }
    try {
      await placePixel(x, y, selectedColor);
      setMessage("Pixel placed!");
      setTimeout(() => setMessage(null), 1500);
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Failed");
      setTimeout(() => setMessage(null), 2000);
    }
  }, [user, userState, selectedColor, placePixel]);

  // Onboarding
  if (!user) {
    return (
      <div className="fixed inset-0 bg-canvas-void flex flex-col items-center justify-center px-6">
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {/* Grid pattern */}
          <div className="absolute inset-0 opacity-5" style={{
            backgroundImage: "linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)",
            backgroundSize: "20px 20px",
          }} />
        </div>
        <AnimatePresence mode="wait">
          {!started ? (
            <motion.div key="intro" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="relative z-10 text-center max-w-sm">
              <motion.div className="text-7xl mb-5" animate={{ rotate: [0, 5, -5, 0] }} transition={{ duration: 4, repeat: Infinity }}>
                🎨
              </motion.div>
              <h1 className="text-3xl font-bold mb-3">Human Canvas</h1>
              <p className="text-white/50 text-base leading-relaxed mb-8">
                One human. One pixel. One round.
                <br /><br />
                Every 60 seconds, each verified human places exactly <span className="text-canvas-neon font-bold">one pixel</span>.
                Pay to <span className="text-canvas-gold font-bold">boost</span> your art.
                <br />Together, we create something beautiful.
              </p>
              <motion.button onClick={() => setStarted(true)} className="w-full py-4 rounded-2xl bg-gradient-to-r from-canvas-neon to-canvas-cyber text-black font-bold text-lg shadow-lg" whileTap={{ scale: 0.97 }}>
                Start Creating
              </motion.button>
            </motion.div>
          ) : (
            <motion.div key="verify" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="relative z-10 text-center max-w-sm">
              <div className="text-7xl mb-5">👽</div>
              <h2 className="text-2xl font-bold mb-3">Verify to Paint</h2>
              <p className="text-white/50 text-sm mb-8">Only real humans can place pixels. No bots. No duplicates. Pure human art.</p>
              {error && <div className="mb-4 px-4 py-2 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">{error}</div>}
              <motion.button onClick={verify} disabled={isVerifying} className="w-full py-4 rounded-2xl bg-gradient-to-r from-canvas-gold to-canvas-ember text-black font-bold text-lg disabled:opacity-50" whileTap={{ scale: 0.97 }}>
                {isVerifying ? "Verifying..." : "Verify with Alien ID"}
              </motion.button>
              <button onClick={() => setStarted(false)} className="mt-4 text-white/30 text-sm">← Back</button>
            </motion.div>
          )}
        </AnimatePresence>
        <div className="absolute bottom-6 text-white/15 text-xs">Built on <span className="text-white/25">Alien Protocol</span></div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-canvas-void text-white">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-canvas-void/80 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-md mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl">🎨</span>
            <div>
              <h1 className="text-base font-bold">Human Canvas</h1>
              <div className="text-[10px] text-white/30">Round {canvasState?.currentRound || 1}</div>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-center">
              <div className={`text-lg font-bold font-mono ${roundTimer <= 10 ? "text-canvas-ember animate-pulse" : "text-canvas-neon"}`}>
                {roundTimer}s
              </div>
              <div className="text-[9px] text-white/30">NEXT ROUND</div>
            </div>
            <div className="text-right">
              <div className="text-sm font-bold text-canvas-gold">{userState?.balance ?? 0}</div>
              <div className="text-[9px] text-white/30">TOKENS</div>
            </div>
          </div>
        </div>
      </div>

      {/* Status */}
      <div className="max-w-md mx-auto px-4 py-3">
        <div className={`text-center text-sm font-medium py-2 rounded-xl ${
          userState?.canPlaceThisRound
            ? "bg-canvas-neon/10 text-canvas-neon border border-canvas-neon/20"
            : "bg-white/5 text-white/40 border border-white/5"
        }`}>
          {userState?.canPlaceThisRound
            ? `🟢 Your turn — tap to place a ${selectedColor === "#000000" ? "black" : "colored"} pixel`
            : "⏳ Pixel placed! Wait for next round..."
          }
        </div>
      </div>

      {/* Canvas */}
      <div className="max-w-md mx-auto px-4">
        <PixelCanvas
          pixels={canvasState?.pixels || []}
          selectedColor={selectedColor}
          canPlace={userState?.canPlaceThisRound ?? false}
          onPixelClick={handlePixelClick}
          onPixelHover={setHoveredPixel}
        />
      </div>

      {/* Hovered pixel info */}
      {hoveredPixel && (
        <div className="max-w-md mx-auto px-4 mt-2">
          <div className="text-center text-xs text-white/40">
            <span className="inline-block w-3 h-3 rounded-sm mr-1" style={{ background: hoveredPixel.color }} />
            {hoveredPixel.userName} · ({hoveredPixel.x}, {hoveredPixel.y})
            {hoveredPixel.boosted && <span className="text-canvas-gold ml-1">✨ Boosted</span>}
          </div>
        </div>
      )}

      {/* AI Art Curator Panel */}
      <AICuratorPanel
        onSuggestPixel={(x, y, color) => {
          setSelectedColor(color);
          handlePixelClick(x, y);
        }}
      />

      {/* Color Palette */}
      <div className="max-w-md mx-auto px-4 py-4">
        <div className="text-[10px] text-white/30 uppercase tracking-wider mb-2">Color</div>
        <div className="flex flex-wrap gap-1.5 justify-center">
          {PALETTE.map((color) => (
            <button
              key={color}
              onClick={() => setSelectedColor(color)}
              className={`w-8 h-8 rounded-lg border-2 transition-all ${
                selectedColor === color ? "border-white scale-110 shadow-lg" : "border-transparent hover:border-white/20"
              }`}
              style={{ background: color, boxShadow: selectedColor === color ? `0 0 12px ${color}80` : "none" }}
            />
          ))}
        </div>
      </div>

      {/* Stats */}
      <div className="max-w-md mx-auto px-4 pb-8">
        <div className="grid grid-cols-3 gap-3 text-center">
          <div className="px-3 py-3 rounded-xl bg-white/[0.03] border border-white/[0.05]">
            <div className="text-xl font-bold text-canvas-cyber">{canvasState?.totalPixelsPlaced || 0}</div>
            <div className="text-[10px] text-white/30">PIXELS</div>
          </div>
          <div className="px-3 py-3 rounded-xl bg-white/[0.03] border border-white/[0.05]">
            <div className="text-xl font-bold text-canvas-neon">{canvasState?.activeHumans || 0}</div>
            <div className="text-[10px] text-white/30">HUMANS</div>
          </div>
          <div className="px-3 py-3 rounded-xl bg-white/[0.03] border border-white/[0.05]">
            <div className="text-xl font-bold text-canvas-gold">{userState?.pixelsPlaced || 0}</div>
            <div className="text-[10px] text-white/30">YOURS</div>
          </div>
        </div>
      </div>

      {/* Toast message */}
      <AnimatePresence>
        {message && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-6 left-0 right-0 flex justify-center z-50"
          >
            <div className="px-6 py-3 rounded-full bg-black/90 border border-white/10 text-white text-sm font-medium shadow-xl">
              {message}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}
