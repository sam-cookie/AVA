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

export const savingsGoalSchema = z.object({
  name: z.string().min(1, 'Goal name is required').max(60),
  targetAmount: amountField,
  targetDate: dateField.optional().or(z.literal('')).optional(),
  note: z.string().max(200).optional(),
})

export const contributionSchema = z.object({
  goalId: z.number().int().positive(),
  fundId: z.number().int().positive(),
  amount: amountField,
  date: dateField,
  note: z.string().max(200).optional(),
})

export type SavingsGoalInput = z.infer<typeof savingsGoalSchema>
export type ContributionInput = z.infer<typeof contributionSchema>
