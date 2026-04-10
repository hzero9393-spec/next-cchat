"use client";

import React, { useState, useEffect, useCallback } from "react";
import { AnimatePresence, motion } from "framer-motion";
import dynamic from "next/dynamic";
import { AuthView } from "@/components/auth-view";
import { DashboardView } from "@/components/dashboard-view";
import { AdminView } from "@/components/admin-view";
import { ProfileView } from "@/components/profile-view";

// Dynamically import Three.js scene (heavy, SSR-incompatible)
const ThreeScene = dynamic(
  () => import("@/components/three-scene").then((mod) => mod.ThreeScene),
  { ssr: false }
);

// ============ TYPES ============

type View = "landing" | "auth" | "dashboard" | "admin" | "profile";

interface UserData {
  id: string;
  email: string;
  full_name: string;
  avatar_url: string;
  theme_preference: string;
}

// ============ MAIN APP ============

export default function HomePage() {
  const [view, setView] = useState<View>("landing");
  const [user, setUser] = useState<UserData | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const [threeLoaded, setThreeLoaded] = useState(false);

  // Check hash on mount → if #admin, show admin panel
  useEffect(() => {
    const checkSession = async () => {
      try {
        // Check for #admin hash first
        if (window.location.hash === "#admin") {
          setView("admin");
          setMounted(true);
          return;
        }

        const savedToken = localStorage.getItem("nextchat_token");
        const savedUser = localStorage.getItem("nextchat_user");
        if (savedToken && savedUser) {
          const res = await fetch("/api/auth/me", {
            headers: { Authorization: `Bearer ${savedToken}` },
          });
          if (res.ok) {
            const data = await res.json();
            setToken(savedToken);
            setUser(data.user || JSON.parse(savedUser));
            setView("dashboard");
          } else {
            localStorage.removeItem("nextchat_token");
            localStorage.removeItem("nextchat_user");
          }
        }
      } catch {
        // ignore
      } finally {
        setMounted(true);
      }
    };
    checkSession();
  }, []);

  // Listen for hash changes
  useEffect(() => {
    const handleHash = () => {
      if (window.location.hash === "#admin") {
        setView("admin");
      }
    };
    window.addEventListener("hashchange", handleHash);
    return () => window.removeEventListener("hashchange", handleHash);
  }, []);

  // Handle login
  const handleLogin = useCallback((newToken: string, newUser: UserData) => {
    setToken(newToken);
    setUser(newUser);
    setView("dashboard");
    try {
      localStorage.setItem("nextchat_token", newToken);
      localStorage.setItem("nextchat_user", JSON.stringify(newUser));
    } catch {}
  }, []);

  // Handle logout
  const handleLogout = useCallback(() => {
    setToken(null);
    setUser(null);
    setView("landing");
    try {
      localStorage.removeItem("nextchat_token");
      localStorage.removeItem("nextchat_user");
    } catch {}
  }, []);

  // Handle profile back
  const handleProfileBack = useCallback(() => {
    setView("dashboard");
  }, []);

  // Handle theme change
  const handleThemeChange = useCallback((theme: string) => {
    if (user) {
      setUser({ ...user, theme_preference: theme });
    }
  }, [user]);

  // Handle admin back
  const handleAdminBack = useCallback(() => {
    window.location.hash = "";
    setView("landing");
  }, []);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <AnimatePresence mode="wait">
        {/* Landing Page with 3D */}
        {view === "landing" && mounted && (
          <motion.div
            key="landing"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="relative min-h-screen w-full"
          >
            {/* 3D Background */}
            <div className="absolute inset-0 z-0">
              {threeLoaded ? null : (
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-950 via-slate-950 to-teal-950" />
              )}
              <ThreeScene
                className="w-full h-full"
                style={{ position: "absolute", inset: 0 }}
              />
              <iframe
                title="three-loader"
                style={{ display: "none" }}
                onLoad={() => setThreeLoaded(true)}
                srcDoc=""
              />
            </div>

            {/* Landing Content Overlay */}
            <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-4">
              <motion.div
                initial={{ y: 30, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.3, duration: 0.8 }}
                className="text-center max-w-lg"
              >
                {/* Logo */}
                <motion.div
                  initial={{ scale: 0.5 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                  className="mx-auto w-20 h-20 mb-8 rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center shadow-2xl shadow-emerald-500/30"
                >
                  <svg
                    viewBox="0 0 24 24"
                    className="w-10 h-10 text-white"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                  </svg>
                </motion.div>

                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-4 bg-gradient-to-r from-emerald-300 via-teal-200 to-cyan-300 bg-clip-text text-transparent">
                  NextChat
                </h1>
                <p className="text-lg sm:text-xl text-white/70 mb-2">
                  AI-Powered Conversations
                </p>
                <p className="text-sm text-white/50 mb-10 max-w-sm mx-auto">
                  Experience the future of chat with real-time AI responses, deep research mode, and beautiful 3D animations.
                </p>

                {/* CTA Button */}
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setView("auth")}
                  className="px-8 py-4 bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-semibold rounded-2xl shadow-lg shadow-emerald-500/30 hover:shadow-emerald-500/50 transition-all duration-300 text-lg"
                >
                  Get Started
                </motion.button>

                {/* Feature badges */}
                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.8, duration: 0.6 }}
                  className="flex flex-wrap justify-center gap-3 mt-12"
                >
                  {["AI Chat", "Deep Research", "Real-time Streaming", "Analytics"].map((feature, i) => (
                    <span
                      key={i}
                      className="px-4 py-1.5 rounded-full bg-white/10 backdrop-blur-sm text-white/70 text-xs border border-white/10"
                    >
                      {feature}
                    </span>
                  ))}
                </motion.div>
              </motion.div>
            </div>
          </motion.div>
        )}

        {/* Auth View */}
        {view === "auth" && mounted && (
          <motion.div
            key="auth"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-950 via-slate-950 to-teal-950 px-4"
          >
            <button
              onClick={() => setView("landing")}
              className="absolute top-6 left-6 text-white/60 hover:text-white transition-colors text-sm flex items-center gap-2"
            >
              ← Back
            </button>
            <AuthView onLogin={handleLogin} />
          </motion.div>
        )}

        {/* Dashboard View */}
        {view === "dashboard" && mounted && user && token && (
          <motion.div
            key="dashboard"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="min-h-screen"
          >
            <DashboardView
              user={user}
              token={token}
              onLogout={handleLogout}
              onProfile={() => setView("profile")}
            />
          </motion.div>
        )}

        {/* Profile View */}
        {view === "profile" && mounted && user && token && (
          <motion.div
            key="profile"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            className="min-h-screen bg-background"
          >
            <ProfileView
              user={user}
              token={token}
              onBack={handleProfileBack}
              onLogout={handleLogout}
              onThemeChange={handleThemeChange}
            />
          </motion.div>
        )}

        {/* Admin View — only via #admin hash */}
        {view === "admin" && mounted && (
          <motion.div
            key="admin"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="min-h-screen bg-background"
          >
            <AdminView onBack={handleAdminBack} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Loading state before mounted */}
      {!mounted && (
        <div className="min-h-screen flex items-center justify-center bg-slate-950">
          <div className="animate-spin w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full" />
        </div>
      )}
    </div>
  );
}
