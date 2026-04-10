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

    // Daily message counts for last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const thirtyDaysAgoStr = thirtyDaysAgo.toISOString().split("T")[0];

    const dailyCounts = await db.execute({
      sql: `SELECT date, SUM(message_count) as total_messages
            FROM chat_analytics
            WHERE user_id = ? AND date >= ?
            GROUP BY date
            ORDER BY date ASC`,
      args: [payload.userId, thirtyDaysAgoStr],
    });

    // Category breakdown
    const categoryBreakdown = await db.execute({
      sql: `SELECT category, SUM(message_count) as total_messages
            FROM chat_analytics
            WHERE user_id = ?
            GROUP BY category`,
      args: [payload.userId],
    });

    return NextResponse.json({
      daily: dailyCounts.rows,
      categories: categoryBreakdown.rows,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    console.error("Analytics error:", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
