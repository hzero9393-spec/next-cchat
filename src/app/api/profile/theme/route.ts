import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { verifyToken } from "@/lib/auth";

export async function PUT(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.split(" ")[1];
    const payload = await verifyToken(token);
    if (!payload) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    const { theme } = await req.json();

    if (!theme) {
      return NextResponse.json(
        { error: "Theme is required" },
        { status: 400 }
      );
    }

    const validThemes = ["light", "dark", "system"];
    if (!validThemes.includes(theme)) {
      return NextResponse.json(
        { error: "Invalid theme. Must be light, dark, or system" },
        { status: 400 }
      );
    }

    const db = getDb();

    await db.execute({
      sql: "UPDATE users SET theme_preference = ? WHERE id = ?",
      args: [theme, payload.userId],
    });

    return NextResponse.json({ success: true, theme });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    console.error("Update theme error:", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
