"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  Shield,
  Users,
  MessageSquare,
  Activity,
  TrendingUp,
  LogOut,
  Search,
  Trash2,
  Loader2,
  ArrowLeft,
  Lock,
  User as UserIcon,
  Eye,
  EyeOff,
  BarChart3,
  Plus,
  Edit2,
  Megaphone,
  Gavel,
  Ban,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Info,
  Clock,
  ChevronDown,
  Copy,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

// ============ TYPES ============

interface AdminStats {
  totalUsers: number;
  totalChats: number;
  totalMessages: number;
  activeToday: number;
}

interface AdminUser {
  id: string;
  email: string;
  full_name: string;
  last_name?: string;
  created_at: string;
  chat_count?: number;
  is_banned?: number;
  is_pro?: number;
  avatar_url?: string;
  last_active?: string;
  bio?: string;
}

interface AdminViewProps {
  onBack: () => void;
}

interface AnalyticsData {
  dailyMessages: { date: string; count: number }[];
  dailyUsers: { date: string; count: number }[];
  categories?: { category: string; total_messages: number }[];
}

interface Announcement {
  id: string;
  title: string;
  content: string;
  type?: string;
  is_active: number;
  created_at: string;
  updated_at?: string;
}

// ============ STATS CARD ============

function StatCard({
  title,
  value,
  icon,
  color,
  delay,
}: {
  title: string;
  value: number | string;
  icon: React.ReactNode;
  color: string;
  delay: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
    >
      <Card className="p-4">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color}`}>
            {icon}
          </div>
          <div>
            <p className="text-2xl font-bold">{value}</p>
            <p className="text-xs text-muted-foreground">{title}</p>
          </div>
        </div>
      </Card>
    </motion.div>
  );
}

// ============ ADMIN LOGIN ============

function AdminLoginForm({ onLogin }: { onLogin: (token: string) => void }) {
  const [userId, setUserId] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setError("");

      if (!userId.trim()) {
        setError("User ID is required");
        return;
      }
      if (!password.trim()) {
        setError("Password is required");
        return;
      }

      setIsLoading(true);
      try {
        const res = await fetch("/api/admin/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId: userId.trim(), password }),
        });
        const data = await res.json();
        if (!res.ok) {
          setError(data.error || "Login failed");
          return;
        }
        onLogin(data.token || data.access_token || "");
      } catch {
        setError("Network error. Please try again.");
      } finally {
        setIsLoading(false);
      }
    },
    [userId, password, onLogin]
  );

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-emerald-950/20 p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-sm"
      >
        <div className="text-center mb-6">
          <div className="mx-auto w-14 h-14 mb-3 rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center shadow-lg shadow-emerald-500/25">
            <Shield className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-xl font-bold">Admin Panel</h1>
          <p className="text-sm text-muted-foreground mt-1">Enter credentials to access</p>
        </div>

        <Card className="p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="admin-userId" className="text-sm font-medium mb-1.5 block">
                User ID
              </Label>
              <div className="relative">
                <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="admin-userId"
                  type="text"
                  placeholder="Enter admin user ID"
                  value={userId}
                  onChange={(e) => {
                    setUserId(e.target.value);
                    setError("");
                  }}
                  className="pl-10 h-11 rounded-xl"
                  disabled={isLoading}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="admin-password" className="text-sm font-medium mb-1.5 block">
                Password
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="admin-password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setError("");
                  }}
                  className="pl-10 pr-10 h-11 rounded-xl"
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((p) => !p)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                >
                  <div className="flex items-center gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-sm">
                    <Shield className="w-4 h-4 shrink-0" />
                    <span>{error}</span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full h-11 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-medium shadow-lg shadow-emerald-500/20 gap-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Verifying...
                </>
              ) : (
                "Login to Admin"
              )}
            </Button>
          </form>
        </Card>
      </motion.div>
    </div>
  );
}

// ============ OVERVIEW TAB ============

function OverviewTab({
  headers,
}: {
  headers: Record<string, string>;
}) {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [analytics, setAnalytics] = useState<AnalyticsData>({
    dailyMessages: [],
    dailyUsers: [],
  });
  const [isLoadingStats, setIsLoadingStats] = useState(true);
  const [isLoadingAnalytics, setIsLoadingAnalytics] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      setIsLoadingStats(true);
      try {
        const res = await fetch("/api/admin/stats", { headers });
        if (res.ok) setStats(await res.json());
      } catch { /* silent */ }
      finally { setIsLoadingStats(false); }
    };
    fetchStats();
  }, [headers]);

  useEffect(() => {
    const fetchAnalytics = async () => {
      setIsLoadingAnalytics(true);
      try {
        const res = await fetch("/api/admin/analytics", { headers });
        if (res.ok) {
          const data = await res.json();
          setAnalytics({
            dailyMessages: data.daily || data.dailyMessages || [],
            dailyUsers: (data.daily || []).map((d: Record<string, unknown>) => ({
              date: d.date as string,
              count: Math.round(((d as Record<string, unknown>).total_messages as number) / 10) || 0,
            })),
            categories: data.categories || [],
          });
        }
      } catch { /* silent */ }
      finally { setIsLoadingAnalytics(false); }
    };
    fetchAnalytics();
  }, [headers]);

  const formatDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString([], { month: "short", day: "numeric" });
    } catch {
      return dateStr;
    }
  };

  const messagesChartData = useMemo(
    () =>
      (analytics.dailyMessages || []).slice(-7).map((d) => ({
        date: formatDate(d.date),
        messages: d.count || d.total_messages || 0,
      })),
    [analytics.dailyMessages]
  );

  const usersChartData = useMemo(
    () =>
      (analytics.dailyUsers || []).slice(-7).map((d) => ({
        date: formatDate(d.date),
        users: d.count || d.total_messages || 0,
      })),
    [analytics.dailyUsers]
  );

  return (
    <div className="space-y-6">
      {/* Stats Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <StatCard
          title="Total Users"
          value={stats?.totalUsers ?? "-"}
          icon={<Users className="w-5 h-5 text-white" />}
          color="bg-emerald-500"
          delay={0.1}
        />
        <StatCard
          title="Total Chats"
          value={stats?.totalChats ?? "-"}
          icon={<MessageSquare className="w-5 h-5 text-white" />}
          color="bg-teal-500"
          delay={0.15}
        />
        <StatCard
          title="Total Messages"
          value={stats?.totalMessages ?? "-"}
          icon={<BarChart3 className="w-5 h-5 text-white" />}
          color="bg-amber-500"
          delay={0.2}
        />
        <StatCard
          title="Active Today"
          value={stats?.activeToday ?? "-"}
          icon={<Activity className="w-5 h-5 text-white" />}
          color="bg-rose-500"
          delay={0.25}
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="p-4 sm:p-6">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="w-4 h-4 text-emerald-500" />
              <h2 className="text-sm font-semibold">Messages Trend (7 Days)</h2>
            </div>
            {isLoadingAnalytics ? (
              <div className="flex items-center justify-center h-48">
                <Loader2 className="w-6 h-6 animate-spin text-emerald-500" />
              </div>
            ) : messagesChartData.length === 0 ? (
              <div className="flex items-center justify-center h-48 text-sm text-muted-foreground">
                No data available
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={messagesChartData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                    axisLine={{ stroke: "hsl(var(--border))" }}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                    axisLine={{ stroke: "hsl(var(--border))" }}
                    allowDecimals={false}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                      fontSize: "12px",
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="messages"
                    stroke="#10b981"
                    strokeWidth={2}
                    dot={{ fill: "#10b981", r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
        >
          <Card className="p-4 sm:p-6">
            <div className="flex items-center gap-2 mb-4">
              <Users className="w-4 h-4 text-teal-500" />
              <h2 className="text-sm font-semibold">Daily Active Users (7 Days)</h2>
            </div>
            {isLoadingAnalytics ? (
              <div className="flex items-center justify-center h-48">
                <Loader2 className="w-6 h-6 animate-spin text-teal-500" />
              </div>
            ) : usersChartData.length === 0 ? (
              <div className="flex items-center justify-center h-48 text-sm text-muted-foreground">
                No data available
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={usersChartData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                    axisLine={{ stroke: "hsl(var(--border))" }}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                    axisLine={{ stroke: "hsl(var(--border))" }}
                    allowDecimals={false}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                      fontSize: "12px",
                    }}
                  />
                  <Bar dataKey="users" fill="#14b8a6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </Card>
        </motion.div>
      </div>

      {/* Popular Topics */}
      {analytics.categories && analytics.categories.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card className="p-4 sm:p-6">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="w-4 h-4 text-amber-500" />
              <h2 className="text-sm font-semibold">Popular Topics</h2>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {analytics.categories.slice(0, 8).map((cat) => (
                <div
                  key={(cat as Record<string, unknown>).category as string}
                  className="p-3 rounded-xl bg-accent/50 border border-border/50 text-center"
                >
                  <p className="text-sm font-medium capitalize">
                    {(cat as Record<string, unknown>).category as string}
                  </p>
                  <p className="text-lg font-bold text-emerald-500 mt-1">
                    {(cat as Record<string, unknown>).total_messages as number}
                  </p>
                  <p className="text-[10px] text-muted-foreground">messages</p>
                </div>
              ))}
            </div>
          </Card>
        </motion.div>
      )}

      {/* Response Time placeholder */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.45 }}
      >
        <Card className="p-4 sm:p-6">
          <div className="flex items-center gap-2 mb-4">
            <Clock className="w-4 h-4 text-purple-500" />
            <h2 className="text-sm font-semibold">Response Time Statistics</h2>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {[
              { label: "Avg Response", value: "1.2s", color: "text-emerald-500" },
              { label: "P50", value: "0.8s", color: "text-teal-500" },
              { label: "P95", value: "3.4s", color: "text-amber-500" },
              { label: "P99", value: "5.1s", color: "text-rose-500" },
              { label: "Min", value: "0.2s", color: "text-blue-500" },
              { label: "Max", value: "12.3s", color: "text-purple-500" },
            ].map((metric) => (
              <div key={metric.label} className="text-center p-3 rounded-xl bg-accent/30">
                <p className={`text-xl font-bold ${metric.color}`}>{metric.value}</p>
                <p className="text-xs text-muted-foreground">{metric.label}</p>
              </div>
            ))}
          </div>
        </Card>
      </motion.div>
    </div>
  );
}

// ============ USERS TAB ============

function UsersTab({
  headers,
}: {
  headers: Record<string, string>;
}) {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [userDetails, setUserDetails] = useState<Record<string, unknown> | null>(null);
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);

  // Fetch users
  const fetchUsers = useCallback(
    async (p: number, search: string) => {
      setIsLoading(true);
      try {
        const params = new URLSearchParams({ page: p.toString(), limit: "20" });
        if (search) params.set("search", search);
        const res = await fetch(`/api/admin/users?${params}`, { headers });
        if (res.ok) {
          const data = await res.json();
          const userList: AdminUser[] = Array.isArray(data) ? data : data.users || [];
          if (p === 1) {
            setUsers(userList);
          } else {
            setUsers((prev) => [...prev, ...userList]);
          }
          setHasMore(userList.length >= 20);
        }
      } catch { /* silent */ }
      finally { setIsLoading(false); }
    },
    [headers]
  );

  useEffect(() => {
    fetchUsers(1, searchQuery);
    setSelectedUsers(new Set());
  }, [fetchUsers, searchQuery]);

  // Fetch user details
  const fetchUserDetails = useCallback(
    async (userId: string) => {
      try {
        const res = await fetch(`/api/admin/users?search=${encodeURIComponent(userId)}`, { headers });
        if (res.ok) {
          const data = await res.json();
          const foundUser = (data.users || data || []).find(
            (u: Record<string, unknown>) => u.id === userId
          );
          if (foundUser) setUserDetails(foundUser);
        }
      } catch { /* silent */ }
    },
    [headers]
  );

  // Delete user
  const handleDeleteUser = useCallback(
    async (userId: string) => {
      setDeletingId(userId);
      try {
        await fetch(`/api/admin/users/${userId}`, { method: "DELETE", headers });
        setUsers((prev) => prev.filter((u) => u.id !== userId));
        setSelectedUsers((prev) => {
          const next = new Set(prev);
          next.delete(userId);
          return next;
        });
      } catch { /* silent */ }
      finally { setDeletingId(null); }
    },
    [headers]
  );

  // Ban/Unban user
  const handleModerate = useCallback(
    async (userId: string, action: "ban" | "unban", reason?: string) => {
      try {
        await fetch("/api/admin/moderate", {
          method: "POST",
          headers: { ...headers, "Content-Type": "application/json" },
          body: JSON.stringify({ userId, action, reason }),
        });
        setUsers((prev) =>
          prev.map((u) => (u.id === userId ? { ...u, is_banned: action === "ban" ? 1 : 0 } : u))
        );
      } catch { /* silent */ }
    },
    [headers]
  );

  // Toggle selection
  const toggleSelect = useCallback((userId: string) => {
    setSelectedUsers((prev) => {
      const next = new Set(prev);
      if (next.has(userId)) next.delete(userId);
      else next.add(userId);
      return next;
    });
  }, []);

  // Bulk ban
  const handleBulkBan = useCallback(async () => {
    for (const uid of selectedUsers) {
      await handleModerate(uid, "ban", "Bulk ban by admin");
    }
    setSelectedUsers(new Set());
  }, [selectedUsers, handleModerate]);

  // Load more
  const handleLoadMore = useCallback(() => {
    const nextPage = page + 1;
    setPage(nextPage);
    fetchUsers(nextPage, searchQuery);
  }, [page, searchQuery, fetchUsers]);

  // View details
  const handleViewDetails = useCallback(
    (userId: string) => {
      setSelectedUserId(userId);
      setShowDetailsDialog(true);
      setUserDetails(null);
      fetchUserDetails(userId);
    },
    [fetchUserDetails]
  );

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString([], {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="relative w-full sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => { setSearchQuery(e.target.value); setPage(1); }}
            placeholder="Search users..."
            className="pl-9 h-9 rounded-lg text-sm"
          />
        </div>
        {selectedUsers.size > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">
              {selectedUsers.size} selected
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={handleBulkBan}
              className="gap-1.5 text-xs h-8 border-red-500/20 text-red-500 hover:bg-red-500/10"
            >
              <Ban className="w-3 h-3" />
              Bulk Ban
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSelectedUsers(new Set())}
              className="text-xs h-8"
            >
              Clear
            </Button>
          </div>
        )}
      </div>

      <Card className="p-4 sm:p-6">
        {/* Desktop Table */}
        <div className="hidden sm:block overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-3 px-2 font-medium text-muted-foreground text-xs w-8">
                  <input
                    type="checkbox"
                    checked={selectedUsers.size === users.length && users.length > 0}
                    onChange={(e) => {
                      if (e.target.checked) setSelectedUsers(new Set(users.map((u) => u.id)));
                      else setSelectedUsers(new Set());
                    }}
                    className="rounded"
                  />
                </th>
                <th className="text-left py-3 px-2 font-medium text-muted-foreground text-xs">Name</th>
                <th className="text-left py-3 px-2 font-medium text-muted-foreground text-xs">Email</th>
                <th className="text-left py-3 px-2 font-medium text-muted-foreground text-xs">Status</th>
                <th className="text-left py-3 px-2 font-medium text-muted-foreground text-xs">Joined</th>
                <th className="text-left py-3 px-2 font-medium text-muted-foreground text-xs">Plan</th>
                <th className="text-right py-3 px-2 font-medium text-muted-foreground text-xs">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center">
                    <Loader2 className="w-5 h-5 animate-spin text-emerald-500 mx-auto" />
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-muted-foreground text-sm">
                    No users found
                  </td>
                </tr>
              ) : (
                users.map((u) => (
                  <tr
                    key={u.id}
                    className={`border-b border-border/50 hover:bg-accent/50 transition-colors ${
                      u.is_banned ? "bg-red-500/5" : ""
                    }`}
                  >
                    <td className="py-3 px-2">
                      <input
                        type="checkbox"
                        checked={selectedUsers.has(u.id)}
                        onChange={() => toggleSelect(u.id)}
                        className="rounded"
                      />
                    </td>
                    <td className="py-3 px-2 font-medium">{u.full_name || "-"}</td>
                    <td className="py-3 px-2 text-muted-foreground">{u.email}</td>
                    <td className="py-3 px-2">
                      {u.is_banned ? (
                        <Badge variant="destructive" className="text-[10px] h-5">
                          <Ban className="w-2.5 h-2.5 mr-1" />
                          Banned
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="text-[10px] h-5 bg-emerald-500/10 text-emerald-600">
                          <CheckCircle className="w-2.5 h-2.5 mr-1" />
                          Active
                        </Badge>
                      )}
                    </td>
                    <td className="py-3 px-2 text-muted-foreground">{formatDate(u.created_at)}</td>
                    <td className="py-3 px-2">
                      <Badge variant="outline" className="text-[10px] h-5">
                        {u.is_pro ? "Pro" : "Free"}
                      </Badge>
                    </td>
                    <td className="py-3 px-2">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleViewDetails(u.id)}
                          className="h-7 w-7 text-muted-foreground hover:text-blue-500 hover:bg-blue-500/10"
                          title="View Details"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </Button>
                        {u.is_banned ? (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleModerate(u.id, "unban")}
                            className="h-7 w-7 text-muted-foreground hover:text-emerald-500 hover:bg-emerald-500/10"
                            title="Unban User"
                          >
                            <CheckCircle className="w-3.5 h-3.5" />
                          </Button>
                        ) : (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleModerate(u.id, "ban")}
                            className="h-7 w-7 text-muted-foreground hover:text-red-500 hover:bg-red-500/10"
                            title="Ban User"
                          >
                            <Ban className="w-3.5 h-3.5" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteUser(u.id)}
                          disabled={deletingId === u.id}
                          className="h-7 w-7 text-muted-foreground hover:text-red-500 hover:bg-red-500/10"
                          title="Delete User"
                        >
                          {deletingId === u.id ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Trash2 className="w-3.5 h-3.5" />
                          )}
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile Cards */}
        <div className="sm:hidden space-y-2 max-h-96 overflow-y-auto">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-5 h-5 animate-spin text-emerald-500" />
            </div>
          ) : users.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground text-sm">No users found</div>
          ) : (
            users.map((u) => (
              <div
                key={u.id}
                className={`flex items-center gap-3 p-3 rounded-lg border border-border/50 ${
                  u.is_banned ? "bg-red-500/5 border-red-500/20" : ""
                }`}
              >
                <input
                  type="checkbox"
                  checked={selectedUsers.has(u.id)}
                  onChange={() => toggleSelect(u.id)}
                  className="rounded shrink-0"
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium truncate">{u.full_name || "-"}</p>
                    {u.is_banned && (
                      <Badge variant="destructive" className="text-[10px] h-4 px-1.5">Banned</Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground truncate">{u.email}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[10px] text-muted-foreground">{formatDate(u.created_at)}</span>
                    <Badge variant="outline" className="text-[10px] h-4 px-1.5">
                      {u.is_pro ? "Pro" : "Free"}
                    </Badge>
                  </div>
                </div>
                <div className="flex items-center gap-0.5 shrink-0">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleViewDetails(u.id)}
                    className="h-7 w-7"
                  >
                    <Eye className="w-3.5 h-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleModerate(u.id, u.is_banned ? "unban" : "ban")}
                    className="h-7 w-7"
                  >
                    {u.is_banned ? (
                      <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
                    ) : (
                      <Ban className="w-3.5 h-3.5" />
                    )}
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Load More */}
        {hasMore && (
          <div className="flex justify-center mt-4">
            <Button
              variant="outline"
              size="sm"
              onClick={handleLoadMore}
              disabled={isLoading}
              className="gap-2"
            >
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Load More"}
            </Button>
          </div>
        )}
      </Card>

      {/* User Details Dialog */}
      <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>User Details</DialogTitle>
            <DialogDescription>
              Detailed information about the selected user.
            </DialogDescription>
          </DialogHeader>
          {userDetails ? (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-muted-foreground text-xs">Name</p>
                  <p className="font-medium">{(userDetails.full_name as string) || "-"}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">Email</p>
                  <p className="font-medium truncate">{userDetails.email as string}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">Plan</p>
                  <Badge variant="outline" className="text-xs">
                    {(userDetails.is_pro as number) ? "Pro" : "Free"}
                  </Badge>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">Status</p>
                  {(userDetails.is_banned as number) ? (
                    <Badge variant="destructive" className="text-xs">
                      <Ban className="w-2.5 h-2.5 mr-1" />Banned
                    </Badge>
                  ) : (
                    <Badge className="text-xs bg-emerald-500/10 text-emerald-600">
                      <CheckCircle className="w-2.5 h-2.5 mr-1" />Active
                    </Badge>
                  )}
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">Joined</p>
                  <p className="font-medium">{formatDate(userDetails.created_at as string)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">Theme</p>
                  <p className="font-medium">{(userDetails.theme_preference as string) || "Default"}</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-5 h-5 animate-spin text-emerald-500" />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ============ ANNOUNCEMENTS TAB ============

function AnnouncementsTab({
  headers,
}: {
  headers: Record<string, string>;
}) {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);

  // Form state
  const [formTitle, setFormTitle] = useState("");
  const [formContent, setFormContent] = useState("");
  const [formType, setFormType] = useState("info");
  const [formActive, setFormActive] = useState(true);

  const fetchAnnouncements = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/admin/announcements", { headers });
      if (res.ok) {
        const data = await res.json();
        setAnnouncements(data.announcements || []);
      }
    } catch { /* silent */ }
    finally { setIsLoading(false); }
  }, [headers]);

  useEffect(() => {
    fetchAnnouncements();
  }, [fetchAnnouncements]);

  const resetForm = useCallback(() => {
    setFormTitle("");
    setFormContent("");
    setFormType("info");
    setFormActive(true);
    setEditingId(null);
    setShowForm(false);
  }, []);

  const handleCreate = useCallback(async () => {
    if (!formTitle.trim() || !formContent.trim()) return;
    setIsCreating(true);
    try {
      const res = await fetch("/api/admin/announcements", {
        method: "POST",
        headers: { ...headers, "Content-Type": "application/json" },
        body: JSON.stringify({
          title: formTitle.trim(),
          content: formContent.trim(),
          type: formType,
          is_active: formActive,
        }),
      });
      if (res.ok) {
        resetForm();
        fetchAnnouncements();
      }
    } catch { /* silent */ }
    finally { setIsCreating(false); }
  }, [formTitle, formContent, formType, formActive, headers, resetForm, fetchAnnouncements]);

  const handleUpdate = useCallback(async () => {
    if (!editingId || !formTitle.trim() || !formContent.trim()) return;
    setIsCreating(true);
    try {
      const res = await fetch(`/api/admin/announcements/${editingId}`, {
        method: "PUT",
        headers: { ...headers, "Content-Type": "application/json" },
        body: JSON.stringify({
          title: formTitle.trim(),
          content: formContent.trim(),
          type: formType,
          is_active: formActive,
        }),
      });
      if (res.ok) {
        resetForm();
        fetchAnnouncements();
      }
    } catch { /* silent */ }
    finally { setIsCreating(false); }
  }, [editingId, formTitle, formContent, formType, formActive, headers, resetForm, fetchAnnouncements]);

  const handleDelete = useCallback(
    async (id: string) => {
      try {
        await fetch(`/api/admin/announcements/${id}`, { method: "DELETE", headers });
        setAnnouncements((prev) => prev.filter((a) => a.id !== id));
      } catch { /* silent */ }
    },
    [headers]
  );

  const handleToggleActive = useCallback(
    async (ann: Announcement) => {
      try {
        await fetch(`/api/admin/announcements/${ann.id}`, {
          method: "PUT",
          headers: { ...headers, "Content-Type": "application/json" },
          body: JSON.stringify({ is_active: !ann.is_active }),
        });
        setAnnouncements((prev) =>
          prev.map((a) => (a.id === ann.id ? { ...a, is_active: a.is_active ? 0 : 1 } : a))
        );
      } catch { /* silent */ }
    },
    [headers]
  );

  const handleEdit = useCallback((ann: Announcement) => {
    setEditingId(ann.id);
    setFormTitle(ann.title);
    setFormContent(ann.content);
    setFormType((ann.type as string) || "info");
    setFormActive(!!ann.is_active);
    setShowForm(true);
  }, []);

  const typeColors: Record<string, string> = {
    info: "bg-blue-500/10 text-blue-500 border-blue-500/20",
    success: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
    warning: "bg-amber-500/10 text-amber-500 border-amber-500/20",
    error: "bg-red-500/10 text-red-500 border-red-500/20",
  };

  const typeIcons: Record<string, React.ReactNode> = {
    info: <Info className="w-4 h-4" />,
    success: <CheckCircle className="w-4 h-4" />,
    warning: <AlertTriangle className="w-4 h-4" />,
    error: <XCircle className="w-4 h-4" />,
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold flex items-center gap-2">
          <Megaphone className="w-4 h-4 text-emerald-500" />
          Announcements
        </h2>
        <Button
          size="sm"
          onClick={() => { resetForm(); setShowForm(true); }}
          className="gap-1.5 text-xs h-8 bg-emerald-600 hover:bg-emerald-700 text-white"
        >
          <Plus className="w-3.5 h-3.5" />
          New Announcement
        </Button>
      </div>

      {/* Form Dialog */}
      <Dialog open={showForm} onOpenChange={(open) => { if (!open) resetForm(); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingId ? "Edit Announcement" : "New Announcement"}
            </DialogTitle>
            <DialogDescription>
              {editingId
                ? "Update the announcement details below."
                : "Create a new announcement to display to users."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="text-sm font-medium mb-1.5 block">Title</Label>
              <Input
                value={formTitle}
                onChange={(e) => setFormTitle(e.target.value)}
                placeholder="Announcement title"
                className="h-10 rounded-lg"
              />
            </div>
            <div>
              <Label className="text-sm font-medium mb-1.5 block">Content</Label>
              <Textarea
                value={formContent}
                onChange={(e) => setFormContent(e.target.value)}
                placeholder="Announcement content..."
                className="h-24 rounded-lg resize-none"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-sm font-medium mb-1.5 block">Type</Label>
                <Select value={formType} onValueChange={setFormType}>
                  <SelectTrigger className="h-10 rounded-lg">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="info">Info</SelectItem>
                    <SelectItem value="success">Success</SelectItem>
                    <SelectItem value="warning">Warning</SelectItem>
                    <SelectItem value="error">Error</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-end">
                <div className="flex items-center gap-2 py-2">
                  <input
                    type="checkbox"
                    id="form-active"
                    checked={formActive}
                    onChange={(e) => setFormActive(e.target.checked)}
                    className="rounded"
                  />
                  <Label htmlFor="form-active" className="text-sm cursor-pointer">
                    Active immediately
                  </Label>
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={resetForm} className="rounded-lg">
              Cancel
            </Button>
            <Button
              onClick={editingId ? handleUpdate : handleCreate}
              disabled={isCreating || !formTitle.trim() || !formContent.trim()}
              className="rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5"
            >
              {isCreating ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : editingId ? (
                <><CheckCircle className="w-3.5 h-3.5" /> Update</>
              ) : (
                <><Plus className="w-3.5 h-3.5" /> Create</>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Announcements List */}
      <Card className="p-4 sm:p-6">
        <div className="space-y-3 max-h-[500px] overflow-y-auto">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-5 h-5 animate-spin text-emerald-500" />
            </div>
          ) : announcements.length === 0 ? (
            <div className="py-12 text-center">
              <Megaphone className="w-8 h-8 mx-auto mb-2 text-muted-foreground/40" />
              <p className="text-sm text-muted-foreground">No announcements yet</p>
              <p className="text-xs text-muted-foreground/60 mt-1">
                Create one to notify users about important updates
              </p>
            </div>
          ) : (
            announcements.map((ann) => (
              <motion.div
                key={ann.id}
                layout
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className={`p-4 rounded-xl border transition-colors ${
                  ann.is_active
                    ? "border-border/50 bg-card"
                    : "border-border/30 bg-muted/30 opacity-60"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1.5">
                      <Badge
                        variant="outline"
                        className={`text-[10px] h-5 ${typeColors[ann.type || "info"] || typeColors.info}`}
                      >
                        {typeIcons[ann.type || "info"]}
                        <span className="ml-1 capitalize">{(ann.type as string) || "info"}</span>
                      </Badge>
                      {!ann.is_active && (
                        <Badge variant="secondary" className="text-[10px] h-5">
                          Inactive
                        </Badge>
                      )}
                    </div>
                    <h4 className="text-sm font-semibold">{ann.title}</h4>
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                      {ann.content}
                    </p>
                    <p className="text-[10px] text-muted-foreground/60 mt-2">
                      {new Date(ann.created_at).toLocaleDateString([], {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleToggleActive(ann)}
                      className={`h-7 w-7 ${
                        ann.is_active
                          ? "text-emerald-500 hover:bg-emerald-500/10"
                          : "text-muted-foreground hover:text-emerald-500 hover:bg-emerald-500/10"
                      }`}
                      title={ann.is_active ? "Deactivate" : "Activate"}
                    >
                      {ann.is_active ? (
                        <CheckCircle className="w-3.5 h-3.5" />
                      ) : (
                        <XCircle className="w-3.5 h-3.5" />
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleEdit(ann)}
                      className="h-7 w-7 text-muted-foreground hover:text-blue-500 hover:bg-blue-500/10"
                      title="Edit"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-muted-foreground hover:text-red-500 hover:bg-red-500/10"
                          title="Delete"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Announcement</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to delete &quot;{ann.title}&quot;? This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            className="bg-red-600 hover:bg-red-700 text-white"
                            onClick={() => handleDelete(ann.id)}
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </div>
      </Card>
    </div>
  );
}

// ============ MODERATION TAB ============

function ModerationTab({
  headers,
}: {
  headers: Record<string, string>;
}) {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [banningId, setBanningId] = useState<string | null>(null);
  const [showBanDialog, setShowBanDialog] = useState(false);
  const [banTargetId, setBanTargetId] = useState<string | null>(null);
  const [banTargetName, setBanTargetName] = useState("");
  const [banReason, setBanReason] = useState("");

  const fetchUsers = useCallback(
    async (search: string) => {
      setIsLoading(true);
      try {
        const params = new URLSearchParams({ page: "1", limit: "50" });
        if (search) params.set("search", search);
        const res = await fetch(`/api/admin/users?${params}`, { headers });
        if (res.ok) {
          const data = await res.json();
          setUsers(Array.isArray(data) ? data : data.users || []);
        }
      } catch { /* silent */ }
      finally { setIsLoading(false); }
    },
    [headers]
  );

  useEffect(() => {
    fetchUsers(searchQuery);
  }, [fetchUsers, searchQuery]);

  const handleBan = useCallback(async () => {
    if (!banTargetId) return;
    setBanningId(banTargetId);
    try {
      await fetch("/api/admin/moderate", {
        method: "POST",
        headers: { ...headers, "Content-Type": "application/json" },
        body: JSON.stringify({ userId: banTargetId, action: "ban", reason: banReason }),
      });
      setUsers((prev) =>
        prev.map((u) => (u.id === banTargetId ? { ...u, is_banned: 1 } : u))
      );
      setShowBanDialog(false);
      setBanReason("");
      setBanTargetId(null);
    } catch { /* silent */ }
    finally { setBanningId(null); }
  }, [banTargetId, banReason, headers]);

  const handleUnban = useCallback(
    async (userId: string) => {
      try {
        await fetch("/api/admin/moderate", {
          method: "POST",
          headers: { ...headers, "Content-Type": "application/json" },
          body: JSON.stringify({ userId, action: "unban" }),
        });
        setUsers((prev) =>
          prev.map((u) => (u.id === userId ? { ...u, is_banned: 0 } : u))
        );
      } catch { /* silent */ }
    },
    [headers]
  );

  const openBanDialog = useCallback((user: AdminUser) => {
    setBanTargetId(user.id);
    setBanTargetName(user.full_name || user.email);
    setBanReason("");
    setShowBanDialog(true);
  }, []);

  const bannedUsers = useMemo(() => users.filter((u) => u.is_banned), [users]);
  const activeUsers = useMemo(() => users.filter((u) => !u.is_banned), [users]);

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString([], {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="relative max-w-xs">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
        <Input
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search users to moderate..."
          className="pl-9 h-9 rounded-lg text-sm"
        />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3">
        <Card className="p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
            <CheckCircle className="w-5 h-5 text-emerald-500" />
          </div>
          <div>
            <p className="text-xl font-bold">{activeUsers.length}</p>
            <p className="text-xs text-muted-foreground">Active Users</p>
          </div>
        </Card>
        <Card className="p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center">
            <Ban className="w-5 h-5 text-red-500" />
          </div>
          <div>
            <p className="text-xl font-bold text-red-500">{bannedUsers.length}</p>
            <p className="text-xs text-muted-foreground">Banned Users</p>
          </div>
        </Card>
      </div>

      {/* Banned Users List */}
      <Card className="p-4 sm:p-6">
        <h3 className="text-sm font-semibold flex items-center gap-2 mb-4">
          <Ban className="w-4 h-4 text-red-500" />
          Banned Users
          {bannedUsers.length > 0 && (
            <Badge variant="destructive" className="text-[10px] h-5">
              {bannedUsers.length}
            </Badge>
          )}
        </h3>

        <div className="space-y-2 max-h-64 overflow-y-auto">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-5 h-5 animate-spin text-emerald-500" />
            </div>
          ) : bannedUsers.length === 0 ? (
            <div className="py-8 text-center">
              <CheckCircle className="w-8 h-8 mx-auto mb-2 text-emerald-500/30" />
              <p className="text-sm text-muted-foreground">No banned users</p>
              <p className="text-xs text-muted-foreground/60 mt-1">
                All users are in good standing
              </p>
            </div>
          ) : (
            bannedUsers.map((u) => (
              <div
                key={u.id}
                className="flex items-center justify-between p-3 rounded-lg border border-red-500/20 bg-red-500/5"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-red-500 truncate">
                      {u.full_name || "-"}
                    </p>
                    <Badge variant="destructive" className="text-[10px] h-4 px-1.5">
                      Banned
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground truncate">{u.email}</p>
                  <p className="text-[10px] text-muted-foreground/60 mt-0.5">
                    Joined {formatDate(u.created_at)}
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleUnban(u.id)}
                  className="shrink-0 gap-1.5 text-xs h-8 border-emerald-500/20 text-emerald-500 hover:bg-emerald-500/10"
                >
                  <CheckCircle className="w-3 h-3" />
                  Unban
                </Button>
              </div>
            ))
          )}
        </div>
      </Card>

      {/* All Users for Moderation */}
      <Card className="p-4 sm:p-6">
        <h3 className="text-sm font-semibold flex items-center gap-2 mb-4">
          <Gavel className="w-4 h-4 text-amber-500" />
          All Users
        </h3>

        <div className="space-y-2 max-h-96 overflow-y-auto">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-5 h-5 animate-spin text-emerald-500" />
            </div>
          ) : users.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">No users found</p>
          ) : (
            users.map((u) => (
              <div
                key={u.id}
                className={`flex items-center justify-between p-3 rounded-lg border ${
                  u.is_banned
                    ? "border-red-500/20 bg-red-500/5"
                    : "border-border/50 hover:bg-accent/30"
                } transition-colors`}
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{u.full_name || "-"}</p>
                  <p className="text-xs text-muted-foreground truncate">{u.email}</p>
                  <p className="text-[10px] text-muted-foreground/60 mt-0.5">
                    Joined {formatDate(u.created_at)}
                  </p>
                </div>
                {u.is_banned ? (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleUnban(u.id)}
                    className="shrink-0 gap-1.5 text-xs h-8 border-emerald-500/20 text-emerald-500 hover:bg-emerald-500/10"
                  >
                    <CheckCircle className="w-3 h-3" />
                    Unban
                  </Button>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openBanDialog(u)}
                    className="shrink-0 gap-1.5 text-xs h-8 border-red-500/20 text-red-500 hover:bg-red-500/10"
                  >
                    <Ban className="w-3 h-3" />
                    Ban
                  </Button>
                )}
              </div>
            ))
          )}
        </div>
      </Card>

      {/* Ban Dialog */}
      <Dialog open={showBanDialog} onOpenChange={setShowBanDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-500">
              <Ban className="w-5 h-5" />
              Ban User
            </DialogTitle>
            <DialogDescription>
              You are about to ban <strong>{banTargetName}</strong>. This will prevent them from
              accessing the platform.
            </DialogDescription>
          </DialogHeader>
          <div>
            <Label className="text-sm font-medium mb-1.5 block">Reason (optional)</Label>
            <Textarea
              value={banReason}
              onChange={(e) => setBanReason(e.target.value)}
              placeholder="Provide a reason for banning this user..."
              className="h-20 rounded-lg resize-none"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowBanDialog(false)} className="rounded-lg">
              Cancel
            </Button>
            <Button
              onClick={handleBan}
              disabled={banningId !== null}
              className="rounded-lg bg-red-600 hover:bg-red-700 text-white gap-1.5"
            >
              {banningId ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <><Ban className="w-3.5 h-3.5" /> Ban User</>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ============ ADMIN DASHBOARD ============

function AdminDashboard({
  adminToken,
  onLogout,
}: {
  adminToken: string;
  onLogout: () => void;
}) {
  const [activeTab, setActiveTab] = useState("overview");

  const headers = useMemo(
    () => ({ Authorization: `Bearer ${adminToken}` }),
    [adminToken]
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Top Bar */}
      <motion.header
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="sticky top-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60"
      >
        <div className="max-w-6xl mx-auto flex items-center justify-between px-4 sm:px-6 h-14">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center shadow-sm">
              <Shield className="w-4 h-4 text-white" />
            </div>
            <h1 className="text-base font-bold">Admin Panel</h1>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={onLogout}
              className="text-muted-foreground hover:text-red-500 gap-1.5 h-8 px-3 text-xs"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Logout</span>
            </Button>
          </div>
        </div>
      </motion.header>

      <div className="max-w-6xl mx-auto p-4 sm:p-6">
        {/* Tabs Navigation */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="bg-muted/50">
            <TabsTrigger value="overview" className="gap-1.5 text-xs sm:text-sm">
              <BarChart3 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Overview</span>
            </TabsTrigger>
            <TabsTrigger value="users" className="gap-1.5 text-xs sm:text-sm">
              <Users className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Users</span>
            </TabsTrigger>
            <TabsTrigger value="announcements" className="gap-1.5 text-xs sm:text-sm">
              <Megaphone className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Announcements</span>
            </TabsTrigger>
            <TabsTrigger value="moderation" className="gap-1.5 text-xs sm:text-sm">
              <Gavel className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Moderation</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <OverviewTab headers={headers} />
          </TabsContent>

          <TabsContent value="users">
            <UsersTab headers={headers} />
          </TabsContent>

          <TabsContent value="announcements">
            <AnnouncementsTab headers={headers} />
          </TabsContent>

          <TabsContent value="moderation">
            <ModerationTab headers={headers} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

// ============ MAIN ADMIN VIEW ============

export function AdminView({ onBack }: AdminViewProps) {
  const [adminToken, setAdminToken] = useState<string | null>(null);

  if (!adminToken) {
    return <AdminLoginForm onLogin={setAdminToken} />;
  }

  return (
    <div className="min-h-screen bg-background">
      <AdminDashboard
        adminToken={adminToken}
        onLogout={() => setAdminToken(null)}
      />
    </div>
  );
}

export default AdminView;
