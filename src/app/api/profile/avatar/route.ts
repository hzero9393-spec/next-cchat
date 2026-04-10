import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { verifyToken } from "@/lib/auth";

export async function PUT(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const token = authHeader.split(" ")[1];
    const payload = await verifyToken(token);
    if (!payload) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    const { avatarUrl } = await req.json();
    if (!avatarUrl) {
      return NextResponse.json({ error: "Avatar URL required" }, { status: 400 });
    }

    // Validate base64 data URL - max ~2MB when base64 encoded (~1.5MB actual)
    if (avatarUrl.length > 2_800_000) {
      return NextResponse.json(
        { error: "Image is too large. Maximum size is 2MB." },
        { status: 400 }
      );
    }

    if (!avatarUrl.startsWith("data:image/")) {
      return NextResponse.json(
        { error: "Invalid image format. Must be a data URL." },
        { status: 400 }
      );
    }

    const db = getDb();
    await db.execute({
      sql: "UPDATE users SET avatar_url = ? WHERE id = ?",
      args: [avatarUrl, payload.userId],
    });

    return NextResponse.json({ success: true, avatar_url: avatarUrl });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    console.error("Update avatar error:", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
