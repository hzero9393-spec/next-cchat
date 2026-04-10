import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { verifyToken } from "@/lib/auth";

function requireAdmin(authHeader: string | null): NextResponse | null {
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const token = authHeader.split(" ")[1];
  return null; // We'll verify inline
}

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization");
    const earlyError = requireAdmin(authHeader);
    if (earlyError) return earlyError;

    const token = authHeader!.split(" ")[1];
    const payload = await verifyToken(token);
    if (!payload || !payload.isAdmin) {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    const db = getDb();
    const today = new Date().toISOString().split("T")[0];

    // Total users
    const usersResult = await db.execute({
      sql: "SELECT COUNT(*) as total FROM users",
      args: [],
    });
    const totalUsers = (usersResult.rows[0] as Record<string, unknown>).total as number;

    // Total chats
    const chatsResult = await db.execute({
      sql: "SELECT COUNT(*) as total FROM chats",
      args: [],
    });
    const totalChats = (chatsResult.rows[0] as Record<string, unknown>).total as number;

    // Total messages
    const messagesResult = await db.execute({
      sql: "SELECT COUNT(*) as total FROM messages",
      args: [],
    });
    const totalMessages = (messagesResult.rows[0] as Record<string, unknown>).total as number;

    // Active today (users with messages today)
    const activeTodayResult = await db.execute({
      sql: `SELECT COUNT(DISTINCT ca.user_id) as total
            FROM chat_analytics ca
            WHERE ca.date = ?`,
      args: [today],
    });
    const activeToday = (activeTodayResult.rows[0] as Record<string, unknown>).total as number;

    return NextResponse.json({
      totalUsers,
      totalChats,
      totalMessages,
      activeToday,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    console.error("Admin stats error:", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
