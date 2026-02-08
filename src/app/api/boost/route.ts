import { NextResponse } from "next/server";
import { boostPixel, getUserCanvasState, registerUser, getUser } from "@/lib/store";

export async function POST(request: Request) {
  try {
    const { userId, x, y, level, transactionId, fromDisplayName } = await request.json();

    // Auto-register user if not found (handles Vercel serverless cold starts)
    if (!getUser(userId)) {
      registerUser(userId, fromDisplayName || "Human");
    }

    const result = boostPixel(userId, x, y, level, transactionId);
    if ("error" in result) return NextResponse.json({ error: result.error }, { status: 400 });
    const state = getUserCanvasState(userId);
    return NextResponse.json({ pixel: result, state });
  } catch { return NextResponse.json({ error: "Failed" }, { status: 500 }); }
}
