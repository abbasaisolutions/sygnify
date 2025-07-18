const sqlite3 = require('better-sqlite3');
const path = require('path');

// Create SQLite database
const dbPath = path.join(__dirname, '../sygnify_analytics.db');
const db = sqlite3(dbPath);

// Initialize database tables
function initializeDatabase() {
  // Users table
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      tenant_id TEXT DEFAULT 'default',
      subscription_status TEXT DEFAULT 'inactive',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Analysis results table
  db.exec(`
    CREATE TABLE IF NOT EXISTS analysis_results (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      file_name TEXT NOT NULL,
      file_type TEXT NOT NULL,
      analysis_type TEXT NOT NULL,
      results TEXT,
      insights TEXT,
      visualizations TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users (id)
    )
  `);

  // Subscriptions table
  db.exec(`
    CREATE TABLE IF NOT EXISTS subscriptions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      plan_type TEXT NOT NULL,
      status TEXT DEFAULT 'active',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users (id)
    )
  `);

  console.log('Database initialized successfully');
}

// Initialize database on module load
initializeDatabase();

module.exports = { db }; 