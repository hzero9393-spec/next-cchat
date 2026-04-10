import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { verifyToken } from "@/lib/auth";

export async function GET(req: NextRequest) {
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

    const db = getDb();

    // Total chats
    const chatsResult = await db.execute({
      sql: "SELECT COUNT(*) as total FROM chats WHERE user_id = ?",
      args: [payload.userId],
    });
    const totalChats = (chatsResult.rows[0] as Record<string, unknown>).total as number;

    // Total messages
    const messagesResult = await db.execute({
      sql: "SELECT COUNT(*) as total FROM messages m JOIN chats c ON m.chat_id = c.id WHERE c.user_id = ?",
      args: [payload.userId],
    });
    const totalMessages = (messagesResult.rows[0] as Record<string, unknown>).total as number;

    // Account age (created_at from user)
    const userResult = await db.execute({
      sql: "SELECT created_at FROM users WHERE id = ?",
      args: [payload.userId],
    });
    const createdAt = userResult.rows.length > 0
      ? (userResult.rows[0] as Record<string, unknown>).created_at as string
      : null;

    // Favorite model (most used model)
    const modelResult = await db.execute({
      sql: `SELECT model, COUNT(*) as count FROM messages m
            JOIN chats c ON m.chat_id = c.id
            WHERE c.user_id = ? AND m.role = 'assistant'
            GROUP BY model ORDER BY count DESC LIMIT 1`,
      args: [payload.userId],
    });
    const favoriteModel = modelResult.rows.length > 0
      ? (modelResult.rows[0] as Record<string, unknown>).model as string
      : "N/A";

    return NextResponse.json({
      totalChats,
      totalMessages,
      createdAt,
      favoriteModel,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    console.error("Profile stats error:", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
