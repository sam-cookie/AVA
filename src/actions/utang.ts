'use server'

import { revalidatePath } from 'next/cache'
import { utangSchema, utangPaymentSchema } from '@/lib/validations/utang'
import {
  createUtang,
  updateUtang,
  deleteUtang,
  recordUtangPayment,
  deleteUtangPayment,
} from '@/services/utang'
import type { ServiceResult } from '@/types'

export async function createUtangAction(formData: unknown): Promise<ServiceResult<{ utangId: number }>> {
  const parsed = utangSchema.safeParse(formData)
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message }
  }

  const { type, person, amount, deadline, note } = parsed.data
  const result = await createUtang({
    type,
    person,
    amountRaw: amount,
    deadline: deadline || undefined,
    note: note || undefined,
  })

  if (!result.success) return result
  revalidatePath('/utang', 'layout')
  return result
}

export async function updateUtangAction(
  utangId: number,
  formData: unknown
): Promise<ServiceResult<void>> {
  const parsed = utangSchema.safeParse(formData)
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message }
  }

  const { person, amount, deadline, note } = parsed.data
  const result = await updateUtang(utangId, {
    person,
    amountRaw: amount,
    deadline: deadline || null,
    note: note || null,
  })

  if (!result.success) return result
  revalidatePath('/utang', 'layout')
  return result
}

export async function deleteUtangAction(utangId: number): Promise<ServiceResult<void>> {
  const result = await deleteUtang(utangId)
  if (!result.success) return result
  revalidatePath('/utang', 'layout')
  return result
}

export async function recordPaymentAction(formData: unknown): Promise<ServiceResult<{ paymentId: number }>> {
  const parsed = utangPaymentSchema.safeParse(formData)
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message }
  }

  const { utangId, fundId, amount, date, note } = parsed.data
  const result = await recordUtangPayment({
    utangId,
    fundId,
    amountRaw: amount,
    date,
    note: note || undefined,
  })

  if (!result.success) return result
  revalidatePath('/utang', 'layout')
  revalidatePath('/', 'layout')
  return result
}

export async function deletePaymentAction(paymentId: number): Promise<ServiceResult<void>> {
  const result = await deleteUtangPayment(paymentId)
  if (!result.success) return result
  revalidatePath('/utang', 'layout')
  revalidatePath('/', 'layout')
  return result
}
