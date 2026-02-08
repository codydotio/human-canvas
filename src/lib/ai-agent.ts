import type { AIPixelSuggestion, CanvasNarrative, Pixel } from "./types";
import { PALETTE, CANVAS_SIZE } from "./types";

const NARRATIVES = [
  "The canvas is coming alive! Humans are collaborating on what looks like {pattern}",
  "A beautiful {pattern} is emerging from collective creativity",
  "Each pixel tells a story. Right now, the community is painting {pattern}",
  "Art is being born — {pattern} is taking shape one pixel at a time",
  "The canvas speaks: {pattern}. Every human touch adds to the masterpiece",
];

const PATTERNS = [
  "a colorful mosaic",
  "an abstract landscape",
  "a pixel art masterpiece",
  "a community mural",
  "a digital tapestry",
  "something uniquely human",
  "a collaborative vision",
  "organized chaos — in the best way",
];

const SUGGESTION_REASONS = [
  "This spot would complement the nearby colors nicely",
  "A pixel here could connect two emerging patterns",
  "This area needs some love — it's been empty!",
  "Adding color here would create a pleasing symmetry",
  "This pixel could complete an emerging shape",
  "The composition would benefit from color in this region",
];

function findEmptySpots(pixels: Pixel[]): Array<{x: number; y: number}> {
  const occupied = new Set(pixels.map(p => `${p.x},${p.y}`));
  const empty: Array<{x: number; y: number}> = [];

  // Find empty spots near existing pixels (more interesting suggestions)
  for (const p of pixels) {
    const neighbors = [
      { x: p.x - 1, y: p.y }, { x: p.x + 1, y: p.y },
      { x: p.x, y: p.y - 1 }, { x: p.x, y: p.y + 1 },
    ];
    for (const n of neighbors) {
      if (n.x >= 0 && n.x < CANVAS_SIZE && n.y >= 0 && n.y < CANVAS_SIZE && !occupied.has(`${n.x},${n.y}`)) {
        empty.push(n);
      }
    }
  }
  return empty;
}

function suggestColor(pixels: Pixel[], x: number, y: number): string {
  // Find nearby pixel colors and suggest a complementary one
  const nearby = pixels.filter(p => Math.abs(p.x - x) <= 2 && Math.abs(p.y - y) <= 2);
  if (nearby.length === 0) return PALETTE[Math.floor(Math.random() * PALETTE.length)];

  // Pick a color that's in the palette but not dominant nearby
  const nearbyColors = new Set(nearby.map(p => p.color));
  const unusedColors = PALETTE.filter(c => !nearbyColors.has(c));
  return unusedColors.length > 0
    ? unusedColors[Math.floor(Math.random() * unusedColors.length)]
    : PALETTE[Math.floor(Math.random() * PALETTE.length)];
}

export function analyzeCanvas(pixels: Pixel[]): CanvasNarrative {
  const now = Date.now();
  const suggestions: AIPixelSuggestion[] = [];

  // Generate 2-3 pixel suggestions
  const emptySpots = findEmptySpots(pixels);
  const numSuggestions = Math.min(3, emptySpots.length);
  const shuffled = emptySpots.sort(() => Math.random() - 0.5);

  for (let i = 0; i < numSuggestions; i++) {
    const spot = shuffled[i];
    suggestions.push({
      id: `ai_suggest_${now}_${i}`,
      x: spot.x,
      y: spot.y,
      color: suggestColor(pixels, spot.x, spot.y),
      reason: SUGGESTION_REASONS[Math.floor(Math.random() * SUGGESTION_REASONS.length)],
      confidence: 0.6 + Math.random() * 0.3,
      createdAt: now,
      isAI: true,
    });
  }

  // Generate narrative
  const pattern = PATTERNS[Math.floor(Math.random() * PATTERNS.length)];
  const template = NARRATIVES[Math.floor(Math.random() * NARRATIVES.length)];
  const story = template.replace("{pattern}", pattern);

  // Detect dominant colors for "community style"
  const colorCounts: Record<string, number> = {};
  for (const p of pixels) {
    colorCounts[p.color] = (colorCounts[p.color] || 0) + 1;
  }
  const topColors = Object.entries(colorCounts).sort((a, b) => b[1] - a[1]).slice(0, 3);
  const communityStyle = topColors.length > 0
    ? `Favoring ${topColors.map(([c]) => c).join(", ")} — ${pixels.length} pixels placed by real humans`
    : "The canvas awaits its first human touch";

  return {
    story,
    suggestions,
    patternDetected: pattern,
    communityStyle,
    lastAnalysis: now,
    isAI: true,
  };
}

// 🚨 HACKATHON SWAP POINT — OpenClaw Integration 🚨
// Replace mock analysis with real OpenClaw agent:
//
// const claw = new WebSocket('ws://127.0.0.1:18789');
// claw.send(JSON.stringify({
//   type: 'tool.invoke',
//   tool: 'art-curator',
//   params: { pixels }
// }));
//
// OpenClaw can use vision models to actually "see" the canvas
// and provide much more intelligent pattern detection and suggestions.
