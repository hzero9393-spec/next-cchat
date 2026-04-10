import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { verifyToken } from "@/lib/auth";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
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

    const { id } = await params;
    const { title } = await req.json();

    if (!title || !title.trim()) {
      return NextResponse.json(
        { error: "title is required" },
        { status: 400 }
      );
    }

    const db = getDb();

    // Verify ownership
    const chatResult = await db.execute({
      sql: "SELECT id FROM chats WHERE id = ? AND user_id = ?",
      args: [id, payload.userId],
    });

    if (chatResult.rows.length === 0) {
      return NextResponse.json({ error: "Chat not found" }, { status: 404 });
    }

    await db.execute({
      sql: "UPDATE chats SET title = ?, updated_at = datetime('now') WHERE id = ? AND user_id = ?",
      args: [title.trim(), id, payload.userId],
    });

    return NextResponse.json({ success: true, title: title.trim() });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    console.error("Rename chat error:", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
