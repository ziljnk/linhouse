export const SEARCH_QUERY_MIN_LENGTH = 2
export const SEARCH_QUERY_MAX_LENGTH = 80

const CONTROL_CHARS = /[\u0000-\u001F\u007F]/g

export function normalizeSearchQuery(query: string) {
  return query.replace(CONTROL_CHARS, "").trim().slice(0, SEARCH_QUERY_MAX_LENGTH)
}

export function isSearchableQuery(query: string) {
  return normalizeSearchQuery(query).length >= SEARCH_QUERY_MIN_LENGTH
}
