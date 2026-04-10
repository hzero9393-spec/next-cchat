import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { verifyToken } from "@/lib/auth";

export async function GET(req: NextRequest) {
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

    const db = getDb();

    const result = await db.execute({
      sql: `SELECT id, email, full_name, last_name, dob, phone, avatar_url, theme_preference, created_at
            FROM users WHERE id = ?`,
      args: [payload.userId],
    });

    if (result.rows.length === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const user = result.rows[0] as Record<string, unknown>;

    return NextResponse.json({
      id: user.id,
      email: user.email,
      full_name: user.full_name,
      last_name: user.last_name,
      dob: user.dob,
      phone: user.phone,
      avatar_url: user.avatar_url,
      theme_preference: user.theme_preference,
      created_at: user.created_at,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    console.error("Auth me error:", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
