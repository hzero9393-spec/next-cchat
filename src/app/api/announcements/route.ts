import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    const db = getDb();

    const result = await db.execute({
      sql: "SELECT id, title, content, created_at FROM announcements WHERE is_active = 1 ORDER BY created_at DESC",
      args: [],
    });

    return NextResponse.json({ announcements: result.rows });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    console.error("Public announcements error:", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
