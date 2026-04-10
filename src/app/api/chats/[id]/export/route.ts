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
    const { searchParams } = new URL(req.url);
    const format = searchParams.get("format") || "json";

    const db = getDb();

    // Verify chat belongs to user
    const chat = await db.execute({
      sql: "SELECT id, title, created_at, updated_at FROM chats WHERE id = ? AND user_id = ?",
      args: [id, payload.userId],
    });

    if (chat.rows.length === 0) {
      return NextResponse.json({ error: "Chat not found" }, { status: 404 });
    }

    const chatData = chat.rows[0] as Record<string, unknown>;

    // Get all messages
    const messages = await db.execute({
      sql: "SELECT role, content, created_at FROM messages WHERE chat_id = ? ORDER BY created_at ASC",
      args: [id],
    });

    // Build export data
    const exportData = {
      id: chatData.id,
      title: chatData.title,
      created_at: chatData.created_at,
      updated_at: chatData.updated_at,
      exported_at: new Date().toISOString(),
      messages: messages.rows,
    };

    if (format === "markdown") {
      // Convert to markdown format
      const lines: string[] = [];
      lines.push(`# ${chatData.title as string}`);
      lines.push(`> Exported on ${new Date().toISOString()}\n`);

      for (const msg of messages.rows) {
        const m = msg as Record<string, unknown>;
        const role = m.role === "user" ? "**You**" : "**AI Assistant**";
        lines.push(`## ${role}`);
        lines.push(`\n${m.content as string}\n`);
      }

      return new NextResponse(lines.join("\n"), {
        headers: {
          "Content-Type": "text/markdown; charset=utf-8",
          "Content-Disposition": `attachment; filename="${chatData.title as string}.md"`,
        },
      });
    }

    if (format === "txt") {
      // Convert to plain text format
      const lines: string[] = [];
      lines.push(`Chat: ${chatData.title as string}`);
      lines.push(`Exported: ${new Date().toISOString()}`);
      lines.push("=".repeat(50));

      for (const msg of messages.rows) {
        const m = msg as Record<string, unknown>;
        lines.push(`\n[${(m.role as string).toUpperCase()}] (${m.created_at as string})`);
        lines.push(`${m.content as string}`);
      }

      return new NextResponse(lines.join("\n"), {
        headers: {
          "Content-Type": "text/plain; charset=utf-8",
          "Content-Disposition": `attachment; filename="${chatData.title as string}.txt"`,
        },
      });
    }

    // Default: JSON format
    return NextResponse.json(exportData);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    console.error("Export chat error:", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
