import { NextResponse } from "next/server";
import { getCanvasState } from "@/lib/store";
export async function GET() {
  return NextResponse.json(getCanvasState());
}
