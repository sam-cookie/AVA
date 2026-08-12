import { z } from 'zod'
import { todayISO } from '@/lib/utils/date'

export const expenseSchema = z.object({
  title: z.string().min(1, 'Enter a title for this expense').max(100, 'Title must be 100 characters or less'),
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
  category: z.string().min(1, 'Select a category'),
  fundId: z.number().int().positive('Select a fund'),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date'),
  note: z.string().max(200).optional(),
})

export type ExpenseFormValues = z.infer<typeof expenseSchema>

export const expenseDefaults: ExpenseFormValues = {
  title: '',
  amount: '',
  category: '',
  fundId: 0,
  date: todayISO(),
  note: '',
}
