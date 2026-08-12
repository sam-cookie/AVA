import { z } from 'zod'

export const sourceCreateSchema = z.object({
  name: z
    .string()
    .min(1, 'Name is required')
    .max(50, 'Name is too long')
    .trim(),
})

export type SourceCreateValues = z.infer<typeof sourceCreateSchema>
