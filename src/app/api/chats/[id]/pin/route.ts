import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { verifyToken } from "@/lib/auth";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id } = await params;
    const db = getDb();

    // Verify chat belongs to user
    const chat = await db.execute({
      sql: "SELECT id, is_pinned FROM chats WHERE id = ? AND user_id = ?",
      args: [id, payload.userId],
    });

    if (chat.rows.length === 0) {
      return NextResponse.json({ error: "Chat not found" }, { status: 404 });
    }

    const row = chat.rows[0] as Record<string, unknown>;
    return NextResponse.json({ pinned: Boolean(row.is_pinned) });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    console.error("Get pin status error:", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id } = await params;
    const { pinned } = await req.json();
    const db = getDb();

    // Verify chat belongs to user
    const chat = await db.execute({
      sql: "SELECT id FROM chats WHERE id = ? AND user_id = ?",
      args: [id, payload.userId],
    });

    if (chat.rows.length === 0) {
      return NextResponse.json({ error: "Chat not found" }, { status: 404 });
    }

    // Toggle or set pin status
    const pinValue = pinned !== undefined ? (pinned ? 1 : 0) : null;
    let sql: string;
    let args: unknown[];

    if (pinValue !== null) {
      sql = "UPDATE chats SET is_pinned = ?, updated_at = ? WHERE id = ?";
      args = [pinValue, new Date().toISOString(), id];
    } else {
      // Toggle: if currently pinned, unpin; otherwise pin
      sql = "UPDATE chats SET is_pinned = CASE WHEN is_pinned = 1 THEN 0 ELSE 1 END, updated_at = ? WHERE id = ?";
      args = [new Date().toISOString(), id];
    }

    await db.execute({ sql, args });

    // Get updated status
    const result = await db.execute({
      sql: "SELECT is_pinned FROM chats WHERE id = ?",
      args: [id],
    });
    const row = result.rows[0] as Record<string, unknown>;

    return NextResponse.json({ pinned: Boolean(row.is_pinned) });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    console.error("Toggle pin error:", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
