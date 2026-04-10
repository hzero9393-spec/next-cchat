import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { verifyToken } from "@/lib/auth";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const payload = await verifyToken(authHeader.split(" ")[1]);
    if (!payload?.isAdmin) {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    const { id } = await params;
    const { title, content, is_active } = await req.json();

    if (!title && !content && is_active === undefined) {
      return NextResponse.json(
        { error: "At least one field (title, content, is_active) is required" },
        { status: 400 }
      );
    }

    const db = getDb();

    const fields: string[] = [];
    const args: (string | number)[] = [];

    if (title !== undefined) {
      fields.push("title = ?");
      args.push(title);
    }
    if (content !== undefined) {
      fields.push("content = ?");
      args.push(content);
    }
    if (is_active !== undefined) {
      fields.push("is_active = ?");
      args.push(is_active ? 1 : 0);
    }

    fields.push("updated_at = datetime('now')");
    args.push(id);

    await db.execute({
      sql: `UPDATE announcements SET ${fields.join(", ")} WHERE id = ?`,
      args,
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    console.error("Admin update announcement error:", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const payload = await verifyToken(authHeader.split(" ")[1]);
    if (!payload?.isAdmin) {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    const { id } = await params;
    const db = getDb();

    await db.execute({
      sql: "DELETE FROM announcements WHERE id = ?",
      args: [id],
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    console.error("Admin delete announcement error:", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
