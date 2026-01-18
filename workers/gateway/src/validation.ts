/**
 * Input validation schemas using Zod
 * All input is validated - zero trust!
 *
 * These schemas match the constraints defined in openapi.yaml.
 * Keep them in sync when updating the API specification.
 *
 * @module validation
 */
import { z } from 'zod'

/**
 * Regex patterns matching OpenAPI spec
 */
const patterns = {
  /** Alphanumeric with underscores and dashes: ^[a-zA-Z0-9_-]+$ */
  id: /^[a-zA-Z0-9_-]+$/,
  /** URL-friendly slug: ^[a-z0-9]+(?:-[a-z0-9]+)*$ */
  slug: /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
  /** Unicode letters, spaces, and common name punctuation */
  name: /^[\p{L}\p{M}\s'.,-]+$/u,
  /** Phone: digits, spaces, parentheses, plus, dash */
  phone: /^[\d\s()+-]*$/,
  /** Email: RFC 5322-ish pattern */
  email: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
}

/**
 * Query parameter schemas
 */
export const paginationSchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(10),
  offset: z.coerce.number().int().min(0).max(10000).default(0),
})

export const eventQuerySchema = paginationSchema

export const newsQuerySchema = paginationSchema

/**
 * Request body schemas
 */
export const contactFormSchema = z.object({
  name: z
    .string()
    .min(1, 'Name is required')
    .max(100, 'Name must be 100 characters or less')
    .regex(patterns.name, 'Name contains invalid characters')
    .trim(),
  email: z
    .string()
    .email('Invalid email address')
    .max(255, 'Email must be 255 characters or less')
    .regex(patterns.email, 'Invalid email format')
    .toLowerCase()
    .trim(),
  phone: z
    .string()
    .max(20, 'Phone must be 20 characters or less')
    .regex(patterns.phone, 'Phone contains invalid characters')
    .trim()
    .optional(),
  message: z
    .string()
    .min(10, 'Message must be at least 10 characters')
    .max(5000, 'Message must be 5000 characters or less')
    .trim(),
})

/**
 * Route parameter schemas
 */
export const idParamSchema = z.object({
  id: z
    .string()
    .min(1, 'ID is required')
    .max(50, 'ID must be 50 characters or less')
    .regex(patterns.id, 'ID contains invalid characters'),
})

export const slugParamSchema = z.object({
  slug: z
    .string()
    .min(1, 'Slug is required')
    .max(200, 'Slug must be 200 characters or less')
    .regex(patterns.slug, 'Slug must be lowercase alphanumeric with dashes'),
})

/**
 * Type exports for validated data
 */
export type PaginationQuery = z.infer<typeof paginationSchema>
export type ContactFormData = z.infer<typeof contactFormSchema>
export type IdParam = z.infer<typeof idParamSchema>
export type SlugParam = z.infer<typeof slugParamSchema>
