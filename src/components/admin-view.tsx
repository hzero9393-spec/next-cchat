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
  ChevronLeft,
  BarChart3,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
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
  created_at: string;
  chat_count?: number;
}

interface AdminViewProps {
  onBack: () => void;
}

interface AnalyticsData {
  dailyMessages: { date: string; count: number }[];
  dailyUsers: { date: string; count: number }[];
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
          <div
            className={`w-10 h-10 rounded-xl flex items-center justify-center ${color}`}
          >
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
          <p className="text-sm text-muted-foreground mt-1">
            Enter credentials to access
          </p>
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
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
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

// ============ ADMIN DASHBOARD ============

function AdminDashboard({
  adminToken,
  onLogout,
}: {
  adminToken: string;
  onLogout: () => void;
}) {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [analytics, setAnalytics] = useState<AnalyticsData>({
    dailyMessages: [],
    dailyUsers: [],
  });
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoadingStats, setIsLoadingStats] = useState(true);
  const [isLoadingUsers, setIsLoadingUsers] = useState(true);
  const [isLoadingAnalytics, setIsLoadingAnalytics] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const headers = useMemo(
    () => ({ Authorization: `Bearer ${adminToken}` }),
    [adminToken]
  );

  // Fetch stats
  useEffect(() => {
    const fetchStats = async () => {
      setIsLoadingStats(true);
      try {
        const res = await fetch("/api/admin/stats", { headers });
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
  }, [headers]);

  // Fetch users
  const fetchUsers = useCallback(
    async (p: number, search: string) => {
      setIsLoadingUsers(true);
      try {
        const params = new URLSearchParams({
          page: p.toString(),
          limit: "20",
        });
        if (search) params.set("search", search);
        const res = await fetch(`/api/admin/users?${params}`, { headers });
        if (res.ok) {
          const data = await res.json();
          const userList = Array.isArray(data) ? data : data.users || [];
          if (p === 1) {
            setUsers(userList);
          } else {
            setUsers((prev) => [...prev, ...userList]);
          }
          setHasMore(userList.length >= 20);
        }
      } catch {
        // silent
      } finally {
        setIsLoadingUsers(false);
      }
    },
    [headers]
  );

  useEffect(() => {
    fetchUsers(1, searchQuery);
  }, [fetchUsers, searchQuery]);

  // Fetch analytics
  useEffect(() => {
    const fetchAnalytics = async () => {
      setIsLoadingAnalytics(true);
      try {
        const res = await fetch("/api/admin/analytics", { headers });
        if (res.ok) {
          const data = await res.json();
          setAnalytics({
            dailyMessages: data.dailyMessages || data.daily_messages || [],
            dailyUsers: data.dailyUsers || data.daily_users || [],
          });
        }
      } catch {
        // silent
      } finally {
        setIsLoadingAnalytics(false);
      }
    };
    fetchAnalytics();
  }, [headers]);

  // Delete user
  const handleDeleteUser = useCallback(
    async (userId: string) => {
      setDeletingId(userId);
      try {
        await fetch(`/api/admin/users/${userId}`, {
          method: "DELETE",
          headers,
        });
        setUsers((prev) => prev.filter((u) => u.id !== userId));
      } catch {
        // silent
      } finally {
        setDeletingId(null);
      }
    },
    [headers]
  );

  // Load more
  const handleLoadMore = useCallback(() => {
    const nextPage = page + 1;
    setPage(nextPage);
    fetchUsers(nextPage, searchQuery);
  }, [page, searchQuery, fetchUsers]);

  // Format chart date
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
        messages: d.count,
      })),
    [analytics.dailyMessages]
  );

  const usersChartData = useMemo(
    () =>
      (analytics.dailyUsers || []).slice(-7).map((d) => ({
        date: formatDate(d.date),
        users: d.count,
      })),
    [analytics.dailyUsers]
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

      <div className="max-w-6xl mx-auto p-4 sm:p-6 space-y-6">
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

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Messages Trend */}
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

          {/* Users Joined */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
          >
            <Card className="p-4 sm:p-6">
              <div className="flex items-center gap-2 mb-4">
                <Users className="w-4 h-4 text-teal-500" />
                <h2 className="text-sm font-semibold">Users Joined (7 Days)</h2>
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
                    <Bar
                      dataKey="users"
                      fill="#14b8a6"
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </Card>
          </motion.div>
        </div>

        {/* Users Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card className="p-4 sm:p-6">
            <div className="flex items-center justify-between gap-4 mb-4">
              <h2 className="text-sm font-semibold flex items-center gap-2">
                <Users className="w-4 h-4 text-muted-foreground" />
                Users
              </h2>
              <div className="relative w-full max-w-xs">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                <Input
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setPage(1);
                  }}
                  placeholder="Search users..."
                  className="pl-9 h-9 rounded-lg text-sm"
                />
              </div>
            </div>

            {/* Desktop Table */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-3 px-2 font-medium text-muted-foreground text-xs">
                      Name
                    </th>
                    <th className="text-left py-3 px-2 font-medium text-muted-foreground text-xs">
                      Email
                    </th>
                    <th className="text-left py-3 px-2 font-medium text-muted-foreground text-xs">
                      Joined
                    </th>
                    <th className="text-left py-3 px-2 font-medium text-muted-foreground text-xs">
                      Chats
                    </th>
                    <th className="text-right py-3 px-2 font-medium text-muted-foreground text-xs">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {isLoadingUsers ? (
                    <tr>
                      <td colSpan={5} className="py-12 text-center">
                        <Loader2 className="w-5 h-5 animate-spin text-emerald-500 mx-auto" />
                      </td>
                    </tr>
                  ) : users.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-12 text-center text-muted-foreground text-sm">
                        No users found
                      </td>
                    </tr>
                  ) : (
                    users.map((u) => (
                      <tr
                        key={u.id}
                        className="border-b border-border/50 hover:bg-accent/50 transition-colors"
                      >
                        <td className="py-3 px-2 font-medium">
                          {u.full_name || "-"}
                        </td>
                        <td className="py-3 px-2 text-muted-foreground">{u.email}</td>
                        <td className="py-3 px-2 text-muted-foreground">
                          {new Date(u.created_at).toLocaleDateString([], {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </td>
                        <td className="py-3 px-2">
                          <Badge variant="secondary" className="text-xs">
                            {u.chat_count ?? 0}
                          </Badge>
                        </td>
                        <td className="py-3 px-2 text-right">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteUser(u.id)}
                            disabled={deletingId === u.id}
                            className="h-8 w-8 text-muted-foreground hover:text-red-500 hover:bg-red-500/10"
                          >
                            {deletingId === u.id ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <Trash2 className="w-4 h-4" />
                            )}
                          </Button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards */}
            <div className="sm:hidden space-y-2 max-h-96 overflow-y-auto">
              {isLoadingUsers ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-5 h-5 animate-spin text-emerald-500" />
                </div>
              ) : users.length === 0 ? (
                <div className="py-12 text-center text-muted-foreground text-sm">
                  No users found
                </div>
              ) : (
                users.map((u) => (
                  <div
                    key={u.id}
                    className="flex items-center justify-between p-3 rounded-lg border border-border/50"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{u.full_name || "-"}</p>
                      <p className="text-xs text-muted-foreground truncate">{u.email}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[10px] text-muted-foreground">
                          {new Date(u.created_at).toLocaleDateString([], {
                            month: "short",
                            day: "numeric",
                          })}
                        </span>
                        <Badge variant="secondary" className="text-[10px] h-4">
                          {u.chat_count ?? 0} chats
                        </Badge>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDeleteUser(u.id)}
                      disabled={deletingId === u.id}
                      className="h-8 w-8 text-muted-foreground hover:text-red-500 hover:bg-red-500/10 shrink-0"
                    >
                      {deletingId === u.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Trash2 className="w-4 h-4" />
                      )}
                    </Button>
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
                  disabled={isLoadingUsers}
                  className="gap-2"
                >
                  {isLoadingUsers ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    "Load More"
                  )}
                </Button>
              </div>
            )}
          </Card>
        </motion.div>
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
