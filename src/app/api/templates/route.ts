import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { verifyToken } from "@/lib/auth";

// System templates (built-in, always available)
const SYSTEM_TEMPLATES = [
  {
    id: "sys-1",
    title: "Creative Writing",
    description: "Generate stories, poems, scripts, and creative content",
    icon: "pen-tool",
    prompt: "You are a creative writing assistant. Help the user create compelling stories, poems, scripts, and other creative content. Be imaginative, vivid, and help develop ideas into polished pieces.",
    category: "writing",
    is_system: true,
  },
  {
    id: "sys-2",
    title: "Code Helper",
    description: "Debug, write, and explain code in any language",
    icon: "code",
    prompt: "You are an expert coding assistant. Help the user write, debug, and understand code. Provide clear explanations, best practices, and working examples. Support any programming language.",
    category: "development",
    is_system: true,
  },
  {
    id: "sys-3",
    title: "Study Buddy",
    description: "Explain concepts, create flashcards, quiz yourself",
    icon: "book-open",
    prompt: "You are a patient and knowledgeable study assistant. Explain complex concepts in simple terms, create study materials like flashcards and summaries, and help quiz the user on any topic.",
    category: "education",
    is_system: true,
  },
  {
    id: "sys-4",
    title: "Business Analyst",
    description: "Analyze data, write reports, strategy planning",
    icon: "briefcase",
    prompt: "You are a business analysis assistant. Help with market research, data analysis, report writing, strategic planning, and business decision-making. Be professional and data-driven.",
    category: "business",
    is_system: true,
  },
  {
    id: "sys-5",
    title: "Language Tutor",
    description: "Practice and learn new languages",
    icon: "globe",
    prompt: "You are a language tutor. Help the user learn and practice new languages. Provide translations, grammar explanations, vocabulary building, and conversational practice.",
    category: "education",
    is_system: true,
  },
  {
    id: "sys-6",
    title: "Recipe Creator",
    description: "Find and create recipes based on ingredients",
    icon: "chef-hat",
    prompt: "You are a recipe assistant. Help users find recipes, create meals from available ingredients, provide cooking tips, and suggest meal plans. Be creative with substitutions and dietary needs.",
    category: "lifestyle",
    is_system: true,
  },
];

export async function GET(req: NextRequest) {
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

    const db = getDb();

    // Get user's custom templates
    const customTemplates = await db.execute({
      sql: "SELECT id, title, description, icon, prompt, category, created_at, updated_at FROM templates WHERE user_id = ? ORDER BY created_at DESC",
      args: [payload.userId],
    });

    // Combine system + custom templates
    const userTemplates = customTemplates.rows.map((row) => ({
      ...row,
      is_system: false,
    }));

    return NextResponse.json({
      templates: [...SYSTEM_TEMPLATES, ...userTemplates],
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    console.error("Get templates error:", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
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

    const { title, description, icon, prompt, category } = await req.json();
    if (!title?.trim() || !prompt?.trim()) {
      return NextResponse.json(
        { error: "Title and prompt are required" },
        { status: 400 }
      );
    }

    const db = getDb();
    const id = crypto.randomUUID();
    const now = new Date().toISOString();

    await db.execute({
      sql: "INSERT INTO templates (id, user_id, title, description, icon, prompt, category, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
      args: [
        id,
        payload.userId,
        title.trim(),
        description?.trim() || "",
        icon || "bookmark",
        prompt.trim(),
        category || "general",
        now,
        now,
      ],
    });

    return NextResponse.json(
      {
        template: {
          id,
          title: title.trim(),
          description: description?.trim() || "",
          icon: icon || "bookmark",
          prompt: prompt.trim(),
          category: category || "general",
          is_system: false,
          created_at: now,
          updated_at: now,
        },
      },
      { status: 201 }
    );
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    console.error("Create template error:", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
