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
  Mic,
  MicOff,
  Paperclip,
  ImageIcon,
  Download,
  Share2,
  Volume2,
  VolumeX,
  X,
  FileText,
  MessageSquare,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { motion, AnimatePresence } from "framer-motion";
import ReactMarkdown from "react-markdown";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { useSpeechRecognition } from "@/hooks/use-speech-recognition";
import { useTTS } from "@/hooks/use-tts";

// ============ TYPES ============

export interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  created_at: string;
}

interface AttachedFile {
  name: string;
  size: number;
  type: string;
  content_text: string;
}

export interface ChatViewProps {
  chatId: string;
  token: string;
  deepResearch?: boolean;
  selectedModel?: string;
  onBack: () => void;
  templatePrompt?: string;
}

const MODEL_LABELS: Record<string, string> = {
  "gpt-4o": "Deep Research",
  "gpt-4o-mini": "Fast",
  "gpt-3.5-turbo": "Economy",
};

const MODEL_COLORS: Record<string, string> = {
  "gpt-4o": "border-purple-500/30 bg-purple-500/10 text-purple-600 dark:text-purple-400",
  "gpt-4o-mini": "border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  "gpt-3.5-turbo": "border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400",
};

function resolveModel(props: ChatViewProps): string {
  if (props.selectedModel) return props.selectedModel;
  if (props.deepResearch) return "gpt-4o";
  return "gpt-4o-mini";
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

// ============ MESSAGE ACTION BUTTONS ============

function MessageActionButtons({
  message,
  onRegenerate,
  isLastAssistant,
  isRegenerating,
  onSpeak,
  isSpeaking,
  onExportMessage,
}: {
  message: Message;
  onRegenerate?: () => void;
  isLastAssistant?: boolean;
  isRegenerating?: boolean;
  onSpeak?: (text: string) => void;
  isSpeaking?: boolean;
  onExportMessage?: (msg: Message) => void;
}) {
  const [copied, setCopied] = useState(false);
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(message.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
    }
  };

  return (
    <div className="flex items-center gap-0.5 mt-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            onClick={handleCopy}
            className="p-1 rounded-md hover:bg-accent transition-colors cursor-pointer"
          >
            {copied ? (
              <Check className="w-3.5 h-3.5 text-green-500" />
            ) : (
              <Copy className="w-3.5 h-3.5 text-muted-foreground" />
            )}
          </button>
        </TooltipTrigger>
        <TooltipContent side="bottom">Copy</TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger asChild>
          <button
            onClick={() => onSpeak?.(message.content)}
            className="p-1 rounded-md hover:bg-accent transition-colors cursor-pointer"
          >
            {isSpeaking ? (
              <VolumeX className="w-3.5 h-3.5 text-red-500" />
            ) : (
              <Volume2 className="w-3.5 h-3.5 text-muted-foreground" />
            )}
          </button>
        </TooltipTrigger>
        <TooltipContent side="bottom">{isSpeaking ? "Stop" : "Read aloud"}</TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger asChild>
          <button
            onClick={() => onExportMessage?.(message)}
            className="p-1 rounded-md hover:bg-accent transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-muted-foreground" />
          </button>
        </TooltipTrigger>
        <TooltipContent side="bottom">Export message</TooltipContent>
      </Tooltip>

      {isLastAssistant && onRegenerate && (
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={onRegenerate}
              disabled={isRegenerating}
              className="p-1 rounded-md hover:bg-accent transition-colors cursor-pointer"
            >
              <RefreshCw
                className={`w-3.5 h-3.5 text-muted-foreground ${
                  isRegenerating ? "animate-spin" : ""
                }`}
              />
            </button>
          </TooltipTrigger>
          <TooltipContent side="bottom">Regenerate</TooltipContent>
        </Tooltip>
      )}
    </div>
  );
}

// ============ MESSAGE BUBBLE ============

