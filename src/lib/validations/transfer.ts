import { z } from 'zod'
import { todayISO } from '@/lib/utils/date'

export const transferSchema = z
  .object({
    fromFundId: z.number().int().positive('Select source fund'),
    toFundId: z.number().int().positive('Select destination fund'),
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
    fee: z
      .string()
      .optional()
      .refine((v) => {
        if (!v) return true
        const n = parseFloat(v.replace(/,/g, ''))
        return !isNaN(n) && n >= 0
      }, 'Fee must be non-negative')
      .refine((v) => {
        if (!v) return true
        const parts = v.replace(/,/g, '').split('.')
        return !parts[1] || parts[1].length <= 2
      }, 'At most 2 decimal places'),
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date'),
    note: z.string().max(200).optional(),
  })
  .refine((v) => v.fromFundId !== v.toFundId, {
    message: 'Source and destination must be different',
    path: ['toFundId'],
  })

export type TransferFormValues = z.infer<typeof transferSchema>

export const transferDefaults: TransferFormValues = {
  fromFundId: 0,
  toFundId: 0,
  amount: '',
  fee: '',
  date: todayISO(),
  note: '',
}

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

const feeField = z
  .string()
  .optional()
  .refine((v) => {
    if (!v) return true
    const n = parseFloat(v.replace(/,/g, ''))
    return !isNaN(n) && n >= 0
  }, 'Fee must be non-negative')
  .refine((v) => {
    if (!v) return true
    const parts = v.replace(/,/g, '').split('.')
    return !parts[1] || parts[1].length <= 2
  }, 'At most 2 decimal places')

export const editTransferSchema = z
  .object({
    fromFundId: z.number().int().positive('Select source fund'),
    toFundId: z.number().int().positive('Select destination fund'),
    amount: amountField,
    fee: feeField,
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date'),
    note: z.string().max(200).optional(),
  })
  .refine((v) => v.fromFundId !== v.toFundId, {
    message: 'Source and destination must be different',
    path: ['toFundId'],
  })

export type EditTransferValues = z.infer<typeof editTransferSchema>
