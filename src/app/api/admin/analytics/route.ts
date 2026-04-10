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
    if (!payload || !payload.isAdmin) {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    const db = getDb();

    // Overall daily message counts (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const thirtyDaysAgoStr = thirtyDaysAgo.toISOString().split("T")[0];

    const dailyCounts = await db.execute({
      sql: `SELECT date, SUM(message_count) as total_messages
            FROM chat_analytics
            WHERE date >= ?
            GROUP BY date
            ORDER BY date ASC`,
      args: [thirtyDaysAgoStr],
    });

    // Overall category breakdown
    const categoryBreakdown = await db.execute({
      sql: `SELECT category, SUM(message_count) as total_messages
            FROM chat_analytics
            GROUP BY category
            ORDER BY total_messages DESC`,
      args: [],
    });

    // Top users by message count
    const topUsers = await db.execute({
      sql: `SELECT u.id, u.email, u.full_name, u.last_name,
                   SUM(ca.message_count) as total_messages
            FROM chat_analytics ca
            JOIN users u ON ca.user_id = u.id
            GROUP BY ca.user_id
            ORDER BY total_messages DESC
            LIMIT 10`,
      args: [],
    });

    return NextResponse.json({
      daily: dailyCounts.rows,
      categories: categoryBreakdown.rows,
      topUsers: topUsers.rows,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    console.error("Admin analytics error:", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
