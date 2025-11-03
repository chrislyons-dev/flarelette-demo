/**
 * Input validation schemas using Zod
 * All input is validated - zero trust!
 */
import { z } from 'zod'

/**
 * Query parameter schemas
 */
export const paginationSchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(10),
  offset: z.coerce.number().int().min(0).default(0),
})

export const eventQuerySchema = paginationSchema

export const newsQuerySchema = paginationSchema

/**
 * Request body schemas
 */
export const contactFormSchema = z.object({
  name: z.string().min(1).max(100).trim(),
  email: z.string().email().max(255).toLowerCase().trim(),
  phone: z.string().max(20).trim().optional(),
  message: z.string().min(10).max(5000).trim(),
})

/**
 * Route parameter schemas
 */
export const idParamSchema = z.object({
  id: z.string().uuid(),
})

export const slugParamSchema = z.object({
  slug: z.string().regex(/^[a-z0-9-]+$/),
})

/**
 * Type exports for validated data
 */
export type PaginationQuery = z.infer<typeof paginationSchema>
export type ContactFormData = z.infer<typeof contactFormSchema>
export type IdParam = z.infer<typeof idParamSchema>
export type SlugParam = z.infer<typeof slugParamSchema>
