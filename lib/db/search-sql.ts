import { sql, type SQLWrapper } from "drizzle-orm"

export function textContains(column: SQLWrapper, pattern: string) {
  return sql`${column} like ${pattern}`
}

export function jsonLocalizedContains(column: SQLWrapper, pattern: string) {
  // Use JSON_EXTRACT instead of `->>`. MariaDB on cPanel often tokenizes `>>`
  // as a bit-shift, so `column->>'$.vi'` throws and the whole search 500s.
  return sql`(coalesce(json_unquote(json_extract(${column}, '$.vi')), '') like ${pattern} or coalesce(json_unquote(json_extract(${column}, '$.en')), '') like ${pattern})`
}

export function yearContains(column: SQLWrapper, pattern: string) {
  return sql`cast(${column} as char) like ${pattern}`
}
