/**
 * 🚀 ALIEN SSO INTEGRATION — READY FOR HACKATHON DAY
 *
 * At the hackathon:
 * 1. npm install @alien_org/sso-sdk-core @alien_org/sso-sdk-react
 * 2. Register at dev.alien.org/dashboard → get providerAddress
 * 3. Set NEXT_PUBLIC_ALIEN_PROVIDER_ADDRESS in .env.local
 * 4. Set NEXT_PUBLIC_ALIEN_MODE=real
 * 5. Uncomment the real implementation in alien-bridge.ts
 */

// ============================================
// Core Client Setup
// ============================================
// import { AlienSsoClient } from '@alien_org/sso-sdk-core';
//
// const PROVIDER_ADDRESS = process.env.NEXT_PUBLIC_ALIEN_PROVIDER_ADDRESS || '';
//
// let clientInstance: AlienSsoClient | null = null;
//
// export function getAlienClient(): AlienSsoClient {
//   if (!clientInstance) {
//     clientInstance = new AlienSsoClient({ providerAddress: PROVIDER_ADDRESS });
//   }
//   return clientInstance;
// }
//
// ============================================
// Identity Verification (OIDC + PKCE)
// ============================================
// export async function alienVerifyIdentity(): Promise<{
//   success: boolean;
//   alienId: string;
//   proofOfHuman: boolean;
// }> {
//   const client = getAlienClient();
//   const existingSub = client.getSubject();
//   if (existingSub && !client.isTokenExpired()) {
//     return { success: true, alienId: existingSub, proofOfHuman: true };
//   }
//   if (client.hasRefreshToken()) {
//     try {
//       await client.refreshAccessToken();
//       const sub = client.getSubject();
//       if (sub) return { success: true, alienId: sub, proofOfHuman: true };
//     } catch { /* new auth */ }
//   }
//   const { deep_link, polling_code } = await client.generateDeeplink();
//   window.open(deep_link, '_blank');
//   for (let i = 0; i < 60; i++) {
//     await new Promise(r => setTimeout(r, 2000));
//     const poll = await client.pollAuth(polling_code);
//     if (poll.status === 'authorized' && poll.authorization_code) {
//       await client.exchangeToken(poll.authorization_code);
//       return { success: true, alienId: client.getSubject()!, proofOfHuman: true };
//     }
//     if (poll.status === 'rejected' || poll.status === 'expired') break;
//   }
//   return { success: false, alienId: '', proofOfHuman: false };
// }
//
// ============================================
// Payments (Alien Wallet JS Bridge — separate from SSO)
// ============================================
// const wallet = (window as any).AlienWallet;
// await wallet.sendPayment({ to, amount, currency: 'ALIEN', memo });

export {};
