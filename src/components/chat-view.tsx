"use client";

import React, {
  useState,
  useRef,
  useEffect,
  useCallback,
  useMemo,
} from "react";
import {
  Send,
  Bot,
  User,
  Copy,
  Check,
  Loader2,
  ArrowLeft,
  RefreshCw,
  Brain,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { motion, AnimatePresence } from "framer-motion";
import ReactMarkdown from "react-markdown";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";

// ============ TYPES ============

export interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  created_at: string;
}

export interface ChatViewProps {
  chatId: string;
  token: string;
  deepResearch: boolean;
  onBack: () => void;
}

// ============ COPY BUTTON ============

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
    }
  };
  return (
    <button
      onClick={handleCopy}
      className="absolute top-2 right-2 p-1.5 rounded-md bg-white/10 hover:bg-white/20 transition-colors opacity-0 group-hover:opacity-100 cursor-pointer"
      title="Copy code"
    >
      {copied ? (
        <Check className="w-3.5 h-3.5 text-green-400" />
      ) : (
        <Copy className="w-3.5 h-3.5 text-gray-400" />
      )}
    </button>
  );
}

// ============ MESSAGE COPY BUTTON ============

function MessageCopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
    }
  };
  return (
    <button
      onClick={handleCopy}
      className="p-1 rounded-md hover:bg-accent transition-colors opacity-0 group-hover:opacity-100 cursor-pointer"
      title="Copy message"
    >
      {copied ? (
        <Check className="w-3.5 h-3.5 text-green-500" />
      ) : (
        <Copy className="w-3.5 h-3.5 text-muted-foreground" />
      )}
    </button>
  );
}

// ============ MESSAGE BUBBLE ============

