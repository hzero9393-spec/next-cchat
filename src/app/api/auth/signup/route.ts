import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { hashPassword, createToken } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const { email, password, fullName, lastName } = await req.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: "Password must be at least 6 characters" },
        { status: 400 }
      );
    }

    const db = getDb();

    // Check if email already exists
    const existing = await db.execute({
      sql: "SELECT id FROM users WHERE email = ?",
      args: [email],
    });

    if (existing.rows.length > 0) {
      return NextResponse.json(
        { error: "Email already exists" },
        { status: 409 }
      );
    }

    // Hash password
    const passwordHash = await hashPassword(password);
    const id = crypto.randomUUID();
    const now = new Date().toISOString();

    // Insert user
    await db.execute({
      sql: `INSERT INTO users (id, email, password_hash, full_name, last_name, theme_preference, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?)`,
      args: [
        id,
        email,
        passwordHash,
        fullName || null,
        lastName || null,
        "system",
        now,
      ],
    });

    // Create JWT
    const token = await createToken({ userId: id, email });

    const user = {
      id,
      email,
      full_name: fullName || null,
      last_name: lastName || null,
      theme_preference: "system",
      created_at: now,
    };

    return NextResponse.json({ token, user }, { status: 201 });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    console.error("Signup error:", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
