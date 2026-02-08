// HUMAN CANVAS — Types

export interface AlienIdentityResult {
  success: boolean;
  alienId: string;
  displayName: string;
  proofOfHuman: boolean;
}

export interface AlienPaymentResult {
  success: boolean;
  transactionId: string;
}

export interface AlienUser {
  id: string;
  alienId: string;
  displayName: string;
  verified: boolean;
  createdAt: number;
}

export interface Pixel {
  x: number;
  y: number;
  color: string;
  userId: string;
  userName: string;
  boosted: boolean;
  boostLevel: number; // 0 = normal, 1-3 = boosted
  placedAt: number;
  round: number;
}

export interface CanvasState {
  width: number;
  height: number;
  pixels: Pixel[];
  currentRound: number;
  roundEndsAt: number;
  totalPixelsPlaced: number;
  activeHumans: number;
}

export interface UserCanvasState {
  balance: number;
  pixelsPlaced: number;
  canPlaceThisRound: boolean;
  lastPlacedRound: number;
}

export const PALETTE = [
  "#FF0000", "#FF4500", "#FF8C00", "#FFD700",
  "#FFFF00", "#7CFC00", "#00FF00", "#00FA9A",
  "#00FFFF", "#00BFFF", "#0000FF", "#8A2BE2",
  "#FF00FF", "#FF1493", "#FFFFFF", "#808080",
  "#000000", "#8B4513", "#FF69B4", "#00FF88",
];

export const CANVAS_SIZE = 32; // 32x32 grid
export const ROUND_DURATION = 60000; // 60 seconds per round

export interface AIPixelSuggestion {
  id: string;
  x: number;
  y: number;
  color: string;
  reason: string;
  confidence: number;
  createdAt: number;
  isAI: true;
}

export interface CanvasNarrative {
  story: string;
  suggestions: AIPixelSuggestion[];
  patternDetected: string | null;
  communityStyle: string;
  lastAnalysis: number;
  isAI: true;
}
