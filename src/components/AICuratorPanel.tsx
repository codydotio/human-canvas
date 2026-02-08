"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { CanvasNarrative, AIPixelSuggestion } from "@/lib/types";

interface Props {
  onSuggestPixel?: (x: number, y: number, color: string) => void;
}

export default function AICuratorPanel({ onSuggestPixel }: Props) {
  const [narrative, setNarrative] = useState<CanvasNarrative | null>(null);
  const [expanded, setExpanded] = useState(false);
  const [usedSuggestions, setUsedSuggestions] = useState<Set<string>>(new Set());

  useEffect(() => {
    const fetchNarrative = async () => {
      try {
        const res = await fetch("/api/ai/canvas");
        if (res.ok) setNarrative(await res.json());
      } catch { /* silent */ }
    };
    fetchNarrative();
    const interval = setInterval(fetchNarrative, 20000);
    return () => clearInterval(interval);
  }, []);

  if (!narrative) return null;

  const handleUseSuggestion = (suggestion: AIPixelSuggestion) => {
    if (onSuggestPixel) {
      onSuggestPixel(suggestion.x, suggestion.y, suggestion.color);
    }
    setUsedSuggestions(prev => new Set(prev).add(suggestion.id));
  };

  return (
    <div className="max-w-md mx-auto px-4 mb-4">
      <motion.div
        layout
        className="rounded-2xl bg-gradient-to-br from-cyan-500/10 to-purple-500/10 border border-cyan-500/20 overflow-hidden"
      >
        <button
          onClick={() => setExpanded(!expanded)}
          className="w-full px-4 py-3 flex items-center justify-between"
        >
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-cyan-500/20 flex items-center justify-center">
              <span className="text-xs">🎨</span>
            </div>
            <span className="text-sm font-medium text-cyan-300">AI Art Curator</span>
            <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-400 font-medium">
              AI-GENERATED
            </span>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right">
              <div className="text-sm font-bold text-cyan-400">
                {narrative.suggestions.length}
              </div>
              <div className="text-[8px] text-white/30">IDEAS</div>
            </div>
            <motion.span animate={{ rotate: expanded ? 180 : 0 }} className="text-white/30 text-xs">▼</motion.span>
          </div>
        </button>

        <AnimatePresence>
          {expanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="px-4 pb-3"
            >
              {/* Canvas Story */}
              <div className="p-2 rounded-xl bg-white/[0.03] mb-3">
                <p className="text-xs text-white/70 leading-relaxed italic">&ldquo;{narrative.story}&rdquo;</p>
                <p className="text-[9px] text-white/30 mt-1">{narrative.communityStyle}</p>
              </div>

              {/* Pixel Suggestions */}
              <div className="text-[10px] text-white/40 mb-2">Suggested pixels:</div>
              <div className="space-y-2">
                {narrative.suggestions.map((suggestion) => (
                  <div key={suggestion.id} className="flex items-center gap-2 p-2 rounded-xl bg-white/[0.03]">
                    <div
                      className="w-6 h-6 rounded-md border border-white/20 flex-shrink-0"
                      style={{ background: suggestion.color }}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-white/70">
                        ({suggestion.x}, {suggestion.y}) — {suggestion.reason}
                      </p>
                      <span className="text-[9px] text-white/30">
                        {Math.round(suggestion.confidence * 100)}% confidence
                      </span>
                    </div>
                    {!usedSuggestions.has(suggestion.id) && onSuggestPixel && (
                      <button
                        onClick={() => handleUseSuggestion(suggestion)}
                        className="text-[9px] px-2 py-1 rounded-full bg-cyan-500/20 text-cyan-400 font-medium flex-shrink-0"
                      >
                        Use →
                      </button>
                    )}
                    {usedSuggestions.has(suggestion.id) && (
                      <span className="text-[9px] text-green-400/60 flex-shrink-0">✓ Used</span>
                    )}
                  </div>
                ))}
              </div>

              <div className="mt-2 pt-2 border-t border-white/5">
                <span className="text-[9px] text-white/20">
                  AI suggests · Humans decide · Every pixel is placed by a verified human
                </span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
