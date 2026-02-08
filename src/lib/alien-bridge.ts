// ALIEN JS BRIDGE — Same pattern as other apps
// 🚨 HACKATHON SWAP POINT 🚨

const IS_MOCK = process.env.NEXT_PUBLIC_ALIEN_MODE !== "real";

const NAMES = ["Pixel","Voxel","Raster","Vector","Hue","Chroma","Prism","Shade","Tint","Lumen"];

export async function verifyIdentity() {
  if (IS_MOCK) {
    await new Promise(r => setTimeout(r, 1500));
    return { success: true, alienId: `alien_${Date.now().toString(36)}`, displayName: NAMES[Math.floor(Math.random() * NAMES.length)], proofOfHuman: true };
  }
  // 🚀 REAL ALIEN SSO SDK — UNCOMMENT AT HACKATHON
  // import { alienVerifyIdentity } from './alien-sso-integration';
  // const result = await alienVerifyIdentity();
  // return { success: result.success, alienId: result.alienId, displayName: `Human ${result.alienId.slice(0,6)}`, proofOfHuman: result.proofOfHuman };
  throw new Error("Implement real bridge");
}

export async function sendPayment(to: string, amount: number, memo: string) {
  if (IS_MOCK) {
    await new Promise(r => setTimeout(r, 800));
    return { success: true, transactionId: `0x${Date.now().toString(16)}`, amount };
  }
  // 🚀 REAL ALIEN WALLET — GET EXACT API FROM HACKATHON DOCS
  // const wallet = (window as any).AlienWallet || (window as any).alien?.wallet;
  // const tx = await wallet.sendPayment({ to: recipientAlienId, amount, currency: 'ALIEN', memo });
  // return { success: true, transactionId: tx.id, amount };
  throw new Error("Implement real bridge");
}
