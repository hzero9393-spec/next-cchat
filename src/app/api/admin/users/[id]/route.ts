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
    if (!payload || !payload.isAdmin) {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    const { id } = await params;
    const db = getDb();

    // Verify user exists
    const user = await db.execute({
      sql: "SELECT id FROM users WHERE id = ?",
      args: [id],
    });

    if (user.rows.length === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Get all chat IDs for this user
    const userChats = await db.execute({
      sql: "SELECT id FROM chats WHERE user_id = ?",
      args: [id],
    });

    // Delete all messages for each chat
    for (const chatRow of userChats.rows) {
      const chatId = (chatRow as Record<string, unknown>).id as string;
      await db.execute({
        sql: "DELETE FROM messages WHERE chat_id = ?",
        args: [chatId],
      });
    }

    // Delete all chats
    await db.execute({
      sql: "DELETE FROM chats WHERE user_id = ?",
      args: [id],
    });

    // Delete analytics
    await db.execute({
      sql: "DELETE FROM chat_analytics WHERE user_id = ?",
      args: [id],
    });

    // Delete the user
    await db.execute({
      sql: "DELETE FROM users WHERE id = ?",
      args: [id],
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    console.error("Admin delete user error:", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
