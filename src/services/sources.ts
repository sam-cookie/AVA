import { db } from '@/lib/db/client'
import { ensureInitialized } from '@/lib/db/init'
ensureInitialized()
import { sources } from '@/lib/db/schema'
import { eq, isNotNull, isNull } from 'drizzle-orm'
import type { IncomeSource, ServiceResult } from '@/types'

let sourcesCache: { data: IncomeSource[]; expiresAt: number } | null = null

export function invalidateSourcesCache() {
  sourcesCache = null
}

export async function getAllSources(): Promise<IncomeSource[]> {
  const now = Date.now()
  if (sourcesCache && sourcesCache.expiresAt > now) {
    return sourcesCache.data
  }

  const rows = await db
    .select()
    .from(sources)
    .where(isNull(sources.archivedAt))
    .orderBy(sources.createdAt)

  sourcesCache = { data: rows, expiresAt: now + 60000 }
  return rows
}

export async function getArchivedSources(): Promise<IncomeSource[]> {
  const rows = await db
    .select()
    .from(sources)
    .where(isNotNull(sources.archivedAt))
    .orderBy(sources.archivedAt)

  return rows
}

export async function createSource(name: string): Promise<ServiceResult<IncomeSource>> {
  invalidateSourcesCache()
  const result = await db
    .insert(sources)
    .values({ name, createdAt: new Date() })
    .returning()

  const s = result[0]
  return {
    success: true,
    data: {
      id: s.id,
      name: s.name,
      archivedAt: s.archivedAt,
      createdAt: s.createdAt,
    },
  }
}

export async function updateSource(id: number, name: string): Promise<ServiceResult<void>> {
  invalidateSourcesCache()
  const src = await db.select().from(sources).where(eq(sources.id, id)).get()
  if (!src) return { success: false, error: 'Source not found' }

  await db.update(sources).set({ name }).where(eq(sources.id, id))
  return { success: true, data: undefined }
}

/** Soft-delete (archive) an income source */
export async function deleteSource(id: number): Promise<ServiceResult<void>> {
  invalidateSourcesCache()
  const src = await db.select().from(sources).where(eq(sources.id, id)).get()
  if (!src) return { success: false, error: 'Source not found' }

  await db.update(sources).set({ archivedAt: new Date() }).where(eq(sources.id, id))
  return { success: true, data: undefined }
}

/** Restore a previously soft-deleted income source */
export async function restoreSource(id: number): Promise<ServiceResult<void>> {
  invalidateSourcesCache()
  const src = await db.select().from(sources).where(eq(sources.id, id)).get()
  if (!src) return { success: false, error: 'Source not found' }

  await db.update(sources).set({ archivedAt: null }).where(eq(sources.id, id))
  return { success: true, data: undefined }
}

/** Permanently delete an income source (irreversible) */
export async function deleteSourceForever(id: number): Promise<ServiceResult<void>> {
  invalidateSourcesCache()
  const src = await db.select().from(sources).where(eq(sources.id, id)).get()
  if (!src) return { success: false, error: 'Source not found' }

  await db.delete(sources).where(eq(sources.id, id))
  return { success: true, data: undefined }
}
