import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { verifyToken } from "@/lib/auth";

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
      sql: "SELECT id, user_id, plan, status, stripe_customer_id, current_period_start, current_period_end, created_at FROM subscriptions WHERE user_id = ?",
      args: [payload.userId],
    });

    if (result.rows.length === 0) {
      return NextResponse.json({
        subscription: null,
        plan: "free",
        status: "inactive",
      });
    }

    const sub = result.rows[0] as Record<string, unknown>;

    return NextResponse.json({
      subscription: sub,
      plan: sub.plan || "free",
      status: sub.status || "inactive",
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    console.error("Get subscription error:", msg);
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

    const { plan, status, stripe_customer_id, stripe_subscription_id, current_period_start, current_period_end } = await req.json();

    if (!plan) {
      return NextResponse.json(
        { error: "plan is required" },
        { status: 400 }
      );
    }

    const db = getDb();

    // Check if subscription already exists
    const existing = await db.execute({
      sql: "SELECT id FROM subscriptions WHERE user_id = ?",
      args: [payload.userId],
    });

    if (existing.rows.length > 0) {
      // Update existing subscription
      const fields: string[] = [];
      const args: (string | null)[] = [];

      fields.push("plan = ?");
      args.push(plan);
      if (status !== undefined) {
        fields.push("status = ?");
        args.push(status);
      }
      if (stripe_customer_id !== undefined) {
        fields.push("stripe_customer_id = ?");
        args.push(stripe_customer_id);
      }
      if (stripe_subscription_id !== undefined) {
        fields.push("stripe_subscription_id = ?");
        args.push(stripe_subscription_id);
      }
      if (current_period_start !== undefined) {
        fields.push("current_period_start = ?");
        args.push(current_period_start);
      }
      if (current_period_end !== undefined) {
        fields.push("current_period_end = ?");
        args.push(current_period_end);
      }

      fields.push("updated_at = datetime('now')");
      args.push(payload.userId);

      await db.execute({
        sql: `UPDATE subscriptions SET ${fields.join(", ")} WHERE user_id = ?`,
        args,
      });

      return NextResponse.json({ success: true, updated: true });
    }

    // Create new subscription
    const id = crypto.randomUUID();

    await db.execute({
      sql: "INSERT INTO subscriptions (id, user_id, plan, status, stripe_customer_id, stripe_subscription_id, current_period_start, current_period_end, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))",
      args: [
        id,
        payload.userId,
        plan,
        status || "active",
        stripe_customer_id || null,
        stripe_subscription_id || null,
        current_period_start || null,
        current_period_end || null,
      ],
    });

    return NextResponse.json({ id, success: true }, { status: 201 });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    console.error("Create subscription error:", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
