-- NutriMetrics.eu — contact form inbox. Messages are kept 12 months max (see privacy policy), then deleted.
CREATE TABLE IF NOT EXISTS contact_messages (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  locale     TEXT,
  name       TEXT NOT NULL,
  email      TEXT NOT NULL,
  topic      TEXT,
  message    TEXT NOT NULL,
  emailed    INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS idx_contact_created ON contact_messages(created_at);
