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

export function sanitizePlainText(text: string) {
  return sanitizeHtml(text, PLAIN_TEXT_OPTIONS).trim()
}

export function sanitizeRichTextHtml(html: string) {
  return sanitizeHtml(html, RICH_TEXT_OPTIONS).trim()
}
