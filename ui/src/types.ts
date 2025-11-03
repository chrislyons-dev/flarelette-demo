/**
 * Shared types for the UI
 */

export interface Event {
  id: string
  title: string
  description: string | null
  date: string
  end_date: string | null
  location: string | null
  category: string | null
  published: number
  created_at: number
  updated_at: number
}

export interface NewsArticle {
  slug: string
  title: string
  excerpt: string | null
  content: string | null
  author: string | null
  published_at: number | null
  created_at: number
  updated_at: number
}

export interface RosterMember {
  id: string
  name: string
  role: string | null
  bio: string | null
  photo_url: string | null
  grade: string | null
  email: string | null
  created_at: number
  updated_at: number
}
