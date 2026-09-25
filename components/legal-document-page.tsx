import { sanitizeRichTextHtml } from "@/lib/sanitize-content"

const BODY_CLASS = [
  "mt-10 text-base leading-relaxed font-light text-charcoal/75 sm:text-lg",
  "[&_h2]:mt-8 [&_h2]:mb-3 [&_h2]:font-heading [&_h2]:text-[1.05rem] [&_h2]:leading-snug [&_h2]:font-medium [&_h2]:text-charcoal sm:[&_h2]:text-lg",
  "[&_h3]:mt-6 [&_h3]:mb-2 [&_h3]:font-heading [&_h3]:text-[1.05rem] [&_h3]:leading-snug [&_h3]:font-medium sm:[&_h3]:text-lg",
  "[&_p]:my-3",
  "[&_ul]:my-3 [&_ul]:list-disc [&_ul]:ps-5",
  "[&_ol]:my-3 [&_ol]:list-decimal [&_ol]:ps-5",
  "[&_blockquote]:my-4 [&_blockquote]:border-l-2 [&_blockquote]:border-charcoal/20 [&_blockquote]:ps-4",
  "[&_a]:text-burgundy [&_a]:underline",
].join(" ")

export function LegalDocumentPage({
  copy,
}: {
  copy: { title: string; body: string }
}) {
  const body = sanitizeRichTextHtml(copy.body)

  return (
    <main className="overflow-x-clip bg-ivory text-charcoal">
      <section className="px-6 py-16 sm:px-10 sm:py-20 lg:px-16 lg:py-24">
        <article className="mx-auto max-w-3xl">
          <h1 className="text-center font-heading text-3xl font-medium tracking-[0.16em] text-burgundy-deep uppercase sm:text-4xl">
            {copy.title}
          </h1>
          {body ? (
            <div className={BODY_CLASS} dangerouslySetInnerHTML={{ __html: body }} />
          ) : null}
        </article>
      </section>
    </main>
  )
}
