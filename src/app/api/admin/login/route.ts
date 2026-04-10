import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { verifyPassword, createToken } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const { userId, password } = await req.json();

    if (!userId || !password) {
      return NextResponse.json(
        { error: "userId and password are required" },
        { status: 400 }
      );
    }

    // Hardcoded admin credentials as per spec
    if (userId !== "000000" || password !== "603281") {
      return NextResponse.json(
        { error: "Invalid admin credentials" },
        { status: 401 }
      );
    }

    const db = getDb();

    // Check if admin record exists and is active
    const adminResult = await db.execute({
      sql: "SELECT id, is_active FROM admin WHERE user_id = ? AND is_active = 1",
      args: [userId],
    });

    if (adminResult.rows.length === 0) {
      return NextResponse.json(
        { error: "Admin account not found or inactive" },
        { status: 403 }
      );
    }

    // Create admin JWT
    const token = await createToken({
      userId: "admin",
      email: "admin@system.local",
      isAdmin: true,
    });

    return NextResponse.json({ token });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    console.error("Admin login error:", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
