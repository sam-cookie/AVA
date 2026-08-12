import { db } from '@/lib/db/client'
import { ensureInitialized } from '@/lib/db/init'
ensureInitialized()
import { categories } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import type { Category, ServiceResult } from '@/types'

export async function getCategories(): Promise<Category[]> {
  const rows = await db.select().from(categories).orderBy(categories.id)
  return rows.map((r) => ({
    id: r.id,
    name: r.name,
    icon: r.icon,
    createdAt: r.createdAt,
  }))
}

export async function createCategory(
  name: string,
  icon: string
): Promise<ServiceResult<Category>> {
  const result = await db
    .insert(categories)
    .values({ name, icon, createdAt: new Date() })
    .returning()

  const cat = result[0]
  return {
    success: true,
    data: { id: cat.id, name: cat.name, icon: cat.icon, createdAt: cat.createdAt },
  }
}

export async function updateCategory(
  id: number,
  name: string,
  icon: string
): Promise<ServiceResult<void>> {
  const cat = await db.select().from(categories).where(eq(categories.id, id)).get()
  if (!cat) return { success: false, error: 'Category not found' }

  await db.update(categories).set({ name, icon }).where(eq(categories.id, id))
  return { success: true, data: undefined }
}

export async function deleteCategory(id: number): Promise<ServiceResult<void>> {
  const cat = await db.select().from(categories).where(eq(categories.id, id)).get()
  if (!cat) return { success: false, error: 'Category not found' }

  await db.delete(categories).where(eq(categories.id, id))
  return { success: true, data: undefined }
}
