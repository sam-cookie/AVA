'use server'

import { revalidatePath } from 'next/cache'
import { savingsGoalSchema, contributionSchema } from '@/lib/validations/savings-goal'
import {
  createSavingsGoal,
  updateSavingsGoal,
  deleteSavingsGoal,
  addContribution,
  deleteContribution,
} from '@/services/savings-goals'
import { todayISO } from '@/lib/utils/date'
import { toCentavos } from '@/lib/utils/currency'
import type { ServiceResult } from '@/types'

export async function createGoalAction(formData: unknown): Promise<ServiceResult<{ goalId: number }>> {
  const parsed = savingsGoalSchema.safeParse(formData)
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message }
  }

  const { name, targetAmount, targetDate, note } = parsed.data
  const result = await createSavingsGoal({
    name,
    targetAmountRaw: targetAmount,
    targetDate: targetDate || undefined,
    note: note || undefined,
  })

  if (!result.success) return result
  revalidatePath('/savings', 'layout')
  revalidatePath('/', 'layout')
  return result
}

export async function updateGoalAction(
  goalId: number,
  formData: unknown
): Promise<ServiceResult<void>> {
  const parsed = savingsGoalSchema.safeParse(formData)
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message }
  }

  const { name, targetAmount, targetDate, note } = parsed.data
  const result = await updateSavingsGoal(goalId, {
    name,
    targetAmountRaw: targetAmount,
    targetDate: targetDate || null,
    note: note || null,
  })

  if (!result.success) return result
  revalidatePath('/savings', 'layout')
  revalidatePath('/', 'layout')
  return result
}

export async function deleteGoalAction(goalId: number): Promise<ServiceResult<void>> {
  const result = await deleteSavingsGoal(goalId)
  if (!result.success) return result
  revalidatePath('/savings', 'layout')
  revalidatePath('/', 'layout')
  return result
}

export async function addContributionAction(formData: unknown): Promise<ServiceResult<void>> {
  const parsed = contributionSchema.safeParse(formData)
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message }
  }

  const { goalId, fundId, amount, date, note } = parsed.data
  const result = await addContribution({
    goalId,
    fundId,
    amountRaw: amount,
    date,
    note: note || undefined,
  })

  if (!result.success) return result
  revalidatePath('/savings', 'layout')
  revalidatePath('/', 'layout')
  return { success: true as const, data: undefined }
}

export async function deleteContributionAction(
  contributionId: number
): Promise<ServiceResult<void>> {
  const result = await deleteContribution(contributionId)
  if (!result.success) return result
  revalidatePath('/savings', 'layout')
  revalidatePath('/', 'layout')
  return result
}
