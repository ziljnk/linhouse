import sanitizeHtml from "sanitize-html"
import { isSafeLinkHref } from "@/lib/sanitize-url"

const PLAIN_TEXT_OPTIONS: sanitizeHtml.IOptions = {
  allowedTags: [],
  allowedAttributes: {},
}

const RICH_TEXT_OPTIONS: sanitizeHtml.IOptions = {
  allowedTags: [
    "h2",
    "h3",
    "p",
    "br",
    "ul",
    "ol",
    "li",
    "blockquote",
    "strong",
    "b",
    "em",
    "i",
    "u",
    "s",
    "a",
  ],
  allowedAttributes: {
    a: ["href"],
  },
  allowedSchemes: ["http", "https", "mailto"],
  allowedSchemesByTag: {
    a: ["http", "https", "mailto"],
  },
  transformTags: {
    a: ((_tagName, attribs) => {
      const href = typeof attribs.href === "string" ? attribs.href.trim() : ""
      if (!isSafeLinkHref(href)) {
        return { tagName: "span", attribs: {} as sanitizeHtml.Attributes }
      }
      return {
        tagName: "a",
        attribs: {
          href,
          target: "_blank",
          rel: "noopener noreferrer",
        },
      }
    }) satisfies sanitizeHtml.Transformer,
  },
}

const NAMED_HTML_ENTITIES: Record<string, string> = {
  amp: "&",
  lt: "<",
  gt: ">",
  quot: '"',
  apos: "'",
  nbsp: "\u00a0",
}

const HTML_TAG = /<\/?[a-z][^>]*>/i

function codePointToChar(code: number) {
  if (!Number.isInteger(code) || code < 0 || code > 0x10ffff) return null
  if (code >= 0xd800 && code <= 0xdfff) return null
  return String.fromCodePoint(code)
}

export function decodeHtmlEntities(value: string) {
  return value.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (entity, body: string) => {
    const token = body.toLowerCase()
    if (token.startsWith("#x")) {
      return codePointToChar(Number.parseInt(token.slice(2), 16)) ?? entity
    }
    if (token.startsWith("#")) {
      return codePointToChar(Number.parseInt(token.slice(1), 10)) ?? entity
    }
    return NAMED_HTML_ENTITIES[token] ?? entity
  })
}

export function decodeStoredPlainText(value: string) {
  if (HTML_TAG.test(value)) return value
  return decodeHtmlEntities(value)
}

export function sanitizePlainText(text: string) {
  return decodeHtmlEntities(sanitizeHtml(text, PLAIN_TEXT_OPTIONS).trim())
}

export function sanitizeRichTextHtml(html: string) {
  return sanitizeHtml(html, RICH_TEXT_OPTIONS).trim()
}
