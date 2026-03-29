// @repo/db — Database client and schema exports

export * from "./schema";
export { db } from "./client";
export type { Database } from "./client";

// Re-export drizzle-orm operators to avoid duplicate-package type conflicts
export { eq, and, or, not, gte, lte, gt, lt, ne, inArray, notInArray, desc, asc, count, avg, sum, sql, isNull, isNotNull, ilike } from "drizzle-orm";
