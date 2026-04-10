"use client";

import React, { useState, useEffect, useCallback, useRef, useMemo } from "react";
import {
  ArrowLeft,
  Save,
  Loader2,
  User,
  Phone,
  Calendar,
  LogOut,
  Trash2,
  Check,
  AlertTriangle,
  Camera,
  Crown,
  Key,
  Shield,
  MessageSquare,
  Clock,
  Star,
  Sun,
  Moon,
  Monitor,
  Copy,
  Plus,
  X,
  Eye,
  EyeOff,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "next-themes";

// ============ TYPES ============

interface ProfileViewProps {
  user: any;
  token: string;
  onBack: () => void;
  onLogout: () => void;
  onThemeChange: (theme: string) => void;
}

interface ProfileStats {
  totalChats: number;
  totalMessages: number;
  createdAt: string | null;
  favoriteModel: string;
}

interface ApiKey {
  id: string;
  key_name: string;
  key_prefix: string;
  created_at: string;
  last_used_at: string | null;
}

interface SubscriptionData {
  plan: string;
  status: string;
}

// ============ THEMES ============

const themes = [
  { id: "ocean-blue", name: "Ocean Blue", colors: ["#0ea5e9", "#0284c7", "#38bdf8", "#0c4a6e"] },
  { id: "forest-green", name: "Forest Green", colors: ["#22c55e", "#16a34a", "#4ade80", "#14532d"] },
  { id: "sunset-orange", name: "Sunset Orange", colors: ["#f97316", "#ea580c", "#fb923c", "#7c2d12"] },
  { id: "purple-haze", name: "Purple Haze", colors: ["#a855f7", "#9333ea", "#c084fc", "#581c87"] },
  { id: "midnight-black", name: "Midnight", colors: ["#1e293b", "#0f172a", "#334155", "#020617"] },
  { id: "rose-pink", name: "Rose Pink", colors: ["#f43f5e", "#e11d48", "#fb7185", "#881337"] },
  { id: "crimson-red", name: "Crimson", colors: ["#dc2626", "#b91c1c", "#ef4444", "#7f1d1d"] },
  { id: "teal-dream", name: "Teal Dream", colors: ["#14b8a6", "#0d9488", "#2dd4bf", "#134e4a"] },
  { id: "golden-hour", name: "Golden Hour", colors: ["#eab308", "#ca8a04", "#facc15", "#713f12"] },
  { id: "arctic-frost", name: "Arctic Frost", colors: ["#94a3b8", "#64748b", "#cbd5e1", "#1e293b"] },
  { id: "lavender", name: "Lavender", colors: ["#a78bfa", "#8b5cf6", "#c4b5fd", "#4c1d95"] },
  { id: "emerald", name: "Emerald", colors: ["#10b981", "#059669", "#34d399", "#064e3b"] },
];

// ============ ANIMATION VARIANTS ============

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.1 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: "easeOut" },
  },
};

// ============ THEME CARD ============

function ThemeCard({
  theme,
  isActive,
  onSelect,
}: {
  theme: (typeof themes)[0];
  isActive: boolean;
  onSelect: () => void;
}) {
  return (
    <motion.button
      whileHover={{ scale: 1.03 }}
      whileTap={{ scale: 0.97 }}
      onClick={onSelect}
      className={`relative p-3 rounded-xl border-2 transition-all duration-200 cursor-pointer text-left ${
        isActive
          ? "border-emerald-500 bg-emerald-500/5 shadow-sm shadow-emerald-500/10"
          : "border-border hover:border-muted-foreground/30 bg-card"
      }`}
    >
      {isActive && (
        <div className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center">
          <Check className="w-3 h-3 text-white" />
        </div>
      )}
      <div className="flex gap-1.5 mb-2">
        {theme.colors.map((color, i) => (
          <div
            key={i}
            className="w-5 h-5 rounded-full border border-border/50 shrink-0"
            style={{ backgroundColor: color }}
          />
        ))}
      </div>
      <p className="text-xs font-medium truncate">{theme.name}</p>
    </motion.button>
  );
}

