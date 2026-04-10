import { NextRequest, NextResponse } from "next/server";

const ELEVENLABS_API = "https://api.elevenlabs.io/v1";
const API_KEY = process.env.ELEVENLABS_API_KEY;
const VOICE_ID = process.env.ELEVENLABS_VOICE_ID || "JTPrASXyK62cF3L7w8hv";

// Clean text for TTS — remove markdown, URLs, emojis, etc.
function cleanTextForTTS(text: string): string {
  return text
    .replace(/```[\s\S]*?```/g, "")
    .replace(/`[^`]+`/g, "")
    .replace(/\[([^\]]*)\]\([^)]+\)/g, "$1")
    .replace(/[#*_~>\-|]/g, "")
    .replace(/https?:\/\/[^\s]+/g, "")
    .replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F700}-\u{1F77F}\u{1F780}-\u{1F7FF}\u{1F800}-\u{1F8FF}\u{1F900}-\u{1F9FF}\u{1FA00}-\u{1FA6F}\u{1FA70}-\u{1FAFF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, "")
    .replace(/\n{2,}/g, ". ")
    .replace(/\n/g, ". ")
    .replace(/\s{2,}/g, " ")
    .trim();
}

export async function POST(req: NextRequest) {
  if (!API_KEY) {
    return NextResponse.json({ error: "ElevenLabs API key not configured" }, { status: 500 });
  }

  try {
    const { text } = await req.json();

    if (!text || typeof text !== "string") {
      return NextResponse.json({ error: "Text is required" }, { status: 400 });
    }

    const cleaned = cleanTextForTTS(text);

    if (!cleaned || cleaned.length < 2) {
      return NextResponse.json({ error: "Text too short after cleaning" }, { status: 400 });
    }

    // ElevenLabs has a 5000 character limit
    const truncated = cleaned.length > 5000 ? cleaned.slice(0, 4997) + "..." : cleaned;

    const response = await fetch(`${ELEVENLABS_API}/text-to-speech/${VOICE_ID}`, {
      method: "POST",
      headers: {
        "xi-api-key": API_KEY,
        "Content-Type": "application/json",
        Accept: "audio/mpeg",
      },
      body: JSON.stringify({
        text: truncated,
        model_id: "eleven_multilingual_v2",
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.75,
          style: 0.0,
          use_speaker_boost: true,
        },
      }),
      signal: AbortSignal.timeout(15000), // 15s timeout
    });

    if (!response.ok) {
      const errText = await response.text().catch(() => "");
      console.error("ElevenLabs API error:", response.status, errText);
      return NextResponse.json(
        { error: `ElevenLabs error: ${response.status}` },
        { status: 502 }
      );
    }

    // Stream audio back
    const audioBuffer = await response.arrayBuffer();

    return new Response(audioBuffer, {
      status: 200,
      headers: {
        "Content-Type": "audio/mpeg",
        "Content-Length": audioBuffer.byteLength.toString(),
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    if (error instanceof DOMException && error.name === "TimeoutError") {
      return NextResponse.json({ error: "TTS request timed out" }, { status: 504 });
    }
    const msg = error instanceof Error ? error.message : "Unknown error";
    console.error("TTS error:", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
