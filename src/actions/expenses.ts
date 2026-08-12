'use server'

import { revalidatePath } from 'next/cache'
import { expenseSchema } from '@/lib/validations/expense'
import { addMoneySchema } from '@/lib/validations/fund'
import { createExpense, updateExpense, deleteExpense, deleteAddition, updateAddition } from '@/services/expenses'
import type { ServiceResult } from '@/types'

export async function createExpenseAction(formData: unknown): Promise<ServiceResult<void>> {
  const parsed = expenseSchema.safeParse(formData)
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message }
  }

  const { fundId, amount, title, category, date, note } = parsed.data
  const result = await createExpense({ fundId, amountRaw: amount, title, category, date, note })

  if (!result.success) return result

  revalidatePath('/', 'layout')
  return { success: true, data: undefined }
}

export async function updateExpenseAction(
  transactionId: number,
  formData: unknown
): Promise<ServiceResult<void>> {
  const parsed = expenseSchema.safeParse(formData)
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message }
  }

  const { fundId, amount, title, category, date, note } = parsed.data
  const result = await updateExpense(transactionId, { fundId, amountRaw: amount, title, category, date, note })

  if (!result.success) return result

  revalidatePath('/', 'layout')
  return { success: true, data: undefined }
}

export async function deleteExpenseAction(transactionId: number): Promise<ServiceResult<void>> {
  const result = await deleteExpense(transactionId)
  if (!result.success) return result
  revalidatePath('/', 'layout')
  return { success: true, data: undefined }
}

export async function deleteAdditionAction(transactionId: number): Promise<ServiceResult<void>> {
  const result = await deleteAddition(transactionId)
  if (!result.success) return result
  revalidatePath('/', 'layout')
  return { success: true, data: undefined }
}

export async function updateAdditionAction(
  transactionId: number,
  formData: unknown
): Promise<ServiceResult<void>> {
  const parsed = addMoneySchema.safeParse(formData)
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message }
  }

  const { fundId, amount, source, date, note } = parsed.data
  const result = await updateAddition(transactionId, { fundId, amountRaw: amount, source, date, note })

  if (!result.success) return result

  revalidatePath('/', 'layout')
  return { success: true, data: undefined }
}
