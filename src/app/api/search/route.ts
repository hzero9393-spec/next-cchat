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
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const q = searchParams.get("q") || "";

    if (!q.trim()) {
      return NextResponse.json({ chatResults: [], messageResults: [] });
    }

    const db = getDb();

    // Search in chat titles
    const chatResults = await db.execute({
      sql: "SELECT c.id, c.title, c.updated_at, 'chat' as type FROM chats c WHERE c.user_id = ? AND (c.title LIKE ?) LIMIT 10",
      args: [payload.userId, `%${q}%`],
    });

    // Search in message content
    const msgResults = await db.execute({
      sql: "SELECT m.chat_id, m.content, m.created_at, c.title, 'message' as type FROM messages m JOIN chats c ON m.chat_id = c.id WHERE c.user_id = ? AND m.content LIKE ? ORDER BY m.created_at DESC LIMIT 20",
      args: [payload.userId, `%${q}%`],
    });

    return NextResponse.json({ chatResults: chatResults.rows, messageResults: msgResults.rows });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    console.error("Search error:", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
