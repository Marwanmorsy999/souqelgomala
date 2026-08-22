/**
 * Branches service — physical store branches CRUD.
 *
 * Runtime-ensure pattern (same as orders/delivery) so a fresh D1 instance
 * never 500s before migrations are applied.
 */

import { getDb } from '@/db'
import { branches } from '@/db/schema/branches'
import { asc, eq, isNull, sql } from 'drizzle-orm'

const CREATE_BRANCHES = `
CREATE TABLE IF NOT EXISTS branches (
  id text PRIMARY KEY NOT NULL,
  name_ar text NOT NULL,
  name_en text,
  code text,
  address text,
  phone text,
  working_hours text,
  latitude real,
  longitude real,
  google_maps_url text,
  manager_id text,
  is_active integer NOT NULL DEFAULT 1,
  created_at text NOT NULL,
  updated_at text NOT NULL,
  deleted_at text
);`

let ensured = false
async function ensureBranchesTable(): Promise<void> {
  if (ensured) return
  await getDb().run(sql.raw(CREATE_BRANCHES))
  ensured = true
}

function now(): string {
  return new Date().toISOString()
}

export interface BranchRow {
  id: string
  nameAr: string
  nameEn: string | null
  code: string | null
  address: string | null
  phone: string | null
  mapsUrl: string | null
  isActive: boolean
}

function toRow(r: typeof branches.$inferSelect): BranchRow {
  return {
    id: r.id,
    nameAr: r.name_ar,
    nameEn: r.name_en ?? null,
    code: r.code ?? null,
    address: r.address ?? null,
    phone: r.phone ?? null,
    mapsUrl: r.google_maps_url ?? null,
    isActive: r.is_active,
  }
}

export async function listBranches(): Promise<BranchRow[]> {
  await ensureBranchesTable()
  const rows = await getDb()
    .select()
    .from(branches)
    .where(isNull(branches.deleted_at))
    .orderBy(asc(branches.name_ar))
  return rows.map(toRow)
}

export async function createBranch(input: {
  nameAr: string
  nameEn?: string
  code?: string
  address?: string
  phone?: string
  mapsUrl?: string
  isActive?: boolean
}): Promise<BranchRow> {
  await ensureBranchesTable()
  const ts = now()
  const [row] = await getDb()
    .insert(branches)
    .values({
      id: crypto.randomUUID(),
      name_ar: input.nameAr.trim(),
      name_en: input.nameEn?.trim() || null,
      code: input.code?.trim() || null,
      address: input.address?.trim() || null,
      phone: input.phone?.trim() || null,
      google_maps_url: input.mapsUrl?.trim() || null,
      is_active: input.isActive ?? true,
      created_at: ts,
      updated_at: ts,
    })
    .returning()
  return toRow(row)
}

export async function updateBranch(
  id: string,
  patch: Partial<{
    nameAr: string
    nameEn: string
    code: string
    address: string
    phone: string
    mapsUrl: string
    isActive: boolean
  }>,
): Promise<void> {
  await ensureBranchesTable()
  const [existing] = await getDb().select({ id: branches.id }).from(branches).where(eq(branches.id, id)).limit(1)
  if (!existing) throw new Error('الفرع غير موجود')
  await getDb()
    .update(branches)
    .set({
      ...(patch.nameAr !== undefined ? { name_ar: patch.nameAr.trim() } : {}),
      ...(patch.nameEn !== undefined ? { name_en: patch.nameEn.trim() || null } : {}),
      ...(patch.code !== undefined ? { code: patch.code.trim() || null } : {}),
      ...(patch.address !== undefined ? { address: patch.address.trim() || null } : {}),
      ...(patch.phone !== undefined ? { phone: patch.phone.trim() || null } : {}),
      ...(patch.mapsUrl !== undefined ? { google_maps_url: patch.mapsUrl.trim() || null } : {}),
      ...(patch.isActive !== undefined ? { is_active: patch.isActive } : {}),
      updated_at: now(),
    })
    .where(eq(branches.id, id))
}

export async function deleteBranch(id: string): Promise<void> {
  await ensureBranchesTable()
  const [existing] = await getDb().select({ id: branches.id }).from(branches).where(eq(branches.id, id)).limit(1)
  if (!existing) throw new Error('الفرع غير موجود')
  await getDb().update(branches).set({ deleted_at: now(), updated_at: now() }).where(eq(branches.id, id))
}
