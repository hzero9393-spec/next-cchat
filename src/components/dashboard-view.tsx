"use client";

import React, {
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
} from "react";
import {
  Plus,
  Search,
  Trash2,
  Sparkles,
  MessageSquare,
  Send,
  User,
  LogOut,
  Settings,
  Menu,
  ChevronRight,
  Flame,
  X,
  Loader2,
  Code,
  BookOpen,
  Lightbulb,
  Zap,
  Sun,
  Moon,
  Brain,
  Pin,
  PinOff,
  Pencil,
  FolderPlus,
  Folder,
  FolderOpen,
  ChevronDown,
  FileDown,
  FileText,
  FileCode,
  Share2,
  Link2,
  Check,
  LayoutTemplate,
  MoreHorizontal,
  PenTool,
  Briefcase,
  Globe,
  ChefHat,
  Bookmark,
  Copy,
  Info,
  AlertTriangle,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { motion, AnimatePresence } from "framer-motion";
import { ChatView } from "@/components/chat-view";

// ============ TYPES ============

interface ChatItem {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
  last_message?: string;
  is_pinned?: number;
  folder_id?: string | null;
}

interface FolderItem {
  id: string;
  name: string;
  color: string;
  icon: string;
  sort_order: number;
  chat_count: number;
  created_at: string;
}

interface TemplateItem {
  id: string;
  title: string;
  description: string;
  icon: string;
  prompt: string;
  category?: string;
  is_system: boolean;
}

interface Announcement {
  id: string;
  title: string;
  content: string;
  created_at: string;
  type?: string;
}

interface SearchResultChat {
  id: string;
  title: string;
  updated_at: string;
  type: string;
}

interface SearchResultMessage {
  chat_id: string;
  content: string;
  created_at: string;
  title: string;
  type: string;
}

interface ModelOption {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
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

// ============ CONSTANTS ============

const MODELS: ModelOption[] = [
  {
    id: "llama-4-scout-17b-16e-instruct",
    name: "Llama 4 Scout",
    description: "Deep Research",
    icon: <Brain className="w-3.5 h-3.5" />,
  },
  {
    id: "llama3.1-8b",
    name: "Llama 3.1 8B",
    description: "Fast",
    icon: <Zap className="w-3.5 h-3.5" />,
  },
  {
    id: "llama3.1-70b",
    name: "Llama 3.1 70B",
    description: "Advanced",
    icon: <Sparkles className="w-3.5 h-3.5" />,
  },
];

const FOLDER_COLORS = [
  "#10b981",
  "#f59e0b",
  "#ef4444",
  "#8b5cf6",
  "#06b6d4",
  "#ec4899",
  "#f97316",
  "#6366f1",
];

const TEMPLATE_ICONS: Record<string, React.ReactNode> = {
  "pen-tool": <PenTool className="w-5 h-5" />,
  code: <Code className="w-5 h-5" />,
  "book-open": <BookOpen className="w-5 h-5" />,
  briefcase: <Briefcase className="w-5 h-5" />,
  globe: <Globe className="w-5 h-5" />,
  "chef-hat": <ChefHat className="w-5 h-5" />,
  bookmark: <Bookmark className="w-5 h-5" />,
};

const ANNOUNCEMENT_STYLES: Record<string, { bg: string; border: string; text: string; icon: React.ReactNode }> = {
  info: {
    bg: "bg-sky-500/10 dark:bg-sky-500/5",
    border: "border-sky-500/20",
    text: "text-sky-700 dark:text-sky-300",
    icon: <Info className="w-4 h-4 text-sky-500" />,
  },
  success: {
    bg: "bg-emerald-500/10 dark:bg-emerald-500/5",
    border: "border-emerald-500/20",
    text: "text-emerald-700 dark:text-emerald-300",
    icon: <CheckCircle2 className="w-4 h-4 text-emerald-500" />,
  },
  warning: {
    bg: "bg-amber-500/10 dark:bg-amber-500/5",
    border: "border-amber-500/20",
    text: "text-amber-700 dark:text-amber-300",
    icon: <AlertTriangle className="w-4 h-4 text-amber-500" />,
  },
  error: {
    bg: "bg-red-500/10 dark:bg-red-500/5",
    border: "border-red-500/20",
    text: "text-red-700 dark:text-red-300",
    icon: <AlertCircle className="w-4 h-4 text-red-500" />,
  },
};

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

function getTemplateIcon(iconName: string): React.ReactNode {
  return TEMPLATE_ICONS[iconName] || <Bookmark className="w-5 h-5" />;
}

function getAnnouncementStyle(type?: string) {
  return ANNOUNCEMENT_STYLES[type || "info"] || ANNOUNCEMENT_STYLES.info;
}

// ============ CHAT LIST ITEM ============

function ChatListItem({
  chat,
  isActive,
  onSelect,
  onDelete,
  onPin,
  onRename,
  onExport,
  onShare,
  onMoveToFolder,
  folders,
}: {
  chat: ChatItem;
  isActive: boolean;
  onSelect: () => void;
  onDelete: () => void;
  onPin: () => void;
  onRename: (newTitle: string) => void;
  onExport: (format: string) => void;
  onShare: () => void;
  onMoveToFolder: (folderId: string | null) => void;
  folders: FolderItem[];
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(chat.title || "Untitled Chat");
  const editRef = useRef<HTMLInputElement>(null);
  const isPinned = Boolean(chat.is_pinned);

  useEffect(() => {
    if (isEditing && editRef.current) {
      editRef.current.focus();
      editRef.current.select();
    }
  }, [isEditing]);

  const handleRenameSubmit = () => {
    const trimmed = editValue.trim();
    if (trimmed && trimmed !== chat.title) {
      onRename(trimmed);
    }
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") handleRenameSubmit();
    if (e.key === "Escape") {
      setEditValue(chat.title || "Untitled Chat");
      setIsEditing(false);
    }
  };

  const handleDoubleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setEditValue(chat.title || "Untitled Chat");
    setIsEditing(true);
  };

  return (
    <ContextMenu>
      <ContextMenuTrigger>
        <motion.button
          whileHover={{ x: 2 }}
          onClick={onSelect}
          onDoubleClick={handleDoubleClick}
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
                <div className="flex items-center gap-1.5 min-w-0">
                  {isPinned && (
                    <Pin className="w-3 h-3 text-emerald-500 shrink-0" />
                  )}
                  {isEditing ? (
                    <input
                      ref={editRef}
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      onBlur={handleRenameSubmit}
                      onKeyDown={handleKeyDown}
                      onClick={(e) => e.stopPropagation()}
                      className="text-sm font-medium bg-transparent border-b border-emerald-500/50 outline-none w-full min-w-0"
                    />
                  ) : (
                    <h3
                      className={`text-sm font-medium truncate ${
                        isActive
                          ? "text-emerald-700 dark:text-emerald-300"
                          : ""
                      }`}
                    >
                      {truncate(chat.title || "Untitled Chat", 28)}
                    </h3>
                  )}
                </div>
                <div className="flex items-center gap-0.5 shrink-0">
                  <span className="text-[10px] text-muted-foreground">
                    {getRelativeDate(chat.updated_at || chat.created_at)}
                  </span>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button
                        onClick={(e) => e.stopPropagation()}
                        className="p-1 rounded-md hover:bg-accent text-muted-foreground opacity-0 group-hover:opacity-100 transition-all duration-200 cursor-pointer"
                      >
                        <MoreHorizontal className="w-3.5 h-3.5" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                      <DropdownMenuItem
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditValue(chat.title || "Untitled Chat");
                          setIsEditing(true);
                        }}
                      >
                        <Pencil className="w-3.5 h-3.5 mr-2" />
                        Rename
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={(e) => {
                          e.stopPropagation();
                          onPin();
                        }}
                      >
                        {isPinned ? (
                          <PinOff className="w-3.5 h-3.5 mr-2" />
                        ) : (
                          <Pin className="w-3.5 h-3.5 mr-2" />
                        )}
                        {isPinned ? "Unpin" : "Pin"}
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuSub>
                        <DropdownMenuSubTrigger>
                          <Folder className="w-3.5 h-3.5 mr-2" />
                          Move to
                        </DropdownMenuSubTrigger>
                        <DropdownMenuSubContent>
                          <DropdownMenuItem
                            onClick={(e) => {
                              e.stopPropagation();
                              onMoveToFolder(null);
                            }}
                          >
                            <X className="w-3.5 h-3.5 mr-2" />
                            No Folder
                          </DropdownMenuItem>
                          {folders.map((f) => (
                            <DropdownMenuItem
                              key={f.id}
                              onClick={(e) => {
                                e.stopPropagation();
                                onMoveToFolder(f.id);
                              }}
                            >
                              <Folder
                                className="w-3.5 h-3.5 mr-2"
                                style={{ color: f.color }}
                              />
                              {f.name}
                            </DropdownMenuItem>
                          ))}
                        </DropdownMenuSubContent>
                      </DropdownMenuSub>
                      <DropdownMenuSeparator />
                      <DropdownMenuSub>
                        <DropdownMenuSubTrigger>
                          <FileDown className="w-3.5 h-3.5 mr-2" />
                          Export
                        </DropdownMenuSubTrigger>
                        <DropdownMenuSubContent>
                          <DropdownMenuItem
                            onClick={(e) => {
                              e.stopPropagation();
                              onExport("markdown");
                            }}
                          >
                            <FileCode className="w-3.5 h-3.5 mr-2" />
                            Markdown (.md)
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={(e) => {
                              e.stopPropagation();
                              onExport("txt");
                            }}
                          >
                            <FileText className="w-3.5 h-3.5 mr-2" />
                            Plain Text (.txt)
                          </DropdownMenuItem>
                        </DropdownMenuSubContent>
                      </DropdownMenuSub>
                      <DropdownMenuItem
                        onClick={(e) => {
                          e.stopPropagation();
                          onShare();
                        }}
                      >
                        <Share2 className="w-3.5 h-3.5 mr-2" />
                        Share
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={(e) => {
                          e.stopPropagation();
                          onDelete();
                        }}
                        className="text-red-500 focus:text-red-500"
                      >
                        <Trash2 className="w-3.5 h-3.5 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
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
      </ContextMenuTrigger>
      <ContextMenuContent className="w-48">
        <ContextMenuItem
          onSelect={() => {
            setEditValue(chat.title || "Untitled Chat");
            setIsEditing(true);
          }}
        >
          <Pencil className="w-3.5 h-3.5 mr-2" />
          Rename
        </ContextMenuItem>
        <ContextMenuItem onSelect={onPin}>
          {isPinned ? (
            <PinOff className="w-3.5 h-3.5 mr-2" />
          ) : (
            <Pin className="w-3.5 h-3.5 mr-2" />
          )}
          {isPinned ? "Unpin" : "Pin"}
        </ContextMenuItem>
        <ContextMenuSeparator />
        <ContextMenuItem onSelect={() => onMoveToFolder(null)}>
          <X className="w-3.5 h-3.5 mr-2" />
          Remove from folder
        </ContextMenuItem>
        {folders.map((f) => (
          <ContextMenuItem
            key={f.id}
            onSelect={() => onMoveToFolder(f.id)}
          >
            <Folder className="w-3.5 h-3.5 mr-2" style={{ color: f.color }} />
            {f.name}
          </ContextMenuItem>
        ))}
        <ContextMenuSeparator />
        <ContextMenuItem onSelect={() => onExport("markdown")}>
          <FileCode className="w-3.5 h-3.5 mr-2" />
          Export as Markdown
        </ContextMenuItem>
        <ContextMenuItem onSelect={() => onExport("txt")}>
          <FileText className="w-3.5 h-3.5 mr-2" />
          Export as TXT
        </ContextMenuItem>
        <ContextMenuItem onSelect={onShare}>
          <Share2 className="w-3.5 h-3.5 mr-2" />
          Share
        </ContextMenuItem>
        <ContextMenuSeparator />
        <ContextMenuItem onSelect={onDelete} className="text-red-500 focus:text-red-500">
          <Trash2 className="w-3.5 h-3.5 mr-2" />
          Delete
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
}

// ============ FOLDER LIST ITEM ============

function FolderListItem({
  folder,
  isActive,
  onSelect,
  onEdit,
  onDelete,
}: {
  folder: FolderItem;
  isActive: boolean;
  onSelect: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <ContextMenu>
      <ContextMenuTrigger>
        <motion.button
          whileHover={{ x: 2 }}
          onClick={onSelect}
          className={`group w-full text-left p-2.5 rounded-lg transition-all duration-200 cursor-pointer ${
            isActive
              ? "bg-accent border border-border"
              : "hover:bg-accent/50 border border-transparent"
          }`}
        >
          <div className="flex items-center gap-2.5">
            <Folder
              className="w-4 h-4 shrink-0"
              style={{ color: folder.color || "#10b981" }}
            />
            <span className="text-sm font-medium flex-1 truncate">
              {folder.name}
            </span>
            <Badge
              variant="secondary"
              className="text-[10px] h-4 px-1.5 opacity-0 group-hover:opacity-100 transition-opacity"
            >
              {folder.chat_count || 0}
            </Badge>
          </div>
        </motion.button>
      </ContextMenuTrigger>
      <ContextMenuContent>
        <ContextMenuItem onSelect={onEdit}>
          <Pencil className="w-3.5 h-3.5 mr-2" />
          Rename
        </ContextMenuItem>
        <ContextMenuItem onSelect={onDelete} className="text-red-500 focus:text-red-500">
          <Trash2 className="w-3.5 h-3.5 mr-2" />
          Delete Folder
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
}

// ============ TEMPLATES PANEL ============

function TemplatesPanel({
  open,
  onClose,
  templates,
  isLoading,
  onUseTemplate,
}: {
  open: boolean;
  onClose: () => void;
  templates: TemplateItem[];
  isLoading: boolean;
  onUseTemplate: (template: TemplateItem) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-hidden flex flex-col p-0">
        <DialogHeader className="p-6 pb-4">
          <DialogTitle className="flex items-center gap-2">
            <LayoutTemplate className="w-5 h-5 text-emerald-500" />
            Chat Templates
          </DialogTitle>
          <DialogDescription>
            Start a new chat from a pre-built template
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="flex-1 px-6 pb-2">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-emerald-500" />
            </div>
          ) : templates.length === 0 ? (
            <div className="text-center py-12">
              <LayoutTemplate className="w-10 h-10 mx-auto text-muted-foreground/30 mb-3" />
              <p className="text-sm text-muted-foreground">
                No templates available
              </p>
            </div>
          ) : (
            <div className="grid gap-3 pb-4">
              {templates.map((tpl, i) => (
                <motion.div
                  key={tpl.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04 }}
                  className="flex items-start gap-3 p-3.5 rounded-xl border border-border bg-card hover:bg-accent hover:border-emerald-500/20 transition-all duration-200 group"
                >
                  <div className="w-10 h-10 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 group-hover:bg-emerald-500/20 transition-colors">
                    {getTemplateIcon(tpl.icon)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-semibold">{tpl.title}</h4>
                      {tpl.is_system && (
                        <Badge
                          variant="secondary"
                          className="text-[9px] h-4 px-1.5"
                        >
                          System
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                      {tpl.description}
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => onUseTemplate(tpl)}
                    className="shrink-0 h-8 text-xs text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 hover:bg-emerald-500/10"
                  >
                    Use
                  </Button>
                </motion.div>
              ))}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}

// ============ NEW FOLDER DIALOG ============

function NewFolderDialog({
  open,
  onClose,
  onSave,
}: {
  open: boolean;
  onClose: () => void;
  onSave: (name: string, color: string) => void;
}) {
  const [name, setName] = useState("");
  const [color, setColor] = useState("#10b981");

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FolderPlus className="w-5 h-5 text-emerald-500" />
            New Folder
          </DialogTitle>
          <DialogDescription>
            Create a folder to organize your chats
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
              Folder Name
            </label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Work Projects"
              className="h-9"
              onKeyDown={(e) => {
                if (e.key === "Enter" && name.trim()) {
                  onSave(name.trim(), color);
                  setName("");
                  onClose();
                }
              }}
              autoFocus
            />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
              Color
            </label>
            <div className="flex gap-2 flex-wrap">
              {FOLDER_COLORS.map((c) => (
                <button
                  key={c}
                  onClick={() => setColor(c)}
                  className={`w-7 h-7 rounded-full transition-all duration-200 cursor-pointer ${
                    color === c
                      ? "ring-2 ring-offset-2 ring-offset-background ring-foreground scale-110"
                      : "hover:scale-110"
                  }`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
          >
            Cancel
          </Button>
          <Button
            size="sm"
            onClick={() => {
              onSave(name.trim(), color);
              setName("");
              onClose();
            }}
            disabled={!name.trim()}
            className="bg-emerald-600 hover:bg-emerald-700 text-white"
          >
            Create
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ============ EDIT FOLDER DIALOG ============

function EditFolderDialog({
  open,
  onClose,
  folder,
  onSave,
}: {
  open: boolean;
  onClose: () => void;
  folder: FolderItem | null;
  onSave: (id: string, name: string, color: string) => void;
}) {
  const [name, setName] = useState(folder?.name || "");
  const [color, setColor] = useState(folder?.color || "#10b981");

  if (!folder) return null;

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Pencil className="w-5 h-5 text-emerald-500" />
            Edit Folder
          </DialogTitle>
          <DialogDescription>Update folder name and color</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
              Folder Name
            </label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Work Projects"
              className="h-9"
              autoFocus
            />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
              Color
            </label>
            <div className="flex gap-2 flex-wrap">
              {FOLDER_COLORS.map((c) => (
                <button
                  key={c}
                  onClick={() => setColor(c)}
                  className={`w-7 h-7 rounded-full transition-all duration-200 cursor-pointer ${
                    color === c
                      ? "ring-2 ring-offset-2 ring-offset-background ring-foreground scale-110"
                      : "hover:scale-110"
                  }`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button
            size="sm"
            onClick={() => {
              onSave(folder.id, name.trim(), color);
              onClose();
            }}
            disabled={!name.trim()}
            className="bg-emerald-600 hover:bg-emerald-700 text-white"
          >
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ============ SHARE DIALOG ============

function ShareDialog({
  open,
  onClose,
  shareUrl,
  isLoading,
}: {
  open: boolean;
  onClose: () => void;
  shareUrl: string;
  isLoading: boolean;
}) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Share2 className="w-5 h-5 text-emerald-500" />
            Share Chat
          </DialogTitle>
          <DialogDescription>
            Anyone with this link can view the chat
          </DialogDescription>
        </DialogHeader>
        <div className="py-2">
          {isLoading ? (
            <div className="flex items-center justify-center py-6">
              <Loader2 className="w-5 h-5 animate-spin text-emerald-500" />
            </div>
          ) : shareUrl ? (
            <div className="flex items-center gap-2">
              <div className="flex-1 flex items-center gap-2 p-2.5 rounded-lg bg-muted border border-border">
                <Link2 className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                <span className="text-sm truncate">{shareUrl}</span>
              </div>
              <Button
                size="sm"
                onClick={handleCopy}
                variant="outline"
                className="shrink-0 h-9"
              >
                {copied ? (
                  <Check className="w-3.5 h-3.5 mr-1.5 text-emerald-500" />
                ) : (
                  <Copy className="w-3.5 h-3.5 mr-1.5" />
                )}
                {copied ? "Copied" : "Copy"}
              </Button>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-4">
              Could not generate share link
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ============ SEARCH RESULTS DROPDOWN ============

function SearchResultsPanel({
  query,
  chatResults,
  messageResults,
  isLoading,
  onSelectChat,
  onSelectMessage,
  onClose,
}: {
  query: string;
  chatResults: SearchResultChat[];
  messageResults: SearchResultMessage[];
  isLoading: boolean;
  onSelectChat: (id: string) => void;
  onSelectMessage: (chatId: string) => void;
  onClose: () => void;
}) {
  if (!query.trim()) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -4 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -4 }}
      className="absolute top-full left-0 right-0 mt-1 z-50 bg-popover border border-border rounded-xl shadow-xl overflow-hidden max-h-80"
    >
      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-4 h-4 animate-spin text-emerald-500" />
          <span className="text-xs text-muted-foreground ml-2">
            Searching...
          </span>
        </div>
      ) : chatResults.length === 0 && messageResults.length === 0 ? (
        <div className="text-center py-8 px-4">
          <Search className="w-6 h-6 mx-auto text-muted-foreground/30 mb-2" />
          <p className="text-xs text-muted-foreground">
            No results for &quot;{query}&quot;
          </p>
        </div>
      ) : (
        <ScrollArea className="max-h-80">
          <div className="p-2">
            {chatResults.length > 0 && (
              <div className="mb-1">
                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider px-2 py-1">
                  Chats
                </p>
                {chatResults.map((r) => (
                  <button
                    key={r.id}
                    onClick={() => {
                      onSelectChat(r.id);
                      onClose();
                    }}
                    className="w-full text-left p-2 rounded-lg hover:bg-accent transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-2">
                      <MessageSquare className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium truncate">
                          {r.title || "Untitled"}
                        </p>
                        <p className="text-[10px] text-muted-foreground">
                          {getRelativeDate(r.updated_at)}
                        </p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
            {messageResults.length > 0 && (
              <div>
                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider px-2 py-1">
                  Messages
                </p>
                {messageResults.map((r, i) => (
                  <button
                    key={`${r.chat_id}-${i}`}
                    onClick={() => {
                      onSelectMessage(r.chat_id);
                      onClose();
                    }}
                    className="w-full text-left p-2 rounded-lg hover:bg-accent transition-colors cursor-pointer"
                  >
                    <div className="flex items-start gap-2">
                      <MessageSquare className="w-3.5 h-3.5 text-muted-foreground shrink-0 mt-0.5" />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium truncate">
                          {truncate(r.content, 50)}
                        </p>
                        <p className="text-[10px] text-muted-foreground">
                          in {truncate(r.title || "Chat", 20)} &middot;{" "}
                          {getRelativeDate(r.created_at)}
                        </p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </ScrollArea>
      )}
    </motion.div>
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
    {
      label: "Total Chats",
      value: chatCount,
      icon: <MessageSquare className="w-4 h-4" />,
    },
    {
      label: "Messages Today",
      value: 0,
      icon: <Send className="w-4 h-4" />,
    },
    {
      label: "Streak",
      value: "1 day",
      icon: <Flame className="w-4 h-4 text-amber-500" />,
    },
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
          Welcome back,{" "}
          <span className="bg-gradient-to-r from-emerald-600 to-teal-600 dark:from-emerald-400 dark:to-teal-400 bg-clip-text text-transparent">
            {firstName}
          </span>
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

// ============ ANNOUNCEMENTS BANNER ============

function AnnouncementsBanner({
  announcements,
  onDismiss,
}: {
  announcements: Announcement[];
  onDismiss: (id: string) => void;
}) {
  if (announcements.length === 0) return null;

  return (
    <AnimatePresence>
      {announcements.map((ann) => {
        const style = getAnnouncementStyle(ann.type);
        return (
          <motion.div
            key={ann.id}
            initial={{ opacity: 0, y: -8, height: 0 }}
            animate={{ opacity: 1, y: 0, height: "auto" }}
            exit={{ opacity: 0, y: -8, height: 0 }}
            className={`flex items-start gap-3 px-4 py-3 border-b ${style.bg} ${style.border}`}
          >
            <div className="shrink-0 mt-0.5">{style.icon}</div>
            <div className="flex-1 min-w-0">
              <p className={`text-sm font-medium ${style.text}`}>
                {ann.title}
              </p>
              {ann.content && (
                <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                  {ann.content}
                </p>
              )}
            </div>
            <button
              onClick={() => onDismiss(ann.id)}
              className="shrink-0 p-1 rounded-md hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-pointer"
            >
              <X className="w-3.5 h-3.5 text-muted-foreground" />
            </button>
          </motion.div>
        );
      })}
    </AnimatePresence>
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
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Core state
  const [chats, setChats] = useState<ChatItem[]>([]);
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showSidebar, setShowSidebar] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);

  // Model selector
  const [selectedModel, setSelectedModel] = useState("llama3.1-8b");

  // Folders
  const [folders, setFolders] = useState<FolderItem[]>([]);
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [showNewFolder, setShowNewFolder] = useState(false);
  const [editingFolder, setEditingFolder] = useState<FolderItem | null>(null);
  const [foldersExpanded, setFoldersExpanded] = useState(true);

  // Templates
  const [showTemplates, setShowTemplates] = useState(false);
  const [templates, setTemplates] = useState<TemplateItem[]>([]);
  const [isLoadingTemplates, setIsLoadingTemplates] = useState(false);
  const [templatePrompt, setTemplatePrompt] = useState<string | null>(null);

  // Announcements
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [dismissedAnnouncements, setDismissedAnnouncements] = useState<Set<string>>(
    new Set()
  );

  // Search
  const [searchResults, setSearchResults] = useState<{
    chatResults: SearchResultChat[];
    messageResults: SearchResultMessage[];
  }>({ chatResults: [], messageResults: [] });
  const [isSearching, setIsSearching] = useState(false);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  // Share dialog
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [shareUrl, setShareUrl] = useState("");
  const [shareLoading, setShareLoading] = useState(false);

  // ---- HYDRATION ----
  useEffect(() => {
    setMounted(true);
  }, []);

  // ---- FETCH CHATS ----
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

  // ---- FETCH FOLDERS ----
  const fetchFolders = useCallback(async () => {
    try {
      const res = await fetch("/api/folders", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) return;
      const data = await res.json();
      setFolders(data.folders || []);
    } catch {
      // silently fail
    }
  }, [token]);

  useEffect(() => {
    fetchFolders();
  }, [fetchFolders]);

  // ---- FETCH TEMPLATES ----
  const fetchTemplates = useCallback(async () => {
    setIsLoadingTemplates(true);
    try {
      const res = await fetch("/api/templates", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) return;
      const data = await res.json();
      setTemplates(data.templates || []);
    } catch {
      // silently fail
    } finally {
      setIsLoadingTemplates(false);
    }
  }, [token]);

  // ---- FETCH ANNOUNCEMENTS ----
  useEffect(() => {
    const fetchAnnouncements = async () => {
      try {
        const res = await fetch("/api/announcements");
        if (!res.ok) return;
        const data = await res.json();
        setAnnouncements(data.announcements || []);
      } catch {
        // silently fail
      }
    };
    fetchAnnouncements();
  }, []);

  // ---- GLOBAL SEARCH ----
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (!searchQuery.trim()) {
      setSearchResults({ chatResults: [], messageResults: [] });
      setShowSearchResults(false);
      return;
    }

    setShowSearchResults(true);
    setIsSearching(true);

    searchTimeoutRef.current = setTimeout(async () => {
      try {
        const res = await fetch(
          `/api/search?q=${encodeURIComponent(searchQuery)}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        if (!res.ok) throw new Error("Search failed");
        const data = await res.json();
        setSearchResults({
          chatResults: data.chatResults || [],
          messageResults: data.messageResults || [],
        });
      } catch {
        setSearchResults({ chatResults: [], messageResults: [] });
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchQuery, token]);

  // Close search results on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        searchContainerRef.current &&
        !searchContainerRef.current.contains(e.target as Node)
      ) {
        setShowSearchResults(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // ---- CREATE CHAT ----
  const handleCreateChat = useCallback(
    async (initialMessage?: string) => {
      setIsCreating(true);
      try {
        const title = initialMessage
          ? initialMessage.slice(0, 60) + (initialMessage.length > 60 ? "..." : "")
          : "New Chat";
        const res = await fetch("/api/chats", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ title }),
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
    },
    [token, fetchChats]
  );

  // ---- USE TEMPLATE ----
  const handleUseTemplate = useCallback(
    async (template: TemplateItem) => {
      setShowTemplates(false);
      setTemplatePrompt(template.prompt);
      await handleCreateChat(template.prompt);
    },
    [handleCreateChat]
  );

  // ---- DELETE CHAT ----
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

  // ---- PIN CHAT ----
  const handlePinChat = useCallback(
    async (chatId: string) => {
      try {
        await fetch(`/api/chats/${chatId}/pin`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({}),
        });
        await fetchChats();
      } catch {
        // silently fail
      }
    },
    [token, fetchChats]
  );

  // ---- RENAME CHAT ----
  const handleRenameChat = useCallback(
    async (chatId: string, newTitle: string) => {
      try {
        await fetch(`/api/chat/${chatId}/rename`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ title: newTitle }),
        });
        setChats((prev) =>
          prev.map((c) =>
            c.id === chatId ? { ...c, title: newTitle } : c
          )
        );
      } catch {
        // silently fail
      }
    },
    [token]
  );

  // ---- EXPORT CHAT ----
  const handleExportChat = useCallback(
    async (chatId: string, format: string) => {
      try {
        const res = await fetch(
          `/api/chats/${chatId}/export?format=${format}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        if (!res.ok) throw new Error("Export failed");
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `chat.${format === "markdown" ? "md" : "txt"}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      } catch {
        // silently fail
      }
    },
    [token]
  );

  // ---- SHARE CHAT ----
  const handleShareChat = useCallback(
    async (chatId: string) => {
      setShareLoading(true);
      setShareUrl("");
      setShareDialogOpen(true);
      try {
        const res = await fetch(`/api/chats/${chatId}/share`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });
        if (!res.ok) throw new Error("Share failed");
        const data = await res.json();
        setShareUrl(data.url || "");
      } catch {
        setShareUrl("");
      } finally {
        setShareLoading(false);
      }
    },
    [token]
  );

  // ---- MOVE CHAT TO FOLDER ----
  const handleMoveToFolder = useCallback(
    async (chatId: string, folderId: string | null) => {
      try {
        await fetch(`/api/chats/${chatId}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ folder_id: folderId }),
        });
        await fetchChats();
        await fetchFolders();
      } catch {
        // silently fail
      }
    },
    [token, fetchChats, fetchFolders]
  );

  // ---- FOLDER CRUD ----
  const handleCreateFolder = useCallback(
    async (name: string, color: string) => {
      try {
        await fetch("/api/folders", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ name, color }),
        });
        await fetchFolders();
      } catch {
        // silently fail
      }
    },
    [token, fetchFolders]
  );

  const handleUpdateFolder = useCallback(
    async (id: string, name: string, color: string) => {
      try {
        await fetch(`/api/folders/${id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ name, color }),
        });
        await fetchFolders();
      } catch {
        // silently fail
      }
    },
    [token, fetchFolders]
  );

  const handleDeleteFolder = useCallback(
    async (id: string) => {
      try {
        await fetch(`/api/folders/${id}`, {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        });
        if (selectedFolderId === id) {
          setSelectedFolderId(null);
        }
        await fetchFolders();
        await fetchChats();
      } catch {
        // silently fail
      }
    },
    [token, selectedFolderId, fetchFolders, fetchChats]
  );

  // ---- DISMISS ANNOUNCEMENT ----
  const handleDismissAnnouncement = useCallback((id: string) => {
    setDismissedAnnouncements((prev) => new Set(prev).add(id));
  }, []);

  // ---- FILTERED + SORTED CHATS ----
  const displayChats = useMemo(() => {
    let filtered = chats;

    // Filter by folder
    if (selectedFolderId) {
      filtered = filtered.filter((c) => c.folder_id === selectedFolderId);
    } else {
      // When "All" is selected, only show chats without a folder
      // (chats in folders are shown under their folder)
      const folderChatIds = new Set(
        chats.filter((c) => c.folder_id).map((c) => c.id)
      );
      filtered = filtered.filter((c) => !folderChatIds.has(c.id));
    }

    // If there's a search query, filter locally too
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (c) =>
          (c.title || "").toLowerCase().includes(q) ||
          (c.last_message || "").toLowerCase().includes(q)
      );
    }

    // Sort: pinned first, then by updated_at
    return [...filtered].sort((a, b) => {
      const aPinned = a.is_pinned ? 1 : 0;
      const bPinned = b.is_pinned ? 1 : 0;
      if (aPinned !== bPinned) return bPinned - aPinned;
      return new Date(b.updated_at || b.created_at).getTime() - new Date(a.updated_at || a.created_at).getTime();
    });
  }, [chats, selectedFolderId, searchQuery]);

  // Get chats per folder
  const folderChats = useMemo(() => {
    const map: Record<string, ChatItem[]> = {};
    folders.forEach((f) => {
      map[f.id] = chats
        .filter((c) => c.folder_id === f.id)
        .sort((a, b) => {
          const aPinned = a.is_pinned ? 1 : 0;
          const bPinned = b.is_pinned ? 1 : 0;
          if (aPinned !== bPinned) return bPinned - aPinned;
          return new Date(b.updated_at || b.created_at).getTime() - new Date(a.updated_at || a.created_at).getTime();
        });
    });
    return map;
  }, [chats, folders]);

  // Active announcements
  const activeAnnouncements = announcements.filter(
    (a) => !dismissedAnnouncements.has(a.id)
  );

  // ---- SIDEBAR CONTENT ----
  const sidebarContent = (
    <TooltipProvider delayDuration={300}>
      {/* Logo + Theme Toggle */}
      <div className="p-4 border-b border-border/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center shadow-sm">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <h2 className="text-base font-bold tracking-tight">NextChat</h2>
          </div>
          {mounted && (
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={() =>
                    setTheme(theme === "dark" ? "light" : "dark")
                  }
                  className="p-1.5 rounded-lg hover:bg-accent transition-colors cursor-pointer"
                >
                  <AnimatePresence mode="wait" initial={false}>
                    {theme === "dark" ? (
                      <motion.div
                        key="sun"
                        initial={{ rotate: -90, opacity: 0 }}
                        animate={{ rotate: 0, opacity: 1 }}
                        exit={{ rotate: 90, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                      >
                        <Sun className="w-4 h-4" />
                      </motion.div>
                    ) : (
                      <motion.div
                        key="moon"
                        initial={{ rotate: 90, opacity: 0 }}
                        animate={{ rotate: 0, opacity: 1 }}
                        exit={{ rotate: -90, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                      >
                        <Moon className="w-4 h-4" />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </button>
              </TooltipTrigger>
              <TooltipContent side="right">
                {theme === "dark" ? "Light mode" : "Dark mode"}
              </TooltipContent>
            </Tooltip>
          )}
        </div>
      </div>

      {/* Model Selector */}
      <div className="px-3 pt-3">
        <Select value={selectedModel} onValueChange={setSelectedModel}>
          <SelectTrigger className="h-9 rounded-lg text-sm bg-muted/50 border-transparent focus:border-emerald-500/30 focus:ring-emerald-500/20">
            <SelectValue>
              <div className="flex items-center gap-2">
                {MODELS.find((m) => m.id === selectedModel)?.icon}
                <span>
                  {MODELS.find((m) => m.id === selectedModel)?.name}
                </span>
                <span className="text-muted-foreground text-[10px]">
                  ({MODELS.find((m) => m.id === selectedModel)?.description})
                </span>
              </div>
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {MODELS.map((m) => (
              <SelectItem key={m.id} value={m.id}>
                <div className="flex items-center gap-2">
                  {m.icon}
                  <span className="font-medium">{m.name}</span>
                  <span className="text-muted-foreground text-xs">
                    {m.description}
                  </span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* New Chat + Templates */}
      <div className="p-3 pt-2 flex gap-2">
        <Button
          onClick={() => handleCreateChat()}
          disabled={isCreating}
          className="flex-1 h-10 rounded-xl bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-600 dark:hover:bg-emerald-700 text-white font-medium shadow-lg shadow-emerald-500/20 transition-all duration-200 gap-1.5"
        >
          {isCreating ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Plus className="w-4 h-4" />
          )}
          New Chat
        </Button>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="outline"
              size="icon"
              className="h-10 w-10 rounded-xl shrink-0"
              onClick={() => {
                fetchTemplates();
                setShowTemplates(true);
              }}
            >
              <LayoutTemplate className="w-4 h-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="right">Templates</TooltipContent>
        </Tooltip>
      </div>

      {/* Search */}
      <div className="px-3 pb-2 relative" ref={searchContainerRef}>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search chats & messages..."
            className="pl-9 pr-8 h-9 rounded-lg text-sm bg-muted/50 border-transparent focus:border-emerald-500/30 focus:bg-background"
            onFocus={() => {
              if (searchQuery.trim()) setShowSearchResults(true);
            }}
          />
          {searchQuery && (
            <button
              onClick={() => {
                setSearchQuery("");
                setShowSearchResults(false);
              }}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 rounded hover:bg-accent cursor-pointer"
            >
              <X className="w-3 h-3 text-muted-foreground" />
            </button>
          )}
        </div>
        {/* Search Results Dropdown */}
        <AnimatePresence>
          {showSearchResults && !showSidebar && (
            <SearchResultsPanel
              query={searchQuery}
              chatResults={searchResults.chatResults}
              messageResults={searchResults.messageResults}
              isLoading={isSearching}
              onSelectChat={(id) => {
                setSelectedChatId(id);
                setShowSidebar(false);
              }}
              onSelectMessage={(id) => {
                setSelectedChatId(id);
                setShowSidebar(false);
              }}
              onClose={() => setShowSearchResults(false)}
            />
          )}
        </AnimatePresence>
      </div>

      {/* Chat List */}
      <ScrollArea className="flex-1 px-2">
        <div className="space-y-1 py-1">
          {/* Folders Section */}
          {folders.length > 0 && (
            <div className="mb-1">
              <button
                onClick={() => setFoldersExpanded(!foldersExpanded)}
                className="flex items-center gap-1.5 px-2 py-1.5 w-full text-left cursor-pointer"
              >
                <ChevronDown
                  className={`w-3 h-3 text-muted-foreground transition-transform duration-200 ${
                    foldersExpanded ? "" : "-rotate-90"
                  }`}
                />
                <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                  Folders
                </span>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowNewFolder(true);
                      }}
                      className="ml-auto p-0.5 rounded hover:bg-accent cursor-pointer"
                    >
                      <FolderPlus className="w-3 h-3 text-muted-foreground hover:text-foreground" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="right">New Folder</TooltipContent>
                </Tooltip>
              </button>

              <AnimatePresence>
                {foldersExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <div className="space-y-0.5 mb-1">
                      <button
                        onClick={() => setSelectedFolderId(null)}
                        className={`w-full text-left px-2.5 py-2 rounded-lg transition-all duration-200 cursor-pointer ${
                          selectedFolderId === null
                            ? "bg-accent border border-border"
                            : "hover:bg-accent/50 border border-transparent"
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <MessageSquare className="w-4 h-4 text-muted-foreground" />
                          <span className="text-sm font-medium">All Chats</span>
                          <Badge
                            variant="secondary"
                            className="text-[10px] h-4 px-1.5 ml-auto"
                          >
                            {chats.length}
                          </Badge>
                        </div>
                      </button>
                      {folders.map((f) => (
                        <FolderListItem
                          key={f.id}
                          folder={f}
                          isActive={selectedFolderId === f.id}
                          onSelect={() => setSelectedFolderId(f.id)}
                          onEdit={() => setEditingFolder(f)}
                          onDelete={() => handleDeleteFolder(f.id)}
                        />
                      ))}
                    </div>

                    {/* Show chats under selected folder */}
                    {selectedFolderId &&
                      (folderChats[selectedFolderId] || []).length > 0 && (
                        <div className="ml-2 border-l-2 border-border/50 pl-2 space-y-0.5 mt-1">
                          {(folderChats[selectedFolderId] || []).map(
                            (chat) => (
                              <ChatListItem
                                key={chat.id}
                                chat={chat}
                                isActive={selectedChatId === chat.id}
                                onSelect={() => {
                                  setSelectedChatId(chat.id);
                                  setShowSidebar(false);
                                }}
                                onDelete={() => handleDeleteChat(chat.id)}
                                onPin={() => handlePinChat(chat.id)}
                                onRename={(title) =>
                                  handleRenameChat(chat.id, title)
                                }
                                onExport={(fmt) =>
                                  handleExportChat(chat.id, fmt)
                                }
                                onShare={() => handleShareChat(chat.id)}
                                onMoveToFolder={(fid) =>
                                  handleMoveToFolder(chat.id, fid)
                                }
                                folders={folders}
                              />
                            )
                          )}
                        </div>
                      )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}

          {/* "New Folder" button when no folders */}
          {folders.length === 0 && (
            <button
              onClick={() => setShowNewFolder(true)}
              className="flex items-center gap-2 px-2 py-1.5 w-full text-left text-muted-foreground hover:text-foreground hover:bg-accent rounded-lg transition-colors cursor-pointer"
            >
              <FolderPlus className="w-3.5 h-3.5" />
              <span className="text-xs font-medium">New Folder</span>
            </button>
          )}

          {/* Section divider when folders exist */}
          {folders.length > 0 && !selectedFolderId && (
            <div className="flex items-center gap-2 px-2 pt-1 pb-0.5">
              <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                Chats
              </span>
            </div>
          )}

          {/* Chat Items */}
          {(selectedFolderId ? folderChats[selectedFolderId] || [] : displayChats).length === 0 &&
          folders.length === 0 ? (
            <div className="flex items-center justify-center py-8">
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin text-emerald-500" />
              ) : (
                <div className="text-center">
                  <MessageSquare className="w-8 h-8 mx-auto text-muted-foreground/30 mb-2" />
                  <p className="text-xs text-muted-foreground">
                    {searchQuery
                      ? "No chats found"
                      : selectedFolderId
                        ? "No chats in this folder"
                        : "No chats yet"}
                  </p>
                </div>
              )}
            </div>
          ) : null}

          {(!selectedFolderId ? displayChats : folderChats[selectedFolderId] || []).map(
            (chat) => (
              <ChatListItem
                key={chat.id}
                chat={chat}
                isActive={selectedChatId === chat.id}
                onSelect={() => {
                  setSelectedChatId(chat.id);
                  setShowSidebar(false);
                }}
                onDelete={() => handleDeleteChat(chat.id)}
                onPin={() => handlePinChat(chat.id)}
                onRename={(title) => handleRenameChat(chat.id, title)}
                onExport={(fmt) => handleExportChat(chat.id, fmt)}
                onShare={() => handleShareChat(chat.id)}
                onMoveToFolder={(fid) => handleMoveToFolder(chat.id, fid)}
                folders={folders}
              />
            )
          )}
        </div>
      </ScrollArea>

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
            <p className="text-sm font-medium truncate">
              {user.full_name || "User"}
            </p>
            <p className="text-[10px] text-muted-foreground truncate">
              {user.email}
            </p>
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
    </TooltipProvider>
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
        {/* Announcements Banner */}
        <AnnouncementsBanner
          announcements={activeAnnouncements}
          onDismiss={handleDismissAnnouncement}
        />

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
                deepResearch={selectedModel === "llama-4-scout-17b-16e-instruct"}
                selectedModel={selectedModel}
                templatePrompt={templatePrompt}
                onBack={() => {
                  setSelectedChatId(null);
                  setTemplatePrompt(null);
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
                onCreateChat={() => handleCreateChat()}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Templates Panel */}
      <TemplatesPanel
        open={showTemplates}
        onClose={() => setShowTemplates(false)}
        templates={templates}
        isLoading={isLoadingTemplates}
        onUseTemplate={handleUseTemplate}
      />

      {/* New Folder Dialog */}
      <NewFolderDialog
        open={showNewFolder}
        onClose={() => setShowNewFolder(false)}
        onSave={handleCreateFolder}
      />

      {/* Edit Folder Dialog */}
      {editingFolder && (
        <EditFolderDialog
          key={editingFolder.id}
          open={!!editingFolder}
          onClose={() => setEditingFolder(null)}
          folder={editingFolder}
          onSave={handleUpdateFolder}
        />
      )}

      {/* Share Dialog */}
      <ShareDialog
        open={shareDialogOpen}
        onClose={() => setShareDialogOpen(false)}
        shareUrl={shareUrl}
        isLoading={shareLoading}
      />
    </div>
  );
}

export default DashboardView;
