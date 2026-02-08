// HUMAN CANVAS — In-Memory Store

import type { AlienUser, Pixel, CanvasState, UserCanvasState } from "./types";
import { CANVAS_SIZE, ROUND_DURATION } from "./types";

const INITIAL_BALANCE = 5;

const users = new Map<string, AlienUser>();
const pixels = new Map<string, Pixel>(); // key: "x,y"
const balances = new Map<string, number>();
const userLastRound = new Map<string, number>();

let currentRound = 1;
let roundStartedAt = Date.now();

type Subscriber = (event: string, data: unknown) => void;
const subscribers = new Set<Subscriber>();

// Advance rounds automatically
function checkRound() {
  if (Date.now() - roundStartedAt >= ROUND_DURATION) {
    currentRound++;
    roundStartedAt = Date.now();
    broadcast("new_round", { round: currentRound, endsAt: roundStartedAt + ROUND_DURATION });
  }
}

// Seed some art
function seed() {
  if (users.size > 0) return;

  const seedUsers = [
    { id: "alien_c01", name: "Pixel" }, { id: "alien_c02", name: "Voxel" },
    { id: "alien_c03", name: "Raster" }, { id: "alien_c04", name: "Vector" },
    { id: "alien_c05", name: "Hue" }, { id: "alien_c06", name: "Chroma" },
  ];

  seedUsers.forEach((u) => {
    users.set(u.id, { id: u.id, alienId: u.id, displayName: u.name, verified: true, createdAt: Date.now() });
    balances.set(u.id, INITIAL_BALANCE);
  });

  // Draw a small heart in the center
  const heart = [
    [0,1],[0,2],[1,0],[1,1],[1,2],[1,3],[2,0],[2,1],[2,2],[2,3],[2,4],
    [3,1],[3,2],[3,3],[4,2],
  ];
  const cx = Math.floor(CANVAS_SIZE / 2) - 2;
  const cy = Math.floor(CANVAS_SIZE / 2) - 2;
  const colors = ["#FF1493", "#FF69B4", "#FF0000", "#FF4500"];

  heart.forEach(([dy, dx], i) => {
    const x = cx + dx;
    const y = cy + dy;
    const userId = seedUsers[i % seedUsers.length].id;
    const key = `${x},${y}`;
    pixels.set(key, {
      x, y,
      color: colors[i % colors.length],
      userId,
      userName: seedUsers.find(u => u.id === userId)!.name,
      boosted: false,
      boostLevel: 0,
      placedAt: Date.now() - 300000,
      round: 0,
    });
  });
}

seed();

// ---- API ----

export function getUser(userId: string): AlienUser | undefined {
  return users.get(userId);
}

export function registerUser(alienId: string, displayName: string): AlienUser {
  const existing = users.get(alienId);
  if (existing) return existing;
  const user: AlienUser = { id: alienId, alienId, displayName, verified: true, createdAt: Date.now() };
  users.set(alienId, user);
  balances.set(alienId, INITIAL_BALANCE);
  broadcast("user_joined", { id: alienId, name: displayName });
  return user;
}

export function getCanvasState(): CanvasState {
  checkRound();
  return {
    width: CANVAS_SIZE,
    height: CANVAS_SIZE,
    pixels: Array.from(pixels.values()),
    currentRound,
    roundEndsAt: roundStartedAt + ROUND_DURATION,
    totalPixelsPlaced: pixels.size,
    activeHumans: users.size,
  };
}

export function getUserCanvasState(userId: string): UserCanvasState {
  checkRound();
  const lastRound = userLastRound.get(userId) || 0;
  return {
    balance: balances.get(userId) || 0,
    pixelsPlaced: Array.from(pixels.values()).filter(p => p.userId === userId).length,
    canPlaceThisRound: lastRound < currentRound,
    lastPlacedRound: lastRound,
  };
}

export function placePixel(
  userId: string, x: number, y: number, color: string
): Pixel | { error: string } {
  checkRound();
  if (!users.has(userId)) return { error: "Not verified" };
  if (x < 0 || x >= CANVAS_SIZE || y < 0 || y >= CANVAS_SIZE) return { error: "Out of bounds" };

  const lastRound = userLastRound.get(userId) || 0;
  if (lastRound >= currentRound) return { error: "Wait for next round — one pixel per round!" };

  const pixel: Pixel = {
    x, y, color, userId,
    userName: users.get(userId)!.displayName,
    boosted: false, boostLevel: 0,
    placedAt: Date.now(),
    round: currentRound,
  };

  pixels.set(`${x},${y}`, pixel);
  userLastRound.set(userId, currentRound);
  broadcast("pixel_placed", pixel);
  return pixel;
}

export function boostPixel(
  userId: string, x: number, y: number, level: number, transactionId?: string
): Pixel | { error: string } {
  if (!users.has(userId)) return { error: "Not verified" };
  const key = `${x},${y}`;
  const pixel = pixels.get(key);
  if (!pixel) return { error: "No pixel at this position" };
  if (level < 1 || level > 3) return { error: "Boost level must be 1-3" };

  const cost = level;
  const balance = balances.get(userId) || 0;
  if (balance < cost) return { error: "Insufficient balance" };

  balances.set(userId, balance - cost);
  pixel.boosted = true;
  pixel.boostLevel = Math.min(3, pixel.boostLevel + level);
  pixels.set(key, pixel);

  broadcast("pixel_boosted", pixel);
  return pixel;
}

export function subscribe(callback: Subscriber) {
  subscribers.add(callback);
  return () => subscribers.delete(callback);
}

function broadcast(event: string, data: unknown) {
  subscribers.forEach((cb) => { try { cb(event, data); } catch { subscribers.delete(cb); } });
}
