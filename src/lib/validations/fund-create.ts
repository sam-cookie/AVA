import { z } from 'zod'

export const fundCreateSchema = z.object({
  name: z.string().min(1, 'Name is required').max(50, 'Name too long'),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional().nullable(),
  initialBalance: z
    .string()
    .optional()
    .refine((v) => {
      if (!v || v.trim() === '' || v === '0' || v === '0.00') return true
      const n = parseFloat(v)
      return !isNaN(n) && n >= 0
    }, 'Enter a valid amount'),
})

export type FundCreateFormValues = z.infer<typeof fundCreateSchema>
