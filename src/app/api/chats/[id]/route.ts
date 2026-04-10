import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { verifyToken } from "@/lib/auth";

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authHeader = _req.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.split(" ")[1];
    const payload = await verifyToken(token);
    if (!payload) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    const { id } = await params;
    const db = getDb();

    // Verify the user owns this chat
    const chat = await db.execute({
      sql: "SELECT id FROM chats WHERE id = ? AND user_id = ?",
      args: [id, payload.userId],
    });

    if (chat.rows.length === 0) {
      return NextResponse.json({ error: "Chat not found" }, { status: 404 });
    }

    // Delete all messages for the chat
    await db.execute({
      sql: "DELETE FROM messages WHERE chat_id = ?",
      args: [id],
    });

    // Delete the chat
    await db.execute({
      sql: "DELETE FROM chats WHERE id = ?",
      args: [id],
    });

    // Delete analytics for this chat's messages
    await db.execute({
      sql: "DELETE FROM chat_analytics WHERE user_id = ?",
      args: [payload.userId],
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    console.error("Delete chat error:", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
