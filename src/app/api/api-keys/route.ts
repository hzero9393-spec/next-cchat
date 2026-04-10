import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { verifyToken, hashPassword } from "@/lib/auth";

export async function GET(req: NextRequest) {
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

    const db = getDb();

    const result = await db.execute({
      sql: "SELECT id, key_name, key_prefix, created_at, last_used_at FROM api_keys WHERE user_id = ? ORDER BY created_at DESC",
      args: [payload.userId],
    });

    return NextResponse.json({ keys: result.rows });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    console.error("List API keys error:", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
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

    const { name } = await req.json();

    const apiKey = `nc_${crypto.randomUUID().replace(/-/g, "")}${crypto.randomUUID().replace(/-/g, "")}`;
    const keyPrefix = apiKey.slice(0, 8);
    const keyHash = await hashPassword(apiKey);

    const id = crypto.randomUUID();
    const db = getDb();

    await db.execute({
      sql: "INSERT INTO api_keys (id, user_id, key_name, key_hash, key_prefix, created_at) VALUES (?, ?, ?, ?, ?, datetime('now'))",
      args: [id, payload.userId, name || "Default", keyHash, keyPrefix],
    });

    return NextResponse.json({ id, name: name || "Default", key: apiKey, keyPrefix }, { status: 201 });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    console.error("Create API key error:", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
