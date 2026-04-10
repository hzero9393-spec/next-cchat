import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { verifyToken } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const payload = await verifyToken(authHeader.split(" ")[1]);
    if (!payload?.isAdmin) {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    const { userId, action, reason } = await req.json();

    if (!userId || !action) {
      return NextResponse.json(
        { error: "userId and action are required" },
        { status: 400 }
      );
    }

    if (action !== "ban" && action !== "unban") {
      return NextResponse.json(
        { error: "action must be 'ban' or 'unban'" },
        { status: 400 }
      );
    }

    const db = getDb();

    // Check if user exists
    const userResult = await db.execute({
      sql: "SELECT id FROM users WHERE id = ?",
      args: [userId],
    });

    if (userResult.rows.length === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (action === "ban") {
      const now = new Date().toISOString();
      await db.execute({
        sql: "UPDATE users SET is_banned = 1, ban_reason = ?, banned_at = ? WHERE id = ?",
        args: [reason || "No reason provided", now, userId],
      });
    } else {
      await db.execute({
        sql: "UPDATE users SET is_banned = 0, ban_reason = NULL, banned_at = NULL WHERE id = ?",
        args: [userId],
      });
    }

    return NextResponse.json({ success: true, action, userId });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    console.error("Admin moderate error:", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
