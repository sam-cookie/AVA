import { z } from 'zod'

const amountField = z
  .string()
  .min(1, 'Amount is required')
  .refine((v) => {
    const n = parseFloat(v.replace(/,/g, ''))
    return !isNaN(n) && n > 0
  }, 'Must be a positive number')
  .refine((v) => {
    const parts = v.replace(/,/g, '').split('.')
    return !parts[1] || parts[1].length <= 2
  }, 'At most 2 decimal places')

const dateField = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format')

export const utangSchema = z.object({
  type: z.enum(['i_owe', 'they_owe']),
  person: z.string().min(1, 'Name is required').max(80),
  amount: amountField,
  deadline: dateField.optional().or(z.literal('')).optional(),
  note: z.string().max(200).optional(),
  fundId: z.number().int().positive().optional(),
})

export const utangPaymentSchema = z.object({
  utangId: z.number().int().positive(),
  fundId: z.number().int().positive(),
  amount: amountField,
  date: dateField,
  note: z.string().max(200).optional(),
})

export type UtangInput = z.infer<typeof utangSchema>
export type UtangPaymentInput = z.infer<typeof utangPaymentSchema>
