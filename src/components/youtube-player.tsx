"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { Play, SkipForward, X, Volume2, VolumeX, Music, Search, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";

interface YouTubeVideo {
  videoId: string;
  title: string;
  thumbnail: string;
  duration: number;
  author: string;
}

interface YouTubeSearchResponse {
  results?: YouTubeVideo[];
  fallbackUrl?: string;
  message?: string;
}

interface YouTubePlayerProps {
  query: string;
  videoId?: string;
  onClose: () => void;
}

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function YouTubePlayer({ query, videoId: initialVideoId, onClose }: YouTubePlayerProps) {
  const [videos, setVideos] = useState<YouTubeVideo[]>([]);
  const [currentVideo, setCurrentVideo] = useState<YouTubeVideo | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fallbackUrl, setFallbackUrl] = useState<string | null>(null);
  const playerRef = useRef<HTMLIFrameElement>(null);

  const searchVideos = useCallback(async (searchQuery: string) => {
    setIsSearching(true);
    setError(null);
    setFallbackUrl(null);
    try {
      const res = await fetch(`/api/youtube-search?q=${encodeURIComponent(searchQuery)}`);
      const data: YouTubeSearchResponse = await res.json();
      if (data.results && data.results.length > 0) {
        setVideos(data.results);
        // Auto-play first result
        setCurrentVideo(data.results[0]);
        setIsPlaying(true);
        setShowResults(false);
      } else if (data.fallbackUrl) {
        setFallbackUrl(data.fallbackUrl);
        setError(data.message || "Direct search unavailable.");
      } else {
        setError("Koi video nahi mili. Doosra naam try karo.");
      }
    } catch {
      setError("Search mein error aaya. Dobara try karo.");
    } finally {
      setIsSearching(false);
    }
  }, []);

  useEffect(() => {
    if (initialVideoId) {
      // AI provided a video ID — play directly
      setCurrentVideo({
        videoId: initialVideoId,
        title: query,
        thumbnail: `https://img.youtube.com/vi/${initialVideoId}/mqdefault.jpg`,
        duration: 0,
        author: "",
      });
      setIsPlaying(true);
      setShowResults(false);
      // Also search for more results in background
      searchVideos(query);
    } else {
      searchVideos(query);
    }
  }, [query, initialVideoId, searchVideos]);

  const playVideo = useCallback((video: YouTubeVideo) => {
    setCurrentVideo(video);
    setIsPlaying(true);
    setShowResults(false);
  }, []);

  const skipNext = useCallback(() => {
    if (!currentVideo) return;
    const idx = videos.findIndex((v) => v.videoId === currentVideo.videoId);
    if (idx < videos.length - 1) {
      playVideo(videos[idx + 1]);
    }
  }, [currentVideo, videos, playVideo]);

  const close = useCallback(() => {
    setCurrentVideo(null);
    setIsPlaying(false);
    onClose();
  }, [onClose]);

  const toggleMute = useCallback(() => {
    setIsMuted((prev) => !prev);
  }, []);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
        className="fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-border shadow-2xl shadow-black/20"
      >
        {/* Video Player */}
        {currentVideo && !showResults && (
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: "auto" }}
            className="relative bg-black"
          >
            <div className="relative w-full max-w-3xl mx-auto" style={{ aspectRatio: "16/9", maxHeight: "280px" }}>
              <iframe
                key={`${currentVideo.videoId}-${isMuted}`}
                ref={playerRef}
                src={`https://www.youtube.com/embed/${currentVideo.videoId}?autoplay=1&rel=0&modestbranding=1${isMuted ? "&mute=1" : ""}`}
                className="absolute inset-0 w-full h-full"
                allow="autoplay; encrypted-media"
                allowFullScreen
                title={currentVideo.title}
              />
            </div>

            {/* Player Controls */}
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-3">
              <div className="max-w-3xl mx-auto flex items-center justify-between">
                <div className="flex items-center gap-2 min-w-0">
                  <Music className="w-4 h-4 text-white/70 shrink-0" />
                  <div className="min-w-0">
                    <p className="text-white text-sm font-medium truncate">{currentVideo.title}</p>
                    {currentVideo.author && (
                      <p className="text-white/60 text-xs truncate">{currentVideo.author}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={toggleMute}
                    className="h-8 w-8 text-white hover:bg-white/20"
                  >
                    {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                  </Button>
                  {videos.length > 1 && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={skipNext}
                      className="h-8 w-8 text-white hover:bg-white/20"
                      disabled={videos.findIndex((v) => v.videoId === currentVideo?.videoId) >= videos.length - 1}
                    >
                      <SkipForward className="w-4 h-4" />
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={close}
                    className="h-8 w-8 text-white hover:bg-white/20"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Bottom Bar */}
        <div className="max-w-3xl mx-auto">
          {showResults ? (
            <div className="p-3">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Music className="w-4 h-4 text-red-500" />
                  <span className="text-sm font-medium">
                    {isSearching ? "Searching..." : `Results for "${query}"`}
                  </span>
                </div>
                <Button variant="ghost" size="icon" onClick={close} className="h-7 w-7">
                  <X className="w-4 h-4" />
                </Button>
              </div>

              {error && (
                <div className="flex flex-col gap-2">
                  <p className="text-sm text-destructive">{error}</p>
                  {fallbackUrl && (
                    <a
                      href={fallbackUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs text-emerald-500 hover:underline"
                    >
                      <ExternalLink className="w-3 h-3" />
                      YouTube pe search karo →
                    </a>
                  )}
                </div>
              )}

              {isSearching && !currentVideo && (
                <div className="flex items-center justify-center py-4">
                  <div className="animate-spin w-5 h-5 border-2 border-emerald-500 border-t-transparent rounded-full" />
                </div>
              )}

              {videos.length > 0 && (
                <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin">
                  {videos.map((video) => (
                    <button
                      key={video.videoId}
                      onClick={() => playVideo(video)}
                      className={`flex items-center gap-3 p-2 rounded-lg transition-colors shrink-0 min-w-[240px] group ${
                        currentVideo?.videoId === video.videoId
                          ? "bg-emerald-100 dark:bg-emerald-900/30 ring-1 ring-emerald-500/50"
                          : "bg-accent hover:bg-accent/80"
                      }`}
                    >
                      <div className="relative w-20 h-14 rounded overflow-hidden shrink-0 bg-muted">
                        <img
                          src={video.thumbnail}
                          alt={video.title}
                          className="w-full h-full object-cover"
                          loading="lazy"
                        />
                        <div className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Play className="w-5 h-5 text-white fill-white" />
                        </div>
                        {video.duration > 0 && (
                          <span className="absolute bottom-0.5 right-0.5 bg-black/80 text-white text-[10px] px-1 rounded">
                            {formatDuration(video.duration)}
                          </span>
                        )}
                      </div>
                      <div className="min-w-0 text-left">
                        <p className="text-xs font-medium truncate max-w-[140px]">{video.title}</p>
                        <p className="text-[10px] text-muted-foreground truncate max-w-[140px]">{video.author}</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="px-3 py-2 flex items-center justify-between">
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                <span className="text-xs text-muted-foreground truncate">
                  Now Playing: {currentVideo?.title || query}
                </span>
              </div>
              <div className="flex items-center gap-1">
                {videos.length > 1 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowResults(true)}
                    className="h-6 px-2 text-xs text-muted-foreground"
                  >
                    <Search className="w-3 h-3 mr-1" />
                    More
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={close}
                  className="h-7 w-7 text-muted-foreground hover:text-foreground"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