// ============ MAIN PROFILE VIEW ============

export function ProfileView({
  user,
  token,
  onBack,
  onLogout,
  onThemeChange,
}: ProfileViewProps) {
  const { theme: nextTheme, setTheme: setNextTheme } = useTheme();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    fullName: "",
    lastName: "",
    dob: "",
    phone: "",
    bio: "",
  });
  const [activeTheme, setActiveTheme] = useState(user?.theme_preference || "emerald");
  const [avatarUrl, setAvatarUrl] = useState(user?.avatar_url || "");
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSavingTheme, setIsSavingTheme] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Profile stats
  const [stats, setStats] = useState<ProfileStats | null>(null);
  const [isLoadingStats, setIsLoadingStats] = useState(true);

  // Subscription
  const [subscription, setSubscription] = useState<SubscriptionData>({ plan: "free", status: "inactive" });
  const [isLoadingSub, setIsLoadingSub] = useState(true);

  // API Keys
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [isLoadingKeys, setIsLoadingKeys] = useState(true);
  const [newKeyName, setNewKeyName] = useState("");
  const [newlyCreatedKey, setNewlyCreatedKey] = useState<string | null>(null);
  const [showNewKeyInput, setShowNewKeyInput] = useState(false);

  // Appearance
  const [appearanceMode, setAppearanceMode] = useState<string>("system");

  const authHeaders = useMemo(
    () => ({ Authorization: `Bearer ${token}` }),
    [token]
  );

  // Load profile data
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await fetch("/api/profile", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          setFormData({
            fullName: data.full_name || data.fullName || "",
            lastName: data.last_name || data.lastName || "",
            dob: data.dob || "",
            phone: data.phone || "",
            bio: data.bio || "",
          });
          if (data.theme_preference) {
            setActiveTheme(data.theme_preference);
          }
          if (data.avatar_url) {
            setAvatarUrl(data.avatar_url);
          }
        }
      } catch {
        // silent
      }
    };
    fetchProfile();
  }, [token]);

  // Load stats
  useEffect(() => {
    const fetchStats = async () => {
      setIsLoadingStats(true);
      try {
        const res = await fetch("/api/profile/stats", { headers: authHeaders });
        if (res.ok) {
          const data = await res.json();
          setStats(data);
        }
      } catch {
        // silent
      } finally {
        setIsLoadingStats(false);
      }
    };
    fetchStats();
  }, [authHeaders]);

  // Load subscription
  useEffect(() => {
    const fetchSub = async () => {
      setIsLoadingSub(true);
      try {
        const res = await fetch("/api/subscription", { headers: authHeaders });
        if (res.ok) {
          const data = await res.json();
          setSubscription({ plan: data.plan || "free", status: data.status || "inactive" });
        }
      } catch {
        // silent
      } finally {
        setIsLoadingSub(false);
      }
    };
    fetchSub();
  }, [authHeaders]);

  // Load API keys
  useEffect(() => {
    const fetchKeys = async () => {
      setIsLoadingKeys(true);
      try {
        const res = await fetch("/api/api-keys", { headers: authHeaders });
        if (res.ok) {
          const data = await res.json();
          setApiKeys(data.keys || []);
        }
      } catch {
        // silent
      } finally {
        setIsLoadingKeys(false);
      }
    };
    fetchKeys();
  }, [authHeaders]);

  // Init appearance from next-themes
  useEffect(() => {
    if (nextTheme) setAppearanceMode(nextTheme);
  }, [nextTheme]);

  const updateField = useCallback((field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setMessage(null);
  }, []);

  // Handle avatar upload
  const handleAvatarClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleAvatarChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      // Check size (2MB)
      if (file.size > 2 * 1024 * 1024) {
        setMessage({ type: "error", text: "Image is too large. Maximum size is 2MB." });
        return;
      }

      setIsUploadingAvatar(true);
      setMessage(null);

      try {
        const reader = new FileReader();
        reader.onloadend = async () => {
          const base64 = reader.result as string;
          const res = await fetch("/api/profile/avatar", {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ avatarUrl: base64 }),
          });

          if (!res.ok) {
            const data = await res.json();
            throw new Error(data.error || "Failed to upload avatar");
          }

          setAvatarUrl(base64);
          setMessage({ type: "success", text: "Avatar updated!" });
          setIsUploadingAvatar(false);
        };
        reader.readAsDataURL(file);
      } catch (err: unknown) {
        const errMsg = err instanceof Error ? err.message : "Failed to upload avatar";
        setMessage({ type: "error", text: errMsg });
        setIsUploadingAvatar(false);
      }

      // Reset file input
      e.target.value = "";
    },
    [token]
  );

  // Save profile
  const handleSave = useCallback(async () => {
    setIsLoading(true);
    setMessage(null);
    try {
      const res = await fetch("/api/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          fullName: formData.fullName,
          lastName: formData.lastName,
          dob: formData.dob,
          phone: formData.phone,
          bio: formData.bio,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to save profile");
      }
      setMessage({ type: "success", text: "Profile saved successfully!" });
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : "Failed to save";
      setMessage({ type: "error", text: errMsg });
    } finally {
      setIsLoading(false);
    }
  }, [formData, token]);

  // Save theme
  const handleThemeSelect = useCallback(
    async (themeId: string) => {
      setActiveTheme(themeId);
      setIsSavingTheme(true);
      try {
        await fetch("/api/profile/theme", {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ theme: themeId }),
        });
        onThemeChange(themeId);
      } catch {
        // silent
      } finally {
        setIsSavingTheme(false);
      }
    },
    [token, onThemeChange]
  );

  // Appearance mode
  const handleAppearanceChange = useCallback(
    (mode: string) => {
      setAppearanceMode(mode);
      setNextTheme(mode);
    },
    [setNextTheme]
  );

  // API key operations
  const handleCreateKey = useCallback(async () => {
    if (!newKeyName.trim()) return;
    try {
      const res = await fetch("/api/api-keys", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name: newKeyName.trim() }),
      });
      if (res.ok) {
        const data = await res.json();
        setNewlyCreatedKey(data.key);
        setApiKeys((prev) => [
          {
            id: data.id,
            key_name: data.name,
            key_prefix: data.keyPrefix,
            created_at: new Date().toISOString(),
            last_used_at: null,
          },
          ...prev,
        ]);
        setNewKeyName("");
        setShowNewKeyInput(false);
        setMessage({ type: "success", text: "API key created! Copy it now, it won't be shown again." });
      }
    } catch {
      setMessage({ type: "error", text: "Failed to create API key" });
    }
  }, [newKeyName, token]);

  const handleDeleteKey = useCallback(
    async (keyId: string) => {
      try {
        await fetch(`/api/api-keys/${keyId}`, {
          method: "DELETE",
          headers: authHeaders,
        });
        setApiKeys((prev) => prev.filter((k) => k.id !== keyId));
        setMessage({ type: "success", text: "API key revoked" });
      } catch {
        setMessage({ type: "error", text: "Failed to revoke API key" });
      }
    },
    [authHeaders]
  );

  const handleCopyKey = useCallback((key: string) => {
    navigator.clipboard.writeText(key);
    setNewlyCreatedKey(null);
    setMessage({ type: "success", text: "API key copied to clipboard!" });
  }, []);

  // Format account age
  const formatAccountAge = (dateStr: string | null) => {
    if (!dateStr) return "N/A";
    const created = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - created.getTime();
    const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    if (days < 1) return "Less than a day";
    if (days < 30) return `${days} day${days !== 1 ? "s" : ""}`;
    const months = Math.floor(days / 30);
    if (months < 12) return `${months} month${months !== 1 ? "s" : ""}`;
    const years = Math.floor(months / 12);
    const remainingMonths = months % 12;
    return `${years} year${years !== 1 ? "s" : ""}${remainingMonths > 0 ? ` ${remainingMonths}mo` : ""}`;
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleAvatarChange}
      />

      {/* Header */}
      <motion.header
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="sticky top-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60"
      >
        <div className="max-w-3xl mx-auto flex items-center gap-3 px-4 sm:px-6 lg:px-8 h-14">
          <Button
            variant="ghost"
            size="icon"
            onClick={onBack}
            className="h-9 w-9 shrink-0"
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <h1 className="text-base font-bold">My Profile</h1>
        </div>
      </motion.header>

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="max-w-3xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6"
      >
        {/* Profile Header with Avatar */}
        <motion.div variants={itemVariants} className="flex flex-col sm:flex-row items-center gap-4 py-4 sm:py-6">
          <div className="relative group">
            <Avatar className="h-20 w-20 shadow-lg mb-3">
              <AvatarImage src={avatarUrl} alt={user?.full_name} />
              <AvatarFallback className="bg-gradient-to-br from-emerald-400 to-teal-500 text-white text-2xl font-bold">
                {(user?.full_name || "U").charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <button
              onClick={handleAvatarClick}
              disabled={isUploadingAvatar}
              className="absolute inset-0 rounded-full bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer"
            >
              {isUploadingAvatar ? (
                <Loader2 className="w-6 h-6 text-white animate-spin" />
              ) : (
                <Camera className="w-6 h-6 text-white" />
              )}
            </button>
          </div>
          <div className="text-center sm:text-left">
            <h2 className="text-lg font-bold">{user?.full_name || "User"}</h2>
            <p className="text-sm text-muted-foreground">{user?.email || ""}</p>
            <button
              onClick={handleAvatarClick}
              className="mt-1.5 text-xs text-emerald-500 hover:text-emerald-600 transition-colors cursor-pointer"
            >
              {isUploadingAvatar ? "Uploading..." : "Change avatar"}
            </button>
          </div>
        </motion.div>

        {/* Global Message */}
        <AnimatePresence>
          {message && (
            <motion.div
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              className={`flex items-center gap-2 p-3 rounded-xl text-sm ${
                message.type === "success"
                  ? "bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400"
                  : "bg-red-500/10 border border-red-500/20 text-red-500"
              }`}
            >
              <span>{message.text}</span>
              <button
                onClick={() => setMessage(null)}
                className="ml-auto hover:opacity-70 transition-opacity cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Section 1 - Personal Info */}
        <motion.div variants={itemVariants}>
          <Card className="p-4 sm:p-6">
            <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
              <User className="w-4 h-4 text-emerald-500" />
              Personal Information
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Full Name */}
              <div>
                <Label htmlFor="fullName" className="text-sm font-medium mb-1.5 block">
                  Full Name
                </Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="fullName"
                    value={formData.fullName}
                    onChange={(e) => updateField("fullName", e.target.value)}
                    placeholder="Enter your first name"
                    className="pl-10 h-11 rounded-xl"
                    disabled={isLoading}
                  />
                </div>
              </div>

              {/* Last Name */}
              <div>
                <Label htmlFor="lastName" className="text-sm font-medium mb-1.5 block">
                  Last Name
                </Label>
                <Input
                  id="lastName"
                  value={formData.lastName}
                  onChange={(e) => updateField("lastName", e.target.value)}
                  placeholder="Enter your last name"
                  className="h-11 rounded-xl"
                  disabled={isLoading}
                />
              </div>

              {/* Date of Birth */}
              <div>
                <Label htmlFor="dob" className="text-sm font-medium mb-1.5 block">
                  Date of Birth
                </Label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="dob"
                    type="date"
                    value={formData.dob}
                    onChange={(e) => updateField("dob", e.target.value)}
                    className="pl-10 h-11 rounded-xl"
                    disabled={isLoading}
                  />
                </div>
              </div>

              {/* Phone */}
              <div>
                <Label htmlFor="phone" className="text-sm font-medium mb-1.5 block">
                  Phone Number
                </Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => updateField("phone", e.target.value)}
                    placeholder="+1 (555) 000-0000"
                    className="pl-10 h-11 rounded-xl"
                    disabled={isLoading}
                  />
                </div>
              </div>

              {/* Bio */}
              <div className="sm:col-span-2">
                <Label htmlFor="bio" className="text-sm font-medium mb-1.5 block">
                  Bio
                </Label>
                <div className="relative">
                  <Textarea
                    id="bio"
                    value={formData.bio}
                    onChange={(e) => {
                      if (e.target.value.length <= 200) {
                        updateField("bio", e.target.value);
                      }
                    }}
                    placeholder="Tell us about yourself..."
                    className="h-24 rounded-xl resize-none"
                    disabled={isLoading}
                  />
                  <span className="absolute bottom-2 right-2 text-xs text-muted-foreground">
                    {formData.bio.length}/200
                  </span>
                </div>
              </div>

              {/* Save Button */}
              <Button
                onClick={handleSave}
                disabled={isLoading}
                className="sm:col-span-2 w-full h-11 rounded-xl bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-600 dark:hover:bg-emerald-700 text-white font-medium shadow-lg shadow-emerald-500/20 gap-2"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    Save Changes
                  </>
                )}
              </Button>
            </div>
          </Card>
        </motion.div>

        {/* Section 2 - Chat Statistics */}
        <motion.div variants={itemVariants}>
          <Card className="p-4 sm:p-6">
            <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-teal-500" />
              Chat Statistics
            </h3>
            {isLoadingStats ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-5 h-5 animate-spin text-emerald-500" />
              </div>
            ) : stats ? (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="text-center p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/10">
                  <MessageSquare className="w-5 h-5 mx-auto mb-1.5 text-emerald-500" />
                  <p className="text-xl font-bold">{stats.totalChats}</p>
                  <p className="text-xs text-muted-foreground">Total Chats</p>
                </div>
                <div className="text-center p-3 rounded-xl bg-teal-500/5 border border-teal-500/10">
                  <Key className="w-5 h-5 mx-auto mb-1.5 text-teal-500" />
                  <p className="text-xl font-bold">{stats.totalMessages}</p>
                  <p className="text-xs text-muted-foreground">Messages</p>
                </div>
                <div className="text-center p-3 rounded-xl bg-amber-500/5 border border-amber-500/10">
                  <Clock className="w-5 h-5 mx-auto mb-1.5 text-amber-500" />
                  <p className="text-xl font-bold">{formatAccountAge(stats.createdAt)}</p>
                  <p className="text-xs text-muted-foreground">Account Age</p>
                </div>
                <div className="text-center p-3 rounded-xl bg-purple-500/5 border border-purple-500/10">
                  <Star className="w-5 h-5 mx-auto mb-1.5 text-purple-500" />
                  <p className="text-sm font-bold truncate px-1">{stats.favoriteModel}</p>
                  <p className="text-xs text-muted-foreground">Favorite Model</p>
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">No stats available</p>
            )}
          </Card>
        </motion.div>

        {/* Section 3 - Subscription Plan */}
        <motion.div variants={itemVariants}>
          <div className="relative rounded-xl overflow-hidden">
            {/* Gradient border */}
            <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-amber-400 via-orange-400 to-rose-400 p-[2px]">
              <div className="w-full h-full rounded-xl bg-background" />
            </div>
            <Card className="relative p-4 sm:p-6 border-0">
              <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
                <Crown className="w-4 h-4 text-amber-500" />
                Subscription Plan
              </h3>
              {isLoadingSub ? (
                <div className="flex items-center justify-center py-6">
                  <Loader2 className="w-5 h-5 animate-spin text-amber-500" />
                </div>
              ) : subscription.plan === "pro" ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <Badge className="bg-gradient-to-r from-amber-500 to-orange-500 text-white border-0">
                          <Crown className="w-3 h-3 mr-1" />
                          Pro Plan
                        </Badge>
                        <Badge variant="secondary" className="text-emerald-600 bg-emerald-500/10 border-emerald-500/20">
                          Active
                        </Badge>
                      </div>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    You have access to all premium features including unlimited messages, Deep Research mode, priority support, and file uploads up to 25MB.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Badge variant="secondary">Free Plan</Badge>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {[
                      { icon: MessageSquare, text: "Unlimited messages", included: false },
                      { icon: Eye, text: "Deep Research mode", included: false },
                      { icon: Shield, text: "Priority support", included: false },
                      { icon: Key, text: "File uploads up to 25MB", included: false },
                    ].map((benefit) => (
                      <div
                        key={benefit.text}
                        className="flex items-center gap-2 text-sm text-muted-foreground"
                      >
                        <benefit.icon className="w-4 h-4 shrink-0" />
                        <span>{benefit.text}</span>
                        {!benefit.included && (
                          <Badge variant="outline" className="text-[10px] ml-auto h-5 px-1.5">
                            PRO
                          </Badge>
                        )}
                      </div>
                    ))}
                  </div>
                  <Button className="w-full h-11 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-medium shadow-lg shadow-amber-500/20 gap-2">
                    <Crown className="w-4 h-4" />
                    Upgrade to Pro
                  </Button>
                </div>
              )}
            </Card>
          </div>
        </motion.div>

        {/* Section 4 - API Keys */}
        <motion.div variants={itemVariants}>
          <Card className="p-4 sm:p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold flex items-center gap-2">
                <Key className="w-4 h-4 text-emerald-500" />
                Developer API Keys
              </h3>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowNewKeyInput(true)}
                className="gap-1.5 rounded-lg text-xs h-8"
              >
                <Plus className="w-3.5 h-3.5" />
                Generate Key
              </Button>
            </div>

            <div className="rounded-lg bg-amber-500/5 border border-amber-500/10 p-3 mb-4">
              <p className="text-xs text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                Keep your API keys secure. Never share them publicly.
              </p>
            </div>

            {/* New Key Created (show once) */}
            <AnimatePresence>
              {newlyCreatedKey && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mb-4"
                >
                  <div className="rounded-lg bg-emerald-500/5 border border-emerald-500/20 p-3 space-y-2">
                    <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                      New API Key Created
                    </p>
                    <div className="flex items-center gap-2">
                      <code className="flex-1 text-xs bg-background rounded-md p-2 font-mono break-all">
                        {newlyCreatedKey}
                      </code>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleCopyKey(newlyCreatedKey)}
                        className="shrink-0 gap-1.5 h-8 text-xs"
                      >
                        <Copy className="w-3 h-3" />
                        Copy
                      </Button>
                    </div>
                    <p className="text-[10px] text-muted-foreground">
                      Make sure to copy this key now. You won&apos;t be able to see it again.
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* New Key Input */}
            <AnimatePresence>
              {showNewKeyInput && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mb-4"
                >
                  <div className="flex items-center gap-2">
                    <Input
                      value={newKeyName}
                      onChange={(e) => setNewKeyName(e.target.value)}
                      placeholder="Key name (e.g. Production)"
                      className="h-9 rounded-lg text-sm flex-1"
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleCreateKey();
                        if (e.key === "Escape") setShowNewKeyInput(false);
                      }}
                      autoFocus
                    />
                    <Button
                      size="sm"
                      onClick={handleCreateKey}
                      disabled={!newKeyName.trim()}
                      className="h-9 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white gap-1"
                    >
                      <Check className="w-3 h-3" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setShowNewKeyInput(false)}
                      className="h-9 rounded-lg"
                    >
                      <X className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Key List */}
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {isLoadingKeys ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-5 h-5 animate-spin text-emerald-500" />
                </div>
              ) : apiKeys.length === 0 ? (
                <div className="text-center py-8">
                  <Key className="w-8 h-8 mx-auto mb-2 text-muted-foreground/40" />
                  <p className="text-sm text-muted-foreground">No API keys yet</p>
                  <p className="text-xs text-muted-foreground/60 mt-1">
                    Generate a key to get started with the API
                  </p>
                </div>
              ) : (
                apiKeys.map((key) => (
                  <div
                    key={key.id}
                    className="flex items-center justify-between p-3 rounded-lg border border-border/50 hover:bg-accent/30 transition-colors"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium">{key.key_name}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <code className="text-xs text-muted-foreground font-mono">
                          {key.key_prefix}...
                        </code>
                        <span className="text-[10px] text-muted-foreground">
                          Created {new Date(key.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteKey(key.id)}
                      className="h-8 text-xs text-muted-foreground hover:text-red-500 hover:bg-red-500/10 gap-1"
                    >
                      <Trash2 className="w-3 h-3" />
                      <span className="hidden sm:inline">Revoke</span>
                    </Button>
                  </div>
                ))
              )}
            </div>
          </Card>
        </motion.div>

        {/* Section 5 - Appearance */}
        <motion.div variants={itemVariants}>
          <Card className="p-4 sm:p-6">
            <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
              <Sun className="w-4 h-4 text-amber-500" />
              Appearance
            </h3>
            <div className="grid grid-cols-3 gap-3">
              {[
                { id: "light", label: "Light", icon: Sun },
                { id: "dark", label: "Dark", icon: Moon },
                { id: "system", label: "System", icon: Monitor },
              ].map((mode) => (
                <motion.button
                  key={mode.id}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleAppearanceChange(mode.id)}
                  className={`flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all cursor-pointer ${
                    appearanceMode === mode.id
                      ? "border-emerald-500 bg-emerald-500/5"
                      : "border-border hover:border-muted-foreground/30 bg-card"
                  }`}
                >
                  <mode.icon
                    className={`w-5 h-5 ${
                      appearanceMode === mode.id ? "text-emerald-500" : "text-muted-foreground"
                    }`}
                  />
                  <span className="text-xs font-medium">{mode.label}</span>
                  {appearanceMode === mode.id && (
                    <Check className="w-3 h-3 text-emerald-500" />
                  )}
                </motion.button>
              ))}
            </div>
          </Card>
        </motion.div>

        {/* Section 6 - Theme Selection */}
        <motion.div variants={itemVariants}>
          <Card className="p-4 sm:p-6">
            <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500" />
              Color Theme
            </h3>

            {isSavingTheme && (
              <div className="flex items-center justify-center gap-2 mb-3 text-xs text-muted-foreground">
                <Loader2 className="w-3 h-3 animate-spin" />
                Applying theme...
              </div>
            )}

            <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-3">
              {themes.map((theme) => (
                <ThemeCard
                  key={theme.id}
                  theme={theme}
                  isActive={activeTheme === theme.id}
                  onSelect={() => handleThemeSelect(theme.id)}
                />
              ))}
            </div>
          </Card>
        </motion.div>

        {/* Section 7 - Actions */}
        <motion.div variants={itemVariants}>
          <Card className="p-4 sm:p-6 space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Logout */}
              <Button
                onClick={onLogout}
                variant="outline"
                className="w-full h-11 rounded-xl gap-2"
              >
                <LogOut className="w-4 h-4" />
                Logout
              </Button>

              {/* Delete Account */}
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full h-11 rounded-xl gap-2 border-red-500/20 text-red-500 hover:bg-red-500/10 hover:text-red-500"
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete Account
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle className="flex items-center gap-2">
                      <AlertTriangle className="w-5 h-5 text-red-500" />
                      Delete Account
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                      This action cannot be undone. This will permanently delete your
                      account and remove all of your data from our servers including
                      chats, messages, and profile information.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel className="rounded-xl">Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      className="rounded-xl bg-red-600 hover:bg-red-700 text-white"
                      onClick={onLogout}
                    >
                      Delete Account
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </Card>
        </motion.div>

        {/* Spacer */}
        <div className="h-6" />
      </motion.div>
    </div>
  );
}

export default ProfileView;