function MessageBubble({
  message,
  onRegenerate,
  isLastAssistant,
  isRegenerating,
  onSpeak,
  isSpeaking,
  onExportMessage,
}: {
  message: Message;
  onRegenerate?: () => void;
  isLastAssistant?: boolean;
  isRegenerating?: boolean;
  onSpeak?: (text: string) => void;
  isSpeaking?: boolean;
  onExportMessage?: (msg: Message) => void;
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

        {/* Action buttons for assistant messages */}
        {!isUser && (
          <MessageActionButtons
            message={message}
            onRegenerate={onRegenerate}
            isLastAssistant={isLastAssistant}
            isRegenerating={isRegenerating}
            onSpeak={onSpeak}
            isSpeaking={isSpeaking}
            onExportMessage={onExportMessage}
          />
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
  selectedModel,
  onBack,
  templatePrompt,
}: ChatViewProps) {
  const model = resolveModel({ chatId, token, deepResearch, selectedModel, onBack, templatePrompt });

  // ---- State ----
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [isFetchingMessages, setIsFetchingMessages] = useState(true);
  const [error, setError] = useState("");

  // File upload state
  const [attachedFile, setAttachedFile] = useState<AttachedFile | null>(null);
  const [isUploadingFile, setIsUploadingFile] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Share dialog state
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [shareUrl, setShareUrl] = useState("");
  const [shareLoading, setShareLoading] = useState(false);

  // Template pre-fill sentinel
  const templateSentRef = useRef(false);

  // ---- Refs ----
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  // ---- Hooks ----
  const speech = useSpeechRecognition();
  const tts = useTTS();

  // ============ FETCH MESSAGES ============

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

  // ============ TEMPLATE PRE-FILL ============

  useEffect(() => {
    if (
      templatePrompt &&
      !templateSentRef.current &&
      !isFetchingMessages
    ) {
      templateSentRef.current = true;
      // Small delay so the user can see messages loading first
      const timer = setTimeout(() => {
        sendMessage(templatePrompt);
      }, 600);
      return () => clearTimeout(timer);
    }
  }, [isFetchingMessages]);

  // ============ AUTO-SCROLL ============

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading, scrollToBottom]);

  // ============ TTS AUTO-SPEAK ============

  const prevAssistantCountRef = useRef(0);
  useEffect(() => {
    const assistantCount = messages.filter((m) => m.role === "assistant").length;
    if (tts.isTTSEnabled && assistantCount > prevAssistantCountRef.current && !isLoading) {
      const lastAssistant = [...messages].reverse().find((m) => m.role === "assistant");
      if (lastAssistant && lastAssistant.content) {
        tts.speak(lastAssistant.content);
      }
    }
    prevAssistantCountRef.current = assistantCount;
  }, [messages.length, isLoading, tts.isTTSEnabled]);

  // ============ SEND MESSAGE ============

  const sendMessage = useCallback(
    async (messageText?: string) => {
      const rawContent = messageText || input.trim();
      if (!rawContent || isLoading) return;

      // Build the actual content with file attachment context if present
      let content = rawContent;
      const fileForMessage = attachedFile;
      if (fileForMessage) {
        content = `Based on the attached file [${fileForMessage.name}]:\n\n${fileForMessage.content_text}\n\nUser question: ${rawContent}`;
        setAttachedFile(null);
      }

      // Optimistically add user message
      const userMsg: Message = {
        id: `temp-${Date.now()}`,
        role: "user",
        content: rawContent, // Show original text in UI
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
          body: JSON.stringify({
            messages: allMessages,
            deepResearch: model === "gpt-4o",
            model,
          }),
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
    [input, isLoading, messages, chatId, token, model, attachedFile]
  );

  // ============ REGENERATE ============

  const handleRegenerate = useCallback(async () => {
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
        body: JSON.stringify({
          messages: chatHistory,
          deepResearch: model === "gpt-4o",
          model,
        }),
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
  }, [messages, chatId, token, model]);

  // ============ FILE UPLOAD ============

  const handleFileSelect = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      if (file.size > 5 * 1024 * 1024) {
        setError("File too large. Maximum size is 5MB.");
        return;
      }

      const allowedExts = [".pdf", ".txt", ".md", ".csv", ".json"];
      const ext = file.name.substring(file.name.lastIndexOf(".")).toLowerCase();
      if (!allowedExts.includes(ext)) {
        setError("Unsupported file type. Allowed: .pdf, .txt, .md, .csv, .json");
        return;
      }

      setIsUploadingFile(true);
      try {
        const formData = new FormData();
        formData.append("file", file);

        const res = await fetch("/api/files", {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
          body: formData,
        });

        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error || "Upload failed");
        }

        const data = await res.json();
        setAttachedFile({
          name: data.file.filename,
          size: data.file.file_size,
          type: data.file.file_type,
          content_text: data.file.content_text,
        });
      } catch (err: unknown) {
        const errMsg = err instanceof Error ? err.message : "Failed to upload file";
        setError(errMsg);
      } finally {
        setIsUploadingFile(false);
        // Reset the file input
        if (fileInputRef.current) fileInputRef.current.value = "";
      }
    },
    [token]
  );

  const removeAttachedFile = useCallback(() => {
    setAttachedFile(null);
  }, []);

  // ============ EXPORT CHAT ============

  const handleExportChat = useCallback(
    async (format: "md" | "txt") => {
      try {
        const res = await fetch(
          `/api/chats/${chatId}/export?format=${format}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        if (!res.ok) throw new Error("Export failed");

        const blob = await res.blob();
        const dateStr = new Date().toISOString().slice(0, 10);
        const filename = `chat-${chatId}-${dateStr}.${format}`;
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      } catch {
        setError("Failed to export chat");
      }
    },
    [chatId, token]
  );

  // ============ EXPORT SINGLE MESSAGE ============

  const handleExportMessage = useCallback((msg: Message) => {
    const text = `[${msg.role === "user" ? "You" : "AI Assistant"}] (${msg.created_at})\n\n${msg.content}`;
    const blob = new Blob([text], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `message-${msg.id.slice(0, 8)}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, []);

  // ============ SHARE CHAT ============

  const handleShareChat = useCallback(async () => {
    setShareLoading(true);
    setShareDialogOpen(true);
    try {
      const res = await fetch(`/api/chats/${chatId}/share`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Share failed");
      }
      const data = await res.json();
      setShareUrl(data.url || `/shared/${data.slug}`);
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : "Failed to share";
      setError(errMsg);
      setShareDialogOpen(false);
    } finally {
      setShareLoading(false);
    }
  }, [chatId, token]);

  const copyShareUrl = useCallback(() => {
    const fullUrl = `${window.location.origin}${shareUrl}`;
    navigator.clipboard.writeText(fullUrl).catch(() => {});
  }, [shareUrl]);

  // ============ VOICE INPUT ============

  const handleMicClick = useCallback(() => {
    if (speech.isListening) {
      speech.stopListening();
      // Fill input with transcript when stopping
      if (speech.transcript) {
        setInput((prev) => prev + (prev ? " " : "") + speech.transcript);
      }
    } else {
      speech.startListening();
    }
  }, [speech]);

  // When speech recognition ends, fill the textarea
  useEffect(() => {
    if (!speech.isListening && speech.transcript) {
      setInput((prev) => {
        // Avoid duplicating if already filled
        if (prev.includes(speech.transcript)) return prev;
        return prev + (prev ? " " : "") + speech.transcript;
      });
    }
  }, [speech.isListening, speech.transcript]);

  // ============ TTS SPEAK ============

  const handleSpeakMessage = useCallback(
    (text: string) => {
      if (tts.isSpeaking) {
        tts.stop();
      } else {
        tts.speak(text);
      }
    },
    [tts]
  );

  // ============ IMAGE GENERATION ============

  const handleImageGen = useCallback(() => {
    const prompt = "Generate an image: ";
    setInput((prev) => prev + prompt);
    textareaRef.current?.focus();
  }, []);

  // ============ KEYBOARD HANDLER ============

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

  // ============ DERIVED VALUES ============

  const lastAssistantIdx = [...messages].reverse().findIndex((m) => m.role === "assistant");
  const lastAssistantMessage =
    lastAssistantIdx >= 0
      ? messages[messages.length - 1 - lastAssistantIdx]
      : null;

  const modelLabel = MODEL_LABELS[model] || model;
  const modelColor = MODEL_COLORS[model] || MODEL_COLORS["gpt-4o-mini"];

  // ============ RENDER ============

  return (
    <div className="flex flex-col h-full bg-background">
      {/* ============ HEADER ============ */}
      <motion.header
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="sticky top-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60"
      >
        <div className="flex items-center justify-between px-4 h-14">
          {/* Left section */}
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

          {/* Right section - actions */}
          <div className="flex items-center gap-1">
            {/* Model badge */}
            <Badge
              variant="outline"
              className={`shrink-0 gap-1 text-[11px] ${modelColor}`}
            >
              {model === "gpt-4o" ? (
                <Brain className="w-3 h-3" />
              ) : (
                <Sparkles className="w-3 h-3" />
              )}
              {modelLabel}
            </Badge>

            {/* TTS Toggle */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={tts.toggleTTS}
                  className={`h-9 w-9 shrink-0 ${tts.isTTSEnabled ? "text-emerald-600" : ""}`}
                >
                  {tts.isTTSEnabled ? (
                    <Volume2 className="w-4 h-4" />
                  ) : (
                    <VolumeX className="w-4 h-4 text-muted-foreground" />
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom">
                {tts.isTTSEnabled ? "Disable TTS" : "Enable TTS"}
              </TooltipContent>
            </Tooltip>

            {/* Export dropdown */}
            <DropdownMenu>
              <Tooltip>
                <TooltipTrigger asChild>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-9 w-9 shrink-0"
                    >
                      <Download className="w-4 h-4 text-muted-foreground" />
                    </Button>
                  </DropdownMenuTrigger>
                </TooltipTrigger>
                <TooltipContent side="bottom">Export chat</TooltipContent>
              </Tooltip>
              <DropdownMenuContent align="end" sideOffset={4}>
                <DropdownMenuItem onClick={() => handleExportChat("md")}>
                  <FileText className="w-4 h-4 mr-2" />
                  Export as Markdown
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleExportChat("txt")}>
                  <MessageSquare className="w-4 h-4 mr-2" />
                  Export as TXT
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Share button */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleShareChat}
                  className="h-9 w-9 shrink-0"
                >
                  <Share2 className="w-4 h-4 text-muted-foreground" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom">Share chat</TooltipContent>
            </Tooltip>
          </div>
        </div>
      </motion.header>

      {/* ============ MESSAGES AREA ============ */}
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
                {model === "gpt-4o"
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
                onSpeak={handleSpeakMessage}
                isSpeaking={tts.isSpeaking && tts.isTTSEnabled}
                onExportMessage={handleExportMessage}
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

      {/* ============ INPUT AREA ============ */}
      <motion.footer
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.4, delay: 0.1 }}
        className="sticky bottom-0 border-t border-border/50 bg-background/80 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60 z-30"
      >
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-3">
          {/* Voice input transcript preview */}
          <AnimatePresence>
            {speech.isListening && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <div className="flex items-center gap-2 mb-2 px-1">
                  <motion.div
                    animate={{ scale: [1, 1.3, 1] }}
                    transition={{ duration: 1, repeat: Infinity }}
                    className="w-2.5 h-2.5 rounded-full bg-red-500"
                  />
                  <span className="text-xs text-red-500 font-medium">
                    Listening...
                  </span>
                  {speech.transcript && (
                    <span className="text-xs text-muted-foreground truncate">
                      {speech.transcript}
                    </span>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Attached file chip */}
          <AnimatePresence>
            {attachedFile && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden mb-2"
              >
                <div className="flex items-center gap-2 px-1">
                  <div className="flex items-center gap-2 bg-muted rounded-lg px-3 py-1.5 text-sm border border-border/50">
                    <FileText className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                    <span className="truncate max-w-[200px] text-muted-foreground">
                      {attachedFile.name}
                    </span>
                    <span className="text-xs text-muted-foreground/60">
                      ({(attachedFile.size / 1024).toFixed(1)}KB)
                    </span>
                    <button
                      onClick={removeAttachedFile}
                      className="p-0.5 rounded hover:bg-accent transition-colors cursor-pointer shrink-0"
                    >
                      <X className="w-3 h-3 text-muted-foreground" />
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Input controls row */}
          <div className="flex items-end gap-2">
            <div className="flex-1 relative">
              <Textarea
                ref={textareaRef}
                value={input}
                onChange={handleTextareaChange}
                onKeyDown={handleKeyDown}
                placeholder={
                  model === "gpt-4o"
                    ? "Ask a complex question for deep research..."
                    : "Type your message..."
                }
                className="resize-none rounded-xl bg-card border-border focus:border-emerald-500/50 focus:ring-emerald-500/20 min-h-[44px] max-h-[160px] py-3 px-4 pr-12 text-sm leading-relaxed"
                rows={1}
                disabled={isLoading}
              />
            </div>

            {/* Microphone button */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleMicClick}
                  disabled={!speech.isSupported || isUploadingFile}
                  className={`h-11 w-11 rounded-xl shrink-0 transition-all duration-200 ${
                    speech.isListening
                      ? "bg-red-500/15 text-red-500 hover:bg-red-500/25 hover:text-red-500"
                      : "bg-card border border-border text-muted-foreground hover:text-foreground hover:bg-accent"
                  }`}
                >
                  {speech.isListening ? (
                    <MicOff className="h-4 w-4" />
                  ) : (
                    <Mic className="h-4 w-4" />
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent side="top">
                {speech.isListening ? "Stop listening" : "Voice input"}
              </TooltipContent>
            </Tooltip>

            {/* File upload button */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isLoading || isUploadingFile}
                  className="h-11 w-11 rounded-xl bg-card border border-border text-muted-foreground hover:text-foreground hover:bg-accent shrink-0 transition-all duration-200"
                >
                  {isUploadingFile ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Paperclip className="h-4 w-4" />
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent side="top">Attach file</TooltipContent>
            </Tooltip>

            {/* Hidden file input */}
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.txt,.md,.csv,.json"
              className="hidden"
              onChange={handleFileSelect}
            />

            {/* Image generation button */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleImageGen}
                  disabled={isLoading}
                  className="h-11 w-11 rounded-xl bg-card border border-border text-muted-foreground hover:text-foreground hover:bg-accent shrink-0 transition-all duration-200"
                >
                  <ImageIcon className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="top">
                Image generation (DALL·E API key required)
              </TooltipContent>
            </Tooltip>

            {/* Send button */}
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
            {speech.isSupported && " · Mic for voice input"}
            {" · "}Supports .pdf, .txt, .md, .csv, .json
          </p>
        </div>
      </motion.footer>

      {/* ============ SHARE DIALOG ============ */}
      <Dialog open={shareDialogOpen} onOpenChange={setShareDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Share Chat</DialogTitle>
            <DialogDescription>
              Anyone with the link can view this conversation.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            {shareLoading ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="w-6 h-6 animate-spin text-emerald-500" />
              </div>
            ) : shareUrl ? (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <div className="flex-1 rounded-lg border border-border bg-muted/50 px-3 py-2.5 text-sm text-muted-foreground truncate">
                    {window.location.origin}{shareUrl}
                  </div>
                  <Button
                    onClick={copyShareUrl}
                    size="sm"
                    className="shrink-0 bg-emerald-600 hover:bg-emerald-700 text-white"
                  >
                    <Copy className="w-3.5 h-3.5 mr-1.5" />
                    Copy
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  This chat is now publicly accessible via the link above.
                </p>
              </div>
            ) : null}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShareDialogOpen(false)}
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default ChatView;
