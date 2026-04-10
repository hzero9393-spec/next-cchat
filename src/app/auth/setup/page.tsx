"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Copy,
  Check,
  Database,
  Shield,
  Key,
  ArrowRight,
  Loader2,
  AlertCircle,
  CheckCircle2,
  ExternalLink,
} from "lucide-react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";

const SQL_SCHEMA = `-- ============================================
-- AI Chat Database Schema
-- Run this in Supabase SQL Editor
-- ============================================

CREATE TABLE IF NOT EXISTS chats (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT DEFAULT 'New Chat',
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE TABLE IF NOT EXISTS messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  chat_id UUID REFERENCES chats(id) ON DELETE CASCADE NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Enable Row Level Security
ALTER TABLE chats ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Chat policies
CREATE POLICY "Users can view own chats" ON chats FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own chats" ON chats FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own chats" ON chats FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own chats" ON chats FOR DELETE USING (auth.uid() = user_id);

-- Message policies
CREATE POLICY "Users can view own messages" ON messages FOR SELECT USING (
  chat_id IN (SELECT id FROM chats WHERE user_id = auth.uid())
);
CREATE POLICY "Users can insert own messages" ON messages FOR INSERT WITH CHECK (
  chat_id IN (SELECT id FROM chats WHERE user_id = auth.uid())
);
CREATE POLICY "Users can delete own messages" ON messages FOR DELETE USING (
  chat_id IN (SELECT id FROM chats WHERE user_id = auth.uid())
);

-- Auto-update timestamp
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER chats_updated_at BEFORE UPDATE ON chats
FOR EACH ROW EXECUTE FUNCTION update_updated_at();`;

const SETUP_STEPS = [
  {
    icon: Database,
    title: "Run SQL Schema",
    desc: "Go to Supabase Dashboard → SQL Editor → Paste & Run",
    action: "sql" as const,
  },
  {
    icon: Shield,
    title: "Enable Google OAuth",
    desc: "Go to Authentication → Providers → Enable Google, add Client ID & Secret",
    action: "google" as const,
  },
  {
    icon: Key,
    title: "Get Correct API Key",
    desc: "Go to Settings → API → Copy the 'anon public' key (starts with eyJ...)",
    action: "key" as const,
  },
];

export default function SetupPage() {
  const router = useRouter();
  const [copied, setCopied] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{
    ok: boolean;
    msg: string;
  } | null>(null);

  const copySQL = async () => {
    await navigator.clipboard.writeText(SQL_SCHEMA);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const testConnection = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      const res = await fetch("/api/chats");
      if (res.ok) {
        setTestResult({ ok: true, msg: "Database connected successfully!" });
      } else {
        const data = await res.json();
        setTestResult({
          ok: false,
          msg: data.error || `Error ${res.status}`,
        });
      }
    } catch (err) {
      setTestResult({
        ok: false,
        msg: err instanceof Error ? err.message : "Connection failed",
      });
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 py-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-2xl space-y-6"
      >
        {/* Header */}
        <div className="text-center">
          <div className="mx-auto w-16 h-16 mb-4 rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center shadow-lg shadow-emerald-500/25">
            <Database className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold">Database Setup</h1>
          <p className="text-sm text-muted-foreground mt-1">
            One step — copy SQL and paste in Supabase SQL Editor
          </p>
        </div>

        {/* One-Click SQL Editor */}
        <Card className="border-emerald-500/30 bg-emerald-50/50 dark:bg-emerald-900/10">
          <CardContent className="p-4 text-center space-y-3">
            <p className="text-sm font-medium">🚀 Fastest way — Open SQL Editor directly</p>
            <a
              href="https://supabase.com/dashboard/project/caublztcnbxvjximomgw/sql/new"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2 h-11 px-6 w-full sm:w-auto">
                <ExternalLink className="w-4 h-4" />
                Open Supabase SQL Editor
              </Button>
            </a>
            <p className="text-xs text-muted-foreground">
              Click → Paste SQL below → Click <strong>Run</strong> → Done!
            </p>
          </CardContent>
        </Card>

        {/* Steps */}
        <div className="space-y-4">
          {SETUP_STEPS.map((step, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 + i * 0.1 }}
            >
              <Card className="border-border/50">
                <CardContent className="flex items-start gap-4 p-4">
                  <div className="w-10 h-10 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center shrink-0">
                    <step.icon className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-sm">{step.title}</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {step.desc}
                    </p>
                    {step.action === "google" && (
                      <a
                        href="https://console.cloud.google.com/apis/credentials"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400 hover:underline mt-1"
                      >
                        Get Google Client ID
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                    {step.action === "key" && (
                      <a
                        href="https://supabase.com/dashboard/project/caublztcnbxvjximomgw/settings/api"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400 hover:underline mt-1"
                      >
                        Open Supabase API Settings
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* SQL Box */}
        <Card className="border-border/50">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-sm">SQL Schema</CardTitle>
                <CardDescription className="text-xs">
                  Copy and paste into Supabase SQL Editor
                </CardDescription>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={copySQL}
                className="gap-1.5 text-xs h-8"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-green-500" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    Copy SQL
                  </>
                )}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <pre className="bg-zinc-900 dark:bg-zinc-950 text-zinc-300 text-xs p-4 rounded-lg overflow-x-auto max-h-64 overflow-y-auto leading-relaxed">
              {SQL_SCHEMA}
            </pre>
          </CardContent>
        </Card>

        {/* Test + Actions */}
        <div className="flex flex-col sm:flex-row gap-3">
          <Button
            onClick={testConnection}
            disabled={testing}
            variant="outline"
            className="flex-1 gap-2 h-11"
          >
            {testing ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : testResult?.ok ? (
              <CheckCircle2 className="w-4 h-4 text-green-500" />
            ) : (
              <Database className="w-4 h-4" />
            )}
            {testing
              ? "Testing..."
              : testResult
                ? "Test Again"
                : "Test Connection"}
          </Button>
          <Button
            onClick={() => router.push("/auth/login")}
            className="flex-1 gap-2 h-11 bg-emerald-600 hover:bg-emerald-700 text-white"
          >
            Go to Login
            <ArrowRight className="w-4 h-4" />
          </Button>
        </div>

        {/* Test Result */}
        {testResult && (
          <motion.div
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            className={`flex items-center gap-2 p-3 rounded-lg text-sm ${
              testResult.ok
                ? "bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-800"
                : "bg-destructive/10 text-destructive border border-destructive/20"
            }`}
          >
            {testResult.ok ? (
              <CheckCircle2 className="w-4 h-4 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 shrink-0" />
            )}
            {testResult.msg}
          </motion.div>
        )}

        <p className="text-center text-xs text-muted-foreground/60">
          After setup,{" "}
          <a href="/" className="text-emerald-600 dark:text-emerald-400 hover:underline">
            use chat without account
          </a>{" "}
          or sign in to save history.
        </p>
      </motion.div>
    </div>
  );
}
