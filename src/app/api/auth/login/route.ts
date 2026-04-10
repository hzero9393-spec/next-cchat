import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { verifyPassword, createToken } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }

    const db = getDb();

    // Find user by email
    const result = await db.execute({
      sql: "SELECT id, email, password_hash, full_name, last_name, avatar_url, theme_preference, created_at FROM users WHERE email = ?",
      args: [email],
    });

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 }
      );
    }

    const row = result.rows[0] as Record<string, unknown>;
    const storedHash = row.password_hash as string;

    // Verify password
    const valid = await verifyPassword(password, storedHash);
    if (!valid) {
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 }
      );
    }

    // Create JWT
    const token = await createToken({
      userId: row.id as string,
      email: row.email as string,
    });

    const user = {
      id: row.id,
      email: row.email,
      full_name: row.full_name,
      last_name: row.last_name,
      avatar_url: row.avatar_url,
      theme_preference: row.theme_preference,
      created_at: row.created_at,
    };

    return NextResponse.json({ token, user });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    console.error("Login error:", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
