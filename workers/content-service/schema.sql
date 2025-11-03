-- Content Service Database Schema
-- For school sites: news, events, roster, pages

-- Events table (games, performances, fundraisers, etc.)
CREATE TABLE IF NOT EXISTS events (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  date TEXT NOT NULL,  -- ISO 8601 datetime
  end_date TEXT,       -- For multi-day events
  location TEXT,
  description TEXT,
  category TEXT,       -- e.g., 'game', 'performance', 'fundraiser'
  published INTEGER DEFAULT 1,  -- 0 = draft, 1 = published
  created_at INTEGER DEFAULT (unixepoch()),
  updated_at INTEGER DEFAULT (unixepoch())
);

-- News/announcements table
CREATE TABLE IF NOT EXISTS news (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  content TEXT,
  excerpt TEXT,
  author TEXT,
  published_at INTEGER,
  created_at INTEGER DEFAULT (unixepoch()),
  updated_at INTEGER DEFAULT (unixepoch())
);

-- Roster/members table (cheerleaders, cast members, etc.)
CREATE TABLE IF NOT EXISTS roster (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  role TEXT,           -- e.g., 'captain', 'lead', 'ensemble'
  grade TEXT,          -- e.g., '9', '10', '11', '12'
  photo_url TEXT,
  bio TEXT,
  sort_order INTEGER DEFAULT 0,
  created_at INTEGER DEFAULT (unixepoch()),
  updated_at INTEGER DEFAULT (unixepoch())
);

-- Static pages (about, booster club, etc.)
CREATE TABLE IF NOT EXISTS pages (
  id TEXT PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  content TEXT,
  published INTEGER DEFAULT 1,
  created_at INTEGER DEFAULT (unixepoch()),
  updated_at INTEGER DEFAULT (unixepoch())
);

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_events_date ON events(date);
CREATE INDEX IF NOT EXISTS idx_events_published ON events(published);
CREATE INDEX IF NOT EXISTS idx_news_published_at ON news(published_at);
CREATE INDEX IF NOT EXISTS idx_news_slug ON news(slug);
CREATE INDEX IF NOT EXISTS idx_roster_sort_order ON roster(sort_order);
CREATE INDEX IF NOT EXISTS idx_pages_slug ON pages(slug);
