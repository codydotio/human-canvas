import { NextResponse } from "next/server";
import { placePixel, getUserCanvasState } from "@/lib/store";
export async function POST(request: Request) {
  try {
    const { userId, x, y, color } = await request.json();
    const result = placePixel(userId, x, y, color);
    if ("error" in result) return NextResponse.json({ error: result.error }, { status: 400 });
    const state = getUserCanvasState(userId);
    return NextResponse.json({ pixel: result, state });
  } catch { return NextResponse.json({ error: "Failed" }, { status: 500 }); }
}
