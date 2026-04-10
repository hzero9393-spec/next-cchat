import { NextRequest } from "next/server";

const SYSTEM_PROMPT = `You are ZAI — a powerful AI personal assistant. You help users with:

1. **Playing Music**: When user asks to play a song/music (keywords: play, song, gana, music, lagao, chalao, sunao, YouTube pe, bajaao, bolo), respond with a brief message AND include exactly this JSON at the END of your response on a new line:
[YT_ACTION]{"query": "SEARCH_QUERY_HERE", "videoId": "YOUTUBE_VIDEO_ID_IF_YOU_KNOW_IT"}[/YT_ACTION]
- query: The search term for the song (e.g., "Tum Hi Ho Arijit Singh Official")
- videoId: If you know the exact YouTube video ID for this song, provide it (e.g., "Gn5QmllRCn4" for Tum Hi Ho). Only provide if you are confident.
Example: if user says "tum hi ho lagao", use query "Tum Hi Ho Arijit Singh" and videoId "Gn5QmllRCn4".

2. **Sending Emails**: When user asks to send an email/mail (keywords: email, mail, bhejo, send, application, letter), draft a professional email. Include this JSON at the END:
[EMAIL_ACTION]{"to": "email@example.com", "subject": "Subject Here", "body": "Full email body here"}[/EMAIL_ACTION]

3. **General Chat**: For normal questions, just respond normally without any action tags.

4. **Deep Research Mode**: When deep research is enabled, provide more detailed, thorough, and well-structured answers with citations, comparisons, and multiple perspectives. Go deeper into topics and provide actionable insights.

RULES:
- Always respond in the same language the user uses (Hindi, English, Hinglish)
- Be friendly, helpful, and concise
- For music, keep response short — "🎵 [Song] YouTube pe chal raha hai!" + action tag
- For emails, draft proper professional emails with proper format
- Only include ONE action tag per response
- Never explain the action tags to the user
- Use markdown for code blocks, lists, etc.`;

const DEEP_RESEARCH_PROMPT = `You are ZAI — an advanced AI research assistant in Deep Research mode. Provide extremely thorough, detailed, and well-structured responses.

For every question:
- Break down into multiple sections with clear headings
- Provide pros/cons when applicable
- Include specific examples, data points, or references
- Compare different approaches/perspectives
- Give actionable recommendations
- Use tables for comparisons when helpful
- Cite sources or mention where to find more info

RULES:
- Always respond in the same language the user uses
- Be thorough but organized
- Use markdown extensively (headings, tables, lists, code blocks, bold, etc.)
- Provide comprehensive answers that cover all angles`;

export async function POST(req: NextRequest) {
  const json = (data: object, status = 200) =>
    new Response(JSON.stringify(data), {
      status,
      headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
    });

  try {
    const { messages, deepResearch } = await req.json();
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return json({ error: "Messages required" }, 400);
    }

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return json({ error: "OpenAI API key not configured" }, 500);
    }

    const systemPrompt = deepResearch ? DEEP_RESEARCH_PROMPT : SYSTEM_PROMPT;
    const model = deepResearch ? "gpt-4o" : "gpt-4o-mini";

    const apiMessages = [
      { role: "system" as const, content: systemPrompt },
      ...messages.map((m: { role: string; content: string }) => ({
        role: m.role as "user" | "assistant",
        content: m.content,
      })),
    ];

    // Call OpenAI API
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: apiMessages,
        temperature: deepResearch ? 0.3 : 0.7,
        max_tokens: deepResearch ? 4096 : 2048,
        stream: true,
      }),
      signal: AbortSignal.timeout(30000),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMsg =
        errorData?.error?.message || `OpenAI API error: ${response.status}`;
      console.error("OpenAI error:", errorMsg);
      return json({ error: errorMsg }, response.status);
    }

    // Stream the response back
    const encoder = new TextEncoder();
    const decoder = new TextDecoder();

    const stream = new ReadableStream({
      async start(controller) {
        let fullContent = "";

        try {
          const reader = response.body?.getReader();
          if (!reader) {
            controller.close();
            return;
          }

          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const chunk = decoder.decode(value, { stream: true });
            const lines = chunk.split("\n").filter((l) => l.startsWith("data: "));

            for (const line of lines) {
              const data = line.slice(6);
              if (data === "[DONE]") break;

              try {
                const parsed = JSON.parse(data);
                const content = parsed.choices?.[0]?.delta?.content;
                if (content) {
                  fullContent += content;
                  controller.enqueue(
                    encoder.encode(`data: ${JSON.stringify({ content })}\n\n`)
                  );
                }
              } catch {
                // skip invalid JSON chunks
              }
            }
          }

          // Send final message with full content
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({ done: true, content: fullContent })}\n\n`
            )
          );
          controller.close();
        } catch (err) {
          const msg = err instanceof Error ? err.message : "Stream error";
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ error: msg })}\n\n`)
          );
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    console.error("Chat API error:", msg);
    return json({ error: msg }, 500);
  }
}
