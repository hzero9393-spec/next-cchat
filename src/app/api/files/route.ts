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
    if (!payload) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    const db = getDb();

    const result = await db.execute({
      sql: `SELECT id, user_id, filename, file_type, file_size, content_text, uploaded_at
            FROM files
            WHERE user_id = ?
            ORDER BY uploaded_at DESC`,
      args: [payload.userId],
    });

    return NextResponse.json({ files: result.rows });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    console.error("List files error:", msg);
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

    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Validate file type
    const allowedTypes = [
      "text/plain",
      "text/markdown",
      "text/csv",
      "application/json",
      "text/html",
      "text/css",
      "text/javascript",
      "application/typescript",
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ];

    if (!allowedTypes.includes(file.type) && !file.name.match(/\.(txt|md|csv|json|html|css|js|ts|tsx|jsx|pdf|py|java|c|cpp|go|rs|rb|php|sh|yaml|yml|xml|sql)$/i)) {
      return NextResponse.json(
        { error: "File type not supported. Please upload text, code, or PDF files." },
        { status: 400 }
      );
    }

    // Read file content
    const arrayBuffer = await file.arrayBuffer();
    const fileBuffer = Buffer.from(arrayBuffer);
    const maxSize = 5 * 1024 * 1024; // 5MB limit

    if (fileBuffer.length > maxSize) {
      return NextResponse.json({ error: "File too large. Maximum size is 5MB." }, { status: 400 });
    }

    let contentText = "";

    if (file.type === "application/pdf") {
      // For PDF files, extract text if possible (basic approach)
      // In production, use a PDF parsing library
      const textDecoder = new TextDecoder("utf-8", { fatal: false });
      contentText = textDecoder.decode(fileBuffer);
      // Filter out non-printable characters
      contentText = contentText.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, "").trim();
      if (!contentText || contentText.length < 10) {
        contentText = `[PDF file: ${file.name}] (Binary PDF content — please use the chat to ask questions about this file.)`;
      }
    } else {
      // Text-based files: decode directly
      const textDecoder = new TextDecoder("utf-8", { fatal: false });
      contentText = textDecoder.decode(fileBuffer);
    }

    const db = getDb();
    const id = crypto.randomUUID();
    const now = new Date().toISOString();

    await db.execute({
      sql: "INSERT INTO files (id, user_id, filename, file_type, file_size, content_text, uploaded_at) VALUES (?, ?, ?, ?, ?, ?, ?)",
      args: [id, payload.userId, file.name, file.type, fileBuffer.length, contentText, now],
    });

    return NextResponse.json(
      {
        file: {
          id,
          filename: file.name,
          file_type: file.type,
          file_size: fileBuffer.length,
          content_text: contentText,
          uploaded_at: now,
        },
      },
      { status: 201 }
    );
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    console.error("Upload file error:", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
