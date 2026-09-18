import { sql, type SQLWrapper } from "drizzle-orm"

export function textContains(column: SQLWrapper, pattern: string) {
  return sql`${column} like ${pattern}`
}

export function jsonLocalizedContains(column: SQLWrapper, pattern: string) {
  return sql`(${column}->>'$.vi' like ${pattern} or coalesce(${column}->>'$.en', '') like ${pattern})`
}

export function yearContains(column: SQLWrapper, pattern: string) {
  return sql`cast(${column} as char) like ${pattern}`
}
