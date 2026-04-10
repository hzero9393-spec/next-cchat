"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
import { motion } from "framer-motion";

// ============ TYPES ============

interface ProfileViewProps {
  user: any;
  token: string;
  onBack: () => void;
  onLogout: () => void;
  onThemeChange: (theme: string) => void;
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
  const [formData, setFormData] = useState({
    fullName: "",
    lastName: "",
    dob: "",
    phone: "",
  });
  const [activeTheme, setActiveTheme] = useState(user?.theme_preference || "emerald");
  const [isLoading, setIsLoading] = useState(false);
  const [isSavingTheme, setIsSavingTheme] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

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
          });
          if (data.theme_preference) {
            setActiveTheme(data.theme_preference);
          }
        }
      } catch {
        // silent
      }
    };
    fetchProfile();
  }, [token]);

  const updateField = useCallback((field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setMessage(null);
  }, []);

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

  return (
    <div className="min-h-screen bg-background">
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
        {/* Profile Header */}
        <motion.div variants={itemVariants} className="flex flex-col sm:flex-row items-center gap-4 py-4 sm:py-6">
          <Avatar className="h-20 w-20 shadow-lg mb-3">
            <AvatarImage src={user?.avatar_url} alt={user?.full_name} />
            <AvatarFallback className="bg-gradient-to-br from-emerald-400 to-teal-500 text-white text-2xl font-bold">
              {(user?.full_name || "U").charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <h2 className="text-lg font-bold">{user?.full_name || "User"}</h2>
          <p className="text-sm text-muted-foreground">{user?.email || ""}</p>
        </motion.div>

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

              {/* Message */}
              {message && (
                <motion.div
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`sm:col-span-2 flex items-center gap-2 p-3 rounded-xl text-sm ${
                    message.type === "success"
                      ? "bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400"
                      : "bg-red-500/10 border border-red-500/20 text-red-500"
                  }`}
                >
                  <span>{message.text}</span>
                </motion.div>
              )}

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

        {/* Section 2 - Theme Selection */}
        <motion.div variants={itemVariants}>
          <Card className="p-4 sm:p-6">
            <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500" />
              Theme Selection
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

        {/* Section 3 - Actions */}
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
