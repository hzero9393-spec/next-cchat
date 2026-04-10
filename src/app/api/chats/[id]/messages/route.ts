import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { verifyToken } from "@/lib/auth";
import ZAI from "z-ai-web-dev-sdk";

const DEEP_RESEARCH_SYSTEM_PROMPT = `You are an expert deep research assistant. Your role is to provide thorough, well-researched, and comprehensive responses. When given a topic:
1. Break down the topic into key aspects
2. Provide detailed analysis with supporting evidence
3. Include relevant data points and statistics where applicable
4. Present multiple perspectives when relevant
5. Cite sources and provide references when possible
6. Structure your response with clear sections and headers
7. Highlight key findings and insights
Always be thorough but also clear and accessible in your explanations.`;

const DEFAULT_SYSTEM_PROMPT = `You are ZAI, a helpful and friendly AI assistant. You provide clear, accurate, and thoughtful responses. When appropriate, use markdown formatting for better readability. Be concise but thorough in your answers.`;

export async function GET(
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
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "50", 10);
    const offset = (page - 1) * limit;

    const db = getDb();

    // Verify chat belongs to user
    const chat = await db.execute({
      sql: "SELECT id FROM chats WHERE id = ? AND user_id = ?",
      args: [id, payload.userId],
    });

    if (chat.rows.length === 0) {
      return NextResponse.json({ error: "Chat not found" }, { status: 404 });
    }

    // Get total count
    const countResult = await db.execute({
      sql: "SELECT COUNT(*) as total FROM messages WHERE chat_id = ?",
      args: [id],
    });

    const total = (countResult.rows[0] as Record<string, unknown>).total as number;

    // Get messages
    const result = await db.execute({
      sql: "SELECT id, role, content, created_at FROM messages WHERE chat_id = ? ORDER BY created_at ASC LIMIT ? OFFSET ?",
      args: [id, limit, offset],
    });

    return NextResponse.json({
      messages: result.rows,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    console.error("Get messages error:", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function POST(
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
    const { content, mode } = await req.json();

    if (!content) {
      return NextResponse.json(
        { error: "Message content is required" },
        { status: 400 }
      );
    }

    const db = getDb();

    // Verify chat belongs to user
    const chat = await db.execute({
      sql: "SELECT id FROM chats WHERE id = ? AND user_id = ?",
      args: [id, payload.userId],
    });

    if (chat.rows.length === 0) {
      return NextResponse.json({ error: "Chat not found" }, { status: 404 });
    }

    const now = new Date().toISOString();

    // Store user message
    const userMsgId = crypto.randomUUID();
    await db.execute({
      sql: "INSERT INTO messages (id, chat_id, role, content, created_at) VALUES (?, ?, ?, ?, ?)",
      args: [userMsgId, id, "user", content, now],
    });

    // Update chat's updated_at
    await db.execute({
      sql: "UPDATE chats SET updated_at = ? WHERE id = ?",
      args: [now, id],
    });

    // Get chat history for context
    const history = await db.execute({
      sql: "SELECT role, content FROM messages WHERE chat_id = ? ORDER BY created_at ASC LIMIT 20",
      args: [id],
    });

    // Build messages for AI
    const systemPrompt =
      mode === "deep-research" ? DEEP_RESEARCH_SYSTEM_PROMPT : DEFAULT_SYSTEM_PROMPT;

    const sdkMessages: Array<{ role: string; content: string }> = [
      { role: "system", content: systemPrompt },
      ...history.rows.map((row) => ({
        role: (row as Record<string, unknown>).role as string,
        content: (row as Record<string, unknown>).content as string,
      })),
    ];

    // Call AI
    const zai = await ZAI.create();
    const completion = await zai.chat.completions.create({
      messages: sdkMessages,
      thinking: { type: "disabled" },
    });

    const aiContent = completion.choices?.[0]?.message?.content || "Sorry, I could not generate a response.";

    // Store AI response
    const aiMsgId = crypto.randomUUID();
    const aiNow = new Date().toISOString();
    await db.execute({
      sql: "INSERT INTO messages (id, chat_id, role, content, created_at) VALUES (?, ?, ?, ?, ?)",
      args: [aiMsgId, id, "assistant", aiContent, aiNow],
    });

    // Track analytics
    const category = mode === "deep-research" ? "deep-research" : "general";
    const today = new Date().toISOString().split("T")[0];

    // Upsert analytics
    const existingAnalytics = await db.execute({
      sql: "SELECT id, message_count FROM chat_analytics WHERE user_id = ? AND category = ? AND date = ?",
      args: [payload.userId, category, today],
    });

    if (existingAnalytics.rows.length > 0) {
      const existing = existingAnalytics.rows[0] as Record<string, unknown>;
      await db.execute({
        sql: "UPDATE chat_analytics SET message_count = message_count + 2 WHERE id = ?",
        args: [existing.id],
      });
    } else {
      const analyticsId = crypto.randomUUID();
      await db.execute({
        sql: "INSERT INTO chat_analytics (id, user_id, category, message_count, date) VALUES (?, ?, ?, ?, ?)",
        args: [analyticsId, payload.userId, category, 2, today],
      });
    }

    return NextResponse.json({
      userMessage: { id: userMsgId, role: "user", content, created_at: now },
      assistantMessage: { id: aiMsgId, role: "assistant", content: aiContent, created_at: aiNow },
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    console.error("Send message error:", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
