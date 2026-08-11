/**
 * Drizzle Schema — Central Export
 *
 * Re-exports every table and type from the individual schema modules.
 * This is the single entry point used by:
 *   - src/db/client.ts (drizzle schema)
 *   - src/db/repositories/* (typed queries)
 *   - src/types/database.ts (InferSelectModel / InferInsertModel)
 */

// --- Auth / Users ---
export * from './auth'
// --- Branches ---
export * from './branches'
// --- Catalog ---
export * from './catalog'
// --- Promos / Content ---
export * from './promos'
// --- Media Library ---
export * from './media'
// --- Deal History ---
export * from './deals'
// --- Import Jobs ---
export * from './imports'
// --- Staff Permissions ---
export * from './staff'
// --- Customers ---
export * from './customers'
// --- Orders ---
export * from './orders'
// --- Offers ---
export * from './offers'
// --- Delivery ---
export * from './delivery'
// --- Operations ---
export * from './operations'
// --- Inventory ---
export * from './inventory'
// --- Suppliers ---
export * from './suppliers'
// --- Returns ---
export * from './returns'
// --- Reviews (social proof) ---
export * from './reviews'
// --- Social Posts (admin-managed daily offers content) ---
export * from './social'
// --- Site Structure ---
export * from './site-structure'

// --- Feature Flags ---
export * from './featureFlags'

// --- Aggregates: import all table objects as a single `schema` namespace ---
import * as authSchema from './auth'
import * as branchesSchema from './branches'
import * as catalogSchema from './catalog'
import * as customersSchema from './customers'
import * as ordersSchema from './orders'
import * as offersSchema from './offers'
import * as deliverySchema from './delivery'
import * as operationsSchema from './operations'
import * as inventorySchema from './inventory'
import * as suppliersSchema from './suppliers'
import * as returnsSchema from './returns'
import * as reviewsSchema from './reviews'
import * as siteStructureSchema from './site-structure'
import * as featureFlagsSchema from './featureFlags'

export const schema = {
  ...authSchema,
  ...branchesSchema,
  ...catalogSchema,
  ...customersSchema,
  ...ordersSchema,
  ...offersSchema,
  ...deliverySchema,
  ...operationsSchema,
  ...inventorySchema,
  ...suppliersSchema,
  ...returnsSchema,
  ...reviewsSchema,
  ...siteStructureSchema,
  ...featureFlagsSchema,
}
