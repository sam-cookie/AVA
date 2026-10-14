import { db } from '@/lib/db/client'
import { ensureInitialized } from '@/lib/db/init'
ensureInitialized()
import { categories } from '@/lib/db/schema'
import { eq, isNotNull, isNull } from 'drizzle-orm'
import type { Category, ServiceResult } from '@/types'

let categoriesCache: { data: Category[]; expiresAt: number } | null = null

export function invalidateCategoriesCache() {
  categoriesCache = null
}

export async function getCategories(): Promise<Category[]> {
  const now = Date.now()
  if (categoriesCache && categoriesCache.expiresAt > now) {
    return categoriesCache.data
  }

  const rows = await db
    .select()
    .from(categories)
    .where(isNull(categories.archivedAt))
    .orderBy(categories.id)

  const data = rows.map((r) => ({
    id: r.id,
    name: r.name,
    icon: r.icon,
    archivedAt: r.archivedAt,
    createdAt: r.createdAt,
  }))

  categoriesCache = { data, expiresAt: now + 60000 }
  return data
}

export async function getArchivedCategories(): Promise<Category[]> {
  const rows = await db
    .select()
    .from(categories)
    .where(isNotNull(categories.archivedAt))
    .orderBy(categories.archivedAt)

  return rows.map((r) => ({
    id: r.id,
    name: r.name,
    icon: r.icon,
    archivedAt: r.archivedAt,
    createdAt: r.createdAt,
  }))
}

export async function createCategory(
  name: string,
  icon: string
): Promise<ServiceResult<Category>> {
  invalidateCategoriesCache()
  const result = await db
    .insert(categories)
    .values({ name, icon, createdAt: new Date() })
    .returning()

  const cat = result[0]
  return {
    success: true,
    data: {
      id: cat.id,
      name: cat.name,
      icon: cat.icon,
      archivedAt: cat.archivedAt,
      createdAt: cat.createdAt,
    },
  }
}

export async function updateCategory(
  id: number,
  name: string,
  icon: string
): Promise<ServiceResult<void>> {
  invalidateCategoriesCache()
  const cat = await db.select().from(categories).where(eq(categories.id, id)).get()
  if (!cat) return { success: false, error: 'Category not found' }

  await db.update(categories).set({ name, icon }).where(eq(categories.id, id))
  return { success: true, data: undefined }
}

/** Soft-delete (archive) a category */
export async function deleteCategory(id: number): Promise<ServiceResult<void>> {
  invalidateCategoriesCache()
  const cat = await db.select().from(categories).where(eq(categories.id, id)).get()
  if (!cat) return { success: false, error: 'Category not found' }

  await db.update(categories).set({ archivedAt: new Date() }).where(eq(categories.id, id))
  return { success: true, data: undefined }
}

/** Restore a previously soft-deleted category */
export async function restoreCategory(id: number): Promise<ServiceResult<void>> {
  invalidateCategoriesCache()
  const cat = await db.select().from(categories).where(eq(categories.id, id)).get()
  if (!cat) return { success: false, error: 'Category not found' }

  await db.update(categories).set({ archivedAt: null }).where(eq(categories.id, id))
  return { success: true, data: undefined }
}

/** Permanently delete a category (irreversible) */
export async function deleteCategoryForever(id: number): Promise<ServiceResult<void>> {
  invalidateCategoriesCache()
  const cat = await db.select().from(categories).where(eq(categories.id, id)).get()
  if (!cat) return { success: false, error: 'Category not found' }

  await db.delete(categories).where(eq(categories.id, id))
  return { success: true, data: undefined }
}
