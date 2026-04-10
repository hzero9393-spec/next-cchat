import { NextRequest } from "next/server";
import ZAI from "z-ai-web-dev-sdk";

const SYSTEM_PROMPT = `You are ZAI — a powerful AI personal assistant. You help users with:

1. **Playing Music**: When user asks to play a song/music (keywords: play, song, gana, music, lagao, chalao, sunao, YouTube pe, bajaao, bolo), respond with a brief message AND include exactly this JSON at the END of your response on a new line:
[YT_ACTION]{"query": "SEARCH_QUERY_HERE", "videoId": "YOUTUBE_VIDEO_ID_IF_YOU_KNOW_IT"}[/YT_ACTION]
- query: The search term for the song (e.g., "Tum Hi Ho Arijit Singh Official")
- videoId: If you know the exact YouTube video ID for this song, provide it (e.g., "Gn5QmllRCn4" for Tum Hi Ho). Only provide if you are confident.
Example: if user says "tum hi ho lagao", use query "Tum Hi Ho Arijit Singh" and videoId "Gn5QmllRCn4".

2. **Sending Emails**: When user asks to send an email/mail (keywords: email, mail, bhejo, send, application, letter), draft a professional email. Include this JSON at the END:
[EMAIL_ACTION]{"to": "email@example.com", "subject": "Subject Here", "body": "Full email body here"}[/EMAIL_ACTION]

3. **General Chat**: For normal questions, just respond normally without any action tags.

RULES:
- Always respond in the same language the user uses (Hindi, English, Hinglish)
- Be friendly, helpful, and concise
- For music, keep response short — "🎵 [Song] YouTube pe chal raha hai!" + action tag
- For emails, draft proper professional emails with proper format
- Only include ONE action tag per response
- Never explain the action tags to the user
- Use markdown for code blocks, lists, etc.`;

// Pre-warm a singleton so first request is instant
let cachedZAI: Awaited<ReturnType<typeof ZAI.create>> | null = null;
let zaiReady: Promise<Awaited<ReturnType<typeof ZAI.create>>> | null = null;

// Start warming in background immediately when module loads
async function initZAI() {
  const instance = await ZAI.create();
  cachedZAI = instance;
  return instance;
}
zaiReady = initZAI();

async function getZAI(): Promise<Awaited<ReturnType<typeof ZAI.create>>> {
  // Return cached if available
  if (cachedZAI) return cachedZAI;
  // Wait for pre-warm to finish
  if (zaiReady) return zaiReady;
  // Fallback: create new
  return await ZAI.create();
}

// Fresh instance — used as retry when cached one goes stale
async function freshZAI() {
  cachedZAI = null;
  zaiReady = null;
  const instance = await ZAI.create();
  cachedZAI = instance;
  zaiReady = Promise.resolve(instance);
  return instance;
}

export async function POST(req: NextRequest) {
  const json = (data: object, status = 200) =>
    new Response(JSON.stringify(data), {
      status,
      headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
    });

  try {
    const { messages } = await req.json();
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return json({ error: "Messages required" }, 400);
    }

    const sdkMessages = [
      { role: "assistant" as const, content: SYSTEM_PROMPT },
      ...messages.map((m: { role: string; content: string }) => ({
        role: m.role as "user" | "assistant",
        content: m.content,
      })),
    ];

    // Try cached instance first with short timeout
    let lastError: Error | null = null;
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const zai = attempt === 0 ? await getZAI() : await freshZAI();
        const completion = await Promise.race([
          zai.chat.completions.create({
            messages: sdkMessages,
            thinking: { type: "disabled" },
          }),
          new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error("slow")), 10000)
          ),
        ]);
        const content = completion.choices?.[0]?.message?.content;
        if (content) return json({ content });
      } catch (err) {
        lastError = err instanceof Error ? err : new Error("Unknown");
        // On 429 (rate limit) or stale connection, wait and retry
        if (lastError.message.includes("429") || lastError.message === "slow") {
          await new Promise((r) => setTimeout(r, 1500));
          continue;
        }
        break;
      }
    }

    // Final retry with fresh instance
    const zai = await freshZAI();
    const completion = await Promise.race([
      zai.chat.completions.create({
        messages: sdkMessages,
        thinking: { type: "disabled" },
      }),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error("AI response timed out")), 20000)
      ),
    ]);

    const content = completion.choices?.[0]?.message?.content || "";
    if (!content) return json({ error: "Empty response" }, 500);
    return json({ content });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    console.error("Chat API error:", msg);
    return json({ error: msg }, 500);
  }
}
