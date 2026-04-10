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
    if (!payload || !payload.isAdmin) {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "20", 10);
    const search = searchParams.get("search") || "";
    const offset = (page - 1) * limit;

    const db = getDb();

    let countQuery = "SELECT COUNT(*) as total FROM users";
    let query = `SELECT id, email, full_name, last_name, phone, avatar_url, theme_preference, created_at FROM users`;

    const args: (string | null)[] = [];
    const countArgs: (string | null)[] = [];

    if (search) {
      const searchPattern = `%${search}%`;
      countQuery += " WHERE email LIKE ? OR full_name LIKE ? OR last_name LIKE ?";
      query += " WHERE email LIKE ? OR full_name LIKE ? OR last_name LIKE ?";
      countArgs.push(searchPattern, searchPattern, searchPattern);
      args.push(searchPattern, searchPattern, searchPattern);
    }

    const totalResult = await db.execute({
      sql: countQuery,
      args: countArgs,
    });
    const total = (totalResult.rows[0] as Record<string, unknown>).total as number;

    query += " ORDER BY created_at DESC LIMIT ? OFFSET ?";
    args.push(String(limit), String(offset));

    const result = await db.execute({
      sql: query,
      args,
    });

    return NextResponse.json({
      users: result.rows,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    console.error("Admin users error:", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
