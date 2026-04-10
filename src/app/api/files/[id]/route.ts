import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { verifyToken } from "@/lib/auth";

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

    // Verify file belongs to user
    const file = await db.execute({
      sql: "SELECT id FROM files WHERE id = ? AND user_id = ?",
      args: [id, payload.userId],
    });

    if (file.rows.length === 0) {
      return NextResponse.json({ error: "File not found" }, { status: 404 });
    }

    await db.execute({
      sql: "DELETE FROM files WHERE id = ? AND user_id = ?",
      args: [id, payload.userId],
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    console.error("Delete file error:", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
