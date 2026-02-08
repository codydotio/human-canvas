import { NextResponse } from "next/server";
import { getCanvasState } from "@/lib/store";
import { analyzeCanvas } from "@/lib/ai-agent";

export async function GET() {
  try {
    const canvas = getCanvasState();
    const narrative = analyzeCanvas(canvas.pixels);
    return NextResponse.json(narrative);
  } catch {
    return NextResponse.json({ error: "AI analysis failed" }, { status: 500 });
  }
}
