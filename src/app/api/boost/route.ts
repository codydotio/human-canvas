import { NextResponse } from "next/server";
import { boostPixel, getUserCanvasState } from "@/lib/store";
export async function POST(request: Request) {
  try {
    const { userId, x, y, level, transactionId } = await request.json();
    const result = boostPixel(userId, x, y, level, transactionId);
    if ("error" in result) return NextResponse.json({ error: result.error }, { status: 400 });
    const state = getUserCanvasState(userId);
    return NextResponse.json({ pixel: result, state });
  } catch { return NextResponse.json({ error: "Failed" }, { status: 500 }); }
}
