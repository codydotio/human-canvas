/**
 * Alien Mini App Bridge — Real SDK Integration
 */

// @ts-ignore: Dynamic import - packages installed at runtime
import type { AlienIdentityResult, AlienPaymentResult } from "./types";

const IS_MOCK = process.env.NEXT_PUBLIC_ALIEN_MODE !== "real";

const MOCK_NAMES = [
  "Starlight", "Moonbeam", "Sunflower", "Raindrop", "Snowflake",
  "Firefly", "Breeze", "Coral", "Willow", "Clover",
];

function getOrCreateMockIdentity(): { id: string; name: string } {
  if (typeof window === "undefined") {
    return { id: "alien_server", name: "ServerUser" };
  }
  const stored = localStorage.getItem("alien_mock_identity");
  if (stored) {
    try { return JSON.parse(stored); } catch { /* fall through */ }
  }
  const id = `alien_${Math.random().toString(36).slice(2, 10)}`;
  const name = MOCK_NAMES[Math.floor(Math.random() * MOCK_NAMES.length)];
  const identity = { id, name };
  localStorage.setItem("alien_mock_identity", JSON.stringify(identity));
  return identity;
}

function simulateDelay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function verifyIdentity(): Promise<AlienIdentityResult> {
  if (IS_MOCK) {
    await simulateDelay(1500);
    const mock = getOrCreateMockIdentity();
    return { success: true, alienId: mock.id, displayName: mock.name, proofOfHuman: true };
  }

  try {
    // @ts-ignore: Dynamic import - packages installed at runtime
    const bridge = await import("@alien_org/bridge") as any;
    const { isBridgeAvailable, getLaunchParams } = bridge;
    if (!isBridgeAvailable()) {
      return { success: false, alienId: "", displayName: "", proofOfHuman: false };
    }
    const params = getLaunchParams();
    if (!params?.authToken) {
      return { success: false, alienId: "", displayName: "", proofOfHuman: false };
    }
    const payload = JSON.parse(atob(params.authToken.split(".")[1]));
    const alienId = payload.sub;
    return { success: true, alienId, displayName: `Human ${alienId.slice(0, 6)}`, proofOfHuman: true };
  } catch (err) {
    console.error("Alien bridge identity error:", err);
    return { success: false, alienId: "", displayName: "", proofOfHuman: false };
  }
}

export async function sendPayment(
  recipientAlienId: string,
  amount: number,
  memo: string
): Promise<AlienPaymentResult> {
  if (IS_MOCK) {
    await simulateDelay(2000);
    return { success: true, transactionId: `tx_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}` };
  }

  try {
    // @ts-ignore: Dynamic import - packages installed at runtime
    const bridge = await import("@alien_org/bridge") as any;
    const { request } = bridge;
    const invoice = `canvas-boost-${Date.now().toString(36)}`;
    const response = await request(
      "payment:request",
      {
        recipient: recipientAlienId,
        amount: String(amount * 1000000),
        token: "ALIEN",
        network: "alien",
        invoice,
        item: { title: `Pixel Boost: ${memo.slice(0, 30)}`, iconUrl: "https://human-canvas.vercel.app/icon.png", quantity: 1 },
      },
      "payment:response",
      { timeout: 120000 }
    );
    if (response.status === "paid") {
      return { success: true, transactionId: response.txHash || invoice };
    }
    return { success: false, transactionId: "" };
  } catch (err) {
    console.error("Alien bridge payment error:", err);
    return { success: false, transactionId: "" };
  }
}

export function isAlienBridgeAvailable(): boolean {
  if (typeof window === "undefined") return false;
  if (IS_MOCK) return true;
  try {
    const w = window as any;
    return !!(w.__ALIEN_AUTH_TOKEN__ || w.__ALIEN_BRIDGE__);
  } catch { return false; }
}
