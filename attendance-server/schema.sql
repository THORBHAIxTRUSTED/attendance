CREATE TABLE IF NOT EXISTS keys (
  key TEXT PRIMARY KEY,
  name TEXT,
  roll TEXT,
  hwid TEXT,
  paused INTEGER DEFAULT 0,
  created_at INTEGER DEFAULT (strftime('%s','now'))
);
