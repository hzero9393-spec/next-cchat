import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { verifyToken } from "@/lib/auth";

export async function PUT(
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
    const { name, color, icon, sort_order } = await req.json();

    if (!name?.trim() && color === undefined && icon === undefined && sort_order === undefined) {
      return NextResponse.json({ error: "No fields to update" }, { status: 400 });
    }

    const db = getDb();

    // Verify folder belongs to user
    const folder = await db.execute({
      sql: "SELECT id FROM folders WHERE id = ? AND user_id = ?",
      args: [id, payload.userId],
    });

    if (folder.rows.length === 0) {
      return NextResponse.json({ error: "Folder not found" }, { status: 404 });
    }

    // Build dynamic UPDATE
    const updates: string[] = [];
    const values: unknown[] = [];

    if (name?.trim()) {
      updates.push("name = ?");
      values.push(name.trim());
    }
    if (color !== undefined) {
      updates.push("color = ?");
      values.push(color);
    }
    if (icon !== undefined) {
      updates.push("icon = ?");
      values.push(icon);
    }
    if (sort_order !== undefined) {
      updates.push("sort_order = ?");
      values.push(sort_order);
    }

    values.push(id);

    await db.execute({
      sql: `UPDATE folders SET ${updates.join(", ")} WHERE id = ?`,
      args: values,
    });

    // Return updated folder
    const updated = await db.execute({
      sql: "SELECT * FROM folders WHERE id = ?",
      args: [id],
    });

    return NextResponse.json({ folder: updated.rows[0] });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    console.error("Update folder error:", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function DELETE(
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

    // Verify folder belongs to user
    const folder = await db.execute({
      sql: "SELECT id FROM folders WHERE id = ? AND user_id = ?",
      args: [id, payload.userId],
    });

    if (folder.rows.length === 0) {
      return NextResponse.json({ error: "Folder not found" }, { status: 404 });
    }

    // Move chats in this folder to uncategorized (set folder_id to NULL)
    await db.execute({
      sql: "UPDATE chats SET folder_id = NULL WHERE folder_id = ? AND user_id = ?",
      args: [id, payload.userId],
    });

    // Delete the folder
    await db.execute({
      sql: "DELETE FROM folders WHERE id = ?",
      args: [id],
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    console.error("Delete folder error:", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
