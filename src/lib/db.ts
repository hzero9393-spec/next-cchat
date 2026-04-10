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
    // --- New tables for 20 features ---
    `CREATE TABLE IF NOT EXISTS folders (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      name TEXT NOT NULL,
      color TEXT DEFAULT '#10b981',
      icon TEXT DEFAULT 'folder',
      sort_order INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )`,
    `CREATE TABLE IF NOT EXISTS pinned_chats (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      chat_id TEXT NOT NULL UNIQUE,
      pinned_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (chat_id) REFERENCES chats(id) ON DELETE CASCADE
    )`,
    `CREATE TABLE IF NOT EXISTS shared_chats (
      id TEXT PRIMARY KEY,
      chat_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      share_slug TEXT UNIQUE NOT NULL,
      is_public INTEGER DEFAULT 1,
      views_count INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now')),
      expires_at TEXT,
      FOREIGN KEY (chat_id) REFERENCES chats(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )`,
    `CREATE TABLE IF NOT EXISTS announcements (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      type TEXT DEFAULT 'info',
      is_active INTEGER DEFAULT 1,
      created_at TEXT DEFAULT (datetime('now')),
      expires_at TEXT
    )`,
    `CREATE TABLE IF NOT EXISTS api_keys (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      key_name TEXT NOT NULL,
      key_hash TEXT NOT NULL,
      key_prefix TEXT NOT NULL,
      is_active INTEGER DEFAULT 1,
      total_requests INTEGER DEFAULT 0,
      last_used_at TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      expires_at TEXT,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )`,
    `CREATE TABLE IF NOT EXISTS subscriptions (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL UNIQUE,
      plan TEXT DEFAULT 'free',
      status TEXT DEFAULT 'active',
      stripe_customer_id TEXT,
      stripe_subscription_id TEXT,
      current_period_start TEXT,
      current_period_end TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )`,
    `CREATE TABLE IF NOT EXISTS uploaded_files (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      chat_id TEXT,
      file_name TEXT NOT NULL,
      file_type TEXT NOT NULL,
      file_size INTEGER DEFAULT 0,
      file_url TEXT,
      content_text TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (chat_id) REFERENCES chats(id) ON DELETE SET NULL
    )`,
    `CREATE TABLE IF NOT EXISTS chat_templates (
      id TEXT PRIMARY KEY,
      user_id TEXT,
      title TEXT NOT NULL,
      description TEXT DEFAULT '',
      prompt TEXT NOT NULL,
      icon TEXT DEFAULT 'sparkles',
      color TEXT DEFAULT '#10b981',
      is_system INTEGER DEFAULT 0,
      sort_order INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )`,
  ];

  for (const sql of statements) {
    await db.execute(sql);
  }

  // --- ALTER TABLE statements (wrapped in try-catch since columns may already exist) ---
  const alterStatements = [
    `ALTER TABLE chats ADD COLUMN folder_id TEXT REFERENCES folders(id) ON DELETE SET NULL`,
    `ALTER TABLE users ADD COLUMN is_pro INTEGER DEFAULT 0`,
    `ALTER TABLE users ADD COLUMN is_banned INTEGER DEFAULT 0`,
    `ALTER TABLE users ADD COLUMN bio TEXT DEFAULT ''`,
    `ALTER TABLE messages ADD COLUMN model TEXT DEFAULT 'llama3.1-8b'`,
    `ALTER TABLE messages ADD COLUMN image_url TEXT`,
    `ALTER TABLE announcements ADD COLUMN updated_at TEXT DEFAULT (datetime('now'))`,
  ];

  for (const sql of alterStatements) {
    try {
      await db.execute(sql);
    } catch {
      // Column likely already exists — safe to ignore
    }
  }

  // --- Insert default system chat templates ---
  const seedStatements = [
    `INSERT OR IGNORE INTO chat_templates (id, user_id, title, description, prompt, icon, color, is_system, sort_order) VALUES
      ('tpl-code', NULL, 'Code Assistant', 'Help with coding questions', 'You are an expert programmer. Help the user with their coding questions. Provide clean, well-commented code with explanations.', 'code', '#10b981', 1, 1)`,
    `INSERT OR IGNORE INTO chat_templates (id, user_id, title, description, prompt, icon, color, is_system, sort_order) VALUES
      ('tpl-write', NULL, 'Content Writer', 'Help with writing content', 'You are a professional content writer. Help create engaging, well-structured content including blog posts, articles, emails, and social media content.', 'pen-tool', '#f59e0b', 1, 2)`,
    `INSERT OR IGNORE INTO chat_templates (id, user_id, title, description, prompt, icon, color, is_system, sort_order) VALUES
      ('tpl-translate', NULL, 'Translator', 'Translate text between languages', 'You are an expert translator. Translate the given text accurately while preserving the tone, style, and meaning. Detect the source language automatically.', 'languages', '#3b82f6', 1, 3)`,
    `INSERT OR IGNORE INTO chat_templates (id, user_id, title, description, prompt, icon, color, is_system, sort_order) VALUES
      ('tpl-tutor', NULL, 'Study Tutor', 'Help with learning and studying', 'You are a patient and knowledgeable tutor. Explain concepts clearly, use examples, and help the user understand topics step by step. Ask follow-up questions to check understanding.', 'graduation-cap', '#8b5cf6', 1, 4)`,
    `INSERT OR IGNORE INTO chat_templates (id, user_id, title, description, prompt, icon, color, is_system, sort_order) VALUES
      ('tpl-research', NULL, 'Research Helper', 'Deep research on any topic', 'You are a research assistant. Provide comprehensive, well-structured research on topics with key points, evidence, comparisons, and actionable insights.', 'search', '#ec4899', 1, 5)`,
    `INSERT OR IGNORE INTO chat_templates (id, user_id, title, description, prompt, icon, color, is_system, sort_order) VALUES
      ('tpl-summarize', NULL, 'Summarizer', 'Summarize long texts', 'You are an expert summarizer. Provide concise, accurate summaries of the given text while preserving key information and main points.', 'file-text', '#14b8a6', 1, 6)`,
    `INSERT OR IGNORE INTO chat_templates (id, user_id, title, description, prompt, icon, color, is_system, sort_order) VALUES
      ('tpl-brainstorm', NULL, 'Brainstorm Partner', 'Generate creative ideas', 'You are a creative brainstorming partner. Generate diverse, innovative ideas and explore possibilities. Think outside the box and offer unique perspectives.', 'lightbulb', '#f97316', 1, 7)`,
    `INSERT OR IGNORE INTO chat_templates (id, user_id, title, description, prompt, icon, color, is_system, sort_order) VALUES
      ('tpl-debug', NULL, 'Code Debugger', 'Help debug and fix code', 'You are an expert debugger. Analyze code for bugs, explain what went wrong, and provide fixed versions. Be thorough in your analysis.', 'bug', '#ef4444', 1, 8)`,
  ];

  for (const sql of seedStatements) {
    await db.execute(sql);
  }

  console.log("Database tables created/verified successfully (8 new tables added)");
}
