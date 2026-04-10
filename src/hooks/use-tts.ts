"use client";

import { useState, useCallback, useRef } from "react";

interface UseTTSLreturn {
  speak: (text: string) => void;
  stop: () => void;
  isSpeaking: boolean;
  isSupported: boolean;
  isLoading: boolean;
  isTTSEnabled: boolean;
  isUsingElevenLabs: boolean;
  toggleTTS: () => void;
}

function cleanTextForSpeech(text: string): string {
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

export function useTTS(): UseTTSLreturn {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSupported] = useState(true);
  const [isTTSEnabled, setIsTTSEnabled] = useState(false);
  const [isUsingElevenLabs, setIsUsingElevenLabs] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const stop = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current = null;
    }
    if (abortRef.current) {
      abortRef.current.abort();
      abortRef.current = null;
    }
    // Also stop browser speech synthesis
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
    setIsSpeaking(false);
    setIsLoading(false);
  }, []);

  // Fallback: browser native TTS
  const speakWithBrowser = useCallback(
    (text: string) => {
      if (!("speechSynthesis" in window)) return;

      window.speechSynthesis.cancel();

      const clean = cleanTextForSpeech(text);
      if (!clean) return;

      const utterance = new SpeechSynthesisUtterance(clean);
      utterance.lang = "hi-IN";
      utterance.rate = 1;
      utterance.pitch = 1;
      utterance.volume = 1;

      const voices = window.speechSynthesis.getVoices();
      const hindiVoice = voices.find((v) => v.lang.startsWith("hi"));
      const englishVoice = voices.find((v) => v.lang.startsWith("en"));
      if (hindiVoice) utterance.voice = hindiVoice;
      else if (englishVoice) utterance.voice = englishVoice;

      utterance.onstart = () => {
        setIsLoading(false);
        setIsSpeaking(true);
        setIsUsingElevenLabs(false);
      };
      utterance.onend = () => {
        setIsSpeaking(false);
        setIsLoading(false);
      };
      utterance.onerror = () => {
        setIsSpeaking(false);
        setIsLoading(false);
      };

      window.speechSynthesis.speak(utterance);
    },
    []
  );

  // Primary: ElevenLabs TTS via our API
  const speakWithElevenLabs = useCallback(
    async (text: string) => {
      if (abortRef.current) abortRef.current.abort();
      abortRef.current = new AbortController();

      const response = await fetch("/api/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
        signal: abortRef.current.signal,
      });

      if (!response.ok) {
        console.warn("ElevenLabs TTS failed, falling back to browser TTS");
        speakWithBrowser(text);
        return;
      }

      const contentType = response.headers.get("content-type") || "";
      if (!contentType.includes("audio")) {
        console.warn("ElevenLabs returned non-audio, falling back to browser TTS");
        speakWithBrowser(text);
        return;
      }

      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);

      const audio = new Audio(audioUrl);
      audioRef.current = audio;

      audio.onplay = () => {
        setIsLoading(false);
        setIsSpeaking(true);
        setIsUsingElevenLabs(true);
      };

      audio.onended = () => {
        setIsSpeaking(false);
        setIsLoading(false);
        setIsUsingElevenLabs(false);
        URL.revokeObjectURL(audioUrl);
        audioRef.current = null;
      };

      audio.onerror = () => {
        console.warn("Audio playback error, falling back to browser TTS");
        setIsSpeaking(false);
        setIsLoading(false);
        setIsUsingElevenLabs(false);
        URL.revokeObjectURL(audioUrl);
        audioRef.current = null;
        speakWithBrowser(text);
      };

      await audio.play();
    },
    [speakWithBrowser]
  );

  const speak = useCallback(
    async (text: string) => {
      if (!isTTSEnabled) return;
      stop();

      if (!text || text.trim().length < 2) return;

      setIsLoading(true);
      setIsUsingElevenLabs(false);

      try {
        await speakWithElevenLabs(text);
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") {
          // User cancelled
          setIsLoading(false);
        } else {
          console.error("TTS error:", error);
          setIsLoading(false);
          // Final fallback to browser
          speakWithBrowser(text);
        }
      }
    },
    [isTTSEnabled, stop, speakWithElevenLabs, speakWithBrowser]
  );

  const toggleTTS = useCallback(() => {
    const newVal = !isTTSEnabled;
    setIsTTSEnabled(newVal);
    if (!newVal) {
      stop();
    }
  }, [isTTSEnabled, stop]);

  return { speak, stop, isSpeaking, isSupported, isLoading, isTTSEnabled, isUsingElevenLabs, toggleTTS };
}
