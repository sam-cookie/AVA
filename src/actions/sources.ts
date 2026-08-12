'use server'

import { revalidatePath } from 'next/cache'
import { sourceCreateSchema } from '@/lib/validations/source'
import { createSource, updateSource, deleteSource } from '@/services/sources'
import type { ServiceResult } from '@/types'

export async function createSourceAction(name: unknown): Promise<ServiceResult<void>> {
  const parsed = sourceCreateSchema.safeParse({ name })
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message }
  }

  const result = await createSource(parsed.data.name)
  if (!result.success) return result

  revalidatePath('/', 'layout')
  return { success: true, data: undefined }
}

export async function updateSourceAction(id: number, name: unknown): Promise<ServiceResult<void>> {
  const parsed = sourceCreateSchema.safeParse({ name })
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message }
  }

  const result = await updateSource(id, parsed.data.name)
  if (!result.success) return result

  revalidatePath('/', 'layout')
  return { success: true, data: undefined }
}

export async function deleteSourceAction(id: number): Promise<ServiceResult<void>> {
  const result = await deleteSource(id)
  if (!result.success) return result

  revalidatePath('/', 'layout')
  return { success: true, data: undefined }
}
