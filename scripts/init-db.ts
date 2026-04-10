import { getDb, initDb } from "../src/lib/db";
import { hashPassword } from "../src/lib/auth";

async function main() {
  console.log("🔄 Initializing Turso database...");

  try {
    // Step 1: Create all tables
    await initDb();
    console.log("✅ Tables created/verified.");

    const db = getDb();

    // Step 2: Check if default admin already exists
    const existing = await db.execute({
      sql: "SELECT id FROM admin WHERE user_id = ?",
      args: ["000000"],
    });

    if (existing.rows.length > 0) {
      console.log("ℹ️  Default admin already exists (user_id: 000000). Skipping insertion.");
    } else {
      // Step 3: Hash the admin password and insert
      const adminPassword = "603281";
      const hashedPassword = await hashPassword(adminPassword);
      console.log("🔐 Admin password hashed.");

      await db.execute({
        sql: `INSERT INTO admin (id, user_id, password_hash, is_active, created_at)
              VALUES (?, ?, ?, 1, datetime('now'))`,
        args: ["admin-000000", "000000", hashedPassword],
      });
      console.log("✅ Default admin inserted (user_id: 000000, password: 603281).");
    }

    // Step 4: Verify tables
    const tables = await db.execute("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name");
    console.log("📋 Tables in database:");
    for (const row of tables.rows) {
      console.log(`   - ${row["name"]}`);
    }

    console.log("\n🎉 Database initialization complete!");
  } catch (error) {
    console.error("❌ Database initialization failed:", error);
    process.exit(1);
  }
}

main();
