'use server'

import { revalidatePath } from 'next/cache'
import { categorySchema } from '@/lib/validations/category'
import { createCategory, updateCategory, deleteCategory } from '@/services/categories'
import type { ServiceResult } from '@/types'

export async function createCategoryAction(
  formData: unknown
): Promise<ServiceResult<{ id: number; name: string; icon: string }>> {
  const parsed = categorySchema.safeParse(formData)
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message }
  }

  const result = await createCategory(parsed.data.name, parsed.data.icon)
  if (!result.success) return result

  revalidatePath('/', 'layout')
  return { success: true, data: { id: result.data.id, name: result.data.name, icon: result.data.icon } }
}

export async function updateCategoryAction(
  id: number,
  formData: unknown
): Promise<ServiceResult<void>> {
  const parsed = categorySchema.safeParse(formData)
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message }
  }

  const result = await updateCategory(id, parsed.data.name, parsed.data.icon)
  if (!result.success) return result

  revalidatePath('/', 'layout')
  return { success: true, data: undefined }
}

export async function deleteCategoryAction(id: number): Promise<ServiceResult<void>> {
  const result = await deleteCategory(id)
  if (!result.success) return result

  revalidatePath('/', 'layout')
  return { success: true, data: undefined }
}
