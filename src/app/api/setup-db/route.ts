import { NextResponse } from "next/server";
import dns from "dns";

const SQL_STATEMENTS = [
  `CREATE TABLE IF NOT EXISTS chats (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    title TEXT DEFAULT 'New Chat',
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    chat_id UUID REFERENCES chats(id) ON DELETE CASCADE NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
  )`,
  `ALTER TABLE chats ENABLE ROW LEVEL SECURITY`,
  `ALTER TABLE messages ENABLE ROW LEVEL SECURITY`,
  `DO $$ BEGIN CREATE POLICY "Users can view own chats" ON chats FOR SELECT USING (auth.uid() = user_id); EXCEPTION WHEN duplicate_object THEN NULL; END $$`,
  `DO $$ BEGIN CREATE POLICY "Users can insert own chats" ON chats FOR INSERT WITH CHECK (auth.uid() = user_id); EXCEPTION WHEN duplicate_object THEN NULL; END $$`,
  `DO $$ BEGIN CREATE POLICY "Users can update own chats" ON chats FOR UPDATE USING (auth.uid() = user_id); EXCEPTION WHEN duplicate_object THEN NULL; END $$`,
  `DO $$ BEGIN CREATE POLICY "Users can delete own chats" ON chats FOR DELETE USING (auth.uid() = user_id); EXCEPTION WHEN duplicate_object THEN NULL; END $$`,
  `DO $$ BEGIN CREATE POLICY "Users can view own messages" ON messages FOR SELECT USING (chat_id IN (SELECT id FROM chats WHERE user_id = auth.uid())); EXCEPTION WHEN duplicate_object THEN NULL; END $$`,
  `DO $$ BEGIN CREATE POLICY "Users can insert own messages" ON messages FOR INSERT WITH CHECK (chat_id IN (SELECT id FROM chats WHERE user_id = auth.uid())); EXCEPTION WHEN duplicate_object THEN NULL; END $$`,
  `DO $$ BEGIN CREATE POLICY "Users can delete own messages" ON messages FOR DELETE USING (chat_id IN (SELECT id FROM chats WHERE user_id = auth.uid())); EXCEPTION WHEN duplicate_object THEN NULL; END $$`,
  `CREATE OR REPLACE FUNCTION update_updated_at() RETURNS TRIGGER AS $$ BEGIN NEW.updated_at = NOW(); RETURN NEW; END; $$ LANGUAGE plpgsql`,
  `DROP TRIGGER IF EXISTS chats_updated_at ON chats`,
  `CREATE TRIGGER chats_updated_at BEFORE UPDATE ON chats FOR EACH ROW EXECUTE FUNCTION update_updated_at()`,
];

function lookupIPv4(hostname: string): Promise<string> {
  return new Promise((resolve, reject) => {
    dns.resolve4(hostname, (err, addresses) => {
      if (err || !addresses.length) reject(new Error("No IPv4 for " + hostname));
      else resolve(addresses[0]);
    });
  });
}

export async function POST() {
  try {
    const poolerHost = "aws-0-us-east-1.pooler.supabase.com";

    // Force IPv4 resolution to avoid ENETUNREACH on IPv6
    const ipv4 = await lookupIPv4(poolerHost);

    const { Client } = await import("pg");
    const client = new Client({
      host: ipv4,
      port: 6543,
      database: "postgres",
      user: "postgres.caublztcnbxvjximomgw",
      password: "ashish603281337259",
      ssl: { rejectUnauthorized: false },
    });

    await client.connect();

    const results: string[] = [];
    for (const sql of SQL_STATEMENTS) {
      try {
        await client.query(sql);
        results.push("✅ " + sql.split("\n")[0].substring(0, 50));
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        results.push("❌ " + msg.substring(0, 100));
      }
    }

    await client.end();

    return NextResponse.json({ success: true, ipv4, results });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error("Setup DB error:", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
