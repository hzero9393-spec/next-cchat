"use client";

import React, {
  useState,
  useEffect,
  useCallback,
  useMemo,
} from "react";
import {
  Plus,
  Search,
  Trash2,
  Brain,
  Sparkles,
  MessageSquare,
  Send,
  User,
  LogOut,
  Settings,
  Menu,
  ChevronRight,
  Flame,
  BarChart3,
  X,
  Loader2,
  Code,
  BookOpen,
  Lightbulb,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { motion, AnimatePresence } from "framer-motion";
import { ChatView } from "@/components/chat-view";

// ============ TYPES ============

interface ChatItem {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
  last_message?: string;
}

interface DashboardViewProps {
  user: {
    id: string;
    email: string;
    full_name: string;
    avatar_url: string;
    theme_preference: string;
  };
  token: string;
  onLogout: () => void;
  onProfile: () => void;
}

// ============ HELPERS ============

function getRelativeDate(dateStr: string): string {
  try {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString([], { month: "short", day: "numeric" });
  } catch {
    return "";
  }
}

function truncate(str: string, len: number): string {
  if (!str) return "";
  return str.length > len ? str.slice(0, len) + "..." : str;
}

// ============ SIDEBAR CHAT LIST ============

function ChatListItem({
  chat,
  isActive,
  onSelect,
  onDelete,
}: {
  chat: ChatItem;
  isActive: boolean;
  onSelect: () => void;
  onDelete: () => void;
}) {
  return (
    <motion.button
      whileHover={{ x: 2 }}
      onClick={onSelect}
      className={`group w-full text-left p-3 rounded-xl transition-all duration-200 cursor-pointer ${
        isActive
          ? "bg-emerald-500/10 border border-emerald-500/20 shadow-sm"
          : "hover:bg-accent border border-transparent"
      }`}
    >
      <div className="flex items-start gap-3">
        <div
          className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
            isActive
              ? "bg-emerald-500/20 text-emerald-600 dark:text-emerald-400"
              : "bg-muted text-muted-foreground"
          }`}
        >
          <MessageSquare className="w-4 h-4" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <h3
              className={`text-sm font-medium truncate ${
                isActive ? "text-emerald-700 dark:text-emerald-300" : ""
              }`}
            >
              {truncate(chat.title || "Untitled Chat", 28)}
            </h3>
            <div className="flex items-center gap-1 shrink-0">
              <span className="text-[10px] text-muted-foreground">
                {getRelativeDate(chat.updated_at || chat.created_at)}
              </span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete();
                }}
                className="p-1 rounded-md hover:bg-red-500/10 text-muted-foreground hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all duration-200 cursor-pointer"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
          </div>
          {chat.last_message && (
            <p className="text-xs text-muted-foreground mt-0.5 truncate">
              {truncate(chat.last_message, 40)}
            </p>
          )}
        </div>
      </div>
    </motion.button>
  );
}

// ============ WELCOME SCREEN ============

function WelcomeScreen({
  userName,
  chatCount,
  onCreateChat,
}: {
  userName: string;
  chatCount: number;
  onCreateChat: () => void;
}) {
  const firstName = userName?.split(" ")[0] || "User";

  const suggestions = [
    {
      icon: <Code className="w-5 h-5" />,
      title: "Write Code",
      desc: "Help me build a REST API with Node.js",
      color: "from-emerald-500 to-teal-500",
    },
    {
      icon: <BookOpen className="w-5 h-5" />,
      title: "Learn Something",
      desc: "Explain quantum computing in simple terms",
      color: "from-amber-500 to-orange-500",
    },
    {
      icon: <Lightbulb className="w-5 h-5" />,
      title: "Brainstorm Ideas",
      desc: "Generate creative startup ideas for 2025",
      color: "from-violet-500 to-purple-500",
    },
    {
      icon: <Zap className="w-5 h-5" />,
      title: "Quick Task",
      desc: "Summarize a long article or document",
      color: "from-rose-500 to-pink-500",
    },
  ];

  const stats = [
    { label: "Total Chats", value: chatCount, icon: <MessageSquare className="w-4 h-4" /> },
    { label: "Messages Today", value: 0, icon: <Send className="w-4 h-4" /> },
    { label: "Streak", value: "1 day", icon: <Flame className="w-4 h-4 text-amber-500" /> },
  ];

  return (
    <div className="flex-1 flex flex-col items-center justify-center px-4 py-8 overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center max-w-lg w-full"
      >
        <div className="mx-auto w-16 h-16 mb-4 rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center shadow-lg shadow-emerald-500/25">
          <Sparkles className="w-8 h-8 text-white" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold mb-1">
          Welcome back, <span className="bg-gradient-to-r from-emerald-600 to-teal-600 dark:from-emerald-400 dark:to-teal-400 bg-clip-text text-transparent">{firstName}</span>
        </h1>
        <p className="text-muted-foreground text-sm sm:text-base mb-6">
          What would you like to explore today?
        </p>
      </motion.div>

      {/* Stats Row */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="grid grid-cols-3 gap-3 w-full max-w-md mb-8"
      >
        {stats.map((stat, i) => (
          <div
            key={i}
            className="bg-card border border-border rounded-xl p-3 text-center"
          >
            <div className="flex items-center justify-center gap-1.5 mb-1 text-muted-foreground">
              {stat.icon}
            </div>
            <p className="text-lg font-bold">{stat.value}</p>
            <p className="text-[10px] text-muted-foreground">{stat.label}</p>
          </div>
        ))}
      </motion.div>

      {/* Quick Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-lg"
      >
        {suggestions.map((s, i) => (
          <motion.button
            key={i}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 + i * 0.1 }}
            onClick={onCreateChat}
            className="flex items-start gap-3 p-4 rounded-xl border border-border bg-card hover:bg-accent hover:border-emerald-500/30 transition-all duration-200 text-left group cursor-pointer"
          >
            <div
              className={`p-2 rounded-lg bg-gradient-to-br ${s.color} text-white shrink-0 group-hover:scale-110 transition-transform duration-200`}
            >
              {s.icon}
            </div>
            <div className="min-w-0">
              <p className="font-medium text-sm">{s.title}</p>
              <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-2">
                {s.desc}
              </p>
            </div>
          </motion.button>
        ))}
      </motion.div>
    </div>
  );
}

// ============ MOBILE SIDEBAR ============

function MobileSidebar({
  open,
  onClose,
  children,
}: {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetContent side="left" className="w-72 p-0">
        <SheetHeader className="sr-only">
          <SheetTitle>Navigation</SheetTitle>
          <SheetDescription>Chat navigation sidebar</SheetDescription>
        </SheetHeader>
        <div className="h-full flex flex-col">{children}</div>
      </SheetContent>
    </Sheet>
  );
}

// ============ MAIN DASHBOARD VIEW ============

export function DashboardView({
  user,
  token,
  onLogout,
  onProfile,
}: DashboardViewProps) {
  const [chats, setChats] = useState<ChatItem[]>([]);
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [deepResearch, setDeepResearch] = useState(false);
  const [showSidebar, setShowSidebar] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);

  // Fetch chats
  const fetchChats = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/chats", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to fetch chats");
      const data = await res.json();
      setChats(Array.isArray(data) ? data : data.chats || []);
    } catch {
      // silently fail
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchChats();
  }, [fetchChats]);

  // Create chat
  const handleCreateChat = useCallback(async () => {
    setIsCreating(true);
    try {
      const res = await fetch("/api/chats", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ title: "New Chat" }),
      });
      if (!res.ok) throw new Error("Failed to create chat");
      const data = await res.json();
      const newChat = data.chat || data;
      setSelectedChatId(newChat.id);
      await fetchChats();
    } catch {
      // silently fail
    } finally {
      setIsCreating(false);
    }
  }, [token, fetchChats]);

  // Delete chat
  const handleDeleteChat = useCallback(
    async (chatId: string) => {
      try {
        await fetch(`/api/chats/${chatId}`, {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        });
        setChats((prev) => prev.filter((c) => c.id !== chatId));
        if (selectedChatId === chatId) {
          setSelectedChatId(null);
        }
      } catch {
        // silently fail
      }
    },
    [token, selectedChatId]
  );

  // Filtered chats
  const filteredChats = useMemo(() => {
    if (!searchQuery.trim()) return chats;
    const q = searchQuery.toLowerCase();
    return chats.filter(
      (c) =>
        (c.title || "").toLowerCase().includes(q) ||
        (c.last_message || "").toLowerCase().includes(q)
    );
  }, [chats, searchQuery]);

  // Sidebar content (shared between desktop and mobile)
  const sidebarContent = (
    <>
      {/* Logo + Name */}
      <div className="p-4 border-b border-border/50">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center shadow-sm">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <h2 className="text-base font-bold tracking-tight">NextChat</h2>
        </div>
      </div>

      {/* New Chat Button */}
      <div className="p-3">
        <Button
          onClick={handleCreateChat}
          disabled={isCreating}
          className="w-full h-11 rounded-xl bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-600 dark:hover:bg-emerald-700 text-white font-medium shadow-lg shadow-emerald-500/20 transition-all duration-200 gap-2"
        >
          {isCreating ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Plus className="w-4 h-4" />
          )}
          New Chat
        </Button>
      </div>

      {/* Search */}
      <div className="px-3 pb-2">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search chats..."
            className="pl-9 h-9 rounded-lg text-sm bg-muted/50 border-transparent focus:border-emerald-500/30 focus:bg-background"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 rounded hover:bg-accent cursor-pointer"
            >
              <X className="w-3 h-3 text-muted-foreground" />
            </button>
          )}
        </div>
      </div>

      {/* Chat List */}
      <ScrollArea className="flex-1 px-2">
        <div className="space-y-1 py-1">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-5 h-5 animate-spin text-emerald-500" />
            </div>
          ) : filteredChats.length === 0 ? (
            <div className="text-center py-8 px-4">
              <MessageSquare className="w-8 h-8 mx-auto text-muted-foreground/30 mb-2" />
              <p className="text-xs text-muted-foreground">
                {searchQuery ? "No chats found" : "No chats yet"}
              </p>
            </div>
          ) : (
            filteredChats.map((chat) => (
              <ChatListItem
                key={chat.id}
                chat={chat}
                isActive={selectedChatId === chat.id}
                onSelect={() => {
                  setSelectedChatId(chat.id);
                  setShowSidebar(false);
                }}
                onDelete={() => handleDeleteChat(chat.id)}
              />
            ))
          )}
        </div>
      </ScrollArea>

      {/* Deep Research Toggle */}
      <div className="px-3 py-2 border-t border-border/50">
        <div className="flex items-center justify-between p-2 rounded-lg bg-muted/30">
          <div className="flex items-center gap-2">
            <Brain className="w-4 h-4 text-violet-500" />
            <span className="text-xs font-medium">Deep Research</span>
          </div>
          <Switch
            checked={deepResearch}
            onCheckedChange={setDeepResearch}
            className="data-[state=checked]:bg-violet-600"
          />
        </div>
      </div>

      {/* Bottom Actions */}
      <div className="p-3 border-t border-border/50 space-y-1">
        <button
          onClick={() => {
            onProfile();
            setShowSidebar(false);
          }}
          className="flex items-center gap-3 w-full p-2.5 rounded-lg hover:bg-accent transition-colors text-left cursor-pointer"
        >
          <Avatar className="h-7 w-7">
            <AvatarImage src={user.avatar_url} alt={user.full_name} />
            <AvatarFallback className="bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 text-xs">
              {(user.full_name || "U").charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{user.full_name || "User"}</p>
            <p className="text-[10px] text-muted-foreground truncate">{user.email}</p>
          </div>
        </button>

        <div className="flex gap-1">
          <button
            onClick={() => {
              onProfile();
              setShowSidebar(false);
            }}
            className="flex-1 flex items-center justify-center gap-1.5 p-2 rounded-lg hover:bg-accent transition-colors text-xs text-muted-foreground hover:text-foreground cursor-pointer"
          >
            <Settings className="w-3.5 h-3.5" />
            Profile
          </button>
          <button
            onClick={onLogout}
            className="flex-1 flex items-center justify-center gap-1.5 p-2 rounded-lg hover:bg-red-500/10 transition-colors text-xs text-muted-foreground hover:text-red-500 cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            Logout
          </button>
        </div>
      </div>
    </>
  );

  return (
    <div className="h-screen flex bg-background overflow-hidden">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-64 flex-col border-r border-border/50 bg-card/50 shrink-0">
        {sidebarContent}
      </aside>

      {/* Mobile Sidebar */}
      <MobileSidebar
        open={showSidebar}
        onClose={() => setShowSidebar(false)}
      >
        {sidebarContent}
      </MobileSidebar>

      {/* Main Area */}
      <main className="flex-1 flex flex-col min-w-0">
        <AnimatePresence mode="wait">
          {selectedChatId ? (
            <motion.div
              key={selectedChatId}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.25 }}
              className="flex-1 flex flex-col"
            >
              {/* Mobile Header */}
              <div className="md:hidden flex items-center gap-2 p-2 border-b border-border/50">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowSidebar(true)}
                  className="h-9 w-9 shrink-0"
                >
                  <Menu className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedChatId(null)}
                  className="h-8 gap-1 text-xs text-muted-foreground"
                >
                  <ChevronRight className="w-3.5 h-3.5 rotate-180" />
                  Dashboard
                </Button>
              </div>
              <ChatView
                chatId={selectedChatId}
                token={token}
                deepResearch={deepResearch}
                onBack={() => {
                  setSelectedChatId(null);
                  fetchChats();
                }}
              />
            </motion.div>
          ) : (
            <motion.div
              key="welcome"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="flex-1 flex flex-col"
            >
              {/* Mobile Header */}
              <div className="md:hidden flex items-center gap-2 p-2 border-b border-border/50">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowSidebar(true)}
                  className="h-9 w-9 shrink-0"
                >
                  <Menu className="w-4 h-4" />
                </Button>
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-md bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center">
                    <Sparkles className="w-3 h-3 text-white" />
                  </div>
                  <span className="text-sm font-semibold">NextChat</span>
                </div>
              </div>
              <WelcomeScreen
                userName={user.full_name}
                chatCount={chats.length}
                onCreateChat={handleCreateChat}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}

export default DashboardView;
