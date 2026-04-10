import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { verifyToken } from "@/lib/auth";

// POST: Create a share link for a chat (auth required)
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
    const db = getDb();

    // Verify chat belongs to user
    const chat = await db.execute({
      sql: "SELECT id, title FROM chats WHERE id = ? AND user_id = ?",
      args: [id, payload.userId],
    });

    if (chat.rows.length === 0) {
      return NextResponse.json({ error: "Chat not found" }, { status: 404 });
    }

    // Check if already shared
    const existing = await db.execute({
      sql: "SELECT slug, is_public FROM shared_chats WHERE chat_id = ?",
      args: [id],
    });

    if (existing.rows.length > 0) {
      const row = existing.rows[0] as Record<string, unknown>;
      return NextResponse.json({
        slug: row.slug,
        is_public: Boolean(row.is_public),
        url: `/shared/${row.slug}`,
      });
    }

    // Generate unique slug
    const slug = crypto.randomUUID().replace(/-/g, "").substring(0, 10);
    const now = new Date().toISOString();

    await db.execute({
      sql: "INSERT INTO shared_chats (id, chat_id, slug, shared_by, is_public, created_at) VALUES (?, ?, ?, ?, ?, ?)",
      args: [crypto.randomUUID(), id, slug, payload.userId, 1, now],
    });

    return NextResponse.json({
      slug,
      is_public: true,
      url: `/shared/${slug}`,
    }, { status: 201 });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    console.error("Share chat error:", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

// GET: Retrieve a shared chat by slug (no auth needed)
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params; // `id` is actually the slug in this context
    const db = getDb();

    // Find shared chat by slug
    const shared = await db.execute({
      sql: "SELECT sc.*, c.title, c.created_at as chat_created_at FROM shared_chats sc JOIN chats c ON sc.chat_id = c.id WHERE sc.slug = ? AND sc.is_public = 1",
      args: [id],
    });

    if (shared.rows.length === 0) {
      return NextResponse.json({ error: "Shared chat not found" }, { status: 404 });
    }

    const row = shared.rows[0] as Record<string, unknown>;
    const chatId = row.chat_id as string;

    // Get messages for this chat
    const messages = await db.execute({
      sql: "SELECT role, content, created_at FROM messages WHERE chat_id = ? ORDER BY created_at ASC",
      args: [chatId],
    });

    return NextResponse.json({
      title: row.title,
      created_at: row.chat_created_at,
      messages: messages.rows,
      shared_at: row.created_at,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    console.error("Get shared chat error:", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
