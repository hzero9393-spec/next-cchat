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
    const result = await db.execute({
      sql: `SELECT f.*, (SELECT COUNT(*) FROM chats c WHERE c.folder_id = f.id) as chat_count
            FROM folders f
            WHERE f.user_id = ?
            ORDER BY f.sort_order ASC, f.created_at DESC`,
      args: [payload.userId],
    });

    return NextResponse.json({ folders: result.rows });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    console.error("Get folders error:", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
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

    const { name, color, icon } = await req.json();
    if (!name?.trim()) {
      return NextResponse.json({ error: "Folder name required" }, { status: 400 });
    }

    const db = getDb();
    const id = crypto.randomUUID();
    const now = new Date().toISOString();

    // Get max sort_order for this user to append at end
    const orderResult = await db.execute({
      sql: "SELECT COALESCE(MAX(sort_order), -1) + 1 as next_order FROM folders WHERE user_id = ?",
      args: [payload.userId],
    });
    const sortOrder = (orderResult.rows[0] as Record<string, unknown>).next_order as number;

    await db.execute({
      sql: "INSERT INTO folders (id, user_id, name, color, icon, sort_order, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)",
      args: [id, payload.userId, name.trim(), color || "#10b981", icon || "folder", sortOrder, now],
    });

    return NextResponse.json(
      {
        folder: {
          id,
          name: name.trim(),
          color: color || "#10b981",
          icon: icon || "folder",
          sort_order: sortOrder,
          created_at: now,
        },
      },
      { status: 201 }
    );
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    console.error("Create folder error:", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
