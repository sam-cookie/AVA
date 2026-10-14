'use server'

import { revalidatePath } from 'next/cache'
import { addMoneySchema } from '@/lib/validations/fund'
import { fundCreateSchema } from '@/lib/validations/fund-create'
import { addMoneyToFund, createFund, renameFund, deleteFund, restoreFund, deleteFundForever, getFundsWithBalances } from '@/services/funds'
import { todayISO } from '@/lib/utils/date'
import type { FundWithBalance, ServiceResult } from '@/types'

export async function getFundsWithBalancesAction(): Promise<FundWithBalance[]> {
  return getFundsWithBalances()
}

export async function addMoneyAction(formData: unknown): Promise<ServiceResult<void>> {
  const parsed = addMoneySchema.safeParse(formData)
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message }
  }

  const { fundId, amount, source, date, note } = parsed.data
  const result = await addMoneyToFund({ fundId, amountRaw: amount, source, date, note })

  if (!result.success) return result

  revalidatePath('/', 'layout')
  return { success: true, data: undefined }
}

export async function createFundAction(formData: unknown): Promise<ServiceResult<void>> {
  const parsed = fundCreateSchema.safeParse(formData)
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message }
  }

  const fundResult = await createFund(parsed.data.name, parsed.data.color ?? null)
  if (!fundResult.success) return fundResult

  const balance = parsed.data.initialBalance?.trim()
  if (balance && balance !== '0' && balance !== '0.00') {
    const addResult = await addMoneyToFund({
      fundId: fundResult.data.id,
      amountRaw: balance,
      source: 'Initial balance',
      date: todayISO(),
    })
    if (!addResult.success) return addResult
  }

  revalidatePath('/', 'layout')
  return { success: true, data: undefined }
}

export async function renameFundAction(
  fundId: number,
  name: unknown
): Promise<ServiceResult<void>> {
  const parsed = fundCreateSchema.safeParse({ name })
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message }
  }

  const result = await renameFund(fundId, parsed.data.name)
  if (!result.success) return result

  revalidatePath('/', 'layout')
  return { success: true, data: undefined }
}

export async function deleteFundAction(fundId: number): Promise<ServiceResult<void>> {
  const result = await deleteFund(fundId)
  if (!result.success) return result

  revalidatePath('/', 'layout')
  return { success: true, data: undefined }
}

export async function restoreFundAction(fundId: number): Promise<ServiceResult<void>> {
  const result = await restoreFund(fundId)
  if (!result.success) return result

  revalidatePath('/', 'layout')
  return { success: true, data: undefined }
}

export async function deleteFundForeverAction(fundId: number): Promise<ServiceResult<void>> {
  const result = await deleteFundForever(fundId)
  if (!result.success) return result

  revalidatePath('/', 'layout')
  return { success: true, data: undefined }
}
