import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { verifyToken } from "@/lib/auth";

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
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
    const db = getDb();

    // Verify ownership before deleting
    const keyResult = await db.execute({
      sql: "SELECT id FROM api_keys WHERE id = ? AND user_id = ?",
      args: [id, payload.userId],
    });

    if (keyResult.rows.length === 0) {
      return NextResponse.json({ error: "API key not found" }, { status: 404 });
    }

    await db.execute({
      sql: "DELETE FROM api_keys WHERE id = ? AND user_id = ?",
      args: [id, payload.userId],
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    console.error("Revoke API key error:", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
