import { createClient, Client } from "@libsql/client";

const dbUrl = process.env.TURSO_DATABASE_URL!;
const dbAuthToken = process.env.TURSO_AUTH_TOKEN!;

let _db: Client | null = null;

export function getDb(): Client {
  if (!_db) {
    _db = createClient({
      url: dbUrl,
      authToken: dbAuthToken,
    });
  }
  return _db;
}

export async function initDb() {
  const db = getDb();

  // Create all tables with IF NOT EXISTS (run individually since libsql execute supports single statements)
  const statements = [
    `CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      full_name TEXT DEFAULT '',
      last_name TEXT DEFAULT '',
      dob TEXT DEFAULT '',
      phone TEXT DEFAULT '',
      avatar_url TEXT DEFAULT '',
      theme_preference TEXT DEFAULT 'ocean-blue',
      created_at TEXT DEFAULT (datetime('now'))
    )`,
    `CREATE TABLE IF NOT EXISTS chats (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      title TEXT DEFAULT 'New Chat',
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )`,
    `CREATE TABLE IF NOT EXISTS messages (
      id TEXT PRIMARY KEY,
      chat_id TEXT NOT NULL,
      role TEXT NOT NULL CHECK(role IN ('user', 'assistant')),
      content TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (chat_id) REFERENCES chats(id) ON DELETE CASCADE
    )`,
    `CREATE TABLE IF NOT EXISTS chat_analytics (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      category TEXT DEFAULT 'general',
      message_count INTEGER DEFAULT 1,
      date TEXT DEFAULT (date('now')),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )`,
    `CREATE TABLE IF NOT EXISTS admin (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      is_active INTEGER DEFAULT 1,
      created_at TEXT DEFAULT (datetime('now'))
    )`,
  ];

  for (const sql of statements) {
    await db.execute(sql);
  }

  console.log("Database tables created/verified successfully");
}