function MessageBubble({
  message,
  onRegenerate,
  isLastAssistant,
  isRegenerating,
}: {
  message: Message;
  onRegenerate?: () => void;
  isLastAssistant?: boolean;
  isRegenerating?: boolean;
}) {
  const isUser = message.role === "user";

  const components = useMemo(
    () => ({
      code({
        className,
        children,
        ...props
      }: React.HTMLAttributes<HTMLElement> & { inline?: boolean }) {
        const match = /language-(\w+)/.exec(className || "");
        const codeString = String(children).replace(/\n$/, "");
        const isInline = !match && !codeString.includes("\n");
        if (isInline) {
          return (
            <code
              className="bg-muted px-1.5 py-0.5 rounded text-sm font-mono"
              {...props}
            >
              {children}
            </code>
          );
        }
        return (
          <div className="group relative my-3 rounded-lg overflow-hidden border border-border/50">
            {match && (
              <div className="flex items-center justify-between px-4 py-2 bg-zinc-800 dark:bg-zinc-900 border-b border-zinc-700">
                <span className="text-xs text-zinc-400 font-mono">
                  {match[1]}
                </span>
              </div>
            )}
            <CopyButton text={codeString} />
            <SyntaxHighlighter
              style={oneDark}
              language={match ? match[1] : "text"}
              PreTag="div"
              customStyle={{
                margin: 0,
                borderRadius: 0,
                fontSize: "0.8125rem",
                lineHeight: "1.6",
              }}
            >
              {codeString}
            </SyntaxHighlighter>
          </div>
        );
      },
      p: ({ children }: React.HTMLAttributes<HTMLParagraphElement>) => (
        <p className="mb-3 last:mb-0 leading-7">{children}</p>
      ),
      ul: ({ children }: React.HTMLAttributes<HTMLUListElement>) => (
        <ul className="mb-3 ml-6 list-disc space-y-1">{children}</ul>
      ),
      ol: ({ children }: React.HTMLAttributes<HTMLOListElement>) => (
        <ol className="mb-3 ml-6 list-decimal space-y-1">{children}</ol>
      ),
      li: ({ children }: React.HTMLAttributes<HTMLLIElement>) => (
        <li className="leading-7">{children}</li>
      ),
      h1: ({ children }: React.HTMLAttributes<HTMLHeadingElement>) => (
        <h1 className="text-2xl font-bold mb-3 mt-4">{children}</h1>
      ),
      h2: ({ children }: React.HTMLAttributes<HTMLHeadingElement>) => (
        <h2 className="text-xl font-bold mb-2 mt-4">{children}</h2>
      ),
      h3: ({ children }: React.HTMLAttributes<HTMLHeadingElement>) => (
        <h3 className="text-lg font-semibold mb-2 mt-3">{children}</h3>
      ),
      blockquote: ({
        children,
      }: React.HTMLAttributes<HTMLQuoteElement>) => (
        <blockquote className="border-l-4 border-primary/30 pl-4 italic text-muted-foreground mb-3">
          {children}
        </blockquote>
      ),
      a: ({
        href,
        children,
      }: React.AnchorHTMLAttributes<HTMLAnchorElement>) => (
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="text-emerald-600 dark:text-emerald-400 hover:underline"
        >
          {children}
        </a>
      ),
      table: ({ children }: React.HTMLAttributes<HTMLTableElement>) => (
        <div className="overflow-x-auto mb-3">
          <table className="min-w-full border border-border rounded-lg">
            {children}
          </table>
        </div>
      ),
      th: ({ children }: React.HTMLAttributes<HTMLTableCellElement>) => (
        <th className="px-4 py-2 bg-muted border-b border-border text-left font-semibold text-sm">
          {children}
        </th>
      ),
      td: ({ children }: React.HTMLAttributes<HTMLTableCellElement>) => (
        <td className="px-4 py-2 border-b border-border text-sm">{children}</td>
      ),
      hr: () => <hr className="my-4 border-border" />,
      strong: ({ children }: React.HTMLAttributes<HTMLElement>) => (
        <strong className="font-semibold">{children}</strong>
      ),
    }),
    []
  );

  const formatTime = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    } catch {
      return "";
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      className={`flex gap-3 px-4 sm:px-6 lg:px-0 max-w-3xl mx-auto w-full group ${
        isUser ? "flex-row-reverse" : ""
      }`}
    >
      <Avatar className="h-8 w-8 mt-1 shrink-0 shadow-sm">
        {isUser ? (
          <AvatarFallback className="bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300">
            <User className="h-4 w-4" />
          </AvatarFallback>
        ) : (
          <>
            <AvatarImage src="/chatbot-avatar.png" alt="ZAI" />
            <AvatarFallback className="bg-gradient-to-br from-emerald-100 to-teal-100 dark:from-emerald-900/40 dark:to-teal-900/40 text-emerald-700 dark:text-emerald-300">
              <Bot className="h-4 w-4" />
            </AvatarFallback>
          </>
        )}
      </Avatar>

      <div
        className={`flex flex-col ${isUser ? "items-end" : "items-start"} max-w-[80%] sm:max-w-[85%]`}
      >
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs font-medium text-muted-foreground">
            {isUser ? "You" : "ZAI Assistant"}
          </span>
          <span className="text-xs text-muted-foreground/60">
            {formatTime(message.created_at)}
          </span>
        </div>

        <div
          className={`rounded-2xl px-4 py-3 ${
            isUser
              ? "bg-emerald-600 dark:bg-emerald-600 text-white rounded-tr-sm shadow-sm"
              : "bg-card border border-border rounded-tl-sm shadow-sm"
          }`}
        >
          {isUser ? (
            <p className="text-sm leading-7 whitespace-pre-wrap">
              {message.content}
            </p>
          ) : (
            <div className="prose prose-sm dark:prose-invert max-w-none prose-p:leading-7 prose-pre:p-0 prose-pre:bg-transparent prose-code:before:content-none prose-code:after:content-none prose-a:text-emerald-600 dark:prose-a:text-emerald-400">
              <ReactMarkdown components={components}>
                {message.content}
              </ReactMarkdown>
            </div>
          )}
        </div>

        {/* Action buttons */}
        {!isUser && (
          <div className="flex items-center gap-1 mt-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
            <MessageCopyButton text={message.content} />
            {isLastAssistant && onRegenerate && (
              <button
                onClick={onRegenerate}
                disabled={isRegenerating}
                className="p-1 rounded-md hover:bg-accent transition-colors cursor-pointer"
                title="Regenerate response"
              >
                <RefreshCw
                  className={`w-3.5 h-3.5 text-muted-foreground ${
                    isRegenerating ? "animate-spin" : ""
                  }`}
                />
              </button>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
}

// ============ TYPING INDICATOR ============

function TypingIndicator() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="flex gap-3 px-4 sm:px-6 lg:px-0 max-w-3xl mx-auto w-full"
    >
      <Avatar className="h-8 w-8 mt-1 shrink-0 shadow-sm">
        <AvatarFallback className="bg-gradient-to-br from-emerald-100 to-teal-100 dark:from-emerald-900/40 dark:to-teal-900/40 text-emerald-700 dark:text-emerald-300">
          <Bot className="h-4 w-4" />
        </AvatarFallback>
      </Avatar>
      <div className="flex flex-col items-start">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs font-medium text-muted-foreground">
            ZAI Assistant
          </span>
        </div>
        <div className="bg-card border border-border rounded-2xl rounded-tl-sm px-5 py-3.5 shadow-sm">
          <div className="flex gap-1.5 items-center">
            {[0, 0.15, 0.3].map((delay, i) => (
              <motion.div
                key={i}
                animate={{ y: [0, -6, 0] }}
                transition={{
                  duration: 0.6,
                  repeat: Infinity,
                  repeatDelay: 0.15,
                  delay,
                }}
                className="w-2 h-2 rounded-full bg-emerald-500"
              />
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// ============ MAIN CHAT VIEW ============

export function ChatView({
  chatId,
  token,
  deepResearch,
  onBack,
}: ChatViewProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [isFetchingMessages, setIsFetchingMessages] = useState(true);
  const [error, setError] = useState("");

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  // Fetch messages on mount
  useEffect(() => {
    const fetchMessages = async () => {
      setIsFetchingMessages(true);
      try {
        const res = await fetch(`/api/chats/${chatId}/messages`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error("Failed to fetch messages");
        const data = await res.json();
        setMessages(data.messages || []);
      } catch {
        setError("Could not load messages");
      } finally {
        setIsFetchingMessages(false);
      }
    };
    fetchMessages();
  }, [chatId, token]);

  // Auto-scroll
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading, scrollToBottom]);

  // Send message
  const sendMessage = useCallback(
    async (messageText?: string) => {
      const content = messageText || input.trim();
      if (!content || isLoading) return;

      // Optimistically add user message
      const userMsg: Message = {
        id: `temp-${Date.now()}`,
        role: "user",
        content,
        created_at: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, userMsg]);
      setInput("");
      setIsLoading(true);
      setError("");

      if (textareaRef.current) textareaRef.current.style.height = "auto";

      abortRef.current = new AbortController();

      try {
        // Save user message to API
        await fetch(`/api/chats/${chatId}/messages`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ role: "user", content }),
        });

        // Get AI response via chat API
        const allMessages = [...messages, userMsg].map((m) => ({
          role: m.role,
          content: m.content,
        }));

        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ messages: allMessages, deepResearch }),
          signal: abortRef.current.signal,
        });

        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error || `API error: ${res.status}`);
        }

        // Stream the response
        const aiMsgId = `ai-${Date.now()}`;
        const streamingMsg: Message = {
          id: aiMsgId,
          role: "assistant",
          content: "",
          created_at: new Date().toISOString(),
        };
        setMessages((prev) => [...prev, streamingMsg]);

        const contentType = res.headers.get("content-type") || "";
        let fullContent = "";

        if (contentType.includes("text/event-stream")) {
          // SSE streaming
          const reader = res.body?.getReader();
          const decoder = new TextDecoder();
          let buffer = "";

          while (reader) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split("\n");
            buffer = lines.pop() || "";

            for (const line of lines) {
              if (!line.startsWith("data: ")) continue;
              try {
                const parsed = JSON.parse(line.slice(6));
                if (parsed.error) {
                  throw new Error(parsed.error);
                }
                if (parsed.done) {
                  fullContent = parsed.content || fullContent;
                } else if (parsed.content) {
                  fullContent += parsed.content;
                  setMessages((prev) =>
                    prev.map((m) =>
                      m.id === aiMsgId
                        ? { ...m, content: fullContent }
                        : m
                    )
                  );
                }
              } catch (e) {
                if (e instanceof Error && e.message !== "Unexpected end of JSON input") {
                  // skip parse errors for incomplete chunks
                }
              }
            }
          }
        } else {
          // Non-streaming fallback
          const data = await res.json();
          if (data.error) throw new Error(data.error);
          fullContent = data.content || "";
          setMessages((prev) =>
            prev.map((m) =>
              m.id === aiMsgId
                ? { ...m, content: fullContent }
                : m
            )
          );
        }

        // Save assistant message to DB
        if (fullContent) {
          fetch(`/api/chats/${chatId}/messages`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ role: "assistant", content: fullContent }),
          }).catch(() => {});
        }
      } catch (err: unknown) {
        if (err instanceof Error && err.name === "AbortError") return;
        const errMsg = err instanceof Error ? err.message : "Unknown error";
        setError(errMsg);
      } finally {
        setIsLoading(false);
        abortRef.current = null;
      }
    },
    [input, isLoading, messages, chatId, token]
  );

  // Regenerate last AI message
  const handleRegenerate = useCallback(async () => {
    // Find last user message
    const lastUserIdx = [...messages]
      .reverse()
      .findIndex((m) => m.role === "user");
    if (lastUserIdx === -1) return;

    const lastUserMsg =
      messages[messages.length - 1 - lastUserIdx];
    if (!lastUserMsg) return;

    // Remove last assistant message
    setMessages((prev) => {
      const idx = [...prev].reverse().findIndex((m) => m.role === "assistant");
      if (idx === -1) return prev;
      return prev.slice(0, prev.length - 1 - idx);
    });

    setIsRegenerating(true);

    try {
      const chatHistory = messages
        .slice(0, messages.length - 1 - lastUserIdx)
        .concat(lastUserMsg)
        .map((m) => ({ role: m.role, content: m.content }));

      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: chatHistory, deepResearch }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "AI error");
      }

      const regenId = `regen-${Date.now()}`;
      const streamingMsg: Message = {
        id: regenId,
        role: "assistant",
        content: "",
        created_at: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, streamingMsg]);

      const contentType = res.headers.get("content-type") || "";
      let fullContent = "";

      if (contentType.includes("text/event-stream")) {
        const reader = res.body?.getReader();
        const decoder = new TextDecoder();
        let buffer = "";

        while (reader) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() || "";
          for (const line of lines) {
            if (!line.startsWith("data: ")) continue;
            try {
              const parsed = JSON.parse(line.slice(6));
              if (parsed.error) throw new Error(parsed.error);
              if (parsed.done) fullContent = parsed.content || fullContent;
              else if (parsed.content) {
                fullContent += parsed.content;
                setMessages((prev) =>
                  prev.map((m) => (m.id === regenId ? { ...m, content: fullContent } : m))
                );
              }
            } catch {}
          }
        }
      } else {
        const data = await res.json();
        if (data.error) throw new Error(data.error);
        fullContent = data.content || "";
        setMessages((prev) =>
          prev.map((m) => (m.id === regenId ? { ...m, content: fullContent } : m))
        );
      }

      if (fullContent) {
        fetch(`/api/chats/${chatId}/messages`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ role: "assistant", content: fullContent }),
        }).catch(() => {});
      }
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : "Failed to regenerate";
      setError(errMsg);
    } finally {
      setIsRegenerating(false);
    }
  }, [messages, chatId, token]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
      }
    },
    [sendMessage]
  );

  const handleTextareaChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      setInput(e.target.value);
      const textarea = e.target;
      textarea.style.height = "auto";
      textarea.style.height = Math.min(textarea.scrollHeight, 160) + "px";
    },
    []
  );

  // Find last assistant message for regenerate button
  const lastAssistantIdx = [...messages].reverse().findIndex((m) => m.role === "assistant");
  const lastAssistantMessage =
    lastAssistantIdx >= 0
      ? messages[messages.length - 1 - lastAssistantIdx]
      : null;

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header */}
      <motion.header
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="sticky top-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60"
      >
        <div className="flex items-center justify-between px-4 h-14">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={onBack}
              className="h-9 w-9 shrink-0"
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center shrink-0">
                <Sparkles className="w-3.5 h-3.5 text-white" />
              </div>
              <div className="min-w-0">
                <h1 className="text-sm font-semibold truncate">Chat</h1>
              </div>
            </div>
          </div>

          {deepResearch && (
            <Badge
              variant="outline"
              className="shrink-0 border-purple-500/30 bg-purple-500/10 text-purple-600 dark:text-purple-400 gap-1"
            >
              <Brain className="w-3 h-3" />
              Deep Research
            </Badge>
          )}
        </div>
      </motion.header>

      {/* Messages Area */}
      <main className="flex-1 overflow-y-auto">
        {isFetchingMessages ? (
          <div className="flex items-center justify-center h-full">
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
              <p className="text-sm text-muted-foreground">Loading chat...</p>
            </div>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex items-center justify-center h-full px-4">
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center">
                <Sparkles className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-xl font-semibold mb-2">
                Start a conversation
              </h2>
              <p className="text-sm text-muted-foreground max-w-sm">
                {deepResearch
                  ? "Deep Research mode is on. Ask complex questions for thorough analysis."
                  : "Type a message below to start chatting with ZAI Assistant."}
              </p>
            </div>
          </div>
        ) : (
          <div className="py-6 space-y-6">
            {messages.map((message) => (
              <MessageBubble
                key={message.id}
                message={message}
                onRegenerate={handleRegenerate}
                isLastAssistant={message.id === lastAssistantMessage?.id}
                isRegenerating={isRegenerating}
              />
            ))}
            {isLoading && <TypingIndicator />}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-0"
              >
                <div className="flex items-center gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-sm">
                  <span>{error}</span>
                </div>
              </motion.div>
            )}
            <div ref={messagesEndRef} className="h-4" />
          </div>
        )}
      </main>

      {/* Input Area */}
      <motion.footer
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.4, delay: 0.1 }}
        className="sticky bottom-0 border-t border-border/50 bg-background/80 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60 z-30"
      >
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-3">
          <div className="flex items-end gap-2">
            <div className="flex-1 relative">
              <Textarea
                ref={textareaRef}
                value={input}
                onChange={handleTextareaChange}
                onKeyDown={handleKeyDown}
                placeholder={
                  deepResearch
                    ? "Ask a complex question for deep research..."
                    : "Type your message..."
                }
                className="resize-none rounded-xl bg-card border-border focus:border-emerald-500/50 focus:ring-emerald-500/20 min-h-[44px] max-h-[160px] py-3 px-4 pr-12 text-sm leading-relaxed"
                rows={1}
                disabled={isLoading}
              />
            </div>
            <Button
              onClick={() => sendMessage()}
              disabled={!input.trim() || isLoading}
              size="icon"
              className="h-11 w-11 rounded-xl bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-600 dark:hover:bg-emerald-700 text-white shadow-sm disabled:opacity-40 shrink-0 transition-all duration-200"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>
          <p className="text-[11px] text-muted-foreground/60 mt-2 px-1">
            Press Enter to send, Shift+Enter for new line
          </p>
        </div>
      </motion.footer>
    </div>
  );
}

export default ChatView;
