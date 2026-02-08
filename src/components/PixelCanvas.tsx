"use client";

import { useRef, useEffect, useState, useCallback } from "react";
import type { Pixel } from "@/lib/types";
import { CANVAS_SIZE } from "@/lib/types";

interface Props {
  pixels: Pixel[];
  selectedColor: string;
  canPlace: boolean;
  onPixelClick: (x: number, y: number) => void;
  onPixelHover: (pixel: Pixel | null) => void;
}

export default function PixelCanvas({ pixels, selectedColor, canPlace, onPixelClick, onPixelHover }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [canvasSize, setCanvasSize] = useState(320);
  const pixelMapRef = useRef(new Map<string, Pixel>());

  // Update pixel map
  useEffect(() => {
    const map = new Map<string, Pixel>();
    pixels.forEach(p => map.set(`${p.x},${p.y}`, p));
    pixelMapRef.current = map;
  }, [pixels]);

  // Resize
  useEffect(() => {
    const update = () => {
      if (containerRef.current) {
        const size = Math.min(containerRef.current.clientWidth, containerRef.current.clientHeight);
        setCanvasSize(size);
      }
    };
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  // Render
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = canvasSize * dpr;
    canvas.height = canvasSize * dpr;
    canvas.style.width = `${canvasSize}px`;
    canvas.style.height = `${canvasSize}px`;
    ctx.scale(dpr, dpr);

    const cellSize = canvasSize / CANVAS_SIZE;

    // Background
    ctx.fillStyle = "#050510";
    ctx.fillRect(0, 0, canvasSize, canvasSize);

    // Grid lines
    ctx.strokeStyle = "rgba(255, 255, 255, 0.03)";
    ctx.lineWidth = 0.5;
    for (let i = 0; i <= CANVAS_SIZE; i++) {
      ctx.beginPath();
      ctx.moveTo(i * cellSize, 0);
      ctx.lineTo(i * cellSize, canvasSize);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, i * cellSize);
      ctx.lineTo(canvasSize, i * cellSize);
      ctx.stroke();
    }

    // Draw pixels
    pixels.forEach(pixel => {
      const px = pixel.x * cellSize;
      const py = pixel.y * cellSize;

      // Glow for boosted pixels
      if (pixel.boosted && pixel.boostLevel > 0) {
        const glowRadius = cellSize * (0.5 + pixel.boostLevel * 0.3);
        const glow = ctx.createRadialGradient(
          px + cellSize / 2, py + cellSize / 2, 0,
          px + cellSize / 2, py + cellSize / 2, glowRadius
        );
        glow.addColorStop(0, pixel.color + "80");
        glow.addColorStop(1, "transparent");
        ctx.fillStyle = glow;
        ctx.fillRect(
          px + cellSize / 2 - glowRadius,
          py + cellSize / 2 - glowRadius,
          glowRadius * 2,
          glowRadius * 2
        );
      }

      // Pixel fill
      const size = pixel.boosted ? cellSize * (1 + pixel.boostLevel * 0.15) : cellSize;
      const offset = (size - cellSize) / 2;
      ctx.fillStyle = pixel.color;
      ctx.fillRect(px - offset, py - offset, size, size);

      // Subtle border
      ctx.strokeStyle = "rgba(255,255,255,0.08)";
      ctx.lineWidth = 0.5;
      ctx.strokeRect(px, py, cellSize, cellSize);
    });
  }, [pixels, canvasSize]);

  const getGridPos = useCallback((e: React.MouseEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    const cellSize = canvasSize / CANVAS_SIZE;
    const x = Math.floor((e.clientX - rect.left) / cellSize);
    const y = Math.floor((e.clientY - rect.top) / cellSize);
    if (x < 0 || x >= CANVAS_SIZE || y < 0 || y >= CANVAS_SIZE) return null;
    return { x, y };
  }, [canvasSize]);

  const handleClick = useCallback((e: React.MouseEvent) => {
    const pos = getGridPos(e);
    if (pos) onPixelClick(pos.x, pos.y);
  }, [getGridPos, onPixelClick]);

  const handleMove = useCallback((e: React.MouseEvent) => {
    const pos = getGridPos(e);
    if (pos) {
      const pixel = pixelMapRef.current.get(`${pos.x},${pos.y}`);
      onPixelHover(pixel || null);
    } else {
      onPixelHover(null);
    }
  }, [getGridPos, onPixelHover]);

  return (
    <div ref={containerRef} className="w-full aspect-square max-w-[400px] mx-auto">
      <canvas
        ref={canvasRef}
        onClick={handleClick}
        onMouseMove={handleMove}
        onMouseLeave={() => onPixelHover(null)}
        className={`rounded-xl border border-white/10 ${canPlace ? "cursor-crosshair" : "cursor-pointer"}`}
        style={{
          boxShadow: canPlace ? `0 0 20px ${selectedColor}30, 0 0 60px ${selectedColor}10` : "none",
        }}
      />
    </div>
  );
}
