import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { verifyToken } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const payload = await verifyToken(authHeader.split(" ")[1]);
    if (!payload?.isAdmin) {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    const db = getDb();

    const result = await db.execute({
      sql: "SELECT id, title, content, is_active, created_at, updated_at FROM announcements ORDER BY created_at DESC",
      args: [],
    });

    return NextResponse.json({ announcements: result.rows });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    console.error("Admin list announcements error:", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const payload = await verifyToken(authHeader.split(" ")[1]);
    if (!payload?.isAdmin) {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    const { title, content, is_active } = await req.json();

    if (!title || !content) {
      return NextResponse.json(
        { error: "title and content are required" },
        { status: 400 }
      );
    }

    const id = crypto.randomUUID();
    const db = getDb();

    await db.execute({
      sql: "INSERT INTO announcements (id, title, content, is_active, created_at, updated_at) VALUES (?, ?, ?, ?, datetime('now'), datetime('now'))",
      args: [id, title, content, is_active !== undefined ? (is_active ? 1 : 0) : 1],
    });

    return NextResponse.json({ id, title, content, is_active: is_active !== undefined ? is_active : true }, { status: 201 });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    console.error("Admin create announcement error:", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
