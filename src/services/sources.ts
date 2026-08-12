import { db } from '@/lib/db/client'
import { ensureInitialized } from '@/lib/db/init'
ensureInitialized()
import { sources } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import type { IncomeSource, ServiceResult } from '@/types'

export async function getAllSources(): Promise<IncomeSource[]> {
  return db.select().from(sources).orderBy(sources.createdAt)
}

export async function createSource(name: string): Promise<ServiceResult<IncomeSource>> {
  const result = await db
    .insert(sources)
    .values({ name, createdAt: new Date() })
    .returning()

  const s = result[0]
  return { success: true, data: { id: s.id, name: s.name, createdAt: s.createdAt } }
}

export async function updateSource(id: number, name: string): Promise<ServiceResult<void>> {
  const src = await db.select().from(sources).where(eq(sources.id, id)).get()
  if (!src) return { success: false, error: 'Source not found' }

  await db.update(sources).set({ name }).where(eq(sources.id, id))
  return { success: true, data: undefined }
}

export async function deleteSource(id: number): Promise<ServiceResult<void>> {
  const src = await db.select().from(sources).where(eq(sources.id, id)).get()
  if (!src) return { success: false, error: 'Source not found' }

  await db.delete(sources).where(eq(sources.id, id))
  return { success: true, data: undefined }
}
