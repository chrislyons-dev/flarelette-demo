-- Forms Service Database Schema

-- Contact form submissions
CREATE TABLE IF NOT EXISTS contact_submissions (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  message TEXT NOT NULL,
  ip_address TEXT,
  user_agent TEXT,
  status TEXT DEFAULT 'unread',  -- unread, read, responded
  created_at INTEGER DEFAULT (unixepoch())
);

-- Tryout/signup form submissions
CREATE TABLE IF NOT EXISTS signup_submissions (
  id TEXT PRIMARY KEY,
  student_name TEXT NOT NULL,
  parent_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  grade TEXT NOT NULL,
  activity TEXT NOT NULL,  -- e.g., 'cheer', 'theater'
  experience TEXT,
  message TEXT,
  status TEXT DEFAULT 'pending',  -- pending, approved, declined
  created_at INTEGER DEFAULT (unixepoch())
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_contact_status ON contact_submissions(status);
CREATE INDEX IF NOT EXISTS idx_contact_created ON contact_submissions(created_at);
CREATE INDEX IF NOT EXISTS idx_signup_status ON signup_submissions(status);
CREATE INDEX IF NOT EXISTS idx_signup_activity ON signup_submissions(activity);
