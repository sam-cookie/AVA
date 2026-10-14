'use server'

import { revalidatePath } from 'next/cache'
import {
  getArchivedItems,
  restoreArchiveItem,
  deleteArchiveItemForever,
} from '@/services/archive'
import type { ArchiveItem, ArchiveItemType, ServiceResult } from '@/types'

export async function getArchivedItemsAction(): Promise<ArchiveItem[]> {
  return getArchivedItems()
}

export async function restoreArchivedItemAction(
  type: ArchiveItemType,
  id: number
): Promise<ServiceResult<void>> {
  const result = await restoreArchiveItem(type, id)
  if (!result.success) return result

  revalidatePath('/', 'layout')
  return { success: true, data: undefined }
}

export async function deleteArchivedItemForeverAction(
  type: ArchiveItemType,
  id: number
): Promise<ServiceResult<void>> {
  const result = await deleteArchiveItemForever(type, id)
  if (!result.success) return result

  revalidatePath('/', 'layout')
  return { success: true, data: undefined }
}
