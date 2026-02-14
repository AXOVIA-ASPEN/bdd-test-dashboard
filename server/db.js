const Database = require('better-sqlite3');
const path = require('path');

const DB_PATH = process.env.DB_PATH || path.join(__dirname, 'data', 'dashboard.db');

// Ensure data directory exists
const fs = require('fs');
fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });

const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// Initialize schema
db.exec(`
  CREATE TABLE IF NOT EXISTS projects (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    color TEXT,
    repo TEXT NOT NULL,
    makeTarget TEXT DEFAULT 'test-acceptance',
    tags TEXT DEFAULT '[]'
  );

  CREATE TABLE IF NOT EXISTS runs (
    id TEXT PRIMARY KEY,
    projectId TEXT NOT NULL,
    repo TEXT,
    tags TEXT DEFAULT '[]',
    branch TEXT DEFAULT 'main',
    makeTarget TEXT DEFAULT 'test-acceptance',
    status TEXT DEFAULT 'pending',
    timestamp TEXT NOT NULL,
    duration INTEGER DEFAULT 0,
    summary TEXT DEFAULT '{"passed":0,"failed":0,"skipped":0,"total":0}',
    error TEXT,
    completedAt TEXT,
    FOREIGN KEY (projectId) REFERENCES projects(id)
  );

  CREATE TABLE IF NOT EXISTS features (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    runId TEXT NOT NULL,
    name TEXT NOT NULL,
    description TEXT DEFAULT '',
    scenarios TEXT DEFAULT '[]',
    FOREIGN KEY (runId) REFERENCES runs(id)
  );

  CREATE INDEX IF NOT EXISTS idx_runs_projectId ON runs(projectId);
  CREATE INDEX IF NOT EXISTS idx_runs_timestamp ON runs(timestamp DESC);
  CREATE INDEX IF NOT EXISTS idx_features_runId ON features(runId);
`);

module.exports = db;
