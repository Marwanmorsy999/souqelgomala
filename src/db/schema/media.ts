/**
 * Drizzle schema: Central Media Library
 */

import { sqliteTable, text, integer, index } from 'drizzle-orm/sqlite-core'

export const mediaLibrary = sqliteTable(
  'media_library',
  {
    id: text('id').primaryKey(),
    url: text('url').notNull(),
    cloudinary_public_id: text('cloudinary_public_id').notNull(),
    filename: text('filename').notNull(),
    alt_text: text('alt_text'),
    tags: text('tags').notNull().default('[]'), // JSON array
    width: integer('width'),
    height: integer('height'),
    format: text('format'),
    resource_type: text('resource_type').notNull().default('image'),
    uploaded_by: text('uploaded_by'),
    uploaded_at: text('uploaded_at').notNull(),
    usage_count: integer('usage_count').notNull().default(0),
  },
  (table) => ({
    idx_media_public_id: index('idx_media_public_id').on(table.cloudinary_public_id),
    idx_media_filename: index('idx_media_filename').on(table.filename),
    idx_media_uploaded: index('idx_media_uploaded').on(table.uploaded_at),
  })
)
