'use server'

import { revalidatePath } from 'next/cache'
import { transferSchema, editTransferSchema } from '@/lib/validations/transfer'
import { createTransfer, deleteTransfer, updateTransfer, getTransferById } from '@/services/transfers'
import type { ServiceResult, Transfer } from '@/types'

export async function getTransferByIdAction(transferId: number): Promise<Transfer | null> {
  const row = await getTransferById(transferId)
  return row as Transfer | null
}

export async function createTransferAction(formData: unknown): Promise<ServiceResult<void>> {
  const parsed = transferSchema.safeParse(formData)
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message }
  }

  const { fromFundId, toFundId, amount, fee, date, note } = parsed.data
  const result = await createTransfer({
    fromFundId,
    toFundId,
    amountRaw: amount,
    feeRaw: fee || undefined,
    date,
    note,
  })

  if (!result.success) return result

  revalidatePath('/', 'layout')
  return { success: true, data: undefined }
}

export async function deleteTransferAction(transferId: number): Promise<ServiceResult<void>> {
  const result = await deleteTransfer(transferId)
  if (!result.success) return result
  revalidatePath('/', 'layout')
  return { success: true, data: undefined }
}

export async function updateTransferAction(
  transferId: number,
  formData: unknown
): Promise<ServiceResult<void>> {
  const parsed = editTransferSchema.safeParse(formData)
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message }
  }

  const { fromFundId, toFundId, amount, fee, date, note } = parsed.data
  const result = await updateTransfer(transferId, {
    fromFundId,
    toFundId,
    amountRaw: amount,
    feeRaw: fee || undefined,
    date,
    note,
  })
  if (!result.success) return result
  revalidatePath('/', 'layout')
  return { success: true, data: undefined }
}
