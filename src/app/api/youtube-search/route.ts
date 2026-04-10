import { NextRequest, NextResponse } from "next/server";

const PIPED_INSTANCES = [
  "https://pipedapi.kavin.rocks",
  "https://pipedapi.adminforge.de",
  "https://pipedapi.r4fo.com",
  "https://api.piped.yt",
  "https://pipedapi.darkness.services",
];

const INVIDIOUS_INSTANCES = [
  "https://inv.tux.pizza",
  "https://vid.puffyan.us",
  "https://invidious.fdn.fr",
];

const TIMEOUT_MS = 4000;
const MAX_RESULTS = 5;

interface PipedItem {
  url?: string;
  title?: string;
  thumbnail?: string;
  duration?: number;
  uploaderName?: string;
  type?: string;
}

interface InvidiousVideo {
  videoId?: string;
  title?: string;
  videoThumbnails?: Array<{ url?: string }>;
  lengthSeconds?: number;
  author?: string;
  type?: string;
}

interface SearchResult {
  videoId: string;
  title: string;
  thumbnail: string;
  duration: number;
  author: string;
}

async function searchPiped(query: string): Promise<SearchResult[]> {
  for (const instance of PIPED_INSTANCES) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

      const response = await fetch(
        `${instance}/search?q=${encodeURIComponent(query)}&filter=videos`,
        { signal: controller.signal }
      );

      clearTimeout(timeoutId);

      if (!response.ok) continue;

      const data = await response.json();
      const items: PipedItem[] = Array.isArray(data?.items)
        ? data.items.filter((item: PipedItem) => item.type === "stream")
        : [];

      if (items.length === 0) continue;

      return items.slice(0, MAX_RESULTS).map((item) => {
        let videoId = "";
        if (item.url) {
          const match = item.url.match(/[?&]v=([^&]+)/);
          videoId = match ? match[1] : item.url.replace(/^\//, "");
        }
        return {
          videoId,
          title: item.title || "Untitled",
          thumbnail: item.thumbnail || "",
          duration: item.duration || 0,
          author: item.uploaderName || "Unknown",
        };
      });
    } catch {
      continue;
    }
  }
  return [];
}

async function searchInvidious(query: string): Promise<SearchResult[]> {
  for (const instance of INVIDIOUS_INSTANCES) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

      const response = await fetch(
        `${instance}/api/v1/search?q=${encodeURIComponent(query)}&type=video`,
        { signal: controller.signal }
      );

      clearTimeout(timeoutId);

      if (!response.ok) continue;

      const data = await response.json();
      const videos: InvidiousVideo[] = Array.isArray(data)
        ? data.filter((v: InvidiousVideo) => v.type === "video" && v.videoId)
        : [];

      if (videos.length === 0) continue;

      return videos.slice(0, MAX_RESULTS).map((v) => ({
        videoId: v.videoId || "",
        title: v.title || "Untitled",
        thumbnail: v.videoThumbnails?.[2]?.url || v.videoThumbnails?.[0]?.url || "",
        duration: v.lengthSeconds || 0,
        author: v.author || "Unknown",
      }));
    } catch {
      continue;
    }
  }
  return [];
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q");

  if (!query || query.trim().length === 0) {
    return NextResponse.json(
      { error: "Missing required query parameter 'q'" },
      { status: 400 }
    );
  }

  const trimmedQuery = query.trim();

  // Try Piped API first
  let results = await searchPiped(trimmedQuery);

  // Fallback to Invidious
  if (results.length === 0) {
    results = await searchInvidious(trimmedQuery);
  }

  // If still no results, provide a "search on YouTube" link
  if (results.length === 0) {
    return NextResponse.json({
      results: [],
      fallbackUrl: `https://www.youtube.com/results?search_query=${encodeURIComponent(trimmedQuery)}`,
      message: "Direct search unavailable. Click to search on YouTube.",
    });
  }

  return NextResponse.json({ results });
}
