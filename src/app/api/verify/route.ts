import { NextResponse } from "next/server";
import { registerUser, getUserCanvasState } from "@/lib/store";
export async function POST(request: Request) {
  try {
    const { alienId, displayName } = await request.json();
    const user = registerUser(alienId, displayName);
    const state = getUserCanvasState(user.id);
    return NextResponse.json({ user, state });
  } catch { return NextResponse.json({ error: "Failed" }, { status: 500 }); }
}
