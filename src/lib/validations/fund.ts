import { z } from 'zod'
import { todayISO } from '@/lib/utils/date'

export const addMoneySchema = z.object({
  fundId: z.number().int().positive('Select a fund'),
  amount: z
    .string()
    .min(1, 'Amount is required')
    .refine((v) => {
      const n = parseFloat(v.replace(/,/g, ''))
      return !isNaN(n) && n > 0
    }, 'Must be a positive number')
    .refine((v) => {
      const parts = v.replace(/,/g, '').split('.')
      return !parts[1] || parts[1].length <= 2
    }, 'At most 2 decimal places'),
  source: z.string().min(1, 'Select a source'),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date'),
  note: z.string().max(200).optional(),
})

export type AddMoneyFormValues = z.infer<typeof addMoneySchema>

export const addMoneyDefaults: Omit<AddMoneyFormValues, 'fundId'> = {
  amount: '',
  source: '',
  date: todayISO(),
  note: '',
}
